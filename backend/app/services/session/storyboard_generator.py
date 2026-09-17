import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from app.services.session.asset_registry import validate_storyboard_assets

logger = logging.getLogger(__name__)

# Prebuilt Clinical Articulation Models
PHONEME_PROFILES = {
    "/r/": {
        "title": "Retroflex Tongue Elevation for /r/",
        "mouth_shape": "mouth_rounded",
        "tongue_shape": "tongue_retroflex_curl",
        "airflow": "air_central_stream",
        "vocal": "vocal_vibration_glow",
        "cues": [
            "Rest your jaw comfortably.",
            "Round your lips slightly into an 'O' shape.",
            "Curl the tip of your tongue upward and backward toward your palate.",
            "Direct a smooth stream of air central over your tongue while vibrating your vocal cords."
        ]
    },
    "/s/": {
        "title": "Alveolar Central Airflow for /s/",
        "mouth_shape": "mouth_spread",
        "tongue_shape": "tongue_alveolar_groove",
        "airflow": "air_friction_burst",
        "vocal": None,
        "cues": [
            "Keep your teeth close together in a slight smile.",
            "Raise your tongue blade up toward the ridge behind your top teeth.",
            "Form a narrow central groove along your tongue.",
            "Blow a high-frequency stream of air forward through the teeth like a hiss."
        ]
    },
    "/th/": {
        "title": "Interdental Tongue Placement for /th/",
        "mouth_shape": "mouth_open_wide",
        "tongue_shape": "tongue_interdental",
        "airflow": "air_soft_continuous",
        "vocal": None,
        "cues": [
            "Open your mouth slightly so top and bottom teeth are visible.",
            "Gently place the tip of your tongue between your front teeth.",
            "Breathe out softly and continuously over the top of your tongue.",
            "Keep the airflow gentle without biting down hard."
        ]
    },
    "/b/": {
        "title": "Bilabial Plosive Release for /b/",
        "mouth_shape": "mouth_bilabial_closed",
        "tongue_shape": "tongue_neutral",
        "airflow": "air_plosive_release",
        "vocal": "vocal_vibration_glow",
        "cues": [
            "Bring your top and bottom lips firmly together.",
            "Build up light air pressure behind your closed lips.",
            "Turn on your voice from your throat.",
            "Release your lips suddenly with a puff of voiced air!"
        ]
    }
}

def validate_request(request) -> bool:
    """Validate demo generation request."""
    if not request.phoneme:
        return False
    return True

def validate_module_request(request) -> bool:
    """Validate module generation request."""
    if not request.phoneme:
        return False
    return True

def generate_storyboard(request) -> Dict[str, Any]:
    """Generate demo storyboard from request object."""
    return generate_live_demo_storyboard(
        phoneme=request.phoneme,
        word=request.word,
        age_band=request.age_band,
        language=request.language
    )

def generate_module(request) -> Dict[str, Any]:
    """Generate module storyboard from request object."""
    return generate_module_storyboard(
        phoneme=request.phoneme,
        age_band=request.age_band,
        language=request.language
    )

