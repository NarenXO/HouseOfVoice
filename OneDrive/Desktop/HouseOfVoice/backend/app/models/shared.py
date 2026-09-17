"""
FROZEN shared types — DO NOT EDIT during the 24h build.
Every domain imports from here.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class Role(str, Enum):
    PATIENT = "patient"
    GUARDIAN = "guardian"
    THERAPIST = "therapist"
    SUPERVISOR = "supervisor"

class ReadingAbility(str, Enum):
    PRE_READER = "pre_reader"
    DEVELOPING = "developing"
    FLUENT = "fluent"

class TypingAbility(str, Enum):
    NONE = "none"
    DEVELOPING = "developing"
    FLUENT = "fluent"

class CommunicationMethod(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    IMAGES = "images"

class ComfortLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class CommunicationProfile(BaseModel):
    primary_language: str = "en"
    secondary_language: Optional[str] = None
    preferred_therapy_language: str = "en"
    reading_ability: ReadingAbility = ReadingAbility.DEVELOPING
    typing_ability: TypingAbility = TypingAbility.DEVELOPING
    preferred_communication_method: CommunicationMethod = CommunicationMethod.VOICE
    guardian_assistance_required: bool = False
    comfort_with_unfamiliar_people: ComfortLevel = ComfortLevel.MEDIUM

class CurrentUser(BaseModel):
    id: str
    email: str
    role: Role
    name: str
    communication_profile: Optional[CommunicationProfile] = None

class ScreeningResult(BaseModel):
    case_id: str
    overall_severity: str
    phoneme_scores: dict
    fluency_score: float
    language_score: float
    recommendations: List[str]
    created_at: datetime

class Milestone(BaseModel):
    id: str
    phoneme: str
    target: str
    current_level: str
    status: str  # "not_started" | "in_progress" | "mastered"

class ProbeResult(BaseModel):
    milestone_id: str
    score: float
    attempts: int
    passed: bool
    timestamp: datetime

class GeneralizationScore(BaseModel):
    case_id: str
    phoneme: str
    context_scores: dict  # e.g. {"home": 0.8, "school": 0.5}
    overall: float

class SessionRecord(BaseModel):
    session_id: str
    case_id: str
    therapist_id: str
    duration_minutes: int
    activities_completed: List[str]
    notes: str
    created_at: datetime

class ModuleLibraryEntry(BaseModel):
    id: str
    phoneme: str
    age_band: str
    language: str
    title: str
    description: str
    storyboard_url: Optional[str] = None
    approved: bool = False
