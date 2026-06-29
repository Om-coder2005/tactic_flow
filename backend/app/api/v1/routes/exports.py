import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user
from app.models.user import User
from app.models.system import ExportJob
from app.schemas.exports import ExportRequest, ExportResponse, ExportJobResponse
from app.services.export_service import generate_pdf, generate_png, EXPORT_DIR
from app.db.session import AsyncSessionLocal, get_db
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

async def process_export_job(job_id: str, payload: ExportRequest):
    async with AsyncSessionLocal() as db:
        try:
            if payload.type == "pdf":
                filename = generate_pdf(payload, job_id=job_id)
            else:
                filename = generate_png(payload, job_id=job_id)

            # Update job success
            job = await db.get(ExportJob, job_id)
            if job:
                job.status = "completed"
                job.output_url = f"/api/v1/exports/{filename}/download"
                await db.commit()
        except Exception as e:
            logger.error(f"Export job {job_id} failed: {e}")
            job = await db.get(ExportJob, job_id)
            if job:
                job.status = "failed"
                job.error_message = str(e)
                await db.commit()

@router.post("", response_model=ExportResponse, status_code=202)
@limiter.limit("10/minute")  # Spec §13: 10 per minute per user
async def create_export(
    request: Request,
    payload: ExportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        job_id = uuid.uuid4()
        new_job = ExportJob(
            id=job_id,
            user_id=current_user.id,
            type=payload.type,
            status="queued",
            request_json=payload.model_dump()
        )
        db.add(new_job)
        await db.commit()

        background_tasks.add_task(process_export_job, job_id, payload)

        return ExportResponse(
            job_id=str(job_id),
            status="queued"
        )
    except Exception as e:
        logger.error(f"Failed to create export job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=ExportJobResponse)
async def get_export_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = await db.get(ExportJob, uuid.UUID(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return ExportJobResponse(
        job_id=str(job.id),
        status=job.status,
        download_url=job.output_url,
        error_message=job.error_message
    )

@router.get("/{filename}/download")
async def download_export(
    filename: str,
    current_user: User = Depends(get_current_user)  # Auth guard added
):
    # Basic path traversal protection
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = os.path.join(EXPORT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file not found or expired.")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf" if filename.endswith(".pdf") else "image/png"
    )
