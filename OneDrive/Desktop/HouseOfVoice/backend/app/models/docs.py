from app.models.shared import *
from datetime import datetime
from typing import List


class SessionNoteCreate(BaseModel):
    case_id: str
    session_id: str
    activities: List[str]
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
