"""
AI Live Demo Storyboard Generation Service

OWNERSHIP: Sai Pranav (feature/saipranav-session)
This service generates procedural animation storyboards for speech articulation demos
using Gemini API with asset validation guardrails and fallback mocks.
"""

import os
import json
import uuid
from typing import List, Optional, Dict
from datetime import datetime
from app.models.session import (
    DemoGenerateRequest, 
    DemoGenerateResponse, 
    DemoStep,
    ModuleGenerateRequest,
    ModuleGenerateResponse,
    ModuleScene
)
from app.services.session.asset_registry import (
    validate_storyboard_assets,
    get_phoneme_preset,
    get_supported_phonemes,
    ASSET_CATALOG,
    PHONEME_PRESETS
)
from app.services.session.tts_service import tts_service

# Mock storyboards for fallback when Gemini is unavailable
MOCK_STORYBOARDS: Dict[str, List[Dict]] = {
    "/r/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's learn how to make the /r/ sound. Start with your mouth in a resting position.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_neutral"],
            "narration_text": "Round your lips like you're going to whistle. Keep your tongue flat for now.",
            "articulatory_cue": "Lip rounding"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl"],
            "narration_text": "Now curl the tip of your tongue back toward the roof of your mouth, but don't let it touch anything.",
            "articulatory_cue": "Tongue retroflex curl"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Gently push air through the center while making your voice buzz. Try saying 'rrrr' like a tiger!",
            "articulatory_cue": "Voiced airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Great job! Keep practicing that /r/ sound in words like 'rabbit' and 'rainbow'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/s/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's practice the /s/ sound. Start with your mouth relaxed.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_neutral"],
            "narration_text": "Stretch your lips wide like a smile. Show your teeth slightly.",
            "articulatory_cue": "Lip spreading"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove"],
            "narration_text": "Raise the sides of your tongue near the bumpy ridge behind your top teeth. Make a small groove in the middle.",
            "articulatory_cue": "Tongue alveolar groove"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Push a thin stream of air through the groove. It should make a hissing snake sound like 'ssss'.",
            "articulatory_cue": "Friction airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Excellent! Use this /s/ sound in words like 'sun' and 'snake'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/th/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's learn the /th/ sound. Start with your mouth comfortable and relaxed.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_neutral"],
            "narration_text": "Open your mouth slightly wider than usual.",
            "articulatory_cue": "Jaw opening"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental"],
            "narration_text": "Gently stick the tip of your tongue between your top and bottom teeth. Don't bite it!",
            "articulatory_cue": "Tongue interdental"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Blow soft air over your tongue. It should make a gentle /th/ sound like in 'thumb'.",
            "articulatory_cue": "Soft continuous airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Wonderful! Practice this /th/ sound in words like 'thumb' and 'teeth'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/b/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's practice the /b/ sound. Start with your mouth in a normal position.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral"],
            "narration_text": "Press your lips together firmly. Hold them closed.",
            "articulatory_cue": "Lip closure"
        },
        {
            "step_number": 3,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "vocal_vibration_glow"],
            "narration_text": "Build up air pressure behind your lips while making your voice buzz.",
            "articulatory_cue": "Pressure build-up"
        },
        {
            "step_number": 4,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
            "narration_text": "Release your lips suddenly with a burst of air! It should sound like 'buh!'.",
            "articulatory_cue": "Plosive release"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Great work! Use this /b/ sound in words like 'ball' and 'baby'.",
            "articulatory_cue": "Return to rest"
        }
    ]
}

