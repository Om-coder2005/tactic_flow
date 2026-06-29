import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.system import AISummary
from app.schemas.ai import AIFeaturesExtractReq, AIResponseRecord
from app.services.tactical_feature_extractor import extract_features
from app.services.ai_service import generate_llm_response, generate_llm_stream
from app.core.config import settings
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/{project_id}/ai/summarize", response_model=AIResponseRecord)
@limiter.limit("20/day")   # Spec §13: 20 AI requests per user per day
async def generate_ai_summary(
    request: Request,
    project_id: uuid.UUID,
    payload: AIFeaturesExtractReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Takes a complex JSON snapshot, compresses it via math heuristics, hits the LLM."""

    # 1. Compress JSON into compact heuristic string
    compressed_string = ""
    latest_features = None

    if payload.snapshots and len(payload.snapshots) > 0:
        for idx, snap in enumerate(payload.snapshots):
            f = extract_features(snap)
            compressed_string += f"Frame {idx+1}: {f.to_llm_prompt_string()}\n"
            latest_features = f
    elif payload.snapshot:
        latest_features = extract_features(payload.snapshot)
        compressed_string = latest_features.to_llm_prompt_string()
    else:
        raise HTTPException(status_code=400, detail="Must provide snapshot or snapshots")

    if payload.stream:
        return StreamingResponse(
            generate_llm_stream(compressed_string, latest_features, payload.mode, payload.tone),
            media_type="text/event-stream"
        )

    # 2. Run LLM via Gemini (with mock fallback if key is missing/fails)
    llm_output = await generate_llm_response(compressed_string, latest_features, payload.mode, payload.tone)

    # 3. Persist to DB — populate all required AISummary columns
    is_mock = not settings.GEMINI_API_KEY or "mock" in settings.GEMINI_API_KEY.lower()
    db_summary = AISummary(
        project_id=project_id,
        user_id=current_user.id,
        scope="frame",
        frame_ids_json=[payload.frame_id] if payload.frame_id else [],
        mode=payload.mode,
        tone=payload.tone,
        prompt_version=1,
        model_provider="mock" if is_mock else "google",
        model_name="tacticflow-heuristic-v1" if is_mock else "gemini-1.5-flash",
        input_snapshot_json={"prompt_used": compressed_string},
        output_json=llm_output.model_dump(),
        status="completed",
    )

    db.add(db_summary)
    await db.commit()
    await db.refresh(db_summary)

    return {
        "id": db_summary.id,
        "project_id": project_id,
        "frame_id": payload.frame_id,
        "created_at": db_summary.created_at,
        **llm_output.model_dump()
    }
