from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class ExportFrameData(BaseModel):
    frame_id: str
    base64_image: str  # e.g., "data:image/png;base64,iVBORw0KGgo..."

class ExportRequest(BaseModel):
    type: str  # 'png' | 'pdf'
    preset: str  # 'instagram' | 'youtube' | 'slide' | 'a4' | 'custom'
    frames: List[ExportFrameData]
    include_ai_summary_id: Optional[UUID] = None

class ExportResponse(BaseModel):
    job_id: str
    status: str

class ExportJobResponse(BaseModel):
    job_id: str
    status: str
    download_url: Optional[str] = None
    error_message: Optional[str] = None
