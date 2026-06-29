from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.models.tactics import Frame
from app.schemas.tactics import FrameCreate, FrameUpdate, FrameMetaUpdate

async def get_project_frames(db: AsyncSession, project_id: uuid.UUID) -> list[Frame]:
    stmt = (
        select(Frame)
        .where(Frame.project_id == project_id)
        .order_by(Frame.order_index.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def create_frame(db: AsyncSession, project_id: uuid.UUID, frame_in: FrameCreate) -> Frame:
    # Handle insertion ordering
    frames = await get_project_frames(db, project_id)
    
    insert_index = len(frames)
    if frame_in.insert_after_id:
        for idx, f in enumerate(frames):
            if f.id == frame_in.insert_after_id:
                insert_index = idx + 1
                break
                
    # Shift existing frames
    for i in range(insert_index, len(frames)):
        frames[i].order_index = i + 1
        db.add(frames[i])
        
    db_frame = Frame(
        id=frame_in.id or uuid.uuid4(),
        project_id=project_id,
        name=frame_in.name,
        phase_label=frame_in.phase_label,
        duration_ms=frame_in.duration_ms,
        order_index=insert_index,
        snapshot_json=frame_in.snapshot
    )
    db.add(db_frame)
    await db.commit()
    await db.refresh(db_frame)
    return db_frame

async def update_frame_snapshot(db: AsyncSession, frame: Frame, snapshot: dict, version: Optional[int] = None) -> Frame:
    # ACID Check: Optimistic Concurrency
    if version is not None and frame.version != version:
        # We could raise a custom error or just handle it. 
        # For simplicity in this session, I'll raise a ValueError that the route can catch.
        raise ValueError("CONCURRENCY_CONFLICT")

    frame.snapshot_json = snapshot
    frame.version += 1 # Increment version
    frame.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(frame)
    return frame

async def update_frame_meta(db: AsyncSession, frame: Frame, meta_in: FrameMetaUpdate) -> Frame:
    if meta_in.name is not None:
        frame.name = meta_in.name
    if meta_in.phase_label is not None:
        frame.phase_label = meta_in.phase_label
    if meta_in.duration_ms is not None:
        frame.duration_ms = meta_in.duration_ms
        
    if meta_in.order_index is not None and meta_in.order_index != frame.order_index:
        # Reorder logic (skipped for brevity/MVP, but would shift neighbors)
        frame.order_index = meta_in.order_index
        
    frame.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(frame)
    return frame

async def delete_frame(db: AsyncSession, frame: Frame):
    await db.delete(frame)
    await db.commit()

async def batch_upsert_frames(db: AsyncSession, project_id: uuid.UUID, frames_in: list[FrameCreate]) -> list[Frame]:
    # 1. Get existing frames for this project to check what to update vs insert
    existing_frames = await get_project_frames(db, project_id)
    existing_map = {f.id: f for f in existing_frames}
    
    frames_out = []
    
    for i, frame_data in enumerate(frames_in):
        existing = existing_map.get(frame_data.id)
        if existing:
            # OCC CHECK (Root Fix)
            if frame_data.version is not None and existing.version != frame_data.version:
                raise ValueError("CONCURRENCY_CONFLICT")
            
            existing.name = frame_data.name
            existing.phase_label = frame_data.phase_label
            existing.duration_ms = frame_data.duration_ms
            existing.snapshot_json = frame_data.snapshot
            existing.order_index = i
            existing.version += 1 # Increment version for consistency
            existing.updated_at = datetime.now(timezone.utc)
            db.add(existing)
            frames_out.append(existing)
        else:
            # Create new
            new_frame = Frame(
                id=frame_data.id if frame_data.id else uuid.uuid4(),
                project_id=project_id,
                name=frame_data.name,
                phase_label=frame_data.phase_label,
                order_index=i,
                duration_ms=frame_data.duration_ms,
                snapshot_json=frame_data.snapshot,
                version=1 # Start at version 1
            )
            db.add(new_frame)
            frames_out.append(new_frame)
            
    await db.commit()
    for r in frames_out:
        await db.refresh(r)
        
    return frames_out
