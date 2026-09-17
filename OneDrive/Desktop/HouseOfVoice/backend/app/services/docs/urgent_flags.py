"""
Urgent flag service for managing high-priority case concerns.
"""
from datetime import datetime
from typing import List
from app.models.docs import UrgentFlagCreate, UrgentFlagResponse
import uuid


# In-memory store for urgent flags
_flags_store: List[UrgentFlagResponse] = []


def raise_flag(data: UrgentFlagCreate) -> UrgentFlagResponse:
    """
    Create a new urgent flag for a case.
    """
    flag = UrgentFlagResponse(
        id=str(uuid.uuid4()),
        case_id=data.case_id,
        raised_by=data.raised_by,
        raised_at=datetime.now(),
        note=data.note
    )
    _flags_store.append(flag)
    return flag


def get_flags_by_case(case_id: str) -> List[UrgentFlagResponse]:
    """
    Get all urgent flags for a specific case.
    """
    return [flag for flag in _flags_store if flag.case_id == case_id]
