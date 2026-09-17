from pydantic import BaseModel
from typing import Dict, List
from enum import Enum

class PromptType(str, Enum):
    SENTENCE = "sentence"
    PICTURE = "picture"
    SPONTANEOUS = "spontaneous"

class BaselineRecording(BaseModel):
    id: str
    case_id: str
    prompt_type: PromptType
    storage_url: str
    recorded_at: str

class BaselineRecordingResponse(BaseModel):
    clip_id: str
    case_id: str
    prompt_type: PromptType
    storage_url: str
    recorded_at: str

class RunPipelineRequest(BaseModel):
    case_id: str
    clip_ids: Dict[str, str]

class ScreeningResultDB(BaseModel):
    case_id: str
    overall_severity: str
    phoneme_scores: Dict[str, float]
    fluency_score: float
    language_score: float
    recommendations: List[str]
    created_at: str
