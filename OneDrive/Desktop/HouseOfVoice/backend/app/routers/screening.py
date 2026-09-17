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

    # Always save to local temp directory so pipeline can read from disk
    from pathlib import Path
    temp_dir = Path("backend/tmp/recordings")
    temp_dir.mkdir(parents=True, exist_ok=True)
    local_file_path = temp_dir / f"{clip_id}.webm"
    local_file_path.write_bytes(file_bytes)
    logger.info(f"[screening] Saved clip {clip_id} to {local_file_path}")

    storage_url = f"local://{local_file_path.absolute()}"

    # Attempt Supabase upload as secondary (non-blocking)
    supabase = get_supabase_client()
    if supabase:
        try:
            remote_path = f"{case_id}/{prompt_type.value}_{clip_id}.webm"
            supabase.storage.from_(SUPABASE_BUCKET).upload(remote_path, file_bytes)
            storage_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(remote_path)
            logger.info(f"[screening] Uploaded clip {clip_id} to Supabase")
        except Exception as e:
            logger.warning(f"Supabase upload failed (using local fallback): {e}")
        
    _RECORDINGS_DB[clip_id] = {
        "clip_id": clip_id,
        "case_id": case_id,
        "prompt_type": prompt_type,
        "storage_url": storage_url,
        "recorded_at": recorded_at,
        "raw_bytes": file_bytes,
        "local_file_path": str(local_file_path.absolute()),
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
    # Build clip_sources: prefer raw_bytes in memory, then local_file_path on disk
    clip_sources: dict = {}
    missing_clips = []
    for p_type, c_id in request.clip_ids.items():
        if c_id in _RECORDINGS_DB:
            rec = _RECORDINGS_DB[c_id]
            clip_sources[p_type] = {
                "bytes": rec.get("raw_bytes"),
                "local_file_path": rec.get("local_file_path"),
            }
        else:
            missing_clips.append(c_id)
            logger.warning(f"[screening] clip_id {c_id} not found in session — skipping.")

    if not clip_sources:
        raise HTTPException(
            status_code=400,
            detail="No recorded clips found in this session. Please record all steps before analyzing."
        )

    try:
        result = await run_full_pipeline(request.case_id, clip_sources)
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
