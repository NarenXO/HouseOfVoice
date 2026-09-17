"""Naren's auth models — imports frozen shared types."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
from app.models.shared import Role, CommunicationProfile

class UserRole(str, Enum):
    PATIENT = "patient"
    GUARDIAN = "guardian"
    THERAPIST = "therapist"
    SUPERVISOR = "supervisor"

class SessionMode(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    HYBRID = "hybrid"

class VerificationStatus(str, Enum):
    SELF_DECLARED = "Self Declared"
    PENDING_VERIFICATION = "Pending Verification"
    INSTITUTION_VERIFIED = "Institution Verified"

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = {}
    
    # Guardian-specific (capturing child info)
    child_name: Optional[str] = None
    child_dob: Optional[date] = None
    child_gender: Optional[str] = None
    
    # Therapist / Supervisor specific
    specialization: Optional[str] = None
    languages: Optional[List[str]] = []
    years_experience: Optional[int] = 0
    weekly_availability: Optional[Dict[str, Any]] = {}
    session_mode: Optional[SessionMode] = SessionMode.ONLINE
    verification_status: Optional[VerificationStatus] = VerificationStatus.SELF_DECLARED

class RegisterResponse(BaseModel):
    user_id: str
    role: UserRole
    email: str
    name: str
    message: str
    child_id: Optional[str] = None

class IntakeRequest(BaseModel):
    primary_concern: str
    medical_history: Optional[str] = None
    prior_therapy: Optional[str] = None
    medications: Optional[str] = None
    therapy_goals: Optional[str] = None
    daily_challenges: Optional[List[str]] = None

class ConsentRequest(BaseModel):
    recording_consent: bool
    supervisor_presence_consent: bool
    declined_reason: Optional[str] = None

class CommunicationProfileRequest(BaseModel):
    user_id: str
    profile: CommunicationProfile

class IntakeFormRequest(BaseModel):
    user_id: str
    primary_concern: str
    medical_history: Optional[str] = None
    prior_therapy: Optional[str] = None
    medications: Optional[str] = None
    therapy_goals: Optional[str] = None
    daily_challenges: Optional[Dict[str, Any]] = {}

class ConsentFormRequest(BaseModel):
    user_id: str
    recording_consent: bool
    supervisor_presence_consent: bool
    accepted_at: Optional[datetime] = None
    declined_reason: Optional[str] = None
