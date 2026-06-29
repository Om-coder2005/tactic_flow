import uuid
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.system import FormationTemplate
from pydantic import BaseModel, Field

router = APIRouter()

class FormationNode(BaseModel):
    role: str
    x: float
    y: float

class FormationCreateReq(BaseModel):
    name: str = Field(max_length=60)
    format: str = Field(pattern="^(11v11|7v7|5v5|futsal)$")
    nodes: List[FormationNode]

class FormationResponse(BaseModel):
    id: str
    name: str
    format: str
    category: str
    is_builtin: bool
    owner_user_id: Optional[uuid.UUID]
    nodes: List[FormationNode]

@router.get("", response_model=List[FormationResponse])
async def list_formations(
    format: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = select(FormationTemplate)
    if format:
        query = query.where(FormationTemplate.format == format)
    if category:
        query = query.where(FormationTemplate.category == category)
        
    result = await db.execute(query)
    formations = result.scalars().all()
    
    # Filter: builtin OR owned by current user
    filtered = []
    for f in formations:
        if f.is_builtin or (current_user and f.owner_user_id == current_user.id):
            filtered.append({
                "id": f.id,
                "name": f.name,
                "format": f.format,
                "category": f.category,
                "is_builtin": f.is_builtin,
                "owner_user_id": f.owner_user_id,
                "nodes": f.nodes_json
            })
    return filtered

@router.post("", response_model=FormationResponse, status_code=201)
async def create_formation(
    payload: FormationCreateReq,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    f_id = f"custom-{uuid.uuid4()}"
    new_formation = FormationTemplate(
        id=f_id,
        owner_user_id=current_user.id,
        name=payload.name,
        format=payload.format,
        category="custom",
        nodes_json=[n.model_dump() for n in payload.nodes],
        is_builtin=False
    )
    db.add(new_formation)
    await db.commit()
    await db.refresh(new_formation)
    return {
        "id": new_formation.id,
        "name": new_formation.name,
        "format": new_formation.format,
        "category": new_formation.category,
        "is_builtin": new_formation.is_builtin,
        "owner_user_id": new_formation.owner_user_id,
        "nodes": new_formation.nodes_json
    }

@router.delete("/{formation_id}", status_code=204)
async def delete_formation(
    formation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(FormationTemplate).where(FormationTemplate.id == formation_id)
    result = await db.execute(query)
    formation = result.scalar_one_or_none()
    
    if not formation:
        raise HTTPException(status_code=404, detail="Formation not found")
        
    if formation.is_builtin or formation.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this formation")
        
    await db.delete(formation)
    await db.commit()
