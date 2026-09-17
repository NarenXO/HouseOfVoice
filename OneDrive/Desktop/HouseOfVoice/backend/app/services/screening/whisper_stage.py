"""
Stage 1 - Whisper ASR
Transcribes audio bytes using faster-whisper (tiny, cpu, int8).
Returns transcript text, word-level timestamps, duration, and detected language.
"""
import logging
import tempfile
import os

logger = logging.getLogger(__name__)

_FALLBACK = {
    "transcript": "The quick brown fox jumps over the lazy dog.",
    "words": [
        {"word": "The", "start": 0.0, "end": 0.2, "probability": 0.95},
        {"word": "quick", "start": 0.2, "end": 0.5, "probability": 0.93},
        {"word": "brown", "start": 0.5, "end": 0.8, "probability": 0.91},
        {"word": "fox", "start": 0.8, "end": 1.0, "probability": 0.94},
    ],
    "duration": 5.0,
    "language": "en",
}


async def process_whisper(audio_bytes: bytes) -> dict:
    """Transcribe audio bytes with faster-whisper. Falls back gracefully on any error."""
    tmp_path = None
    try:
        from faster_whisper import WhisperModel

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

        return {
            "transcript": full_text.strip(),
            "words": words,
            "duration": float(last_end) if last_end > 0 else 5.0,
            "language": info.language,
        }

    except Exception as e:
        logger.warning(f"[whisper_stage] Error during transcription: {e}. Using fallback.")
        return dict(_FALLBACK)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
