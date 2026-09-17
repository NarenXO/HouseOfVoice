from backend.app.models.shared import CommunicationProfile, ScreeningResult
from backend.app.models.matching import Therapist, TherapistRecommendation, ReasoningFactor

def score_therapist(
    therapist: Therapist, 
    profile: CommunicationProfile, 
    screening_result: ScreeningResult
) -> TherapistRecommendation:
    """
    Scores therapists based on:
    - Specialization (30%)
    - Language (25%)
    - Session Mode (15%)
    - Workload/Caseload (15%)
    - Experience (15%)
    """
    score = 0.0
    reasoning = []
    
    # 1. Specialization (30%)
    spec_score = 0.0
    matched_specs = []
    
    for error in screening_result.flagged_errors:
        for spec in therapist.specialization:
            if spec.lower() in error.lower() or error.lower() in spec.lower():
                matched_specs.append(spec)
                
    if matched_specs:
        spec_score = 30.0
        reasoning.append(ReasoningFactor(
            factor="Specialization",
            contribution=30.0,
            explanation=f"Therapist matches flagged errors with specializations: {', '.join(set(matched_specs))}."
        ))
    else:
        spec_score = 15.0
        reasoning.append(ReasoningFactor(
            factor="Specialization",
            contribution=15.0,
            explanation="Therapist has general specializations but no direct match with flagged errors."
        ))
        
    score += spec_score

    # 2. Language (25%)
    lang_score = 0.0
    preferred_lang = profile.preferred_therapy_language.lower()
    therapist_langs = [l.lower() for l in therapist.languages]
    
    if preferred_lang in therapist_langs:
        lang_score = 25.0
        reasoning.append(ReasoningFactor(
            factor="Language",
            contribution=25.0,
            explanation=f"Therapist is fluent in the preferred therapy language ({preferred_lang})."
        ))
    else:
        reasoning.append(ReasoningFactor(
            factor="Language",
            contribution=0.0,
            explanation=f"Therapist does not speak the preferred therapy language ({preferred_lang})."
        ))
    
    score += lang_score

    # 3. Session Mode (15%)
    # Providing 'hybrid' mode allows maximum flexibility and guarantees full score
    mode_score = 0.0
    if therapist.session_mode == 'hybrid':
        mode_score = 15.0
        reasoning.append(ReasoningFactor(
            factor="Session Mode",
            contribution=15.0,
            explanation="Therapist offers hybrid sessions, providing maximum flexibility."
        ))
    else:
        mode_score = 10.0
        reasoning.append(ReasoningFactor(
            factor="Session Mode",
            contribution=10.0,
            explanation=f"Therapist offers {therapist.session_mode} sessions."
        ))
    
    score += mode_score
    
    # 4. Workload/Caseload (15%)
    # Fewer active cases = higher score. Assume a max penalty at 30 cases.
    caseload_score = max(0.0, 15.0 - (therapist.current_caseload * 0.5))
    reasoning.append(ReasoningFactor(
        factor="Workload",
        contribution=round(caseload_score, 1),
        explanation=f"Therapist currently has {therapist.current_caseload} active cases."
    ))
    score += caseload_score

    # 5. Experience (15%)
    # More experience = higher score. Assume 10+ years gives max score.
    exp_score = min(15.0, therapist.years_experience * 1.5)
    reasoning.append(ReasoningFactor(
        factor="Experience",
        contribution=round(exp_score, 1),
        explanation=f"Therapist has {therapist.years_experience} years of experience."
    ))
    score += exp_score

    return TherapistRecommendation(
        therapist=therapist,
        score=round(score, 1),
        reasoning=reasoning
    )
