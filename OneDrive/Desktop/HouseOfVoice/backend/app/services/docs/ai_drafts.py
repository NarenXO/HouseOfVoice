"""
AI draft generation service for session documentation.
Uses Gemini Pro to generate SOAP notes, session summaries, and parent-friendly explanations.
"""
from datetime import datetime
from uuid import uuid4
from typing import List, Optional
import json
from pathlib import Path

# DEPENDENCY NOTE: requires google-generativeai — Naren will
# add to requirements.txt at integration. Install locally with:
# pip install google-generativeai
try:
    import google.generativeai as genai
except ImportError:
    genai = None  # will fall back to mock drafts

from app.models.docs import AIDraftResponse
from app.services.docs.session_notes import _notes_store, get_note_by_session


# In-memory store for AI drafts (dict keyed by id)
_ai_drafts_store: dict[str, AIDraftResponse] = {}

USE_MOCKS = True  # Set to False when Gemini API key is available


def _load_mock_context():
    """Load mock context data for AI prompts."""
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    
    with open(base_path / "current_user.mock.json", "r") as f:
        current_user = json.load(f)
    
    with open(base_path / "screening_result.mock.json", "r") as f:
        screening_result = json.load(f)
    
    with open(base_path / "therapy_plan.mock.json", "r") as f:
        therapy_plan = json.load(f)
    
    return {
        "current_user": current_user,
        "screening_result": screening_result,
        "therapy_plan": therapy_plan
    }


def _get_mock_drafts(session_note_id: str) -> AIDraftResponse:
    """Return mock AI drafts when USE_MOCKS is True or Gemini fails."""
    context = _load_mock_context()
    comm_profile = context["current_user"].get("communication_profile", {})
    reading_ability = comm_profile.get("reading_ability", "developing")
    
    # Determine tone level based on reading ability
    if reading_ability == "pre_reader":
        tone_level = "Simple"
    elif reading_ability == "developing":
        tone_level = "Moderate"
    else:
        tone_level = "Advanced"
    
    return AIDraftResponse(
        id=str(uuid4()),
        session_note_id=session_note_id,
        soap_note="""[MOCK DRAFT — replace with live Gemini output]

**Subjective:**
Patient presented for scheduled therapy session. Reported good sleep and diet. Parent expressed concerns about progress with /r/ sound in conversational speech.

**Objective:**
- Target phoneme: /r/ (word-initial position)
- Accuracy: 75% at word level, 60% at phrase level
- Cueing hierarchy: minimal verbal cues, tactile cues when needed
- Activities completed: Minimal pairs drill, narrative retell
- Session duration: 45 minutes

**Assessment:**
Patient demonstrates improved isolation of /r/ sound but struggles with generalization to connected speech. Motivation remains high. Progress is consistent with expected trajectory for current therapy plan.

**Plan:**
- Continue targeting /r/ in word-initial position
- Increase complexity to phrase-level practice
- Assign home practice: 10 minutes daily /r/ word drills
- Schedule next session in 3 days""",
        session_summary="""[MOCK DRAFT — replace with live Gemini output]

Patient completed 45-minute session focusing on /r/ production. Accuracy improved from baseline (65%) to 75% at word level with minimal cues. Patient showed excellent engagement during minimal pairs activity. Parent homework reinforcement appears consistent. Recommended continuing current treatment plan with increased phrase-level practice.""",
        parent_summary=f"""[MOCK DRAFT — replace with live Gemini output]

Today we worked on saying the "r" sound at the beginning of words! Your child did great - they got it right about 75% of the time when we practiced words. We played some fun games with minimal pairs and they really enjoyed it.

For homework this week, please practice /r/ words for 10 minutes each day. Try to make it fun - you can use flashcards or play "I spy" with /r/ words.

Their progress is right on track! We'll see them again in 3 days to keep building on this success.

Tone level: {tone_level}""",
        approved=False,
        created_at=datetime.utcnow()
    )


