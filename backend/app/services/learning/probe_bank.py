"""Probe bank for generalization testing across phonemes and contexts."""
from typing import Dict, List
from app.models.shared import ProbeResult


class ProbeBank:
    """Manages probe word bank for phoneme generalization testing."""

    # Sample probe words organized by phoneme and position
    # In production, this would be loaded from a database or config
    PROBE_WORDS: Dict[str, Dict[str, List[str]]] = {
        "s": {
            "word_initial": ["sun", "soap", "soup", "sand", "sock", "sing", "socks", "seven"],
            "word_final": ["bus", "kiss", "mess", "class", "pass", "glass", "grass", "dress"],
            "word_medial": ["hissing", "cactus", "basin", "mustard", "pasta", "mask", "desk"],
        },
        "th": {
            "word_initial": ["think", "thank", "thumb", "thin", "three", "throw", "thirty"],
            "word_final": ["bath", "path", "math", "both", "mouth", "truth", "month"],
            "word_medial": ["nothing", "something", "brother", "feather", "mother", "father"],
        },
        "r": {
            "word_initial": ["red", "run", "rabbit", "rain", "read", "ring", "road", "rock"],
            "word_final": ["car", "star", "door", "bear", "hair", "four", "ear", "deer"],
            "word_medial": ["orange", "berry", "carrot", "parrot", "arrow", "mirror", "forest"],
        },
    }

    @staticmethod
    def get_probes_for_phoneme(phoneme: str, position: str = "all") -> List[str]:
        """
        Get probe words for a specific phoneme.

        Args:
            phoneme: The phoneme to get probes for (e.g., "s", "th", "r")
            position: Position filter - "word_initial", "word_final", "word_medial", or "all"

        Returns:
            List of probe words
        """
        if phoneme not in ProbeBank.PROBE_WORDS:
            return []

        if position == "all":
            all_probes = []
            for pos_words in ProbeBank.PROBE_WORDS[phoneme].values():
                all_probes.extend(pos_words)
            return all_probes

        return ProbeBank.PROBE_WORDS[phoneme].get(position, [])

    @staticmethod
    def record_probe_result(case_id: str, phoneme: str, probe_word: str, passed: bool) -> ProbeResult:
        """
        Record a probe attempt result.

        Args:
            case_id: Patient case ID
            phoneme: The phoneme being tested
            probe_word: The specific probe word used
            passed: Whether the probe was passed

        Returns:
            ProbeResult object
        """
        from datetime import datetime

        return ProbeResult(
            case_id=case_id,
            phoneme=phoneme,
            probe_word=probe_word,
            passed=passed,
            scored_at=datetime.utcnow().isoformat(),
        )

    @staticmethod
    def select_probe_word(phoneme: str, exclude_words: list[str] | None = None) -> dict:
        """
        Select a probe word for a phoneme, excluding previously used words.

        Args:
            phoneme: The phoneme to select a probe for (e.g., "s", "th", "r")
            exclude_words: List of words to exclude from selection

        Returns:
            Dict with probe word information
        """
        import random

        exclude_words = exclude_words or []

        # Normalize phoneme (handle /s/ vs s)
        phoneme_normalized = phoneme.strip("/")

        # Get all available probe words for the phoneme
        all_probes = ProbeBank.get_probes_for_phoneme(phoneme_normalized, position="all")

        # Filter out excluded words
        available_probes = [word for word in all_probes if word not in exclude_words]

        # If no probes available after exclusion, return a default
        if not available_probes:
            return {
                "id": f"probe_{phoneme_normalized}_default",
                "word": f"practice_{phoneme_normalized}",
                "phoneme": phoneme_normalized
            }

        # Randomly select a probe word
        selected_word = random.choice(available_probes)

        return {
            "id": f"probe_{phoneme_normalized}_{selected_word}",
            "word": selected_word,
            "phoneme": phoneme_normalized
        }


# Convenience functions for the probe engine
PROBE_WORD_BANK = ProbeBank.PROBE_WORDS


def select_probe_word(phoneme: str, exclude_words: list[str] | None = None) -> dict:
    """
    Convenience function to select a probe word.
    """
    return ProbeBank.select_probe_word(phoneme, exclude_words)
