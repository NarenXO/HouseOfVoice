"""
Speech Articulation Asset Registry & Validator

OWNERSHIP: Sai Pranav (feature/saipranav-session)
This service manages the catalog of SVG anatomical assets for speech therapy visualization,
providing validation for AI-generated storyboards and metadata for phoneme-specific articulation.
"""

from typing import Dict, List, Optional

# Asset Catalog with metadata
ASSET_CATALOG: Dict[str, Dict] = {
    # Mouth Base Shapes
    "mouth_neutral": {
        "layer_type": "mouth_base",
        "phoneme_affinity": ["all"],
        "description": "Side-profile resting mouth with neutral lip position",
        "category": "mouth_shape"
    },
    "mouth_open_wide": {
        "layer_type": "mouth_base",
        "phoneme_affinity": ["/a/", "/æ/", "/r/"],
        "description": "Jaw dropped for open vowels and retroflex sounds",
        "category": "mouth_shape"
    },
    "mouth_spread": {
        "layer_type": "mouth_base",
        "phoneme_affinity": ["/s/", "/i/", "/e/"],
        "description": "Lips retracted/smiling for sibilants and front vowels",
        "category": "mouth_shape"
    },
    "mouth_rounded": {
        "layer_type": "mouth_base",
        "phoneme_affinity": ["/r/", "/w/", "/u/", "/o/"],
        "description": "Lips protruded/pursed for rounded vowels and /r/",
        "category": "mouth_shape"
    },
    "mouth_bilabial_closed": {
        "layer_type": "mouth_base",
        "phoneme_affinity": ["/b/", "/p/", "/m/"],
        "description": "Lips pressed together for bilabial sounds",
        "category": "mouth_shape"
    },
    
    # Tongue Postures
    "tongue_neutral": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["all"],
        "description": "Flat resting tongue at floor of mouth",
        "category": "tongue"
    },
    "tongue_alveolar_touch": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["/t/", "/d/", "/n/", "/l/"],
        "description": "Tongue tip firmly against upper alveolar ridge",
        "category": "tongue"
    },
    "tongue_alveolar_groove": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["/s/", "/z/"],
        "description": "Tongue blade raised near ridge with narrow central groove for sibilants",
        "category": "tongue"
    },
    "tongue_interdental": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["/th/", "/ð/"],
        "description": "Tongue tip protruding slightly between teeth for interdentals",
        "category": "tongue"
    },
    "tongue_retroflex_curl": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["/r/"],
        "description": "Tongue tip curled upward and backward toward hard palate",
        "category": "tongue"
    },
    "tongue_velar_back": {
        "layer_type": "tongue_posture",
        "phoneme_affinity": ["/k/", "/g/", "/ŋ/"],
        "description": "Tongue dorsum elevated against soft palate for velars",
        "category": "tongue"
    },
    
    # Airflow & Acoustic Indicators
    "air_central_stream": {
        "layer_type": "airflow",
        "phoneme_affinity": ["all"],
        "description": "Focused forward laminar airflow arrow",
        "category": "airflow"
    },
    "air_friction_burst": {
        "layer_type": "airflow",
        "phoneme_affinity": ["/s/", "/z/", "/ʃ/", "/ʒ/"],
        "description": "Turbulent high-frequency friction burst at constriction",
        "category": "airflow"
    },
    "air_soft_continuous": {
        "layer_type": "airflow",
        "phoneme_affinity": ["/th/", "/ð/", "/f/", "/v/"],
        "description": "Gentle continuous airflow over tongue tip",
        "category": "airflow"
    },
    "air_plosive_release": {
        "layer_type": "airflow",
        "phoneme_affinity": ["/p/", "/b/", "/t/", "/d/", "/k/", "/g/"],
        "description": "Sudden outward explosive wave for plosives",
        "category": "airflow"
    },
    "vocal_vibration_glow": {
        "layer_type": "acoustic",
        "phoneme_affinity": ["/b/", "/d/", "/g/", "/z/", "/ð/", "/v/", "/m/", "/n/", "/l/", "/r/"],
        "description": "Glowing acoustic wave indicator at larynx for voiced sounds",
        "category": "acoustic"
    },
    
    # Teeth & Palate Guides
    "palate_teeth_upper_lower": {
        "layer_type": "anatomical_reference",
        "phoneme_affinity": ["all"],
        "description": "Anatomical reference overlay with hard palate, alveolar ridge, teeth",
        "category": "reference"
    }
}

# Phoneme-specific asset presets
PHONEME_PRESETS: Dict[str, List[str]] = {
    "/r/": [
        "palate_teeth_upper_lower",
        "mouth_rounded",
        "tongue_retroflex_curl",
        "air_central_stream",
        "vocal_vibration_glow"
    ],
    "/s/": [
        "palate_teeth_upper_lower",
        "mouth_spread",
        "tongue_alveolar_groove",
        "air_friction_burst"
    ],
    "/th/": [
        "palate_teeth_upper_lower",
        "mouth_open_wide",
        "tongue_interdental",
        "air_soft_continuous"
    ],
    "/b/": [
        "palate_teeth_upper_lower",
        "mouth_bilabial_closed",
        "tongue_neutral",
        "air_plosive_release",
        "vocal_vibration_glow"
    ]
}

def validate_storyboard_assets(asset_ids: List[str]) -> List[str]:
    """
    Validate and filter asset IDs from AI-generated storyboards.
    Removes any unrecognized asset IDs to prevent client-side rendering errors.
    
    Args:
        asset_ids: List of asset IDs from LLM or storyboard generation
        
    Returns:
        Filtered list containing only valid asset IDs
    """
    if not asset_ids:
        return []
    
    valid_assets = []
    for asset_id in asset_ids:
        if asset_id in ASSET_CATALOG:
            valid_assets.append(asset_id)
        else:
            # Log warning about invalid asset (in production, use proper logging)
            print(f"Warning: Invalid asset ID '{asset_id}' filtered out")
    
    return valid_assets

def get_supported_phonemes() -> List[str]:
    """
    Returns list of phonemes that have complete asset presets.
    
    Returns:
        List of supported phoneme symbols
    """
    return list(PHONEME_PRESETS.keys())

def get_phoneme_preset(phoneme: str) -> Optional[List[str]]:
    """
    Get the asset preset for a specific phoneme.
    
    Args:
        phoneme: Phoneme symbol (e.g., "/r/", "/s/")
        
    Returns:
        List of asset IDs for the phoneme, or None if not supported
    """
    return PHONEME_PRESETS.get(phoneme)

def get_asset_metadata(asset_id: str) -> Optional[Dict]:
    """
    Get metadata for a specific asset.
    
    Args:
        asset_id: Asset identifier
        
    Returns:
        Asset metadata dictionary or None if not found
    """
    return ASSET_CATALOG.get(asset_id)

def get_assets_by_category(category: str) -> List[str]:
    """
    Get all asset IDs for a specific category.
    
    Args:
        category: Category name (mouth_shape, tongue, airflow, acoustic, reference)
        
    Returns:
        List of asset IDs in the category
    """
    return [
        asset_id for asset_id, metadata in ASSET_CATALOG.items()
        if metadata.get("category") == category
    ]

def get_all_asset_ids() -> List[str]:
    """
    Get all valid asset IDs in the catalog.
    
    Returns:
        Complete list of asset IDs
    """
    return list(ASSET_CATALOG.keys())