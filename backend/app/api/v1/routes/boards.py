import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.tactics import BoardResponse, BoardUpdate
from app.services import project_service, board_service

router = APIRouter()

@router.get("/{id}/board", response_model=BoardResponse)
async def read_board(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get the active board attached to a project."""
    # Ensure project access
    project = await project_service.get_project(db, project_id=id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    board = await board_service.get_board_by_project(db, project_id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
        
    return board

@router.put("/{id}/board", response_model=BoardResponse)
async def update_board_route(
    id: uuid.UUID,
    board_in: BoardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update board parameters (optimistic locking enforced)."""
    project = await project_service.get_project(db, project_id=id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    board = await board_service.get_board_by_project(db, project_id=id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    try:
        updated_board = await board_service.update_board(db, board, board_in)
        return updated_board
    except ValueError as e:
        if "STALE_WRITE" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "STALE_WRITE", "message": "Server has newer data."}
            )
        raise HTTPException(status_code=400, detail=str(e))
