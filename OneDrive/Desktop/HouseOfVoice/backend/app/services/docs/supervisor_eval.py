"""
Supervisor evaluation service for clinical competency assessment.
"""
from datetime import datetime
from typing import List
from app.models.docs import SupervisorEvalCreate, SupervisorEvalResponse
import uuid


# In-memory store for supervisor evaluations
_eval_store: List[SupervisorEvalResponse] = []


def submit_evaluation(data: SupervisorEvalCreate) -> SupervisorEvalResponse:
    """
    Submit a supervisor evaluation for a therapist.
    Calculates average score across the 5 dimensions.
    """
    # Calculate average score
    dimensions = [
        data.documentation_quality,
        data.therapy_planning,
        data.session_quality,
        data.clinical_reasoning,
        data.professional_communication
    ]
    average_score = sum(dimensions) / 5.0
    
    evaluation = SupervisorEvalResponse(
        id=str(uuid.uuid4()),
        case_id=data.case_id,
        therapist_id=data.therapist_id,
        documentation_quality=data.documentation_quality,
        therapy_planning=data.therapy_planning,
        session_quality=data.session_quality,
        clinical_reasoning=data.clinical_reasoning,
        professional_communication=data.professional_communication,
        feedback_notes=data.feedback_notes,
        average_score=average_score,
        evaluated_at=datetime.now()
    )
    
    _eval_store.append(evaluation)
    return evaluation


def get_evaluations_by_case(case_id: str) -> List[SupervisorEvalResponse]:
    """
    Get all supervisor evaluations for a specific case.
    """
    return [eval for eval in _eval_store if eval.case_id == case_id]
