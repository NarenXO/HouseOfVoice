"""
Stage 5 - Voice Stability Analysis
Evaluates speaker voice stability via pitch/energy standard deviation.
Resemblyzer embedding stability is used if available.
"""
import logging

logger = logging.getLogger(__name__)

async def process_voice(audio_bytes: bytes) -> dict:
    """Compute voice stability score (0.0–1.0). Returns safe defaults if audio cannot be decoded."""
    import tempfile
    import os
    import numpy as np

    # Write to temp file to support WebM from MediaRecorder
    suffix = ".webm" if (len(audio_bytes) >= 4 and audio_bytes[:4] == b'\x1a\x45\xdf\xa3') else ".wav"
    tmp_path = None
    audio_data = None
    sr = 16000

    try:
        import librosa
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            audio_data, sr = librosa.load(tmp_path, sr=None, mono=True)
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        logger.debug(f"[voice_stage] librosa decode failed (returning defaults): {e}")
        return {"voice_stability": 0.80}

    if audio_data is None:
        return {"voice_stability": 0.80}

    # Pitch stability: lower std dev → higher stability
    try:
        f0, voiced_flag, _ = librosa.pyin(
            audio_data,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
        )
        voiced_f0 = f0[voiced_flag & ~np.isnan(f0)]
        if len(voiced_f0) > 1:
            pitch_std = float(np.std(voiced_f0))
            pitch_stability = 1.0 - min(pitch_std / 200.0, 1.0)
        else:
            pitch_stability = 0.80
    except Exception:
        pitch_stability = 0.80

    # Energy stability: lower var → higher stability
    rms = librosa.feature.rms(y=audio_data)[0]
    energy_std = float(np.std(rms))
    energy_stability = 1.0 - min(energy_std / 0.1, 1.0)

    # Combined stability score
    voice_stability = round((0.6 * pitch_stability + 0.4 * energy_stability), 4)
    voice_stability = max(0.0, min(1.0, voice_stability))

    # Attempt Resemblyzer (optional, soft fail)
    try:
        from resemblyzer import VoiceEncoder, preprocess_wav
        encoder = VoiceEncoder()
        wav = preprocess_wav(audio_data, source_sr=sr)
        # chunk and compute embedding variance as stability measure
        chunk = min(len(wav), sr * 3)
        embed1 = encoder.embed_utterance(wav[:chunk])
        embed2 = encoder.embed_utterance(wav[-chunk:]) if len(wav) > chunk else embed1
        cosine_sim = float(np.dot(embed1, embed2) / (np.linalg.norm(embed1) * np.linalg.norm(embed2)))
        voice_stability = round((voice_stability + cosine_sim) / 2.0, 4)
    except Exception as resemble_err:
        logger.debug(f"[voice_stage] Resemblyzer skipped: {resemble_err}")

    return {"voice_stability": voice_stability}
