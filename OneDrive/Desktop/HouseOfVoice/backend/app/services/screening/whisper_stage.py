"""
Stage 1 - Whisper ASR
Transcribes audio bytes using faster-whisper (tiny, cpu, int8).
Returns transcript text, word-level timestamps, duration, and detected language.
"""
import logging
import tempfile
import os

logger = logging.getLogger(__name__)

async def process_whisper(audio_bytes: bytes) -> dict:
    """Transcribe audio bytes with faster-whisper. Raises ValueError on silence."""
    import io
    import numpy as np
    import soundfile as sf
    from faster_whisper import WhisperModel

    audio_data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    duration = len(audio_data) / sr
    mean_rms = float(np.sqrt(np.mean(audio_data ** 2)))

    if mean_rms < 0.005 or duration < 0.8:
        raise ValueError("Audio is silent or too short.")

    tmp_path = None
    try:
        # Write bytes to a temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, info = model.transcribe(tmp_path, beam_size=5, word_timestamps=True)

        words = []
        full_text = ""
        last_end = 0.0

        for seg in segments:
            full_text += seg.text
            last_end = seg.end
            if seg.words:
                for w in seg.words:
                    words.append({
                        "word": w.word.strip(),
                        "start": float(w.start),
                        "end": float(w.end),
                        "probability": float(w.probability),
                    })

        transcript_text = full_text.strip()
        if not transcript_text or not words:
            raise ValueError("No speech detected in audio clip.")

        return {
            "transcript": transcript_text,
            "words": words,
            "duration": float(last_end) if last_end > 0 else duration,
            "language": info.language,
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
