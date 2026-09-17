from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class Therapist(BaseModel):
    id: str
    name: str
    specialization: List[str]
    languages: List[str]
    years_experience: int
    weekly_availability: Dict[str, Any]
    session_mode: Literal["in-person", "virtual", "hybrid"]
    current_caseload: int

class Supervisor(BaseModel):
    id: str
    name: str
    current_caseload: int

class Booking(BaseModel):
    id: str
    case_id: str
    therapist_id: str
    datetime: datetime
    mode: Literal["in-person", "virtual"]
    status: Literal["pending", "confirmed", "no_response", "trial"]
    reminder_sent: bool

class SupervisorAssignment(BaseModel):
    booking_id: str
    supervisor_id: str
    assigned_at: datetime

class TherapyPlan(BaseModel):
    id: str
    case_id: str = Field(alias="caseId")
    therapist_id: str = Field(alias="therapistId")
    goals: List[str]
    session_mode: str = Field(alias="sessionMode")
    gemini_draft: Optional[Dict[str, Any]] = None
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    approved_at: Optional[datetime] = Field(None, alias="approvedAt")

    model_config = ConfigDict(populate_by_name=True)

class ReasoningFactor(BaseModel):
    factor: str
    contribution: float
    explanation: str

class TherapistRecommendation(BaseModel):
    therapist: Therapist
    score: float
    reasoning: List[ReasoningFactor]

class BookingCreateRequest(BaseModel):
    case_id: str
    therapist_id: str
    datetime: datetime
    mode: Literal["in-person", "virtual"]
    is_trial: bool = False

class SupervisorAssignRequest(BaseModel):
    booking_id: str

class PlanDraftRequest(BaseModel):
    case_id: str
    therapist_id: str
    goals: List[str]
    session_mode: str

class PlanApproveRequest(BaseModel):
    approved_by: str
