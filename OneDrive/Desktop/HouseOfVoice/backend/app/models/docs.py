"""
Documentation models - imports from shared types.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4

from app.models.shared import (
    CurrentUser,
    ScreeningResult,
    Milestone,
    ProbeResult,
    GeneralizationScore,
    SessionRecord,
    ModuleLibraryEntry,
)


class SessionNoteCreate(BaseModel):
    case_id: str
    session_id: str
    activities: List[str] = Field(default_factory=list)
    patient_response: str
    homework_assigned: str
    clinical_observations: str


class SessionNoteResponse(BaseModel):
    id: str
    case_id: str
    session_id: str
    activities: List[str]
    patient_response: str
    homework_assigned: str
    clinical_observations: str
    created_at: datetime
