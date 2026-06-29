import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.tactics import FrameCreate, FrameUpdate, FrameMetaUpdate, FrameResponse
from app.services import project_service, frame_service

router = APIRouter()

async def _verify_project(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID):
    project = await project_service.get_project(db, project_id=project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

@router.get("/{id}/frames", response_model=list[FrameResponse])
async def read_frames(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await _verify_project(db, id, current_user.id)
    return await frame_service.get_project_frames(db, project_id=id)

@router.post("/{id}/frames", response_model=FrameResponse, status_code=status.HTTP_201_CREATED)
async def create_new_frame(
    id: uuid.UUID,
    frame_in: FrameCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await _verify_project(db, id, current_user.id)
    return await frame_service.create_frame(db, project_id=id, frame_in=frame_in)

@router.put("/{id}/frames/{frame_id}", response_model=FrameResponse)
async def update_snapshot(
    id: uuid.UUID,
    frame_id: uuid.UUID,
    frame_in: FrameUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await _verify_project(db, id, current_user.id)
    
    frames = await frame_service.get_project_frames(db, project_id=id)
    target_frame = next((f for f in frames if f.id == frame_id), None)
    if not target_frame:
        raise HTTPException(status_code=404, detail="Frame not found")
        
    try:
        return await frame_service.update_frame_snapshot(
            db, target_frame, frame_in.snapshot, version=frame_in.version
        )
    except ValueError as e:
        if str(e) == "CONCURRENCY_CONFLICT":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tactical state has been updated by another source. Please refresh."
            )
        raise e

@router.post("/{id}/frames/batch", response_model=list[FrameResponse])
async def batch_update_frames(
    id: uuid.UUID,
    frames_in: list[FrameCreate], # We use FrameCreate to allow IDs and full snapshots
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await _verify_project(db, id, current_user.id)
    try:
        return await frame_service.batch_upsert_frames(db, project_id=id, frames_in=frames_in)
    except ValueError as e:
        if str(e) == "CONCURRENCY_CONFLICT":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tactical state has been updated by another source. Please refresh."
            )
        raise e
