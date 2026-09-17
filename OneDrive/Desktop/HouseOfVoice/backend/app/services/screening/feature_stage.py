"""
Stage 3 - Acoustic Feature Extraction
Computes speech rate, mean pitch, and energy variance from audio bytes + Whisper results.
Uses librosa for acoustic analysis.
"""
import logging

logger = logging.getLogger(__name__)
async def process_features(audio_bytes: bytes, whisper_res: dict) -> dict:
    """Extract acoustic features."""
    import io
    import numpy as np
    import librosa
    import soundfile as sf

    audio_data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    # Speech rate in words per minute
    word_count = len(whisper_res.get("words", []))
    duration_s = whisper_res.get("duration", 5.0)
    duration_min = max(duration_s / 60.0, 1e-6)
    speech_rate_wpm = round(word_count / duration_min, 2)

    # Mean pitch using librosa's pyin
    f0, voiced_flag, _ = librosa.pyin(
        audio_data,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
    )
    voiced_f0 = f0[voiced_flag & ~np.isnan(f0)]
    mean_pitch = float(np.mean(voiced_f0)) if len(voiced_f0) > 0 else 210.0

    # RMS energy variance
    rms = librosa.feature.rms(y=audio_data)[0]
    energy_variance = round(float(np.var(rms)), 6)

    return {
        "speech_rate_wpm": speech_rate_wpm,
        "mean_pitch_hz": round(mean_pitch, 2),
        "energy_variance": energy_variance,
    }
