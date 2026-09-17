from typing import List
from fastapi import APIRouter, HTTPException
from app.models.docs import SessionNoteCreate, SessionNoteResponse, AIDraftRequest, AIDraftResponse
from app.services.docs import save_note, get_notes_by_case, get_note_by_session, generate_draft, approve_draft, get_drafts_by_case
import json
from pathlib import Path

USE_MOCKS = True

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
