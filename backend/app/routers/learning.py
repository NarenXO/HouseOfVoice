"""OWNERSHIP: Sameer. Steps 9B/9C + Learning Engine — learning path, milestones, generalization probes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from urllib.parse import unquote
from app.services.learning import (
    MilestoneStateMachine,
    record_practice_attempt,
    update_streak,
    get_practice_progress,
    get_streak,
    should_serve_probe,
    serve_probe,
    score_probe,
    get_probe_statistics,
    get_all_phoneme_statistics,
    award_badge,
    get_badges,
)
from app.models.shared import Milestone

router = APIRouter()


# In-memory store for demo (replace with database in production)
class LearningPathStore:
    def __init__(self):
        self.paths: dict = {}
        self.milestones: dict = {}

    def get_path(self, case_id: str) -> Optional[dict]:
        return self.paths.get(case_id)

    def set_path(self, case_id: str, path_data: dict):
        self.paths[case_id] = path_data

    def get_milestone(self, milestone_id: str) -> Optional[Milestone]:
        return self.milestones.get(milestone_id)

    def set_milestone(self, milestone_id: str, milestone: Milestone):
        self.milestones[milestone_id] = milestone


store = LearningPathStore()


class UnlockRequest(BaseModel):
    case_id: str


class PracticeAttemptRequest(BaseModel):
    case_id: str
    exercise_index: int
    audio_or_text: str = ""


class CheckpointRequest(BaseModel):
    case_id: str
    phoneme: str = "/s/"
    audio_or_text: str = ""


@router.get("/ping")
def ping():
    return {"module": "learning", "status": "ok"}


@router.post("/milestones/{milestone_id}/unlock")
def unlock_milestone(milestone_id: str, request: UnlockRequest):
    """
    Manually unlock a milestone (soft lock override).

    This allows patients to progress even if they haven't completed
    the previous milestone, supporting flexible therapy paths.
    """
    milestone = store.get_milestone(milestone_id)

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    try:
        updated_milestone = MilestoneStateMachine.transition(milestone, "active")
        store.set_milestone(milestone_id, updated_milestone)
        return updated_milestone
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/milestones/{milestone_id}/practice-attempt")
async def practice_attempt(milestone_id: str, request: PracticeAttemptRequest):
    """
    Record a practice attempt for a milestone exercise.

    Only active milestones accept practice attempts. The system tracks
    consecutive successful attempts and signals when the checkpoint is ready.
    """
    milestone = store.get_milestone(milestone_id)

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if milestone.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Only active milestones accept practice attempts. Current status: {milestone.status}"
        )

    # Record the practice attempt
    attempt_result = await record_practice_attempt(
        milestone_id=milestone_id,
        case_id=request.case_id,
        exercise_index=request.exercise_index,
        audio_or_text=request.audio_or_text
    )

    # Update streak
    streak_data = await update_streak(request.case_id)

    return {
        "attempt_id": attempt_result["attempt_id"],
        "passed": attempt_result["passed"],
        "exercise_done": attempt_result["exercise_done"],
        "consecutive_successes": attempt_result["consecutive_successes"],
        "checkpoint_ready": attempt_result["checkpoint_ready"],
        "streak": streak_data
    }


@router.get("/milestones/{milestone_id}/progress")
async def get_progress(milestone_id: str):
    """
    Get practice progress for a milestone.

    Returns completion status, consecutive successes, and checkpoint readiness.
    """
    progress_data = await get_practice_progress(milestone_id)
    return progress_data


@router.get("/paths/{case_id}/roadmap")
async def get_roadmap(case_id: str):
    """
    Get the full learning path roadmap for a patient case.

    Returns milestones ordered by sequence with current status,
    plus streak information for motivation.
    """
    path_data = store.get_path(case_id)

    # Get streak from practice tracker
    streak_data = await get_streak(case_id)

    if not path_data:
        # Initialize demo milestones in store for practice attempts
        demo_milestones = [
            Milestone(
                id="m1",
                path_id=f"path_{case_id}",
                order_index=1,
                title="s - start of words",
                goal="Produce /s/ correctly at word-initial position",
                status="generalized",
                linked_demo_id="mod_s_start",
            ),
            Milestone(
                id="m2",
                path_id=f"path_{case_id}",
                order_index=2,
                title="s - end of words",
                goal="Produce /s/ correctly at word-final position",
                status="trained",
                linked_demo_id="mod_s_end",
            ),
            Milestone(
                id="m3",
                path_id=f"path_{case_id}",
                order_index=3,
                title="short sentences with s",
                goal="Use /s/ correctly in short sentences",
                status="active",
                linked_demo_id=None,
            ),
            Milestone(
                id="m4",
                path_id=f"path_{case_id}",
                order_index=4,
                title="stories with s",
                goal="Use /s/ correctly in longer narratives",
                status="locked",
                linked_demo_id=None,
            ),
        ]

        # Store milestones for practice attempts AND store the path
        for milestone in demo_milestones:
            store.set_milestone(milestone.id, milestone)

        store.set_path(case_id, {
            "path_id": f"path_{case_id}",
            "case_id": case_id,
            "is_live": False,
            "milestones": [m.model_dump() for m in demo_milestones],
        })

        return {
            "path_id": f"path_{case_id}",
            "case_id": case_id,
            "is_live": False,
            "milestones": [m.model_dump() for m in demo_milestones],
            "streak": streak_data,
        }

    # Sort milestones by order_index
    sorted_milestones = sorted(path_data.get("milestones", []), key=lambda m: m["order_index"])

    return {
        "path_id": path_data.get("path_id"),
        "case_id": case_id,
        "is_live": path_data.get("is_live", False),
        "milestones": sorted_milestones,
        "streak": streak_data,
    }


@router.post("/milestones/{milestone_id}/checkpoint")
async def checkpoint(milestone_id: str, request: CheckpointRequest):
    """
    Handle checkpoint probe serving and scoring.

    Phase 1 (serve): If audio_or_text is empty, check if probe should be served
    and return a probe word from the probe bank.

    Phase 2 (score): If audio_or_text is provided, score the probe attempt
    and update milestone status accordingly.
    """
    milestone = store.get_milestone(milestone_id)

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Phase 1: Serve probe
    if not request.audio_or_text:
        # Check if probe should be served
        ready = await should_serve_probe(milestone_id)

        if not ready:
            return {
                "phase": "not_ready",
                "message": "Complete more practice sessions to unlock checkpoint."
            }

        # Serve the probe
        probe_item = await serve_probe(milestone_id, request.phoneme)

        return {
            "phase": "probe_served",
            "item": probe_item
        }

    # Phase 2: Score probe
    result = await score_probe(
        milestone_id=milestone_id,
        case_id=request.case_id,
        phoneme=request.phoneme,
        audio_or_text=request.audio_or_text,
        path_milestones=None
    )

    # Update milestone status in store (only if different from current and transition is valid)
    new_status = result["milestone_status"]
    if milestone.status != new_status and MilestoneStateMachine.can_transition(milestone.status, new_status):
        updated_milestone = MilestoneStateMachine.transition(milestone, new_status)
        store.set_milestone(milestone_id, updated_milestone)

    return {
        "phase": "probe_scored",
        "result": result["result"],
        "milestone_status": result["milestone_status"],
        "badge_awarded": result["badge_awarded"],
        "badge": result.get("badge"),
        "message": result["message"],
        "extra_practice_items": result.get("extra_practice_items", [])
    }


@router.get("/generalization/{case_id}")
async def get_generalization_summary(case_id: str):
    """
    Get generalization statistics summary for all phonemes for a case.

    Returns overall statistics and per-phoneme breakdown.
    """
    stats = get_all_phoneme_statistics(case_id)
    return stats


@router.get("/generalization/{case_id}/{phoneme}")
async def get_generalization_stats(case_id: str, phoneme: str):
    """
    Get generalization statistics for a case and phoneme.

    Returns probe attempt counts, pass rate, and last updated timestamp.
    """
    # Decode URL-encoded phoneme (e.g., %2Fs%2F -> /s/)
    decoded_phoneme = unquote(phoneme)
    # Remove slashes if present for consistency with probe_engine
    normalized_phoneme = decoded_phoneme.strip("/")
    stats = get_probe_statistics(case_id, normalized_phoneme)
    return stats


@router.get("/badges/{case_id}")
async def get_badges_endpoint(case_id: str):
    """
    Get all badges awarded to a case.

    Returns list of awarded badges with total count.
    """
    badges_data = get_badges(case_id)
    return badges_data

