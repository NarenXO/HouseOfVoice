"""
Stage 7 - Clinical Explanation Generator
Produces therapist-facing recommendations via Gemini API or rule-based fallback.
"""
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

_PHONEME_RULES = {
    "th": (0.50, "Focus on /th/ sound in initial word positions using tongue-tip placement exercises"),
    "s": (0.60, "Target /s/ blends through interactive pacing drills and minimal pair contrasts"),
    "r": (0.60, "Incorporate minimal pair contrast exercises for /r/ vs /w/ in medial positions"),
    "l": (0.65, "Practise /l/ in final position using word-final elicitation tasks"),
    "sh": (0.60, "Work on /sh/ using prolonged fricative shaping and auditory bombardment"),
}

_SEVERITY_RECS = {
    "mild": "Consider maintenance therapy with monthly monitoring sessions.",
    "moderate": "Schedule bi-weekly therapy sessions focusing on articulatory precision.",
    "severe": "Initiate intensive daily therapy program with caregiver training and home practice support.",
}


def _rule_based_recommendations(metrics: dict) -> List[str]:
    """Generate clinical recommendations based on threshold rules."""
    phoneme_scores: dict = metrics.get("phoneme_scores", {})
    severity: str = metrics.get("overall_severity", "mild")
    recs = []

    for phoneme, (threshold, message) in _PHONEME_RULES.items():
        score = phoneme_scores.get(phoneme, 1.0)
        if score < threshold:
            recs.append(message)

    if severity in _SEVERITY_RECS:
        recs.append(_SEVERITY_RECS[severity])

    if not recs:
        recs.append("Continue current therapy plan with regular phoneme practice.")

    return recs[:3]


async def process_explanation(metrics: dict) -> List[str]:
    """Generate clinical recommendations. Falls back to rule-based on any error."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            phoneme_scores = metrics.get("phoneme_scores", {})
            severity = metrics.get("overall_severity", "mild")
            fluency = metrics.get("fluency_score", 0.72)
            language = metrics.get("language_score", 0.65)

            prompt = (
                f"You are a licensed speech-language pathologist.\n"
                f"A child patient has been assessed with the following metrics:\n"
                f"- Overall severity: {severity}\n"
                f"- Fluency score: {fluency:.2f} (0=poor, 1=excellent)\n"
                f"- Language score: {language:.2f} (0=poor, 1=excellent)\n"
                f"- Phoneme accuracy scores: {phoneme_scores}\n\n"
                f"Provide exactly 2 to 3 specific, evidence-based therapy recommendations "
                f"for the therapist. Output only the recommendations as a numbered list "
                f"with no additional commentary. Each item on its own line, starting with '1.', '2.', '3.'."
            )

            response = model.generate_content(prompt)
            lines = [
                line.strip().lstrip("123456789. )")
                for line in response.text.strip().splitlines()
                if line.strip() and line.strip()[0].isdigit()
            ]
            if lines:
                return lines[:3]
        except Exception as e:
            logger.warning(f"[explain_stage] Gemini call failed: {e}. Using rule-based fallback.")

    return _rule_based_recommendations(metrics)