def generate_live_demo_storyboard(phoneme: str, word: Optional[str] = None, age_band: str = "child-6-8", language: str = "en-US") -> Dict[str, Any]:
    """Prebuilt clinical speech pathologist model for 5-15s procedural demo."""
    clean_p = phoneme.strip().lower()
    if clean_p not in PHONEME_PROFILES:
        clean_p = "/r/"

    prof = PHONEME_PROFILES[clean_p]
    target_word = word.strip() if word else clean_p.replace("/", "")

    steps = [
        {
            "step_number": 1,
            "duration_ms": 3000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": f"Let's practice making the {phoneme} sound for {target_word}. Start in a relaxed resting position.",
            "articulatory_cue": "1. Resting Position"
        },
        {
            "step_number": 2,
            "duration_ms": 3500,
            "asset_ids": ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"]],
            "narration_text": prof["cues"][1] + " " + prof["cues"][2],
            "articulatory_cue": "2. Tongue & Lip Placement"
        },
        {
            "step_number": 3,
            "duration_ms": 3500,
            "asset_ids": [a for a in ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"], prof["airflow"], prof["vocal"]] if a],
            "narration_text": f"{prof['cues'][3]} Now say: {target_word}!",
            "articulatory_cue": "3. Airflow & Word Production"
        }
    ]

    for s in steps:
        s["asset_ids"] = validate_storyboard_assets(s["asset_ids"])

    return {
        "id": f"demo_{clean_p.replace('/', '')}_{str(uuid.uuid4())}",
        "phoneme": phoneme,
        "word": target_word,
        "total_duration_ms": 10000,
        "steps": steps,
        "narration_audio_url": None,
        "linked_milestone_id": None,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tts_fallback_info": None
    }

def generate_module_storyboard(phoneme: str, age_band: str = "child-6-8", language: str = "en-US") -> Dict[str, Any]:
    """Prebuilt clinical speech pathologist model for 30s training module."""
    clean_p = phoneme.strip().lower()
    if clean_p not in PHONEME_PROFILES:
        clean_p = "/r/"

    prof = PHONEME_PROFILES[clean_p]

    scenes = [
        {
            "scene_number": 1,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": f"Welcome to the 30-second articulation training module for {phoneme}. Relax your mouth.",
            "articulatory_cue": "Scene 1: Introduction",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 2,
            "duration_ms": 5000,
            "asset_ids": ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"]],
            "narration_text": prof["cues"][1],
            "articulatory_cue": "Scene 2: Lip Shape",
            "transition_type": "slide"
        },
        {
            "scene_number": 3,
            "duration_ms": 5000,
            "asset_ids": ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"]],
            "narration_text": prof["cues"][2],
            "articulatory_cue": "Scene 3: Tongue Placement",
            "transition_type": "zoom"
        },
        {
            "scene_number": 4,
            "duration_ms": 5000,
            "asset_ids": [a for a in ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"], prof["airflow"]] if a],
            "narration_text": prof["cues"][3],
            "articulatory_cue": "Scene 4: Airflow Control",
            "transition_type": "lottie_mouth"
        },
        {
            "scene_number": 5,
            "duration_ms": 5000,
            "asset_ids": [a for a in ["palate_teeth_upper_lower", prof["mouth_shape"], prof["tongue_shape"], prof["airflow"], prof["vocal"]] if a],
            "narration_text": f"Great effort! Repeat the {phoneme} sound three times aloud.",
            "articulatory_cue": "Scene 5: Repetition Practice",
            "transition_type": "crossfade"
        },
        {
            "scene_number": 6,
            "duration_ms": 4000,
            "asset_ids": ["palate_teeth_upper_lower", "mouth_neutral", "tongue_neutral"],
            "narration_text": f"Awesome job! You have mastered the target placement for {phoneme}!",
            "articulatory_cue": "Scene 6: Module Completion",
            "transition_type": "crossfade"
        }
    ]

    for sc in scenes:
        sc["asset_ids"] = validate_storyboard_assets(sc["asset_ids"])

    return {
        "id": f"mod_{clean_p.replace('/', '')}_{str(uuid.uuid4())}",
        "phoneme": phoneme,
        "age_band": age_band,
        "language": language,
        "title": prof["title"],
        "total_duration_ms": 28000,
        "scenes": scenes,
        "narration_audio_url": None,
        "source": "mid-session",
        "approved": False,
        "approved_by": None,
        "approved_at": None,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tts_fallback_info": None
    }


class StoryboardGenerator:
    @staticmethod
    def generate_storyboard(req):
        phoneme = getattr(req, 'phoneme', '/r/')
        word = getattr(req, 'word', None)
        age_band = getattr(req, 'age_band', 'child-6-8')
        language = getattr(req, 'language', 'en-US')
        return generate_live_demo_storyboard(phoneme, word, age_band, language)

    @staticmethod
    def generate_module(req):
        phoneme = getattr(req, 'phoneme', '/r/')
        age_band = getattr(req, 'age_band', 'child-6-8')
        language = getattr(req, 'language', 'en-US')
        return generate_module_storyboard(phoneme, age_band, language)

def generate_storyboard(req):
    return StoryboardGenerator.generate_storyboard(req)

def generate_module(req):
    return StoryboardGenerator.generate_module(req)
