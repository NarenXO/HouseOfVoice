"""Practice tracker for milestone exercise completion and streak management."""
from datetime import date, timedelta, datetime
from typing import Dict, List
import uuid


# In-memory stores (hackathon — matches the _paths pattern from Phase 2)
_attempts: Dict[str, List[Dict]] = {}  # milestone_id -> [attempts]
_streaks: Dict[str, Dict] = {}  # case_id -> streak data
_consecutive_successes: Dict[str, int] = {}  # milestone_id -> count

CONSECUTIVE_SUCCESS_THRESHOLD = 3  # N days before checkpoint fires


async def record_practice_attempt(
    milestone_id: str,
    case_id: str,
    exercise_index: int,
    audio_or_text: str = ""
) -> Dict:
    """
    Record a practice attempt for a milestone exercise.

    Args:
        milestone_id: The milestone being practiced
        case_id: Patient case ID
        exercise_index: Which exercise in the milestone (0-based)
        audio_or_text: Audio or text input (stub for now)

    Returns:
        Dict with attempt details and progress info
    """
    from .scorer import MilestoneScorer

    # Initialize milestone attempts if not exists
    if milestone_id not in _attempts:
        _attempts[milestone_id] = []

    # Call the stubbed scorer (for now, always pass for demo)
    # In production, this would analyze audio/text
    passed = True  # Stub: always pass for demo
    # passed = MilestoneScorer.score_attempt(milestone_id, audio_or_text, is_probe=False)

    # Create practice attempt record
    attempt_id = str(uuid.uuid4())
    attempt = {
        "attempt_id": attempt_id,
        "milestone_id": milestone_id,
        "case_id": case_id,
        "exercise_index": exercise_index,
        "audio_or_text": audio_or_text,
        "passed": passed,
        "is_probe": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    _attempts[milestone_id].append(attempt)

    # Update consecutive success counter
    if passed:
        _consecutive_successes[milestone_id] = _consecutive_successes.get(milestone_id, 0) + 1
    else:
        _consecutive_successes[milestone_id] = 0

    # Check if checkpoint is ready
    consecutive_count = _consecutive_successes.get(milestone_id, 0)
    checkpoint_ready = consecutive_count >= CONSECUTIVE_SUCCESS_THRESHOLD

    return {
        "attempt_id": attempt_id,
        "passed": passed,
        "exercise_done": True,
        "consecutive_successes": consecutive_count,
        "checkpoint_ready": checkpoint_ready,
    }


async def update_streak(case_id: str) -> Dict:
    """
    Update the practice streak for a patient.

    Streak logic:
    - If last_practice_date == today: no change (already practiced today)
    - If last_practice_date == yesterday: increment current_streak_days
    - If last_practice_date < yesterday: reset to 1 (streak broken)
    - If no streak exists: create with current_streak_days = 1
    - Update last_practice_date = today

    Args:
        case_id: Patient case ID

    Returns:
        Updated streak data
    """
    today = date.today()
    yesterday = today - timedelta(days=1)

    if case_id not in _streaks:
        # Create new streak
        _streaks[case_id] = {
            "current_streak_days": 1,
            "last_practice_date": today.isoformat(),
        }
    else:
        streak_data = _streaks[case_id]
        last_practice_date = date.fromisoformat(streak_data["last_practice_date"])

        if last_practice_date == today:
            # Already practiced today, no change
            pass
        elif last_practice_date == yesterday:
            # Consecutive day, increment streak
            streak_data["current_streak_days"] += 1
            streak_data["last_practice_date"] = today.isoformat()
        else:
            # Streak broken, reset to 1
            streak_data["current_streak_days"] = 1
            streak_data["last_practice_date"] = today.isoformat()

    return _streaks[case_id]


async def get_practice_progress(milestone_id: str) -> Dict:
    """
    Get practice progress for a milestone.

    Args:
        milestone_id: The milestone to get progress for

    Returns:
        Dict with progress information
    """
    attempts = _attempts.get(milestone_id, [])
    consecutive_count = _consecutive_successes.get(milestone_id, 0)
    checkpoint_ready = consecutive_count >= CONSECUTIVE_SUCCESS_THRESHOLD

    # Calculate completed exercises (unique exercise indices that passed)
    completed_exercises = set()
    for attempt in attempts:
        if attempt["passed"]:
            completed_exercises.add(attempt["exercise_index"])

    total_exercises = 3  # Stub: assume 3 exercises per milestone
    completed_count = len(completed_exercises)

    # Get recent attempts (last 5)
    recent_attempts = attempts[-5:] if attempts else []

    return {
        "total_exercises": total_exercises,
        "completed_exercises": completed_count,
        "consecutive_successes": consecutive_count,
        "checkpoint_ready": checkpoint_ready,
        "recent_attempts": recent_attempts,
    }


async def reset_milestone_practice(milestone_id: str):
    """
    Reset practice tracking when a milestone transitions to a new status.

    Clears the consecutive success counter but keeps historical attempts
    for generalization statistics.

    Args:
        milestone_id: The milestone to reset
    """
    _consecutive_successes[milestone_id] = 0
    # Note: We do NOT delete _attempts[milestone_id] to preserve history


async def get_streak(case_id: str) -> Dict:
    """
    Get the current streak for a patient.

    Args:
        case_id: Patient case ID

    Returns:
        Streak data (current_streak_days, last_practice_date)
    """
    if case_id not in _streaks:
        return {"current_streak_days": 0, "last_practice_date": None}
    return _streaks[case_id]
