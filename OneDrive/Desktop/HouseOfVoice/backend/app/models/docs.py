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


class AIDraftRequest(BaseModel):
    session_note_id: str


class AIDraftResponse(BaseModel):
    id: str
    session_note_id: str
    soap_note: str
    session_summary: str
    parent_summary: str
    approved: bool = False
    created_at: datetime


class DashboardMetric(BaseModel):
    label: str
    data: list[dict]


class DashboardResponse(BaseModel):
    case_id: str
    speech_clarity: DashboardMetric
    fluency: DashboardMetric
    pronunciation: DashboardMetric
    voice_stability: DashboardMetric
    attendance: DashboardMetric
    milestone_progress: DashboardMetric
    generalization_rate: dict[str, list[dict]]
    isolation_forest_alert: bool
    alert_message: str | None = None
