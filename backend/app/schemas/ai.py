from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class PhaseObservation(BaseModel):
    phase: str
    notes: str

class ConfidenceBlock(BaseModel):
    overall: float
    notes: List[str]

class TacticalSummaryOutput(BaseModel):
    title: str
    formation_summary: str
    shape_summary: str
    short_summary: str
    detailed_explanation: List[str]
    speaking_points: List[str]
    phase_observations: List[PhaseObservation]
    risks: List[str]
    caption_ideas: List[str]
    confidence: ConfidenceBlock

class AIFeaturesExtractReq(BaseModel):
    frame_id: Optional[str] = None
    snapshot: Optional[dict] = None
    snapshots: Optional[List[dict]] = None
    stream: Optional[bool] = False
    mode: Optional[str] = "analytical"
    tone: Optional[str] = "balanced"

class AIResponseRecord(TacticalSummaryOutput):
    id: UUID
    project_id: UUID
    frame_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
