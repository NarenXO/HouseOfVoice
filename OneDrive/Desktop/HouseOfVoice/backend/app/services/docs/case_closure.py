"""
Case closure and follow-up check-in service.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from app.models.docs import CaseCloseCreate, CaseCloseResponse, FollowUpCheckinCreate, FollowUpCheckinResponse
import json
import random
from pathlib import Path
import uuid


# In-memory stores
_case_closures: dict[str, CaseCloseResponse] = {}
_followup_checkins: List[FollowUpCheckinResponse] = []


def close_case(data: CaseCloseCreate) -> CaseCloseResponse:
    """
    Close a case and generate final outcome summary.
    """
    # Load baseline screening data for comparison
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    with open(base_path / "screening_result.mock.json", "r") as f:
        screening_data = json.load(f)
    
    # Generate current final scores (synthesized as improved from baseline)
    baseline_clarity = sum(screening_data.get("phoneme_scores", {}).values()) / len(screening_data.get("phoneme_scores", {})) if screening_data.get("phoneme_scores") else 0.5
    final_clarity = min(1.0, baseline_clarity + random.uniform(0.15, 0.25))  # 15-25% improvement
    
    # Generate milestone completion (100% for successful closure)
    milestones_completed = random.randint(8, 12)
    total_milestones = 12
    milestone_percentage = (milestones_completed / total_milestones) * 100
    
    # Calculate improvement percentage
    improvement_percentage = ((final_clarity - baseline_clarity) / baseline_clarity) * 100 if baseline_clarity > 0 else 0
    
    # Generate final summary
    final_summary = {
        "initial_speech_clarity": round(baseline_clarity * 100, 1),
        "final_speech_clarity": round(final_clarity * 100, 1),
        "improvement_percentage": round(improvement_percentage, 1),
        "milestones_completed": milestones_completed,
        "total_milestones": total_milestones,
        "milestone_completion_rate": round(milestone_percentage, 1),
        "generalization_mastery": "High" if final_clarity > 0.8 else "Moderate",
        "total_sessions": random.randint(16, 24),
        "discharge_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    closure = CaseCloseResponse(
        id=str(uuid.uuid4()),
        case_id=data.case_id,
        discharge_reason=data.discharge_reason,
        discharge_notes=data.discharge_notes,
        final_summary=final_summary,
        closed_at=datetime.now(),
        status="closed"
    )
    
    _case_closures[data.case_id] = closure
    return closure


def get_case_status(case_id: str) -> Optional[CaseCloseResponse]:
    """
    Get the closure status for a case. Returns None if case is still open.
    """
    return _case_closures.get(case_id)


def submit_followup(data: FollowUpCheckinCreate) -> FollowUpCheckinResponse:
    """
    Submit a follow-up check-in response.
    Logs intent flag if re-booking is needed.
    """
    # Check if intent flag should be logged
    should_log_intent = (
        data.wants_followup_booking or
        data.progress_status in ["some_regression", "significant_difficulty"]
    )
    
    if should_log_intent:
        print(f"NEW_BOOKING_INTENT_LOGGED for case {data.case_id}: Progress status '{data.progress_status}', re-booking requested: {data.wants_followup_booking}")
    
    checkin = FollowUpCheckinResponse(
        id=str(uuid.uuid4()),
        case_id=data.case_id,
        prompted_at=datetime.now() - timedelta(weeks=4),  # Simulate 4-week gap
        response_text=data.response_text,
        progress_status=data.progress_status,
        wants_followup_booking=data.wants_followup_booking,
        created_at=datetime.now()
    )
    
    _followup_checkins.append(checkin)
    return checkin


def get_followups_by_case(case_id: str) -> List[FollowUpCheckinResponse]:
    """
    Get all follow-up check-ins for a specific case.
    """
    return [fu for fu in _followup_checkins if fu.case_id == case_id]
