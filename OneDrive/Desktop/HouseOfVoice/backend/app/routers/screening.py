import os
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from app.models.screening import (
    BaselineRecordingResponse,
    RunPipelineRequest,
    ScreeningResultDB,
    PromptType
)
from app.services.screening.pipeline import run_full_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/screening", tags=["screening"])

# --- Environment & Storage Setup ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "baseline-recordings")

# In-memory runtime dictionaries for session persistence
_RECORDINGS_DB: Dict[str, dict] = {}
_RESULTS_DB: Dict[str, dict] = {}

def get_supabase_client():
    if not (SUPABASE_URL and SUPABASE_KEY):
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

@router.post("/baseline-recording", response_model=BaselineRecordingResponse)
async def create_baseline_recording(
    case_id: str = Form(...),
    prompt_type: PromptType = Form(...),
    audio_file: UploadFile = File(...)
):
    if not audio_file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    
    file_bytes = await audio_file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")
        
    clip_id = str(uuid.uuid4())
    recorded_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    storage_url = None
    supabase = get_supabase_client()
    if supabase:
        try:
            file_path = f"{case_id}/{prompt_type.value}_{clip_id}.wav"
            supabase.storage.from_(SUPABASE_BUCKET).upload(file_path, file_bytes)
            storage_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(file_path)
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}")
    
    if not storage_url:
        # Fallback to local storage
        from pathlib import Path
        import tempfile
        local_dir = Path("backend/tmp/screening") / case_id
        local_dir.mkdir(parents=True, exist_ok=True)
        local_path = local_dir / f"{clip_id}.wav"
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        storage_url = f"local://{local_path.absolute()}"
        
    _RECORDINGS_DB[clip_id] = {
        "clip_id": clip_id,
        "case_id": case_id,
        "prompt_type": prompt_type,
        "storage_url": storage_url,
        "recorded_at": recorded_at,
        "raw_bytes": file_bytes
    }
    
    return BaselineRecordingResponse(
        clip_id=clip_id,
        case_id=case_id,
        prompt_type=prompt_type,
        storage_url=storage_url,
        recorded_at=recorded_at
    )

@router.post("/run-pipeline", response_model=ScreeningResultDB)
async def run_pipeline(request: RunPipelineRequest):
    clip_data = {}
    for p_type, c_id in request.clip_ids.items():
        if c_id in _RECORDINGS_DB:
            clip_data[p_type] = {
                "url": _RECORDINGS_DB[c_id]["storage_url"],
                "bytes": _RECORDINGS_DB[c_id]["raw_bytes"]
            }
        else:
            clip_data[p_type] = {
                "url": f"https://mock-storage.houseofvoice.internal/{request.case_id}/fallback_{c_id}.wav",
                "bytes": None
            }
            
    try:
        result = await run_full_pipeline(request.case_id, clip_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[screening] Pipeline error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    _RESULTS_DB[request.case_id] = result
    return ScreeningResultDB(**result)

@router.get("/result/{case_id}", response_model=ScreeningResultDB)
async def get_screening_result(case_id: str):
    if case_id in _RESULTS_DB:
        return ScreeningResultDB(**_RESULTS_DB[case_id])
        
    raise HTTPException(status_code=404, detail=f"ScreeningResult for case_id '{case_id}' not found.")
