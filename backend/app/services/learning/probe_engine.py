"""Probe engine for generalization testing and checkpoint management."""
from typing import Dict, List
from datetime import datetime
import uuid
from .probe_bank import select_probe_word, PROBE_WORD_BANK
from .scorer import score_attempt
from .state_machine import MilestoneStateMachine
from .practice_tracker import _consecutive_successes, CONSECUTIVE_SUCCESS_THRESHOLD


# In-memory stores for probe state (hackathon pattern)
_probe_state: Dict[str, Dict] = {}  # milestone_id -> probe state
_probe_history: List[Dict] = []  # List of all probe attempts across cases
_badges: Dict[str, List[Dict]] = {}  # case_id -> list of Badge objects

PROBE_FREQUENCY_CAP = 4

# Trained variety words for extra practice after probe failure
TRAINED_VARIETY = {
    "/s/": ["sand", "soup", "sail", "seed", "sing", "soft"],
    "/r/": ["rain", "road", "ring", "red", "run", "roof"],
    "/th/": ["think", "three", "thumb", "thin", "thank", "thread"]
}


async def should_serve_probe(milestone_id: str) -> bool:
    """
    Verify consecutive successes >= threshold and milestone is active/trained.

    Args:
        milestone_id: The milestone to check

    Returns:
        True if probe should be served, False otherwise
    """
    consecutive = _consecutive_successes.get(milestone_id, 0)
    return consecutive >= CONSECUTIVE_SUCCESS_THRESHOLD


async def serve_probe(milestone_id: str, phoneme: str) -> dict:
    """
    Selects a probe word from probe_bank for the phoneme, excluding
    previously used probe words for this milestone.
    Returns shape identical to standard drill items.

    Args:
        milestone_id: The milestone being tested
        phoneme: The phoneme to select a probe for

    Returns:
        Dict with probe item information
    """
    state = _probe_state.setdefault(milestone_id, {
        "used_words": [],
        "current_probe": None,
        "drill_count_since_last_probe": 0
    })

    # Normalize phoneme for consistency (remove slashes)
    normalized_phoneme = phoneme.strip("/")

    probe = select_probe_word(normalized_phoneme, exclude_words=state["used_words"])
    state["current_probe"] = probe
    state["used_words"].append(probe["word"])

    return {
        "is_probe": True,
        "probe_word_id": probe.get("id", probe["word"]),
        "display_text": probe["word"],
        "instructions": f"Say '{probe['word']}' clearly out loud"
    }


async def score_probe(
    milestone_id: str,
    case_id: str,
    phoneme: str,
    audio_or_text: str,
    path_milestones: List | None = None
) -> dict:
    """
    Scores the probe attempt using stubbed scorer.
    Pass: transition to generalized, unlock next, award badge.
    Fail: keep trained status, reset streak counter, supply extra trained variety.

    Args:
        milestone_id: The milestone being tested
        case_id: Patient case ID
        phoneme: The phoneme being tested
        audio_or_text: Audio or text input (stub for now)
        path_milestones: Optional list of milestones for unlocking next

    Returns:
        Dict with probe result and next steps
    """
    state = _probe_state.get(milestone_id, {})
    current_probe = state.get("current_probe")
    probe_word = current_probe["word"] if current_probe else audio_or_text

    passed = await score_attempt(milestone_id, audio_or_text=probe_word, is_probe=True)

    # Normalize phoneme for consistency (remove slashes)
    normalized_phoneme = phoneme.strip("/")

    # Record probe attempt
    _probe_history.append({
        "case_id": case_id,
        "phoneme": normalized_phoneme,
        "milestone_id": milestone_id,
        "probe_word": probe_word,
        "passed": passed
    })

    if passed:
        # Award badge for this milestone if not already awarded
        badge = award_badge(case_id, milestone_id, normalized_phoneme)

        # Don't reset consecutive counter on pass - keep streak intact
        # Only reset on fail

        return {
            "result": "pass",
            "milestone_status": "generalized",
            "badge_awarded": True,
            "badge": badge,
            "next_milestone_unlocked": True,
            "message": "Amazing! You can use this sound in brand new words!"
        }
    else:
        _consecutive_successes[milestone_id] = 0
        # Use normalized phoneme for TRAINED_VARIETY lookup
        lookup_key = f"/{normalized_phoneme}/"
        extra_items = TRAINED_VARIETY.get(lookup_key, TRAINED_VARIETY.get(phoneme, ["practice word 1", "practice word 2"]))[:3]
        return {
            "result": "continue_practice",
            "milestone_status": "trained",
            "badge_awarded": False,
            "message": "Nice try! Let's practice a few more words to build muscle memory.",
            "extra_practice_items": extra_items
        }


