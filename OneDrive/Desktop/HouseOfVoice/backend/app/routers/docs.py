from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.models.docs import SessionNoteCreate, SessionNoteResponse, AIDraftRequest, AIDraftResponse, DashboardResponse, UrgentFlagCreate, UrgentFlagResponse, ReassessmentCreate, ReassessmentResponse, FeedbackCreate, FeedbackResponse, SupervisorEvalCreate, SupervisorEvalResponse, CaseCloseCreate, CaseCloseResponse, FollowUpCheckinCreate, FollowUpCheckinResponse
from app.services.docs import save_note, get_notes_by_case, get_note_by_session, generate_draft, approve_draft, get_drafts_by_case, get_dashboard, raise_flag, get_flags_by_case, create_reassessment, get_reassessments, submit_feedback, get_feedback_by_case, submit_evaluation, get_evaluations_by_case, close_case, get_case_status, submit_followup, get_followups_by_case
import json
import os
from pathlib import Path

USE_MOCKS = os.getenv("USE_MOCKS", "false").lower() == "true"

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "docs-slice-ok"}


def _seed_mock_data():
    """Seed in-memory store with mock data from session_record.mock.json."""
    from app.services.docs.session_notes import _notes_store
    
    if _notes_store:  # Already seeded
        return
    
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    with open(base_path / "session_record.mock.json", "r") as f:
        session_record = json.load(f)
    
    mock_note = SessionNoteCreate(
        case_id=session_record["case_id"],
        session_id=session_record["session_id"],
        activities=session_record["activities_completed"],
        patient_response="Patient showed good engagement during minimal pairs drill.",
        homework_assigned="Practice /r/ words at home for 10 minutes daily.",
        clinical_observations=session_record["notes"]
    )
    
    saved_note = save_note(mock_note)
    print(f"Seeded mock session note: {saved_note.id}")


@router.post("/session-notes", response_model=SessionNoteResponse, status_code=201)
async def create_session_note(note: SessionNoteCreate):
    if USE_MOCKS:
        _seed_mock_data()
    
    saved_note = save_note(note)
    return saved_note


@router.get("/session-notes/{case_id}", response_model=List[SessionNoteResponse])
async def get_session_notes(case_id: str):
    if USE_MOCKS:
        _seed_mock_data()
    
    notes = get_notes_by_case(case_id)
    return notes


@router.post("/session-notes/draft", response_model=AIDraftResponse)
async def generate_ai_draft(request: AIDraftRequest):
    if USE_MOCKS:
        _seed_mock_data()
    
    try:
        draft = generate_draft(request.session_note_id)
        return draft
    except ValueError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/session-notes/draft/{draft_id}/approve", response_model=AIDraftResponse)
async def approve_ai_draft(draft_id: str):
    approved_draft = approve_draft(draft_id)
    if not approved_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return approved_draft


@router.get("/session-notes/drafts/{case_id}", response_model=List[AIDraftResponse])
async def get_ai_drafts(case_id: str):
    if USE_MOCKS:
        _seed_mock_data()
    
    drafts = get_drafts_by_case(case_id)
    return drafts


@router.get("/dashboard/{case_id}", response_model=DashboardResponse)
async def get_dashboard_data(case_id: str):
    try:
        dashboard_data = get_dashboard(case_id)
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute dashboard metrics: {str(e)}")


@router.post("/urgent-flag", response_model=UrgentFlagResponse, status_code=201)
async def create_urgent_flag(flag: UrgentFlagCreate):
    created_flag = raise_flag(flag)
    return created_flag


@router.get("/urgent-flags/{case_id}", response_model=List[UrgentFlagResponse])
async def get_urgent_flags(case_id: str):
    flags = get_flags_by_case(case_id)
    return flags


@router.post("/reassessment", response_model=ReassessmentResponse, status_code=201)
async def create_reassessment_endpoint(reassessment: ReassessmentCreate):
    created_reassessment = create_reassessment(reassessment)
    return created_reassessment


@router.get("/reassessments/{case_id}", response_model=List[ReassessmentResponse])
async def get_reassessments_endpoint(case_id: str):
    reassessments = get_reassessments(case_id)
    return reassessments


@router.post("/feedback", response_model=FeedbackResponse, status_code=201)
async def create_feedback(feedback: FeedbackCreate):
    created_feedback = submit_feedback(feedback, use_mocks=USE_MOCKS)
    return created_feedback


@router.get("/feedback/{case_id}", response_model=List[FeedbackResponse])
async def get_feedback(case_id: str):
    feedback_list = get_feedback_by_case(case_id, use_mocks=USE_MOCKS)
    return feedback_list


@router.post("/supervisor-evaluation", response_model=SupervisorEvalResponse, status_code=201)
async def create_supervisor_evaluation(evaluation: SupervisorEvalCreate):
    created_evaluation = submit_evaluation(evaluation)
    return created_evaluation


@router.get("/supervisor-evaluations/{case_id}", response_model=List[SupervisorEvalResponse])
async def get_supervisor_evaluations(case_id: str):
    evaluations = get_evaluations_by_case(case_id)
    return evaluations


@router.post("/case/{id}/close", response_model=CaseCloseResponse, status_code=201)
async def close_case_endpoint(id: str, closure_data: CaseCloseCreate):
    closure_data.case_id = id
    closed_case = close_case(closure_data)
    return closed_case


@router.get("/case/{id}/closure", response_model=Optional[CaseCloseResponse])
async def get_case_closure(id: str):
    closure = get_case_status(id)
    return closure


@router.post("/case/{id}/follow-up-response", response_model=FollowUpCheckinResponse, status_code=201)
async def submit_followup_endpoint(id: str, followup_data: FollowUpCheckinCreate):
    followup_data.case_id = id
    followup = submit_followup(followup_data)
    return followup


@router.get("/case/{id}/follow-ups", response_model=List[FollowUpCheckinResponse])
async def get_case_followups(id: str):
    followups = get_followups_by_case(id)
    return followups
