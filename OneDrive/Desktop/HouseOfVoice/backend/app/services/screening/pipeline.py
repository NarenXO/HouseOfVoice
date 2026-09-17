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

def _fetch_all_audio_bytes(clip_data: dict) -> list[bytes]:
    """Fetch audio bytes for all available clips. Returns list of bytes."""
    audio_clips = []
    priority = ["sentence", "picture", "spontaneous"]
    
    for key in priority:
        if key in clip_data:
            data = clip_data[key]
            if data.get("bytes"):
                audio_clips.append(data["bytes"])
            elif data.get("local_file_path"):
                with open(data["local_file_path"], "rb") as f:
                    audio_clips.append(f.read())
                    
    for key, data in clip_data.items():
        if key not in priority:
            if data.get("bytes") and data["bytes"] not in audio_clips:
                audio_clips.append(data["bytes"])
            elif data.get("local_file_path"):
                try:
                    with open(data["local_file_path"], "rb") as f:
                        content = f.read()
                        if content not in audio_clips:
                            audio_clips.append(content)
                except Exception:
                    pass
                    
    if not audio_clips:
        raise ValueError("No audio bytes available. Please re-record your clips.")
        
    return audio_clips


async def run_full_pipeline(case_id: str, clip_data: dict) -> dict:
    """
    Orchestrate the 7-stage screening pipeline.
    Returns a dict matching the frozen ScreeningResult contract.
    """
    print(f"[DEBUG PIPELINE] Running live pipeline for case: {case_id}")
    logger.info(f"[screening] LIVE mode active. Running live pipeline for case_id={case_id}")

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
        logger.error(f"[pipeline] Stage import failed: {e}")
        raise

    audio_clips_bytes = _fetch_all_audio_bytes(clip_data)

    try:
        # Stage 1 – Whisper
        full_transcript = ""
        combined_words = []
        total_duration = 0.0
        detected_lang = "en"
        
        for clip_bytes in audio_clips_bytes:
            whisper_res = await whisper_stage.process_whisper(clip_bytes)
            if whisper_res["transcript"]:
                full_transcript += (" " + whisper_res["transcript"]) if full_transcript else whisper_res["transcript"]
            if whisper_res["words"]:
                combined_words.extend(whisper_res["words"])
            total_duration += whisper_res["duration"]
            if whisper_res["language"]:
                detected_lang = whisper_res["language"]

        if not combined_words:
            raise ValueError("⚠️ Analysis Failed: No speech detected in your audio. Please re-record your clips and speak clearly into the microphone.")

        aggregated_whisper_res = {
            "transcript": full_transcript.strip(),
            "words": combined_words,
            "duration": total_duration,
            "language": detected_lang
        }
        
        total_words = len(combined_words)
        speech_rate_wpm = (total_words / total_duration) * 60.0 if total_duration > 0 else 0.0

        print(f"[LIVE PIPELINE] Full Transcript: '{full_transcript}'")
        print(f"[LIVE PIPELINE] Total Words: {total_words}, Duration: {total_duration:.1f}s, WPM: {speech_rate_wpm:.1f}")

        # Use first clip for acoustic-only analysis where concatenation isn't trivial
        primary_audio_bytes = audio_clips_bytes[0]

        # Stage 2 – VAD
        vad_res = await vad_stage.process_vad(primary_audio_bytes)
        logger.info(f"[pipeline] VAD done: speech_ratio={vad_res.get('speech_ratio')}")
    except ValueError as e:
        import fastapi
        print(f"[DEBUG PIPELINE] ValueError caught: {e}")
        logger.warning(f"[pipeline] Silence detected: {e}")
        raise fastapi.HTTPException(
            status_code=400,
            detail=str(e)
        )

    # Stage 3 – Features
    feat_res = await feature_stage.process_features(primary_audio_bytes, aggregated_whisper_res)
    logger.info(f"[pipeline] Features done: wpm={feat_res.get('speech_rate_wpm')}")

    # Stage 4 – Phonemes
    phoneme_res = await phoneme_stage.process_phonemes(primary_audio_bytes, aggregated_whisper_res)
    logger.info(f"[pipeline] Phonemes done: {phoneme_res.get('phoneme_scores')}")

    # Stage 5 – Voice
    voice_res = await voice_stage.process_voice(primary_audio_bytes)
    logger.info(f"[pipeline] Voice done: stability={voice_res.get('voice_stability')}")

    # Stage 6 – Classify
    class_res = await classify_stage.process_classification(feat_res, vad_res, phoneme_res, voice_res)
    logger.info(f"[pipeline] Classify done: severity={class_res.get('overall_severity')}")

    # Print final verification logs
    print(f"[LIVE PIPELINE] Fluency: {class_res['fluency_score'] * 100:.1f}%, Language: {class_res['language_score'] * 100:.1f}%")

    # Stage 7 – Explain
    recs = await explain_stage.process_explanation({**phoneme_res, **class_res, "full_transcript": full_transcript.strip()})
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