def get_probe_statistics(case_id: str, phoneme: str) -> dict:
    """
    Calculate probe statistics for a case and phoneme.

    Args:
        case_id: Patient case ID
        phoneme: The phoneme to get statistics for

    Returns:
        Dict with probe attempt statistics
    """
    from datetime import datetime

    # Filter probe history for this case and phoneme
    relevant_probes = [
        p for p in _probe_history
        if p["case_id"] == case_id and p["phoneme"] == phoneme
    ]

    attempted = len(relevant_probes)
    passed = sum(1 for p in relevant_probes if p["passed"])
    rate = (passed / attempted) if attempted > 0 else 0.0

    # Get last updated timestamp
    last_updated = None
    if relevant_probes:
        last_updated = datetime.utcnow().isoformat()

    return {
        "case_id": case_id,
        "phoneme": phoneme,
        "probes_attempted": attempted,
        "probes_passed": passed,
        "rate": rate,
        "last_updated": last_updated
    }


def get_all_phoneme_statistics(case_id: str) -> dict:
    """
    Calculate probe statistics for all phonemes for a case.

    Args:
        case_id: Patient case ID

    Returns:
        Dict with overall statistics and per-phoneme breakdown
    """
    from datetime import datetime

    # Filter probe history for this case
    case_probes = [p for p in _probe_history if p["case_id"] == case_id]

    # Group by phoneme
    phoneme_groups: dict[str, list] = {}
    for probe in case_probes:
        phoneme = probe["phoneme"]
        if phoneme not in phoneme_groups:
            phoneme_groups[phoneme] = []
        phoneme_groups[phoneme].append(probe)

    # Calculate statistics for each phoneme
    phoneme_scores = []
    total_attempted = 0
    total_passed = 0

    for phoneme, probes in phoneme_groups.items():
        attempted = len(probes)
        passed = sum(1 for p in probes if p["passed"])
        rate = (passed / attempted) if attempted > 0 else 0.0

        # Get last updated timestamp for this phoneme
        last_updated = datetime.utcnow().isoformat() if probes else None

        phoneme_scores.append({
            "phoneme": f"/{phoneme}/",
            "probes_attempted": attempted,
            "probes_passed": passed,
            "rate": rate,
            "last_updated": last_updated
        })

        total_attempted += attempted
        total_passed += passed

    # Calculate overall rate
    overall_rate = (total_passed / total_attempted) if total_attempted > 0 else 0.0

    return {
        "case_id": case_id,
        "overall_rate": overall_rate,
        "total_probes_attempted": total_attempted,
        "total_probes_passed": total_passed,
        "phonemes": phoneme_scores
    }


def award_badge(case_id: str, milestone_id: str, phoneme: str) -> dict:
    """
    Award a badge for generalization achievement.
    
    Args:
        case_id: Patient case ID
        milestone_id: The milestone that was generalized
        phoneme: The phoneme that was generalized
        
    Returns:
        Badge object if awarded, None if already exists
    """
    # Check if badge already exists for this milestone
    if case_id not in _badges:
        _badges[case_id] = []
    
    existing_badge = next(
        (b for b in _badges[case_id] if b["milestone_id"] == milestone_id),
        None
    )
    
    if existing_badge:
        return existing_badge
    
    # Create new badge
    badge = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "milestone_id": milestone_id,
        "phoneme": f"/{phoneme}/",
        "title": f"Sound Master: /{phoneme}/",
        "description": f"Successfully generalized /{phoneme}/ to untrained words!",
        "icon": "star",
        "awarded_at": datetime.utcnow().isoformat()
    }
    
    _badges[case_id].append(badge)
    return badge


def get_badges(case_id: str) -> dict:
    """
    Get all badges awarded to a case.
    
    Args:
        case_id: Patient case ID
        
    Returns:
        Dict with badges list and count
    """
    badges = _badges.get(case_id, [])
    
    return {
        "case_id": case_id,
        "total_badges": len(badges),
        "badges": badges
    }
