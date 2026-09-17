"""Scoring logic for training and generalization phases."""
from typing import List
from app.models.shared import ProbeResult, GeneralizationScore


class MilestoneScorer:
    """Scores milestone performance and determines generalization readiness."""

    # Thresholds for progression
    TRAINING_THRESHOLD = 0.8  # 80% success rate to mark as trained
    GENERALIZATION_THRESHOLD = 0.7  # 70% probe success to generalize

    @staticmethod
    def calculate_training_score(completed_exercises: int, total_exercises: int) -> float:
        """
        Calculate training completion score.

        Args:
            completed_exercises: Number of exercises completed successfully
            total_exercises: Total number of exercises in the milestone

        Returns:
            Score between 0.0 and 1.0
        """
        if total_exercises == 0:
            return 0.0
        return completed_exercises / total_exercises

    @staticmethod
    def is_trained(completed_exercises: int, total_exercises: int) -> bool:
        """
        Determine if milestone meets training threshold.

        Args:
            completed_exercises: Number of exercises completed successfully
            total_exercises: Total number of exercises in the milestone

        Returns:
            True if trained, False otherwise
        """
        score = MilestoneScorer.calculate_training_score(completed_exercises, total_exercises)
        return score >= MilestoneScorer.TRAINING_THRESHOLD

    @staticmethod
    def calculate_generalization_score(probe_results: List[ProbeResult]) -> GeneralizationScore:
        """
        Calculate generalization score from probe results.

        Args:
            probe_results: List of probe attempts for a phoneme

        Returns:
            GeneralizationScore object with rate and counts
        """
        if not probe_results:
            return GeneralizationScore(
                case_id=probe_results[0].case_id if probe_results else "",
                phoneme=probe_results[0].phoneme if probe_results else "",
                probes_attempted=0,
                probes_passed=0,
                rate=0.0,
            )

        phoneme = probe_results[0].phoneme
        case_id = probe_results[0].case_id
        passed = sum(1 for p in probe_results if p.passed)
        total = len(probe_results)
        rate = passed / total if total > 0 else 0.0

        return GeneralizationScore(
            case_id=case_id,
            phoneme=phoneme,
            probes_attempted=total,
            probes_passed=passed,
            rate=rate,
        )

    @staticmethod
    def is_generalized(probe_results: List[ProbeResult]) -> bool:
        """
        Determine if milestone meets generalization threshold.

        Args:
            probe_results: List of probe attempts

        Returns:
            True if generalized, False otherwise
        """
        if not probe_results:
            return False

        score = MilestoneScorer.calculate_generalization_score(probe_results)
        return score.rate >= MilestoneScorer.GENERALIZATION_THRESHOLD


async def score_attempt(milestone_id: str, audio_or_text: str, is_probe: bool = False) -> bool:
    """
    Score a single practice or probe attempt.

    Stub implementation for demo:
    - For regular practice: always returns True (trained)
    - For probes: returns True ~70% of the time (hash-based for consistency)

    Args:
        milestone_id: The milestone being attempted
        audio_or_text: Audio or text input (stub for now)
        is_probe: Whether this is a probe attempt

    Returns:
        True if passed, False otherwise
    """
    import hashlib

    if not is_probe:
        # Regular practice: always pass for demo
        return True

    # Probe: use hash for consistent 70% pass rate
    # This ensures the same word always gets the same result
    hash_input = f"{milestone_id}_{audio_or_text}".encode()
    hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
    return (hash_value % 100) < 70  # 70% pass rate
