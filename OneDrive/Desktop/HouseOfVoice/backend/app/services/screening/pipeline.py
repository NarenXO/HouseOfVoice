"""
Screening Pipeline Orchestrator
Chains all 7 stages: whisper → vad → features → phonemes → voice → classify → explain
USE_MOCKS env var controls mock vs live execution.
"""
import os
import json
import logging
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

USE_MOCKS = os.getenv("USE_MOCKS", "True").lower() == "true"

MOCK_FILE_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent.parent / "shared" / "mocks" / "screening_result.mock.json"
)


def _load_mock(case_id: str) -> dict:
    with open(MOCK_FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["case_id"] = case_id
    data["created_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return data


def _fetch_audio_bytes(clip_urls: dict) -> bytes:
    """
    Try to fetch audio bytes from the best available clip URL.
    Priority: spontaneous > sentence > picture > first available.
    If all fail (e.g. mock URLs), return minimal silent WAV bytes.
    """
    priority = ["spontaneous", "sentence", "picture"]
    ordered_urls = []
    for key in priority:
        if key in clip_urls:
            ordered_urls.append(clip_urls[key])
    # Also add any remaining URLs not in priority list
    for key, url in clip_urls.items():
        if key not in priority:
            ordered_urls.append(url)

    for url in ordered_urls:
        if url and not url.startswith("https://mock-storage"):
            try:
                with urllib.request.urlopen(url, timeout=5) as resp:
                    return resp.read()
            except Exception as e:
                logger.debug(f"[pipeline] Could not fetch {url}: {e}")

    # Return minimal valid WAV (44-byte header, 1 second silence at 16kHz)
    logger.warning("[pipeline] No real audio available; using silent WAV stub.")
    return _make_silent_wav()


def _make_silent_wav(sample_rate: int = 16000, duration_s: int = 1) -> bytes:
    """Generate a minimal silent WAV file in memory."""
    import struct

    num_samples = sample_rate * duration_s
    data_size = num_samples * 2  # 16-bit PCM
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,        # chunk size
        1,         # PCM
        1,         # mono
        sample_rate,
        sample_rate * 2,
        2,         # block align
        16,        # bits per sample
        b"data",
        data_size,
    )
    return header + b"\x00" * data_size


async def run_full_pipeline(case_id: str, clip_urls: dict) -> dict:
    """
    Orchestrate the 7-stage screening pipeline.
    Returns a dict matching the frozen ScreeningResult contract.
    """
    if USE_MOCKS:
        logger.info(f"[pipeline] USE_MOCKS=True → returning mock fixture for case_id={case_id}")
        return _load_mock(case_id)

    logger.info(f"[pipeline] Running live pipeline for case_id={case_id}")

    try:
        from app.services.screening import (
            whisper_stage,
            vad_stage,
            feature_stage,
            phoneme_stage,
            voice_stage,
            classify_stage,
            explain_stage,
        )
    except ImportError as e:
        logger.error(f"[pipeline] Stage import failed: {e}. Returning mock.")
        return _load_mock(case_id)

    audio_bytes = _fetch_audio_bytes(clip_urls)

    # Stage 1 – Whisper
    whisper_res = await whisper_stage.process_whisper(audio_bytes)
    logger.info(f"[pipeline] Whisper done: lang={whisper_res.get('language')}, "
                f"words={len(whisper_res.get('words', []))}")

    # Stage 2 – VAD
    vad_res = await vad_stage.process_vad(audio_bytes)
    logger.info(f"[pipeline] VAD done: speech_ratio={vad_res.get('speech_ratio')}")

    # Stage 3 – Features
    feat_res = await feature_stage.process_features(audio_bytes, whisper_res)
    logger.info(f"[pipeline] Features done: wpm={feat_res.get('speech_rate_wpm')}")

    # Stage 4 – Phonemes
    phoneme_res = await phoneme_stage.process_phonemes(audio_bytes, whisper_res)
    logger.info(f"[pipeline] Phonemes done: {phoneme_res.get('phoneme_scores')}")

    # Stage 5 – Voice
    voice_res = await voice_stage.process_voice(audio_bytes)
    logger.info(f"[pipeline] Voice done: stability={voice_res.get('voice_stability')}")

    # Stage 6 – Classify
    class_res = await classify_stage.process_classification(feat_res, vad_res, phoneme_res, voice_res)
    logger.info(f"[pipeline] Classify done: severity={class_res.get('overall_severity')}")

    # Stage 7 – Explain
    recs = await explain_stage.process_explanation({**phoneme_res, **class_res})
    logger.info(f"[pipeline] Explain done: {len(recs)} recommendations")

    return {
        "case_id": case_id,
        "overall_severity": class_res["overall_severity"],
        "phoneme_scores": phoneme_res["phoneme_scores"],
        "fluency_score": class_res["fluency_score"],
        "language_score": class_res["language_score"],
        "recommendations": recs,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