# Mock module storyboards for 30-second modules (6-10 scenes with transitions)
MOCK_MODULES: Dict[str, List[Dict]] = {
    "/r/": [
        {
            "scene_number": 1,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Welcome to your /r/ sound training module. Let's start by understanding where this sound comes from in your mouth.",
            "articulatory_cue": "Introduction & Anatomy",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 2,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_neutral"],
            "narration_text": "First, round your lips like you're going to whistle. This helps create the right shape for the /r/ sound.",
            "articulatory_cue": "Lip Rounding Setup",
            "transition_type": "slide"
        },
        {
            "scene_number": 3,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl"],
            "narration_text": "Now, curl the tip of your tongue back toward the roof of your mouth. The tip should not touch anything - it floats in the middle.",
            "articulatory_cue": "Tongue Positioning",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 4,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream"],
            "narration_text": "When you push air through, it should flow smoothly down the center. Practice this airflow pattern without using your voice first.",
            "articulatory_cue": "Airflow Practice",
            "transition_type": "zoom"
        },
        {
            "scene_number": 5,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Now add your voice. Make your vocal cords buzz while maintaining the tongue position. It should sound like a gentle 'rrrr'.",
            "articulatory_cue": "Voiced Production",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 6,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Try saying 'rabbit' slowly. Notice how your tongue stays curled while your lips stay rounded throughout the word.",
            "articulatory_cue": "Word Practice: Rabbit",
            "transition_type": "slide"
        },
        {
            "scene_number": 7,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Now try 'rainbow'. The /r/ sound at the beginning requires the same tongue curl and lip rounding.",
            "articulatory_cue": "Word Practice: Rainbow",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 8,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Great progress! Remember the key points: round lips, curl tongue back, keep tongue tip floating, and add voice for the buzzing sound.",
            "articulatory_cue": "Summary & Key Points",
            "transition_type": "crossfade"
        }
    ],
    "/s/": [
        {
            "scene_number": 1,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Welcome to your /s/ sound training module. The /s/ sound is one of the most common sounds in English, so let's master it together.",
            "articulatory_cue": "Introduction",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 2,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_neutral"],
            "narration_text": "Start by stretching your lips wide into a smile. Your teeth should be slightly visible. This is called the 'smile position'.",
            "articulatory_cue": "Lip Spreading",
            "transition_type": "slide"
        },
        {
            "scene_number": 3,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove"],
            "narration_text": "Raise the sides of your tongue up near the bumpy ridge behind your top teeth. This ridge is called the alveolar ridge.",
            "articulatory_cue": "Tongue Sides Elevation",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 4,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove"],
            "narration_text": "While keeping the sides up, create a small groove or channel down the center of your tongue. The air will flow through this groove.",
            "articulatory_cue": "Tongue Groove Formation",
            "transition_type": "zoom"
        },
        {
            "scene_number": 5,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Push a thin, focused stream of air through the groove. It should create a hissing sound, like a snake saying 'ssss'.",
            "articulatory_cue": "Friction Airflow",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 6,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Practice saying 'sun' slowly. Keep your smile and tongue groove throughout the entire word.",
            "articulatory_cue": "Word Practice: Sun",
            "transition_type": "slide"
        },
        {
            "scene_number": 7,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Now try 'snake'. The /s/ sound at the beginning should be crisp and clear, just like the hissing of a real snake.",
            "articulatory_cue": "Word Practice: Snake",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 8,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Excellent work! Remember: smile wide, raise tongue sides, make a center groove, and push air through to create the hissing /s/ sound.",
            "articulatory_cue": "Summary",
            "transition_type": "crossfade"
        }
    ],
    "/th/": [
        {
            "scene_number": 1,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Welcome to your /th/ sound training module. This sound can be tricky, but with practice you'll master it in no time.",
            "articulatory_cue": "Introduction",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 2,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_neutral"],
            "narration_text": "Open your mouth slightly wider than usual. Your jaw should be relaxed and comfortable.",
            "articulatory_cue": "Jaw Positioning",
            "transition_type": "slide"
        },
        {
            "scene_number": 3,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental"],
            "narration_text": "Gently place the tip of your tongue between your upper and lower teeth. It should peek out just a little bit.",
            "articulatory_cue": "Tongue Positioning",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 4,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental"],
            "narration_text": "Don't bite down on your tongue! Keep a small gap so air can flow around it. The tongue should be relaxed, not tense.",
            "articulatory_cue": "Tongue Relaxation",
            "transition_type": "zoom"
        },
        {
            "scene_number": 5,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Blow soft air over and around your tongue. It should create a gentle /th/ sound, like in the word 'thumb'.",
            "articulatory_cue": "Soft Airflow",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 6,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Practice saying 'thumb' slowly. Notice how your tongue stays between your teeth while you blow air.",
            "articulatory_cue": "Word Practice: Thumb",
            "transition_type": "slide"
        },
        {
            "scene_number": 7,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Now try 'teeth'. The /th/ sound should be the same, with your tongue gently between your teeth.",
            "articulatory_cue": "Word Practice: Teeth",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 8,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Wonderful practice! Remember: open mouth comfortably, place tongue tip gently between teeth, keep tongue relaxed, and blow soft air.",
            "articulatory_cue": "Summary",
            "transition_type": "crossfade"
        }
    ],
    "/b/": [
        {
            "scene_number": 1,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Welcome to your /b/ sound training module. The /b/ sound is a 'stop' sound - we build up pressure and then release it.",
            "articulatory_cue": "Introduction",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 2,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral"],
            "narration_text": "Press your lips together firmly. Seal them tight so no air can escape. Hold this position.",
            "articulatory_cue": "Lip Closure",
            "transition_type": "slide"
        },
        {
            "scene_number": 3,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "vocal_vibration_glow"],
            "narration_text": "While keeping your lips closed, start your voice buzzing. Build up air pressure behind your lips.",
            "articulatory_cue": "Voice & Pressure Build-up",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 4,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
            "narration_text": "Release your lips suddenly! The built-up air bursts out, creating the 'buh' sound. This is called a plosive release.",
            "articulatory_cue": "Plosive Release",
            "transition_type": "zoom"
        },
        {
            "scene_number": 5,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "After the release, return your mouth to a resting position. Practice the full sequence: close, build pressure, release, relax.",
            "articulatory_cue": "Return to Rest",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 6,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
            "narration_text": "Practice saying 'ball'. Feel how your lips close, build pressure, and release to make the /b/ sound.",
            "articulatory_cue": "Word Practice: Ball",
            "transition_type": "slide"
        },
        {
            "scene_number": 7,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
            "narration_text": "Now try 'baby'. Notice how you make the /b/ sound twice - at the beginning and in the middle of the word.",
            "articulatory_cue": "Word Practice: Baby",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 8,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Great job! Remember: close lips firmly, build pressure with voice, release suddenly, and relax. The /b/ sound is all about that burst of air!",
            "articulatory_cue": "Summary",
            "transition_type": "crossfade"
        }
    ]
}
    "/r/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's learn how to make the /r/ sound. Start with your mouth in a resting position.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_neutral"],
            "narration_text": "Round your lips like you're going to whistle. Keep your tongue flat for now.",
            "articulatory_cue": "Lip rounding"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl"],
            "narration_text": "Now curl the tip of your tongue back toward the roof of your mouth, but don't let it touch anything.",
            "articulatory_cue": "Tongue retroflex curl"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Gently push air through the center while making your voice buzz. Try saying 'rrrr' like a tiger!",
            "articulatory_cue": "Voiced airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_rounded", "tongue_retroflex_curl", "air_central_stream", "vocal_vibration_glow"],
            "narration_text": "Great job! Keep practicing that /r/ sound in words like 'rabbit' and 'rainbow'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/s/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's practice the /s/ sound. Start with your mouth relaxed.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_neutral"],
            "narration_text": "Stretch your lips wide like a smile. Show your teeth slightly.",
            "articulatory_cue": "Lip spreading"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove"],
            "narration_text": "Raise the sides of your tongue near the bumpy ridge behind your top teeth. Make a small groove in the middle.",
            "articulatory_cue": "Tongue alveolar groove"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Push a thin stream of air through the groove. It should make a hissing snake sound like 'ssss'.",
            "articulatory_cue": "Friction airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_spread", "tongue_alveolar_groove", "air_friction_burst"],
            "narration_text": "Excellent! Use this /s/ sound in words like 'sun' and 'snake'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/th/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's learn the /th/ sound. Start with your mouth comfortable and relaxed.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_neutral"],
            "narration_text": "Open your mouth slightly wider than usual.",
            "articulatory_cue": "Jaw opening"
        },
        {
            "step_number": 3,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental"],
            "narration_text": "Gently stick the tip of your tongue between your top and bottom teeth. Don't bite it!",
            "articulatory_cue": "Tongue interdental"
        },
        {
            "step_number": 4,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Blow soft air over your tongue. It should make a gentle /th/ sound like in 'thumb'.",
            "articulatory_cue": "Soft continuous airflow"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_open_wide", "tongue_interdental", "air_soft_continuous"],
            "narration_text": "Wonderful! Practice this /th/ sound in words like 'thumb' and 'teeth'.",
            "articulatory_cue": "Sustained production"
        }
    ],
    "/b/": [
        {
            "step_number": 1,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Let's practice the /b/ sound. Start with your mouth in a normal position.",
            "articulatory_cue": "Resting position"
        },
        {
            "step_number": 2,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral"],
            "narration_text": "Press your lips together firmly. Hold them closed.",
            "articulatory_cue": "Lip closure"
        },
        {
            "step_number": 3,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "vocal_vibration_glow"],
            "narration_text": "Build up air pressure behind your lips while making your voice buzz.",
            "articulatory_cue": "Pressure build-up"
        },
        {
            "step_number": 4,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_bilabial_closed", "tongue_neutral", "air_plosive_release", "vocal_vibration_glow"],
            "narration_text": "Release your lips suddenly with a burst of air! It should sound like 'buh!'.",
            "articulatory_cue": "Plosive release"
        },
        {
            "step_number": 5,
            "duration_ms": 2000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": "Great work! Use this /b/ sound in words like 'ball' and 'baby'.",
            "articulatory_cue": "Return to rest"
        }
    ]
}

