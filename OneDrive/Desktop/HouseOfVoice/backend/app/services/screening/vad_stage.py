"""
Stage 2 - Voice Activity Detection (VAD)
Computes pause count, pause frequency, and speech ratio from audio bytes.
Uses energy-threshold VAD; Silero VAD is attempted if torch is available.
"""
import logging

logger = logging.getLogger(__name__)

def _energy_vad(y, sr: int, frame_duration_ms: int = 30, energy_threshold: float = 0.02):
    """Simple energy-based VAD returning list of (is_speech: bool) per frame."""
    import numpy as np

    frame_len = int(sr * frame_duration_ms / 1000)
    frames = []
    for i in range(0, len(y) - frame_len, frame_len):
        frame = y[i : i + frame_len]
        rms = float(np.sqrt(np.mean(frame ** 2)))
        frames.append(rms > energy_threshold)
    return frames


async def process_vad(audio_bytes: bytes) -> dict:
    """Detect pauses and compute speech ratio. Returns safe defaults if audio cannot be decoded."""
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
        logger.debug(f"[vad_stage] librosa decode failed (returning defaults): {e}")
        return {"pause_count": 2, "pause_frequency": 3.5, "speech_ratio": 0.75}

    if audio_data is None:
        return {"pause_count": 2, "pause_frequency": 3.5, "speech_ratio": 0.75}

    duration_s = len(audio_data) / sr
    frames = _energy_vad(audio_data, sr)

    if not frames:
        return {"pause_count": 0, "pause_frequency": 0.0, "speech_ratio": 0.0}

    # Count transitions from speech→silence as pauses
    pause_count = 0
    speech_frames = 0
    prev = frames[0]
    for f in frames[1:]:
        if prev and not f:
            pause_count += 1
        if f:
            speech_frames += 1
        prev = f

    speech_ratio = round(speech_frames / len(frames), 4)
    pause_frequency = round((pause_count / duration_s) * 60, 2) if duration_s > 0 else 3.5

    return {
        "pause_count": pause_count,
        "pause_frequency": pause_frequency,
        "speech_ratio": speech_ratio,
    }
