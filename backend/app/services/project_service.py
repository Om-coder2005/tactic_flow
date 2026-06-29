from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import uuid

from app.models.tactics import Project, Board, Frame
from app.schemas.tactics import ProjectCreate

async def create_project(db: AsyncSession, user_id: uuid.UUID, project_in: ProjectCreate) -> Project:
    db_project = Project(
        user_id=user_id,
        title=project_in.title,
        pitch_type=project_in.pitch_type,
        theme=project_in.theme
    )
    db.add(db_project)
    await db.flush() # Secure the ID
    
    # Auto-initialize an empty board for every new project
    db_board = Board(
        project_id=db_project.id,
        pitch_type=project_in.pitch_type,
        viewport_json={"zoom": 1.0, "x": 0.0, "y": 0.0},
        schema_version=1
    )
    db.add(db_board)

    # Bootstrap an initial frame so every project is immediately editable.
    db_frame = Frame(
        project_id=db_project.id,
        name="Frame 1",
        phase_label=None,
        order_index=0,
        duration_ms=1800,
        snapshot_json={
            "schema_version": 1,
            "pitch_type": project_in.pitch_type,
            "theme": project_in.theme,
            "objects": [],
        },
        version=1,
    )
    db.add(db_frame)
    await db.commit()
    await db.refresh(db_project)
    return db_project

async def get_user_projects(db: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Project]:
    stmt = (
        select(Project)
        .where(Project.user_id == user_id, Project.is_deleted == False)
        .order_by(desc(Project.updated_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

from sqlalchemy.orm import selectinload

async def get_project(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Project]:
    stmt = (
        select(Project)
        .options(selectinload(Project.board), selectinload(Project.frames))
        .where(
            Project.id == project_id,
            Project.user_id == user_id,
            Project.is_deleted == False
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_project(db: AsyncSession, db_project: Project, project_in: dict) -> Project:
    for field, value in project_in.items():
        if hasattr(db_project, field) and value is not None:
            setattr(db_project, field, value)
    db_project.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_project)
    return db_project

async def soft_delete_project(db: AsyncSession, db_project: Project) -> Project:
    db_project.is_deleted = True
    db_project.updated_at = datetime.utcnow()
    await db.commit()
    return db_project
