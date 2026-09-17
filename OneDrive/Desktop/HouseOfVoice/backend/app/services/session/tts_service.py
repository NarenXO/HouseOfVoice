"""
TTS Narration Service

OWNERSHIP: Sai Pranav (feature/saipranav-session)
This service handles text-to-speech narration generation for speech therapy demos,
using Piper CLI integration with Web Speech API browser fallback.
"""

import os
import subprocess
import tempfile
import uuid
from typing import Optional
from pathlib import Path


class TTSService:
    """Text-to-speech service for demo narration generation."""
    
    def __init__(self):
        self.piper_enabled = self._check_piper_available()
        self.output_dir = Path(tempfile.gettempdir()) / "houseofvoice_tts"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def _check_piper_available(self) -> bool:
        """
        Check if Piper CLI is available on the system.
        
        Returns:
            True if Piper CLI is available, False otherwise
        """
        try:
            result = subprocess.run(
                ["piper", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def generate_narration_audio(
        self,
        text: str,
        voice_model: str = "en_US-lessac-medium",
        output_filename: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate audio file from narration text using Piper CLI.
        
        Args:
            text: Narration text to convert to speech
            voice_model: Piper voice model to use (default: en_US-lessac-medium)
            output_filename: Optional custom filename for the output
            
        Returns:
            Path to generated audio file, or None if generation failed
        """
        if not self.piper_enabled:
            print("Piper CLI not available, skipping backend TTS generation")
            return None
        
        if not text or not text.strip():
            return None
        
        # Generate output filename if not provided
        if not output_filename:
            output_filename = f"narration_{uuid.uuid4().hex}.wav"
        
        output_path = self.output_dir / output_filename
        
        try:
            # Run Piper CLI to generate audio
            # Piper CLI command: piper --model <model> --output <output> - < <text>
            result = subprocess.run(
                [
                    "piper",
                    "--model", voice_model,
                    "--output", str(output_path),
                    "-"
                ],
                input=text,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and output_path.exists():
                print(f"Successfully generated TTS audio: {output_path}")
                return str(output_path)
            else:
                print(f"Piper CLI failed: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            print("Piper CLI timed out")
            return None
        except Exception as e:
            print(f"Error generating TTS audio: {e}")
            return None
    
    def get_browser_fallback_instructions(self) -> dict:
        """
        Get instructions for browser-side Web Speech API fallback.
        
        Returns:
            Dictionary with fallback configuration for frontend
        """
        return {
            "use_browser_tts": True,
            "speech_synthesis_api": True,
            "preferred_voice": "en-US",
            "fallback_reason": "Piper CLI not available on server"
        }
    
    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Clean up old TTS audio files to prevent disk space issues.
        
        Args:
            max_age_hours: Maximum age of files to keep in hours
        """
        import time
        
        if not self.output_dir.exists():
            return
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for file_path in self.output_dir.glob("*.wav"):
            try:
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_path.unlink()
                    print(f"Cleaned up old TTS file: {file_path}")
            except Exception as e:
                print(f"Error cleaning up file {file_path}: {e}")
    
    def is_available(self) -> bool:
        """
        Check if TTS service is available.
        
        Returns:
            True if Piper CLI is available, False otherwise
        """
        return self.piper_enabled


# Global instance
tts_service = TTSService()
