"""
Domain-specific pydantic models. OWNERSHIP: whoever owns app/routers/session.py.
Extend freely — this file belongs only to you, so it can never conflict
with anyone else's PR. Import shared shapes from app.models.shared, don't
redefine them here.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.shared import *  # noqa: F401,F403  (shared contract types)

# TODO: add your own request/response models below.

class BoardSnapshotCreate(BaseModel):
    session_id: str
    snapshot_data: str  # Base64 data URL or JSON drawing vector
    saved_at: Optional[str] = None

class TurnState(BaseModel):
    session_id: str
    active_drawer_id: str
    updated_at: str

class DemoGenerateRequest(BaseModel):
    phoneme: str  # e.g. "/r/", "/s/", "/th/", "/b/"
    word: Optional[str] = None  # e.g. "rabbit", "sun"
    age_band: str = "child-6-8"
    reading_ability: str = "early-reader"
    language: str = "en-US"
    session_id: Optional[str] = None
    milestone_id: Optional[str] = None

class DemoStep(BaseModel):
    step_number: int
    duration_ms: int
    asset_ids: List[str]
    narration_text: str
    articulatory_cue: str

class DemoGenerateResponse(BaseModel):
    id: str
    phoneme: str
    word: Optional[str]
    total_duration_ms: int
    steps: List[DemoStep]
    narration_audio_url: Optional[str] = None
    linked_milestone_id: Optional[str] = None
    created_at: str
    tts_fallback_info: Optional[dict] = None

# Phase 6: Module Library Models
class ModuleGenerateRequest(BaseModel):
    phoneme: str
    age_band: str = "child-6-8"
    language: str = "en-US"
    source: str = "mid-session"  # "mid-session" or "library-admin"
    session_id: Optional[str] = None

class ModuleScene(BaseModel):
    scene_number: int
    duration_ms: int
    asset_ids: List[str]
    narration_text: str
    articulatory_cue: str
    transition_type: str = "crossfade"  # "crossfade", "slide", "zoom", "lottie_mouth"

class ModuleGenerateResponse(BaseModel):
    id: str
    phoneme: str
    age_band: str
    language: str
    title: str
    total_duration_ms: int
    scenes: List[ModuleScene]
    narration_audio_url: Optional[str] = None
    source: str
    approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: str
    tts_fallback_info: Optional[dict] = None

class ModuleApproveRequest(BaseModel):
    approved_by: str = "therapist_current"
    approved: bool = True

class ModuleLibraryListResponse(BaseModel):
    modules: List[dict]  # Each dict matches ModuleLibraryEntry frozen shape exactly
    total: int
    cached: bool = False

# Phase 7: Clinical Context & Session Record Models
class ClinicalContextResponse(BaseModel):
    case_id: str
    patient_name: str
    target_phonemes: List[str]
    weekly_goals: List[str]
    severity: str
    articulation_score: float
    milestones: List[dict]
    screening_summary: str
    session_mode: str
    therapist_id: str

class ModuleAttachmentCreate(BaseModel):
    module_id: str
    milestone_id: Optional[str] = None
    session_id: Optional[str] = None

class ModuleAttachmentResponse(BaseModel):
    success: bool
    linked_at: str
    attachment_id: str

class SessionEndRequest(BaseModel):
    case_id: str
    therapist_id: str
    session_id: str
    parent_present: bool
    low_bandwidth_mode: bool
    snapshots: List[str]
    demos_generated: List[str]
    modules_used: List[str]
    session_duration_seconds: int

class SessionEndResponse(BaseModel):
    status: str
    session_record: dict
    summary_for_soap: dict
