"""
Reassessment service for before/after progress comparison.
"""
from datetime import datetime
from typing import List, Optional
from app.models.docs import ReassessmentCreate, ReassessmentResponse
import json
from pathlib import Path
import uuid
from app.services.docs.session_notes import get_notes_by_case


# In-memory store for reassessments
_reassessments_store: List[ReassessmentResponse] = []


def create_reassessment(reassessment_data: ReassessmentCreate) -> ReassessmentResponse:
    """
    Create a new reassessment with real or derived current scores.
    """
    # Load baseline screening data
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    with open(base_path / "screening_result.mock.json", "r") as f:
        baseline_data = json.load(f)
    
    # If scores are provided in the request, use them
    if reassessment_data.clarity_score is not None:
        current_data = baseline_data.copy()
        
        # Update phoneme scores based on clarity score (average)
        if "phoneme_scores" in current_data:
            avg_phoneme = sum(current_data["phoneme_scores"].values()) / len(current_data["phoneme_scores"])
            improvement_factor = reassessment_data.clarity_score / avg_phoneme if avg_phoneme > 0 else 1.0
            current_data["phoneme_scores"] = {
                phoneme: min(1.0, score * improvement_factor)
                for phoneme, score in current_data["phoneme_scores"].items()
            }
        
        if reassessment_data.fluency_score is not None:
            current_data["fluency_score"] = reassessment_data.fluency_score
        
        if reassessment_data.pronunciation_score is not None:
            current_data["language_score"] = reassessment_data.pronunciation_score
        
        if reassessment_data.voice_stability_score is not None:
            # Use voice stability as an additional metric
            current_data["voice_stability_score"] = reassessment_data.voice_stability_score
    else:
        # Derive scores from session notes if not provided
        session_notes = get_notes_by_case(reassessment_data.case_id)
        
        # Calculate averages from session observations
        current_data = baseline_data.copy()
        
        if session_notes:
            # Count activities as a proxy for progress
            total_activities = sum(len(note.activities) for note in session_notes)
            activity_progress = min(1.0, total_activities / 20.0)  # Assume 20 activities is full progress
            
            # Apply progress factor to baseline scores
            if "phoneme_scores" in current_data:
                current_data["phoneme_scores"] = {
                    phoneme: min(1.0, score + (1.0 - score) * activity_progress * 0.3)
                    for phoneme, score in current_data["phoneme_scores"].items()
                }
            
            if "fluency_score" in current_data:
                current_data["fluency_score"] = min(1.0, current_data["fluency_score"] + (1.0 - current_data["fluency_score"]) * activity_progress * 0.3)
            
            if "language_score" in current_data:
                current_data["language_score"] = min(1.0, current_data["language_score"] + (1.0 - current_data["language_score"]) * activity_progress * 0.3)
    
    # Generate improvement summary with exact mathematical deltas
    summary_parts = []
    
    # Calculate phoneme improvements
    if "phoneme_scores" in baseline_data and "phoneme_scores" in current_data:
        for phoneme in baseline_data["phoneme_scores"]:
            baseline = baseline_data["phoneme_scores"][phoneme]
            current = current_data["phoneme_scores"][phoneme]
            improvement = (current - baseline) * 100
            direction = "+" if improvement >= 0 else ""
            summary_parts.append(
                f"/{phoneme}/ phoneme: {baseline*100:.0f}% → {current*100:.0f}% ({direction}{improvement:.0f}pp)"
            )
    
    # Calculate fluency improvement
    if "fluency_score" in baseline_data and "fluency_score" in current_data:
        baseline = baseline_data["fluency_score"]
        current = current_data["fluency_score"]
        improvement = (current - baseline) * 100
        direction = "+" if improvement >= 0 else ""
        summary_parts.append(
            f"Fluency: {baseline*100:.0f}% → {current*100:.0f}% ({direction}{improvement:.0f}pp)"
        )
    
    # Calculate language improvement
    if "language_score" in baseline_data and "language_score" in current_data:
        baseline = baseline_data["language_score"]
        current = current_data["language_score"]
        improvement = (current - baseline) * 100
        direction = "+" if improvement >= 0 else ""
        summary_parts.append(
            f"Language skills: {baseline*100:.0f}% → {current*100:.0f}% ({direction}{improvement:.0f}pp)"
        )
    
    improvement_summary = ". ".join(summary_parts) + "."
    
    # Create reassessment record
    reassessment = ReassessmentResponse(
        id=str(uuid.uuid4()),
        case_id=reassessment_data.case_id,
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
