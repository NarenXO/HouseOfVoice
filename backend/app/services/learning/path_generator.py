"""Learning path generation using AI (Gemini)."""
from typing import List, Optional
import os
import logging
from app.models.shared import Milestone, ScreeningResult


class PathGenerator:
    """Generates personalized learning paths based on screening results."""

    @staticmethod
    def generate_path(case_id: str, screening_result: ScreeningResult) -> List[Milestone]:
        """
        Generate a learning path based on screening results.

        Supports both mock and live modes via USE_MOCKS environment variable.
        - When USE_MOCKS=True: Uses mock generation (100% offline, no API keys)
        - When USE_MOCKS=False: Would call Gemini API (currently stubbed with fallback)

        Args:
            case_id: Patient case ID
            screening_result: Screening results with flagged errors

        Returns:
            List of milestones ordered by sequence
        """
        use_mocks = os.getenv("USE_MOCKS", "True").lower() == "true"

        if use_mocks:
            # Mock generation - 100% offline, no API keys required
            return PathGenerator._generate_mock_path(case_id, screening_result)
        else:
            # Live mode - would call Gemini API
            try:
                # TODO: Implement actual Gemini API call
                # For now, still use mock with warning
                logging.warning("Gemini API not yet implemented, falling back to mock generation")
                return PathGenerator._generate_mock_path(case_id, screening_result)
            except Exception as e:
                # Fallback to mock on error
                logging.error(f"Gemini API failed: {e}, falling back to mock generation")
                return PathGenerator._generate_mock_path(case_id, screening_result)

    @staticmethod
    def _generate_mock_path(case_id: str, screening_result: ScreeningResult) -> List[Milestone]:
        """
        Generate mock learning path based on screening results.

        Args:
            case_id: Patient case ID
            screening_result: Screening results with flagged errors

        Returns:
            List of milestones ordered by sequence
        """
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
