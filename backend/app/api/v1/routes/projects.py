from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.tactics import ProjectCreate, ProjectResponse, ProjectFullResponse, ProjectUpdate
from app.models.user import User
from app.models.tactics import Project
from app.api.deps import get_current_user
from app.services import project_service

router = APIRouter()

@router.get("", response_model=list[ProjectResponse])
async def read_projects(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieve projects mapped to the active user."""
    projects = await project_service.get_user_projects(db, user_id=current_user.id, skip=skip, limit=limit)
    return projects

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new project explicitly."""
    project = await project_service.create_project(db, current_user.id, project_in)
    return project

@router.get("/{id}", response_model=ProjectFullResponse)
async def read_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Read a specific project with all its details."""
    project = await project_service.get_project(db, project_id=id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return project

@router.patch("/{id}", response_model=ProjectResponse)
async def update_project(
    id: uuid.UUID,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update project details (title, theme, etc.)."""
    db_project = await project_service.get_project(db, project_id=id, user_id=current_user.id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = await project_service.update_project(db, db_project, project_in.model_dump(exclude_unset=True))
    return project

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """Soft delete a project."""
    db_project = await project_service.get_project(db, project_id=id, user_id=current_user.id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await project_service.soft_delete_project(db, db_project)
    return None
