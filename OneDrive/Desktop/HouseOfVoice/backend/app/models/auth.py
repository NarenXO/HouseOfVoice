"""Naren's auth models — imports frozen shared types."""
from pydantic import BaseModel
from typing import Optional, List
from app.models.shared import CommunicationProfile, Role

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: Role
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    contact_info: Optional[str] = None
    guardian_id: Optional[str] = None
    # therapist-specific
    specialization: Optional[str] = None
    languages: Optional[List[str]] = None
    years_experience: Optional[int] = None
    weekly_availability: Optional[str] = None
    session_mode: Optional[str] = None

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