class StoryboardGenerator:
    """Generates procedural animation storyboards for speech articulation demos."""
    
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.use_gemini = bool(self.gemini_api_key and self.gemini_api_key.strip())
    
    def generate_storyboard(self, request: DemoGenerateRequest) -> DemoGenerateResponse:
        """
        Generate a storyboard for the requested phoneme demo.
        
        Args:
            request: Demo generation request with phoneme and context
            
        Returns:
            DemoGenerateResponse with storyboard steps and metadata
        """
        # Validate phoneme is supported
        if request.phoneme not in get_supported_phonemes():
            raise ValueError(f"Unsupported phoneme: {request.phoneme}. Supported: {get_supported_phonemes()}")
        
        # Try Gemini generation if available, otherwise use mock
        if self.use_gemini:
            try:
                return self._generate_with_gemini(request)
            except Exception as e:
                print(f"Gemini generation failed, falling back to mock: {e}")
                return self._generate_mock(request)
        else:
            print("Gemini API key not configured, using mock storyboard")
            return self._generate_mock(request)
    
    def _generate_with_gemini(self, request: DemoGenerateRequest) -> DemoGenerateResponse:
        """
        Generate storyboard using Gemini API with asset validation.
        
        This is a placeholder for actual Gemini integration.
        In production, this would call the Gemini API with appropriate prompts.
        """
        # Placeholder for Gemini API call
        # For now, fall back to mock but mark as if it came from Gemini
        mock_response = self._generate_mock(request)
        
        # In real implementation, you would:
        # 1. Construct prompt with phoneme, word, age band, etc.
        # 2. Call Gemini API
        # 3. Parse response into storyboard steps
        # 4. Validate asset IDs using validate_storyboard_assets()
        # 5. Return validated response
        
        return mock_response
    
    def _generate_mock(self, request: DemoGenerateRequest) -> DemoGenerateResponse:
        """
        Generate storyboard using predefined mock data.
        
        Args:
            request: Demo generation request
            
        Returns:
            DemoGenerateResponse with mock storyboard
        """
        # Get mock storyboard for the phoneme
        mock_steps = MOCK_STORYBOARDS.get(request.phoneme, MOCK_STORYBOARDS["/r/"])
        
        # Validate and filter asset IDs
        validated_steps = []
        full_narration_text = ""
        
        for step_data in mock_steps:
            validated_assets = validate_storyboard_assets(step_data["asset_ids"])
            
            step = DemoStep(
                step_number=step_data["step_number"],
                duration_ms=step_data["duration_ms"],
                asset_ids=validated_assets,
                narration_text=step_data["narration_text"],
                articulatory_cue=step_data["articulatory_cue"]
            )
            validated_steps.append(step)
            full_narration_text += step_data["narration_text"] + " "
        
        # Calculate total duration
        total_duration = sum(step.duration_ms for step in validated_steps)
        
        # Generate TTS audio if available
        narration_audio_url = None
        tts_fallback_info = None
        if tts_service.is_available():
            audio_path = tts_service.generate_narration_audio(
                text=full_narration_text.strip(),
                output_filename=f"demo_{request.phoneme.replace('/', '')}_{uuid.uuid4().hex}.wav"
            )
            if audio_path:
                # For now, return the absolute path. In production, this would be a URL
                narration_audio_url = audio_path
        else:
            # Provide fallback info for browser-based TTS
            tts_fallback_info = tts_service.get_browser_fallback_instructions()
        
        # Create response
        response = DemoGenerateResponse(
            id=str(uuid.uuid4()),
            phoneme=request.phoneme,
            word=request.word,
            total_duration_ms=total_duration,
            steps=validated_steps,
            narration_audio_url=narration_audio_url,
            linked_milestone_id=request.milestone_id,
            created_at=datetime.utcnow().isoformat(),
            tts_fallback_info=tts_fallback_info
        )
        
        return response
    
    def get_supported_phonemes(self) -> List[str]:
        """Return list of phonemes that can be demonstrated."""
        return get_supported_phonemes()
    
    def validate_request(self, request: DemoGenerateRequest) -> bool:
        """
        Validate the demo generation request.
        
        Args:
            request: Demo generation request
            
        Returns:
            True if request is valid, False otherwise
        """
        if not request.phoneme:
            return False
        
        if request.phoneme not in get_supported_phonemes():
            return False
        
        if request.age_band not in ["child-3-5", "child-6-8", "child-9-12", "teen", "adult"]:
            return False
        
        if request.reading_ability not in ["pre-reader", "early-reader", "fluent-reader"]:
            return False
        
        return True
    
    def generate_module(self, request: ModuleGenerateRequest) -> ModuleGenerateResponse:
        """
        Generate a 30-second procedural animation module for speech therapy.
        
        Args:
            request: Module generation request with phoneme and context
            
        Returns:
            ModuleGenerateResponse with module scenes and metadata
        """
        # Validate phoneme is supported
        if request.phoneme not in get_supported_phonemes():
            raise ValueError(f"Unsupported phoneme: {request.phoneme}. Supported: {get_supported_phonemes()}")
        
        # Try Gemini generation if available, otherwise use mock
        if self.use_gemini:
            try:
                return self._generate_module_with_gemini(request)
            except Exception as e:
                print(f"Gemini module generation failed, falling back to mock: {e}")
                return self._generate_module_mock(request)
        else:
            print("Gemini API key not configured, using mock module")
            return self._generate_module_mock(request)
    
    def _generate_module_with_gemini(self, request: ModuleGenerateRequest) -> ModuleGenerateResponse:
        """
        Generate module using Gemini API with asset validation.
        
        This is a placeholder for actual Gemini integration.
        In production, this would call the Gemini API with appropriate prompts.
        """
        # Placeholder for Gemini API call
        # For now, fall back to mock but mark as if it came from Gemini
        mock_response = self._generate_module_mock(request)
        
        # In real implementation, you would:
        # 1. Construct prompt with phoneme, age band, language, module duration (30s)
        # 2. Call Gemini API for 6-10 scenes with transitions
        # 3. Parse response into module scenes
        # 4. Validate asset IDs using validate_storyboard_assets()
        # 5. Return validated response
        
        return mock_response
    
    def _generate_module_mock(self, request: ModuleGenerateRequest) -> ModuleGenerateResponse:
        """
        Generate module using predefined mock data.
        
        Args:
            request: Module generation request
            
        Returns:
            ModuleGenerateResponse with mock module
        """
        # Get mock module for the phoneme
        mock_scenes = MOCK_MODULES.get(request.phoneme, MOCK_MODULES["/r/"])
        
        # Validate and filter asset IDs
        validated_scenes = []
        full_narration_text = ""
        
        for scene_data in mock_scenes:
            validated_assets = validate_storyboard_assets(scene_data["asset_ids"])
            
            scene = ModuleScene(
                scene_number=scene_data["scene_number"],
                duration_ms=scene_data["duration_ms"],
                asset_ids=validated_assets,
                narration_text=scene_data["narration_text"],
                articulatory_cue=scene_data["articulatory_cue"],
                transition_type=scene_data.get("transition_type", "crossfade")
            )
            validated_scenes.append(scene)
            full_narration_text += scene_data["narration_text"] + " "
        
        # Calculate total duration
        total_duration = sum(scene.duration_ms for scene in validated_scenes)
        
        # Generate TTS audio if available
        narration_audio_url = None
        tts_fallback_info = None
        if tts_service.is_available():
            audio_path = tts_service.generate_narration_audio(
                text=full_narration_text.strip(),
                output_filename=f"module_{request.phoneme.replace('/', '')}_{uuid.uuid4().hex}.wav"
            )
            if audio_path:
                # For now, return the absolute path. In production, this would be a URL
                narration_audio_url = audio_path
        else:
            # Provide fallback info for browser-based TTS
            tts_fallback_info = tts_service.get_browser_fallback_instructions()
        
        # Generate title
        phoneme_display = request.phoneme.replace("/", "")
        title = f"{phoneme_display} Articulation Training - {request.age_band}"
        
        # Create response
        response = ModuleGenerateResponse(
            id=str(uuid.uuid4()),
            phoneme=request.phoneme,
            age_band=request.age_band,
            language=request.language,
            title=title,
            total_duration_ms=total_duration,
            scenes=validated_scenes,
            narration_audio_url=narration_audio_url,
            source=request.source,
            approved=False,
            approved_by=None,
            approved_at=None,
            created_at=datetime.utcnow().isoformat(),
            tts_fallback_info=tts_fallback_info
        )
        
        return response
    
    def validate_module_request(self, request: ModuleGenerateRequest) -> bool:
        """
        Validate the module generation request.
        
        Args:
            request: Module generation request
            
        Returns:
            True if request is valid, False otherwise
        """
        if not request.phoneme:
            return False
        
        if request.phoneme not in get_supported_phonemes():
            return False
        
        if request.age_band not in ["child-3-5", "child-6-8", "child-9-12", "teen", "adult"]:
            return False
        
        if request.source not in ["mid-session", "library-admin"]:
            return False
        
        return True

# Global instance
storyboard_generator = StoryboardGenerator()