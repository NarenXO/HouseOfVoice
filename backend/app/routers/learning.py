"""OWNERSHIP: Sameer. Steps 9B/9C + Learning Engine — learning path, milestones, generalization probes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.learning import MilestoneStateMachine
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


@router.get("/paths/{case_id}/roadmap")
def get_roadmap(case_id: str):
    """
    Get the full learning path roadmap for a patient case.

    Returns milestones ordered by sequence with current status,
    plus streak information for motivation.
    """
    path_data = store.get_path(case_id)

    if not path_data:
        # Return demo data if no path exists
        return {
            "path_id": f"path_{case_id}",
            "case_id": case_id,
            "is_live": False,
            "milestones": [
                {
                    "id": "m1",
                    "path_id": f"path_{case_id}",
                    "order_index": 1,
                    "title": "s - start of words",
                    "goal": "Produce /s/ correctly at word-initial position",
                    "status": "generalized",
                    "linked_demo_id": "mod_s_start",
                },
                {
                    "id": "m2",
                    "path_id": f"path_{case_id}",
                    "order_index": 2,
                    "title": "s - end of words",
                    "goal": "Produce /s/ correctly at word-final position",
                    "status": "trained",
                    "linked_demo_id": "mod_s_end",
                },
                {
                    "id": "m3",
                    "path_id": f"path_{case_id}",
                    "order_index": 3,
                    "title": "short sentences with s",
                    "goal": "Use /s/ correctly in short sentences",
                    "status": "active",
                    "linked_demo_id": None,
                },
                {
                    "id": "m4",
                    "path_id": f"path_{case_id}",
                    "order_index": 4,
                    "title": "stories with s",
                    "goal": "Use /s/ correctly in longer narratives",
                    "status": "locked",
                    "linked_demo_id": None,
                },
            ],
            "streak": {"current_streak_days": 2},
        }

    # Sort milestones by order_index
    sorted_milestones = sorted(path_data.get("milestones", []), key=lambda m: m["order_index"])

    return {
        "path_id": path_data.get("path_id"),
        "case_id": case_id,
        "is_live": path_data.get("is_live", False),
        "milestones": sorted_milestones,
        "streak": {"current_streak_days": 2},  # Hardcoded for now, real logic in Phase 7
    }

