from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field
from uuid import UUID

# ---------- FRAME SCHEMAS ----------

class FrameBase(BaseModel):
    name: str = "Frame 1"
    phase_label: Optional[str] = None
    duration_ms: int = Field(default=1800, ge=500, le=10000)

class FrameCreate(FrameBase):
    id: Optional[UUID] = None
    snapshot: dict
    insert_after_id: Optional[UUID] = None
    version: Optional[int] = None

class FrameUpdate(BaseModel):
    snapshot: dict
    version: Optional[int] = None # For Optimistic Concurrency

class FrameMetaUpdate(BaseModel):
    name: Optional[str] = None
    phase_label: Optional[str] = None
    duration_ms: Optional[int] = Field(None, ge=500, le=10000)
    order_index: Optional[int] = None

class FrameResponse(FrameBase):
    id: UUID
    project_id: UUID
    order_index: int
    snapshot: dict = Field(validation_alias="snapshot_json", serialization_alias="snapshot")
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# ---------- BOARD SCHEMAS ----------

class ViewportData(BaseModel):
    zoom: float = 1.0
    x: float = 0.0
    y: float = 0.0

class BoardUpdate(BaseModel):
    pitch_type: str
    viewport: ViewportData
    active_frame_id: Optional[UUID] = None
    client_updated_at: datetime  # For optimistic concurrency
    version: Optional[int] = None # Added for OCC

class BoardResponse(BaseModel):
    id: UUID
    project_id: UUID
    pitch_type: str
    viewport: ViewportData = Field(validation_alias="viewport_json", serialization_alias="viewport")
    active_frame_id: Optional[UUID]
    schema_version: int
    version: int
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# ---------- PROJECT SCHEMAS ----------

class ProjectBase(BaseModel):
    title: str = Field(..., max_length=120)
    pitch_type: str = "full"
    theme: str = "classic_green"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=120)
    pitch_type: Optional[str] = None
    theme: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Allows responding with frames attached natively
class ProjectFullResponse(ProjectResponse):
    board: Optional[BoardResponse] = None
    frames: list[FrameResponse] = []
