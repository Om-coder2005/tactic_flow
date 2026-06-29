from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.models.tactics import Board
from app.schemas.tactics import BoardUpdate

async def get_board_by_project(db: AsyncSession, project_id: uuid.UUID) -> Optional[Board]:
    stmt = select(Board).where(Board.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_board(db: AsyncSession, board: Board, board_in: BoardUpdate) -> Board:
    # Optimistic Concurrency Check (Root Fix: Version-based)
    if board_in.version is not None and board.version != board_in.version:
        raise ValueError(f"STALE_WRITE: Server version {board.version} differs from client version {board_in.version}")
        
    board.pitch_type = board_in.pitch_type
    board.viewport_json = board_in.viewport.model_dump()
    board.active_frame_id = board_in.active_frame_id
    board.version += 1 # Increment version
    board.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(board)
    return board
