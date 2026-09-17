"""Learning path generation using AI (Gemini)."""
from typing import List, Optional
from app.models.shared import Milestone, ScreeningResult


class PathGenerator:
    """Generates personalized learning paths based on screening results."""

    @staticmethod
    def generate_path(case_id: str, screening_result: ScreeningResult) -> List[Milestone]:
        """
        Generate a learning path based on screening results.

        In production, this would call the Gemini API to generate
        a personalized sequence of milestones based on the patient's
        flagged errors and speech profile.

        Args:
            case_id: Patient case ID
            screening_result: Screening results with flagged errors

        Returns:
            List of milestones ordered by sequence
        """
        # Stub implementation - generates mock milestones based on flagged errors
        milestones: List[Milestone] = []

        # Extract phonemes from flagged errors
        flagged_errors = screening_result.flagged_errors if screening_result.flagged_errors else []

        # Create milestones for each flagged error
        for idx, error in enumerate(flagged_errors[:5], start=1):  # Limit to 5 for demo
            milestone = Milestone(
                id=f"m_{case_id}_{idx}",
                path_id=f"path_{case_id}",
                order_index=idx,
                title=error,
                goal=f"Master {error} in structured practice",
                status="locked",
                linked_demo_id=None,
            )
            milestones.append(milestone)

        # If no errors, provide a default path
        if not milestones:
            milestone = Milestone(
                id=f"m_{case_id}_1",
                path_id=f"path_{case_id}",
                order_index=1,
                title="Basic Articulation",
                goal="Establish baseline articulation skills",
                status="locked",
                linked_demo_id=None,
            )
            milestones.append(milestone)

        return milestones

    @staticmethod
    def suggest_next_milestone(current_milestones: List[Milestone]) -> Optional[Milestone]:
        """
        Suggest the next milestone to work on based on current progress.

        Args:
            current_milestones: List of current milestones with their statuses

        Returns:
            The next milestone to focus on, or None if all complete
        """
        # Find the first locked milestone after any active/trained ones
        for milestone in current_milestones:
            if milestone.status == "locked":
                return milestone

        return None
