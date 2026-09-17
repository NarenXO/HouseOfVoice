"""
Stage 6 - Classification
Derives fluency_score, language_score, and overall_severity
from all upstream stage results.
"""
import logging

logger = logging.getLogger(__name__)


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


async def process_classification(
    features: dict, vad: dict, phonemes: dict, voice: dict
) -> dict:
    """Combine stage outputs into final classification scores."""
    speech_rate = float(features.get("speech_rate_wpm", 0.0))

    # confidence_ratio = mean of word-level probabilities (from feature_stage)
    mean_confidence = float(features.get("mean_confidence", 0.8))

    # pacing_ratio: normalised to 130 WPM (typical comfortable speaking rate)
    pacing_ratio = _clamp(speech_rate / 130.0)

    # --- Fluency Score ---
    # 40% pacing, 60% raw word confidence
    fluency_score = _clamp(pacing_ratio * 0.4 + mean_confidence * 0.6)
    fluency_score = round(fluency_score, 3)

    # --- Language Score ---
    # 80% confidence, 20% pacing sanity check
    language_score = _clamp(0.80 * mean_confidence + 0.20 * pacing_ratio)
    language_score = round(language_score, 3)

    # --- Severity ---
    if language_score > 0.80:
        severity = "mild"
    elif language_score > 0.60:
        severity = "moderate"
    else:
        severity = "severe"

    return {
        "fluency_score": fluency_score,
        "language_score": language_score,
        "overall_severity": severity,
    }
