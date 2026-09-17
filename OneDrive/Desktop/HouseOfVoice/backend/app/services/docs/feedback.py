"""
Patient feedback service for session ratings and comments.
"""
from datetime import datetime
from typing import List
from app.models.docs import FeedbackCreate, FeedbackResponse
import uuid


# In-memory store for feedback
_feedback_store: List[FeedbackResponse] = []
_feedback_seeded = False


def _seed_mock_feedback():
    """Seed in-memory store with mock patient feedback."""
    global _feedback_seeded
    
    if _feedback_seeded:
        return
    
    mock_feedback = FeedbackResponse(
        id=str(uuid.uuid4()),
        case_id="CASE-001",
        session_id="SESSION-001",
        rating=5,
        satisfaction_level="very_satisfied",
        comments="My child really enjoyed today's session! The therapist was patient and made the exercises fun. We've noticed improvement at home.",
        submitted_at=datetime.now()
    )
    
    _feedback_store.append(mock_feedback)
    _feedback_seeded = True
    print(f"Seeded mock patient feedback: {mock_feedback.id}")


def submit_feedback(data: FeedbackCreate, use_mocks: bool = True) -> FeedbackResponse:
    """
    Submit patient feedback for a session.
    """
    if use_mocks:
        _seed_mock_feedback()
    
    feedback = FeedbackResponse(
        id=str(uuid.uuid4()),
        case_id=data.case_id,
        session_id=data.session_id,
        rating=data.rating,
        satisfaction_level=data.satisfaction_level,
        comments=data.comments,
        submitted_at=datetime.now()
    )
    _feedback_store.append(feedback)
    return feedback


def get_feedback_by_case(case_id: str, use_mocks: bool = True) -> List[FeedbackResponse]:
    """
    Get all feedback for a specific case.
    """
    if use_mocks:
        _seed_mock_feedback()
    
    return [fb for fb in _feedback_store if fb.case_id == case_id]
