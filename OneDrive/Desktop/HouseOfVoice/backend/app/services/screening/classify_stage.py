"""
Stage 6 - Classification
Derives fluency_score, language_score, and overall_severity
from all upstream stage results.
"""
import logging

logger = logging.getLogger(__name__)

# Typical speech rate range (WPM) for normalization
_NORMAL_WPM_MIN = 80.0
_NORMAL_WPM_MAX = 160.0


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


async def process_classification(
    features: dict, vad: dict, phonemes: dict, voice: dict
) -> dict:
    """Combine stage outputs into final classification scores."""
    speech_ratio = float(vad.get("speech_ratio", 0.0))
    speech_rate = float(features.get("speech_rate_wpm", 0.0))
    phoneme_scores: dict = phonemes.get("phoneme_scores", {})
    voice_stability = float(voice.get("voice_stability", 0.0))

    # --- Fluency Score ---
    # Weighted: 50% speech ratio, 30% speech rate normalised, 20% voice stability
    wpm_normalized = _clamp(
        (speech_rate - _NORMAL_WPM_MIN) / (_NORMAL_WPM_MAX - _NORMAL_WPM_MIN)
    )
    fluency_score = _clamp(
        0.50 * speech_ratio + 0.30 * wpm_normalized + 0.20 * voice_stability
    )
    fluency_score = round(fluency_score, 4)

    # --- Language Score ---
    # Mean of phoneme scores + speech rate sanity bonus
    if phoneme_scores:
        mean_phoneme = sum(phoneme_scores.values()) / len(phoneme_scores)
    else:
        mean_phoneme = _clamp(
            (speech_rate - _NORMAL_WPM_MIN) / (_NORMAL_WPM_MAX - _NORMAL_WPM_MIN)
        )

    rate_sanity = _clamp(wpm_normalized)
    language_score = _clamp(0.80 * mean_phoneme + 0.20 * rate_sanity)
    language_score = round(language_score, 4)

    # --- Severity ---
    if language_score > 0.75:
        severity = "mild"
    elif language_score > 0.50:
        severity = "moderate"
    else:
        severity = "severe"

    return {
        "fluency_score": fluency_score,
        "language_score": language_score,
        "overall_severity": severity,
    }
