"""
In-memory session notes store for hackathon demo.
"""
from datetime import datetime
from uuid import uuid4
from typing import List, Optional
from app.models.docs import SessionNoteCreate, SessionNoteResponse


# In-memory store (dict keyed by id)
_notes_store: dict[str, SessionNoteResponse] = {}


def save_note(note: SessionNoteCreate) -> SessionNoteResponse:
    """Save a session note and return the response with generated id and timestamp."""
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
        created_at=created_at
    )
    
    _notes_store[note_id] = response
    return response


def get_notes_by_case(case_id: str) -> List[SessionNoteResponse]:
    """Get all session notes for a given case_id."""
    return [note for note in _notes_store.values() if note.case_id == case_id]


def get_note_by_session(session_id: str) -> Optional[SessionNoteResponse]:
    """Get a session note by session_id (returns None if not found)."""
    for note in _notes_store.values():
        if note.session_id == session_id:
            return note
    return None
