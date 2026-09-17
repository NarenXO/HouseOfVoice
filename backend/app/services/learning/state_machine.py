"""Milestone state machine for learning path progression."""
from typing import Literal
from app.models.shared import Milestone


class MilestoneStateMachine:
    """Manages milestone status transitions according to therapy rules."""

    # Valid transitions: (from_status, to_status)
    VALID_TRANSITIONS = {
        ("locked", "active"),
        ("active", "trained"),
        ("trained", "generalized"),
        # Allow manual unlock override
        ("locked", "active"),
    }

    @staticmethod
    def can_transition(current_status: str, new_status: str) -> bool:
        """Check if a transition is valid."""
        return (current_status, new_status) in MilestoneStateMachine.VALID_TRANSITIONS

    @staticmethod
    def transition(milestone: Milestone, new_status: str) -> Milestone:
        """
        Transition a milestone to a new status.

        Args:
            milestone: Current milestone object
            new_status: Desired new status

        Returns:
            Updated milestone with new status

        Raises:
            ValueError: If transition is invalid
        """
        if not MilestoneStateMachine.can_transition(milestone.status, new_status):
            raise ValueError(
                f"Invalid transition from {milestone.status} to {new_status}. "
                f"Valid transitions from {milestone.status}: "
                f"{[t[1] for t in MilestoneStateMachine.VALID_TRANSITIONS if t[0] == milestone.status]}"
            )

        # Create updated milestone
        updated_data = milestone.model_dump()
        updated_data["status"] = new_status
        return Milestone(**updated_data)
