"""
Stage 1 - Whisper ASR
Transcribes audio bytes using faster-whisper (tiny, cpu, int8).
Returns transcript text, word-level timestamps, duration, and detected language.
Supports WebM (MediaRecorder output) and WAV formats by writing to temp file first.
"""
import logging
import tempfile
import os

logger = logging.getLogger(__name__)


async def process_whisper(audio_bytes: bytes) -> dict:
    """Transcribe audio bytes with faster-whisper. Does not aggressively reject silence."""
    from faster_whisper import WhisperModel

    # Determine file suffix from magic bytes
    if len(audio_bytes) >= 4 and audio_bytes[:4] == b'\x1a\x45\xdf\xa3':
        suffix = ".webm"
    elif len(audio_bytes) >= 4 and audio_bytes[:4] == b'OggS':
        suffix = ".ogg"
    elif len(audio_bytes) >= 12 and audio_bytes[8:12] == b'WAVE':
        suffix = ".wav"
    else:
        # Default: MediaRecorder in Chrome/Firefox sends webm
        suffix = ".webm"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Transcribe with Whisper directly using the temp file
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
        print(f"[DEBUG TRANSCRIPT] Transcribed Text: '{transcript_text}' | Words: {len(words)}")
        logger.info(f"[whisper_stage] Transcript='{transcript_text}', words={len(words)}")

        return {
            "transcript": transcript_text,
            "words": words,
            "duration": float(info.duration) if hasattr(info, 'duration') and info.duration > 0 else (float(last_end) if last_end > 0 else 0.0),
            "language": info.language,
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
