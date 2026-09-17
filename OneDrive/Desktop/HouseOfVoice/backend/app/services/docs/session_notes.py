"""
Session notes service - in-memory store for hackathon demo.
"""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from app.models.docs import SessionNoteCreate, SessionNoteResponse


# In-memory store keyed by note ID
_notes_store: dict[str, SessionNoteResponse] = {}


def save_note(note: SessionNoteCreate) -> SessionNoteResponse:
    """
    Save a session note to the in-memory store.
    
    Args:
        note: The session note to save
        
    Returns:
        The saved note with generated ID and timestamp
    """
    note_id = str(uuid4())
    created_at = datetime.utcnow()
    
    response = SessionNoteResponse(
        id=note_id,
        case_id=note.case_id,
        session_id=note.session_id,
        activities=note.activities,
        patient_response=note.patient_response,
        homework_assigned=note.homework_assigned,
        clinical_observations=note.clinical_observations,
        created_at=created_at,
    )
    
    _notes_store[note_id] = response
    return response


def get_notes_by_case(case_id: str) -> List[SessionNoteResponse]:
    """
    Get all session notes for a specific case.
    
    Args:
        case_id: The case ID to filter by
        
    Returns:
        List of session notes for the case
    """
    return [note for note in _notes_store.values() if note.case_id == case_id]


def get_note_by_session(session_id: str) -> Optional[SessionNoteResponse]:
    """
    Get a session note by session ID.
    
    Args:
        session_id: The session ID to look up
        
    Returns:
        The session note if found, None otherwise
    """
    for note in _notes_store.values():
        if note.session_id == session_id:
            return note
    return None


def seed_mock_note() -> None:
    """
    Seed the in-memory store with a mock note derived from session_record.mock.json.
    This is called on first request when USE_MOCKS is True.
    """
    from pathlib import Path
    import json
    
    # Load the mock session record
    # Navigate from backend/app/services/docs/session_notes.py to shared/mocks
    # Based on repo structure: backend/app/services/docs/session_notes.py -> shared/mocks
    # Go up 4 levels to reach the HouseOfVoice directory, then access shared/mocks
    base_path = Path(__file__).parent.parent.parent.parent / "shared" / "mocks"
    with open(base_path / "session_record.mock.json", "r") as f:
        session_record = json.load(f)
    
    # Create a mock note from the session record
    mock_note = SessionNoteCreate(
        case_id=session_record["case_id"],
        session_id=session_record["session_id"],
        activities=session_record["activities_completed"],
        patient_response="Patient showed good engagement during minimal pairs drill.",
        homework_assigned="Practice /r/ sounds in word-initial position for 10 minutes daily.",
        clinical_observations=session_record["notes"],
    )
    
    save_note(mock_note)
