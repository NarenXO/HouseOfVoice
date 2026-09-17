"""
Reassessment service for before/after progress comparison.
"""
from datetime import datetime
from typing import List
from app.models.docs import ReassessmentCreate, ReassessmentResponse
import json
import random
from pathlib import Path
import uuid


# In-memory store for reassessments
_reassessments_store: List[ReassessmentResponse] = []


def create_reassessment(case_id: str) -> ReassessmentResponse:
    """
    Create a new reassessment with synthesized current scores.
    """
    # Load baseline screening data
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    with open(base_path / "screening_result.mock.json", "r") as f:
        baseline_data = json.load(f)
    
    # Synthesize current scores by adding 8-18% improvement
    current_data = baseline_data.copy()
    
    # Helper function to add improvement
    def add_improvement(baseline_value: float) -> float:
        improvement = random.uniform(0.08, 0.18)  # 8-18% improvement
        new_value = baseline_value + improvement
        return min(1.0, new_value)  # Cap at 100%
    
    # Apply improvement to numeric scores
    if "phoneme_scores" in current_data:
        current_data["phoneme_scores"] = {
            phoneme: add_improvement(score)
            for phoneme, score in current_data["phoneme_scores"].items()
        }
    
    if "fluency_score" in current_data:
        current_data["fluency_score"] = add_improvement(current_data["fluency_score"])
    
    if "language_score" in current_data:
        current_data["language_score"] = add_improvement(current_data["language_score"])
    
    # Generate improvement summary
    summary_parts = []
    
    # Calculate phoneme improvements
    if "phoneme_scores" in baseline_data and "phoneme_scores" in current_data:
        for phoneme in baseline_data["phoneme_scores"]:
            baseline = baseline_data["phoneme_scores"][phoneme]
            current = current_data["phoneme_scores"][phoneme]
            improvement = (current - baseline) * 100
            summary_parts.append(
                f"/{phoneme}/ phoneme improved from {baseline*100:.0f}% to {current*100:.0f}% (+{improvement:.0f}pp)"
            )
    
    # Calculate fluency improvement
    if "fluency_score" in baseline_data and "fluency_score" in current_data:
        baseline = baseline_data["fluency_score"]
        current = current_data["fluency_score"]
        improvement = (current - baseline) * 100
        summary_parts.append(
            f"Fluency improved from {baseline*100:.0f}% to {current*100:.0f}% (+{improvement:.0f}pp)"
        )
    
    # Calculate language improvement
    if "language_score" in baseline_data and "language_score" in current_data:
        baseline = baseline_data["language_score"]
        current = current_data["language_score"]
        improvement = (current - baseline) * 100
        summary_parts.append(
            f"Language skills improved from {baseline*100:.0f}% to {current*100:.0f}% (+{improvement:.0f}pp)"
        )
    
    improvement_summary = ". ".join(summary_parts) + "."
    
    # Create reassessment record
    reassessment = ReassessmentResponse(
        id=str(uuid.uuid4()),
        case_id=case_id,
        baseline_snapshot=baseline_data,
        current_snapshot=current_data,
        improvement_summary=improvement_summary,
        assessed_at=datetime.now()
    )
    
    _reassessments_store.append(reassessment)
    return reassessment


def get_reassessments(case_id: str) -> List[ReassessmentResponse]:
    """
    Get all reassessments for a specific case.
    """
    return [r for r in _reassessments_store if r.case_id == case_id]
