"""
Stage 4 - Phoneme Scoring
Estimates per-phoneme accuracy for common therapy targets using Whisper word probabilities.
Optionally refines via Wav2Vec2 CTC if transformers is available.
"""
import logging

logger = logging.getLogger(__name__)

# Target phonemes and phonetically related word substrings to match
_PHONEME_PATTERNS = {
    "s": ["s", "c"],
    "th": ["th"],
    "r": ["r"],
    "l": ["l"],
    "sh": ["sh"],
}

def _score_from_whisper(words: list) -> dict:
    """Aggregate Whisper word-level probabilities into per-phoneme confidence scores."""
    totals = {p: [] for p in _PHONEME_PATTERNS}
    for w in words:
        token = w.get("word", "").lower().strip(".,!?")
        prob = float(w.get("probability", 0.5))
        for phoneme, patterns in _PHONEME_PATTERNS.items():
            if any(pat in token for pat in patterns):
                totals[phoneme].append(prob)

    scores = {}
    for phoneme, probs in totals.items():
        if probs:
            scores[phoneme] = round(sum(probs) / len(probs), 4)

    return scores


async def process_phonemes(audio_bytes: bytes, whisper_res: dict) -> dict:
    """Compute phoneme accuracy scores."""
    words = whisper_res.get("words", [])
    scores = _score_from_whisper(words)

    # Attempt Wav2Vec2 refinement (optional, soft fail)
    try:
        import io
        import numpy as np
        import soundfile as sf
        from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
        import torch

        audio_data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
        if audio_data.ndim > 1:
            audio_data = audio_data.mean(axis=1)

        processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")

        inputs = processor(audio_data, sampling_rate=sr, return_tensors="pt", padding=True)
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze(0)

        # Use frame-level confidence as a weight multiplier on whisper scores
        mean_conf = float(probs.max(dim=-1).values.mean())
        for p in scores:
            scores[p] = round(min(scores[p] * (0.5 + 0.5 * mean_conf), 1.0), 4)

    except Exception as refine_err:
        logger.debug(f"[phoneme_stage] Wav2Vec2 refinement skipped: {refine_err}")

    return {"phoneme_scores": scores}
