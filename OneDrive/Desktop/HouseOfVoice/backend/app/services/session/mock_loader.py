"""
Clinical Context Mock Loader Service

OWNERSHIP: Sai Pranav (feature/saipranav-session)
This service loads and integrates mock data from other team members' fixtures
to provide clinical context for live therapy sessions.
"""

import json
import re
from typing import Dict, List, Optional, Any
from pathlib import Path

# Constants for mock file paths
USE_MOCKS = True
MOCK_BASE_PATH = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"

SCREENING_MOCK_PATH = MOCK_BASE_PATH / "screening_result.mock.json"
THERAPY_PLAN_MOCK_PATH = MOCK_BASE_PATH / "therapy_plan.mock.json"
LEARNING_PATH_MOCK_PATH = MOCK_BASE_PATH / "learning_path.mock.json"


class MockLoader:
    """Loads and integrates clinical context from mock fixtures."""
    
    def __init__(self):
        self.use_mocks = USE_MOCKS
        self._cache: Dict[str, Any] = {}
    
    def load_json_file(self, file_path: Path) -> Optional[Dict]:
        """
        Load a JSON file from the shared mocks directory.
        
        Args:
            file_path: Path to the JSON file
            
        Returns:
            Parsed JSON data or None if file not found
        """
        if not self.use_mocks:
            return None
        
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print(f"Mock file not found: {file_path}")
                return None
        except Exception as e:
            print(f"Error loading mock file {file_path}: {e}")
            return None
    
    def get_screening_result(self, case_id: str = "case_demo_001") -> Dict:
        """
        Get screening result data for a specific case.
        
        Args:
            case_id: Case identifier
            
        Returns:
            Screening result data with fallback defaults
        """
        cache_key = f"screening_{case_id}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        screening_data = self.load_json_file(SCREENING_MOCK_PATH)
        
        if screening_data:
            # Normalize case ID if needed
            result = screening_data.copy()
            self._cache[cache_key] = result
            return result
        
        # Fallback default screening result
        fallback_result = {
            "caseId": case_id,
            "speechRate": 3.2,
            "pauseFrequency": 0.18,
            "pronunciationScore": 0.71,
            "fluencyScore": 0.68,
            "voiceStability": 0.82,
            "clarityScore": 0.74,
            "confidenceLevel": 0.77,
            "flaggedErrors": ["s - end of words", "th - start of words", "r - blends"],
            "plainLanguageSummary": "Mild articulation difficulty on /s/ at word-final position and /th/ at word-initial position. Fluency and voice stability are within normal range."
        }
        
        self._cache[cache_key] = fallback_result
        return fallback_result
    
    def get_therapy_plan(self, case_id: str = "case_demo_001") -> Dict:
        """
        Get therapy plan data for a specific case.
        
        Args:
            case_id: Case identifier
            
        Returns:
            Therapy plan data with fallback defaults
        """
        cache_key = f"therapy_plan_{case_id}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        therapy_data = self.load_json_file(THERAPY_PLAN_MOCK_PATH)
        
        if therapy_data:
            result = therapy_data.copy()
            self._cache[cache_key] = result
            return result
        
        # Fallback default therapy plan
        fallback_plan = {
            "caseId": case_id,
            "therapistId": "thr_demo_001",
            "goals": [
                "Improve /s/ production at word-final position",
                "Improve /th/ production at word-initial position"
            ],
            "sessionMode": "online",
            "approvedBy": "thr_demo_001",
            "approvedAt": "2026-09-10T10:00:00Z"
        }
        
        self._cache[cache_key] = fallback_plan
        return fallback_plan
    
    def get_learning_path(self, case_id: str = "case_demo_001") -> Dict:
        """
        Get learning path with milestones for a specific case.
        
        Args:
            case_id: Case identifier
            
        Returns:
            Learning path data with fallback defaults
        """
        cache_key = f"learning_path_{case_id}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        learning_data = self.load_json_file(LEARNING_PATH_MOCK_PATH)
        
        if learning_data:
            result = learning_data.copy()
            self._cache[cache_key] = result
            return result
        
        # Fallback default learning path
        fallback_path = {
            "pathId": "path_demo_001",
            "caseId": case_id,
            "milestones": [
                {
                    "id": "m1",
                    "pathId": "path_demo_001",
                    "orderIndex": 1,
                    "title": "s - start of words",
                    "goal": "Produce /s/ correctly at word-initial position",
                    "status": "generalized",
                    "linkedDemoId": "mod_s_start"
                },
                {
                    "id": "m2",
                    "pathId": "path_demo_001",
                    "orderIndex": 2,
                    "title": "s - end of words",
                    "goal": "Produce /s/ correctly at word-final position",
                    "status": "trained",
                    "linkedDemoId": "mod_s_end"
                },
                {
                    "id": "m3",
                    "pathId": "path_demo_001",
                    "orderIndex": 3,
                    "title": "short sentences with s",
                    "goal": "Use /s/ correctly in short sentences",
                    "status": "locked",
                    "linkedDemoId": None
                }
            ]
        }
        
        self._cache[cache_key] = fallback_path
        return fallback_path
    
    def get_clinical_context(self, case_id: str = "case_demo_001") -> Dict:
        """
        Get comprehensive clinical context for a specific case.
        
        This combines data from screening, therapy plan, and learning path
        to provide a complete clinical picture for the session.
        
        Args:
            case_id: Case identifier
            
        Returns:
            Complete clinical context dictionary
        """
        screening = self.get_screening_result(case_id)
        therapy_plan = self.get_therapy_plan(case_id)
        learning_path = self.get_learning_path(case_id)
        
        # Extract target phonemes from screening errors
        flagged_errors = screening.get("flaggedErrors", [])
        target_phonemes = self._extract_phonemes_from_errors(flagged_errors)
        
        # Get milestones from learning path
        milestones = learning_path.get("milestones", [])
        
        # Calculate severity based on scores
        articulation_score = screening.get("pronunciationScore", 0.71)
        severity = self._calculate_severity(articulation_score)
        
        # Get weekly goals from therapy plan
        weekly_goals = therapy_plan.get("goals", [])
        
        context = {
            "case_id": screening.get("caseId", case_id),
            "patient_name": f"Patient {case_id}",  # Would come from patient data in production
            "target_phonemes": target_phonemes,
            "weekly_goals": weekly_goals,
            "severity": severity,
            "articulation_score": articulation_score,
            "milestones": milestones,
            "screening_summary": screening.get("plainLanguageSummary", ""),
            "session_mode": therapy_plan.get("sessionMode", "online"),
            "therapist_id": therapy_plan.get("therapistId", "thr_demo_001")
        }
        
        return context
    
    def _extract_phonemes_from_errors(self, errors: List[str]) -> List[str]:
        """
        Extract phonemes from flagged error messages.
        
        Args:
            errors: List of error messages like "s - end of words"
            
        Returns:
            List of phoneme symbols in IPA format
        """
        phonemes = []
        phoneme_map = {
            's': '/s/',
            'th': '/th/',
            'r': '/r/',
            'b': '/b/',
            'p': '/p/',
            't': '/t/',
            'd': '/d/',
            'k': '/k/',
            'g': '/g/',
            'f': '/f/',
            'v': '/v/',
            'z': '/z/',
            'sh': '/ʃ/',
            'ch': '/tʃ/',
            'j': '/dʒ/',
            'l': '/l/',
            'm': '/m/',
            'n': '/n/',
            'ng': '/ŋ/',
        }
        
        for error in errors:
            # Extract phoneme from error messages like "s - end of words", "th - start of words"
            match = re.match(r'^([a-z]+)\s*-', error)
            if match:
                phoneme = match.group(1)
                ipa_phoneme = phoneme_map.get(phoneme, f"/{phoneme}/")
                if ipa_phoneme not in phonemes:
                    phonemes.append(ipa_phoneme)
        
        return phonemes
    
    def _calculate_severity(self, score: float) -> str:
        """
        Calculate severity level based on articulation score.
        
        Args:
            score: Articulation score (0-1)
            
        Returns:
            Severity level: mild, moderate, or severe
        """
        if score >= 0.8:
            return "mild"
        elif score >= 0.6:
            return "moderate"
        else:
            return "severe"
    
    def clear_cache(self):
        """Clear the internal cache."""
        self._cache.clear()


# Global instance
mock_loader = MockLoader()