def generate_draft(session_note_id: str) -> AIDraftResponse:
    """Generate AI drafts for a session note using Gemini Pro."""
    # Load the session note
    session_note = None
    for note in _notes_store.values():
        if note.id == session_note_id:
            session_note = note
            break
    
    if not session_note:
        raise ValueError(f"Session note with id {session_note_id} not found")
    
    # Load mock context
    context = _load_mock_context()
    
    # Check if this is the first session for the case
    case_notes = [n for n in _notes_store.values() if n.case_id == session_note.case_id]
    is_first_session = len(case_notes) <= 1
    
    # Extract patient profile data
    comm_profile = context["current_user"].get("communication_profile", {})
    reading_ability = comm_profile.get("reading_ability", "developing")
    
    # If USE_MOCKS is True or Gemini is not available, return mock drafts
    if USE_MOCKS or genai is None:
        return _get_mock_drafts(session_note_id)
    
    try:
        # Configure Gemini (in production, this would use env var)
        # genai.configure(api_key="your-api-key")
        
        # Build session data string
        session_data = f"""
Session ID: {session_note.session_id}
Case ID: {session_note.case_id}
Activities: {', '.join(session_note.activities)}
Patient Response: {session_note.patient_response}
Homework Assigned: {session_note.homework_assigned}
Clinical Observations: {session_note.clinical_observations}
"""
        
        # Build baseline data
        screening = context["screening_result"]
        baseline_data = f"""
Overall Severity: {screening.get('overall_severity', 'unknown')}
Phoneme Scores: {screening.get('phoneme_scores', {})}
Fluency Score: {screening.get('fluency_score', 0)}
Language Score: {screening.get('language_score', 0)}
"""
        
        # Build prior context
        if is_first_session:
            prior_context = "First session — using intake data from therapy plan"
            therapy_plan = context["therapy_plan"]
            prior_context += f"\nGoals: {', '.join(therapy_plan.get('goals', []))}"
        else:
            prior_context = f"Previous notes exist for this case ({len(case_notes)} total sessions)"
        
        # PROMPT 1 — SOAP NOTE
        soap_prompt = f"""You are a licensed speech-language pathologist writing a clinical SOAP note. Use the following session documentation and patient baseline data. Format with clear S/O/A/P headers. Be specific about phonemes targeted, accuracy percentages, and cueing hierarchy used.

Session data: {session_data}
Baseline: {baseline_data}
Prior context: {prior_context}"""
        
        # PROMPT 2 — SESSION SUMMARY
        summary_prompt = f"""Write a concise 4-6 sentence session summary for the therapist's case file. Focus on progress toward goals, notable behaviors, and next-session recommendations.

Session data: {session_data}
Baseline: {baseline_data}
Prior context: {prior_context}"""
        
        # PROMPT 3 — PARENT-FRIENDLY EXPLANATION
        parent_prompt = f"""Write a warm, encouraging explanation of today's therapy session for the patient's parent/guardian.

IMPORTANT tone rules based on patient profile:
- Reading ability: {reading_ability}

If readingAbility is 'pre_reader', use very simple sentences (Flesch-Kincaid grade ≤ 4), short words, and concrete examples. If 'developing', use moderate complexity (grade 6-7). If 'fluent', you may use standard adult language.

Avoid all clinical jargon. Explain what was practiced and how the parent can reinforce it at home.

Session data: {session_data}
Baseline: {baseline_data}
Prior context: {prior_context}"""
        
        # Call Gemini for each prompt (commented out since we're using mocks)
        # model = genai.GenerativeModel('gemini-pro')
        # soap_response = model.generate_content(soap_prompt)
        # summary_response = model.generate_content(summary_prompt)
        # parent_response = model.generate_content(parent_prompt)
        
        # For now, use mock responses
        soap_text = "[LIVE GEMINI OUTPUT WOULD GO HERE - currently using mock]"
        summary_text = "[LIVE GEMINI OUTPUT WOULD GO HERE - currently using mock]"
        parent_text = "[LIVE GEMINI OUTPUT WOULD GO HERE - currently using mock]"
        
        draft = AIDraftResponse(
            id=str(uuid4()),
            session_note_id=session_note_id,
            soap_note=soap_text,
            session_summary=summary_text,
            parent_summary=parent_text,
            approved=False,
            created_at=datetime.utcnow()
        )
        
        _ai_drafts_store[draft.id] = draft
        return draft
        
    except Exception as e:
        print(f"Error generating AI draft: {e}")
        # Fall back to mock drafts on error
        return _get_mock_drafts(session_note_id)


def approve_draft(draft_id: str) -> Optional[AIDraftResponse]:
    """Approve an AI draft by setting approved = True."""
    if draft_id in _ai_drafts_store:
        draft = _ai_drafts_store[draft_id]
        draft.approved = True
        return draft
    return None


def get_drafts_by_case(case_id: str) -> List[AIDraftResponse]:
    """Get all AI drafts for a given case_id (joins through session notes)."""
    matching_drafts = []
    
    for draft in _ai_drafts_store.values():
        # Find the session note this draft references
        session_note = None
        for note in _notes_store.values():
            if note.id == draft.session_note_id:
                session_note = note
                break
        
        # Check if the session note belongs to the case
        if session_note and session_note.case_id == case_id:
            matching_drafts.append(draft)
    
    return matching_drafts
