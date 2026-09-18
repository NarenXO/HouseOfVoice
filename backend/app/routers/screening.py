"""OWNERSHIP: Salman. Step 3 + Step 5 — baseline recording + AI screening pipeline."""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Dict
import uuid
from datetime import datetime
import os
import hashlib

router = APIRouter()

# In-memory storage for demo (in production, use Supabase Storage)
recordings_storage: Dict[str, Dict] = {}


@router.get("/ping")
def ping():
    return {"message": "screening router alive"}


@router.post("/baseline-recording")
async def upload_baseline_recording(
    file: UploadFile = File(None),
    audio_file: UploadFile = File(None),
    case_id: str = Form("demo_patient"),
    prompt_type: str = Form("sentence")
):
    """
    Upload audio recording for baseline speech assessment.
    In production, this would store to Supabase Storage.
    For demo, we store in memory and return a clip ID.
    """
    try:
        # Use whichever file field is provided
        upload_file = file or audio_file
        if not upload_file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Generate unique clip ID
        clip_id = f"clip_{uuid.uuid4().hex[:8]}"

        # Read audio file content
        content = await upload_file.read()

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
            "status": "success",
            "clip_id": clip_id,
            "case_id": case_id,
            "prompt_type": prompt_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/run-pipeline")
async def run_screening_pipeline(payload: Dict):
    """
    Run the AI screening pipeline on uploaded recordings.
    In production, this would run Whisper STT, VAD, acoustic analysis, and Gemini summary.
    For demo, we return dynamic screening results based on input parameters.
    """
    try:
        case_id = payload.get("case_id", "demo-case-001")
        clip_ids = payload.get("clip_ids", {})
        prompt_type = payload.get("prompt_type", "sentence")
        
        # Generate dynamic scores based on case_id and prompt_type for variety
        # Use hash of case_id to seed pseudo-random values
        seed = int(hashlib.md5(case_id.encode()).hexdigest()[:8], 16)
        
        # Different prompt types yield different score patterns
        if prompt_type == "sentence":
            base_r = 0.35 + (seed % 20) / 100.0  # 0.35-0.55
            base_s = 0.40 + ((seed >> 4) % 25) / 100.0  # 0.40-0.65
            base_th = 0.25 + ((seed >> 8) % 20) / 100.0  # 0.25-0.45
            fluency = 0.70 + ((seed >> 12) % 20) / 100.0  # 0.70-0.90
            language = 0.75 + ((seed >> 16) % 20) / 100.0  # 0.75-0.95
        elif prompt_type == "picture":
            base_r = 0.45 + (seed % 15) / 100.0  # 0.45-0.60
            base_s = 0.50 + ((seed >> 4) % 20) / 100.0  # 0.50-0.70
            base_th = 0.35 + ((seed >> 8) % 15) / 100.0  # 0.35-0.50
            fluency = 0.80 + ((seed >> 12) % 15) / 100.0  # 0.80-0.95
            language = 0.80 + ((seed >> 16) % 15) / 100.0  # 0.80-0.95
        else:  # spontaneous
            base_r = 0.30 + (seed % 25) / 100.0  # 0.30-0.55
            base_s = 0.35 + ((seed >> 4) % 25) / 100.0  # 0.35-0.60
            base_th = 0.20 + ((seed >> 8) % 25) / 100.0  # 0.20-0.45
            fluency = 0.65 + ((seed >> 12) % 25) / 100.0  # 0.65-0.90
            language = 0.70 + ((seed >> 16) % 25) / 100.0  # 0.70-0.95
        
        # Determine severity based on average phoneme score
        avg_phoneme = (base_r + base_s + base_th) / 3
        if avg_phoneme >= 0.7:
            severity = "mild"
        elif avg_phoneme >= 0.5:
            severity = "moderate"
        else:
            severity = "severe"
        
        # Generate dynamic recommendations based on lowest scores
        recommendations = []
        phoneme_list = [("r", base_r), ("s", base_s), ("th", base_th)]
        phoneme_list.sort(key=lambda x: x[1])  # Sort by score ascending
        
        if phoneme_list[0][1] < 0.5:
            recommendations.append(f"Priority focus on /{phoneme_list[0][0]}/ sound production")
        if phoneme_list[1][1] < 0.6:
            recommendations.append(f"Secondary target: /{phoneme_list[1][0]}/ articulation exercises")
        
        if fluency < 0.75:
            recommendations.append("Practice paced speech techniques to improve fluency")
        if language < 0.75:
            recommendations.append("Work on sentence structure and language organization")
        
        recommendations.append("Monitor progress over 6-8 weeks with regular assessments")
        
        # Return dynamic screening result matching frontend ScreeningResult type
        return {
            "case_id": case_id,
            "overall_severity": severity,
            "phoneme_scores": {
                "/r/": round(base_r, 3),
                "/s/": round(base_s, 3),
                "/th/": round(base_th, 3)
            },
            "fluency_score": round(fluency, 3),
            "language_score": round(language, 3),
            "recommendations": recommendations,
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


@router.get("/result/{case_id}")
async def get_screening_result(case_id: str):
    """
    Retrieve screening result for a case.
    For demo, return dynamic results based on case_id.
    """
    try:
        # Generate dynamic scores based on case_id for variety
        seed = int(hashlib.md5(case_id.encode()).hexdigest()[:8], 16)
        
        base_r = 0.35 + (seed % 20) / 100.0  # 0.35-0.55
        base_s = 0.40 + ((seed >> 4) % 25) / 100.0  # 0.40-0.65
        base_th = 0.25 + ((seed >> 8) % 20) / 100.0  # 0.25-0.45
        fluency = 0.70 + ((seed >> 12) % 20) / 100.0  # 0.70-0.90
        language = 0.75 + ((seed >> 16) % 20) / 100.0  # 0.75-0.95
        
        # Determine severity based on average phoneme score
        avg_phoneme = (base_r + base_s + base_th) / 3
        if avg_phoneme >= 0.7:
            severity = "mild"
        elif avg_phoneme >= 0.5:
            severity = "moderate"
        else:
            severity = "severe"
        
        # Generate dynamic recommendations
        recommendations = []
        phoneme_list = [("r", base_r), ("s", base_s), ("th", base_th)]
        phoneme_list.sort(key=lambda x: x[1])
        
        if phoneme_list[0][1] < 0.5:
            recommendations.append(f"Priority focus on /{phoneme_list[0][0]}/ sound production")
        if phoneme_list[1][1] < 0.6:
            recommendations.append(f"Secondary target: /{phoneme_list[1][0]}/ articulation exercises")
        
        if fluency < 0.75:
            recommendations.append("Practice paced speech techniques to improve fluency")
        if language < 0.75:
            recommendations.append("Work on sentence structure and language organization")
        
        recommendations.append("Monitor progress over 6-8 weeks with regular assessments")
        
        return {
            "case_id": case_id,
            "overall_severity": severity,
            "phoneme_scores": {
                "/r/": round(base_r, 3),
                "/s/": round(base_s, 3),
                "/th/": round(base_th, 3)
            },
            "fluency_score": round(fluency, 3),
            "language_score": round(language, 3),
            "recommendations": recommendations,
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch result failed: {str(e)}")
