from fastapi import APIRouter
from app.models.screening import (
    BaselineRecording,
    BaselineRecordingResponse,
    RunPipelineRequest,
    ScreeningResultDB
)
from app.services.screening.pipeline import run_full_pipeline

router = APIRouter(prefix="/screening", tags=["screening"])

@router.post("/baseline-recording", response_model=BaselineRecordingResponse)
async def create_baseline_recording(recording: BaselineRecording):
    return BaselineRecordingResponse(
        clip_id="mock-clip-id",
        case_id=recording.case_id,
        prompt_type=recording.prompt_type,
        storage_url=recording.storage_url,
        recorded_at=recording.recorded_at
    )

@router.post("/run-pipeline", response_model=ScreeningResultDB)
async def run_pipeline(request: RunPipelineRequest):
    result = await run_full_pipeline(request.case_id, request.clip_ids)
    return ScreeningResultDB(**result)

@router.get("/result/{case_id}", response_model=ScreeningResultDB)
async def get_screening_result(case_id: str):
    # For now, reuse the mock pipeline to return a mock result
    result = await run_full_pipeline(case_id, {})
    return ScreeningResultDB(**result)
