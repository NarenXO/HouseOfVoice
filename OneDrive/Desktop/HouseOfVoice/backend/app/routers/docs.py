from fastapi import APIRouter, HTTPException
from typing import List

from app.models.docs import SessionNoteCreate, SessionNoteResponse
from app.services.docs.session_notes import (
    save_note,
    get_notes_by_case,
    get_note_by_session,
    seed_mock_note,
)

USE_MOCKS = True

router = APIRouter()

# Flag to ensure mock data is seeded only once
_mock_seeded = False


def _ensure_mock_seeded():
    """Seed mock data on first request if USE_MOCKS is True."""
    global _mock_seeded
    if USE_MOCKS and not _mock_seeded:
        seed_mock_note()
        _mock_seeded = True


@router.get("/health")
async def health():
    return {"status": "docs-slice-ok"}


@router.post("/session-notes", response_model=SessionNoteResponse, status_code=201)
async def create_session_note(note: SessionNoteCreate):
    """
    Create a new session note.
    """
    _ensure_mock_seeded()
    return save_note(note)


@router.get("/session-notes/{case_id}", response_model=List[SessionNoteResponse])
async def get_session_notes(case_id: str):
    """
    Get all session notes for a specific case.
    """
    _ensure_mock_seeded()
    notes = get_notes_by_case(case_id)
    return notes
