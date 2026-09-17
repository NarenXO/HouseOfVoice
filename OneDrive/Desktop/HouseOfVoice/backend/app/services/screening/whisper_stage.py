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
    """Transcribe audio bytes with faster-whisper. Raises ValueError on silence."""
    import numpy as np
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

        # Use librosa to decode audio (handles WebM via soundfile/audioread/ffmpeg)
        import librosa
        try:
            audio_data, sr = librosa.load(tmp_path, sr=None, mono=True)
        except Exception as load_err:
            print(f"[DEBUG AUDIO] librosa.load failed: {load_err}")
            raise ValueError(
                f"Could not decode audio. Ensure microphone audio is captured correctly. ({load_err})"
            )

        duration = len(audio_data) / sr
        mean_rms = float(np.sqrt(np.mean(audio_data ** 2)))

        print(f"[DEBUG AUDIO] RMS Energy: {mean_rms:.6f}, Audio Duration: {duration:.2f}s")
        logger.info(f"[whisper_stage] RMS={mean_rms:.6f}, duration={duration:.2f}s")

        if mean_rms < 0.005:
            print(f"[DEBUG REJECTED] RMS {mean_rms:.6f} below threshold 0.005 — treating as silence.")
            raise ValueError("Audio is silent or too short.")
        if duration < 0.8:
            print(f"[DEBUG REJECTED] Duration {duration:.2f}s below minimum 0.8s.")
            raise ValueError("Audio is silent or too short.")

        # Transcribe with Whisper using the same temp file
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

        if not transcript_text or not words or len(transcript_text) < 3:
            print("[DEBUG REJECTED] No actual speech words recognized.")
            raise ValueError(
                "No speech recognized in recording. Please speak clearly into your microphone."
            )

        return {
            "transcript": transcript_text,
            "words": words,
            "duration": float(last_end) if last_end > 0 else duration,
            "language": info.language,
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

