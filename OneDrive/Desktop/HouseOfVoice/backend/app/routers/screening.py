"""OWNERSHIP: Salman. Step 3 + Step 5 — baseline recording + AI screening pipeline."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
import uuid
from datetime import datetime
import os

router = APIRouter()

# In-memory storage for demo (in production, use Supabase Storage)
recordings_storage: Dict[str, Dict] = {}


@router.get("/ping")
def ping():
    return {"module": "screening", "status": "ok"}


@router.post("/baseline-recording")
async def upload_baseline_recording(
    case_id: str,
    prompt_type: str,
    audio_file: UploadFile = File(...)
):
    """
    Upload audio recording for baseline speech assessment.
    In production, this would store to Supabase Storage.
    For demo, we store in memory and return a clip ID.
    """
    try:
        # Generate unique clip ID
        clip_id = f"{case_id}_{prompt_type}_{uuid.uuid4().hex[:8]}"
        
        # Read audio file content
        content = await audio_file.read()
        
        # Store in memory (in production, upload to Supabase Storage)
        recordings_storage[clip_id] = {
            "clip_id": clip_id,
            "case_id": case_id,
            "prompt_type": prompt_type,
            "storage_url": f"/tmp/recordings/{clip_id}.webm",
            "file_size": len(content),
            "recorded_at": datetime.utcnow().isoformat(),
            "content": content
        }
        
        return {
            "clip_id": clip_id,
            "case_id": case_id,
            "prompt_type": prompt_type,
            "storage_url": recordings_storage[clip_id]["storage_url"],
            "recorded_at": recordings_storage[clip_id]["recorded_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/run-pipeline")
async def run_screening_pipeline(payload: Dict):
    """
    Run the AI screening pipeline on uploaded recordings.
    In production, this would run Whisper STT, VAD, acoustic analysis, and Gemini summary.
    For demo, we return a mock screening result.
    """
    try:
        case_id = payload.get("case_id", "demo-case-001")
        clip_ids = payload.get("clip_ids", {})
        
        # Mock screening result matching frontend ScreeningResult type
        return {
            "case_id": case_id,
            "overall_severity": "mild",
            "phoneme_scores": {
                "/r/": 0.45,
                "/s/": 0.32,
                "/th/": 0.18
            },
            "fluency_score": 0.78,
            "language_score": 0.82,
            "recommendations": [
                "Consider targeting /r/ and /s/ sounds in therapy",
                "Practice spontaneous speech exercises",
                "Monitor progress over 6-8 weeks"
            ],
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


@router.get("/result/{case_id}")
async def get_screening_result(case_id: str):
    """
    Retrieve screening result for a case.
    For demo, return a mock result.
    """
    try:
        return {
            "case_id": case_id,
            "overall_severity": "mild",
            "phoneme_scores": {
                "/r/": 0.45,
                "/s/": 0.32,
                "/th/": 0.18
            },
            "fluency_score": 0.78,
            "language_score": 0.82,
            "recommendations": [
                "Consider targeting /r/ and /s/ sounds in therapy",
                "Practice spontaneous speech exercises",
                "Monitor progress over 6-8 weeks"
            ],
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch result failed: {str(e)}")
