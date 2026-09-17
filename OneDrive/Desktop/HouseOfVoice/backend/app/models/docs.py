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


class UrgentFlagCreate(BaseModel):
    case_id: str
    raised_by: str
    note: str


class UrgentFlagResponse(BaseModel):
    id: str
    case_id: str
    raised_by: str
    raised_at: datetime
    note: str


class ReassessmentCreate(BaseModel):
    case_id: str


class ReassessmentResponse(BaseModel):
    id: str
    case_id: str
    baseline_snapshot: dict
    current_snapshot: dict
    improvement_summary: str
    assessed_at: datetime


class FeedbackCreate(BaseModel):
    case_id: str
    session_id: str
    rating: int
    satisfaction_level: str
    comments: str


class FeedbackResponse(BaseModel):
    id: str
    case_id: str
    session_id: str
    rating: int
    satisfaction_level: str
    comments: str
    submitted_at: datetime


class SupervisorEvalCreate(BaseModel):
    case_id: str
    therapist_id: str
    documentation_quality: int
    therapy_planning: int
    session_quality: int
    clinical_reasoning: int
    professional_communication: int
    feedback_notes: str


class SupervisorEvalResponse(BaseModel):
    id: str
    case_id: str
    therapist_id: str
    documentation_quality: int
    therapy_planning: int
    session_quality: int
    clinical_reasoning: int
    professional_communication: int
    feedback_notes: str
    average_score: float
    evaluated_at: datetime


class CaseCloseCreate(BaseModel):
    case_id: str
    discharge_reason: str
    discharge_notes: str
    therapist_id: str


class CaseCloseResponse(BaseModel):
    id: str
    case_id: str
    discharge_reason: str
    discharge_notes: str
    final_summary: dict
    closed_at: datetime
    status: str


class FollowUpCheckinCreate(BaseModel):
    case_id: str
    response_text: str
    progress_status: str
    wants_followup_booking: bool


class FollowUpCheckinResponse(BaseModel):
    id: str
    case_id: str
    prompted_at: datetime
    response_text: str
    progress_status: str
    wants_followup_booking: bool
    created_at: datetime
