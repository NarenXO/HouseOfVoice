"""
Module Storage Service

OWNERSHIP: Sai Pranav (feature/saipranav-session)
This service handles persistent storage of generated therapy modules with approval workflow.
Uses in-memory storage for demo purposes, ready for Supabase integration.
"""

import uuid
from typing import Dict, List, Optional
from datetime import datetime
from app.models.session import ModuleGenerateResponse, ModuleApproveRequest


class ModuleStorage:
    """In-memory storage for therapy modules with Supabase-ready schema."""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would be replaced with Supabase database calls
        self.modules: Dict[str, ModuleGenerateResponse] = {}
        
        # Initialize with some sample approved modules for testing
        self._initialize_sample_modules()
    
    def _initialize_sample_modules(self):
        """Initialize with sample approved modules for demo purposes."""
        sample_modules = [
            {
                "id": "sample_r_module_001",
                "phoneme": "/r/",
                "age_band": "child-6-8",
                "language": "en-US",
                "title": "R Articulation Training - child-6-8",
                "total_duration_ms": 31000,
                "scenes": [],  # Would be populated with actual scenes
                "narration_audio_url": None,
                "source": "library-admin",
                "approved": True,
                "approved_by": "admin_demo",
                "approved_at": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "tts_fallback_info": None
            },
            {
                "id": "sample_s_module_001",
                "phoneme": "/s/",
                "age_band": "child-6-8",
                "language": "en-US",
                "title": "S Articulation Training - child-6-8",
                "total_duration_ms": 31000,
                "scenes": [],
                "narration_audio_url": None,
                "source": "library-admin",
                "approved": True,
                "approved_by": "admin_demo",
                "approved_at": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "tts_fallback_info": None
            }
        ]
        
        for module_data in sample_modules:
            self.modules[module_data["id"]] = ModuleGenerateResponse(**module_data)
    
    def save_module(self, module: dict) -> dict:
        """
        Save a generated module to storage.
        
        Args:
            module: Module dictionary to save
            
        Returns:
            Saved module dictionary with assigned ID
        """
        # Generate ID if not provided
        if not module.get("id") or module.get("id") == "":
            module["id"] = str(uuid.uuid4())
        
        # Convert dictionary to ModuleGenerateResponse for storage
        module_response = ModuleGenerateResponse(**module)
        
        # Store module
        self.modules[module["id"]] = module_response
        
        # In production, this would be a Supabase INSERT operation:
        # supabase.table('modules').insert({
        #     'id': module.id,
        #     'phoneme': module.phoneme,
        #     'age_band': module.age_band,
        #     'language': module.language,
        #     'title': module.title,
        #     'duration_seconds': module.total_duration_ms // 1000,
        #     'scenes': [scene.dict() for scene in module.scenes],
        #     'narration_audio_url': module.narration_audio_url,
        #     'source': module.source,
        #     'approved': module.approved,
        #     'approved_by': module.approved_by,
        #     'approved_at': module.approved_at,
        #     'created_at': module.created_at
        # }).execute()
        
        # Return the dictionary version
        return module
    
    def get_module(self, module_id: str) -> Optional[ModuleGenerateResponse]:
        """
        Retrieve a module by ID.
        
        Args:
            module_id: Module identifier
            
        Returns:
            Module if found, None otherwise
        """
        return self.modules.get(module_id)
    
    def get_all_modules(self, approved_only: bool = True) -> List[ModuleGenerateResponse]:
        """
        Retrieve all modules, optionally filtering by approval status.
        
        Args:
            approved_only: If True, only return approved modules
            
        Returns:
            List of modules
        """
        modules = list(self.modules.values())
        
        if approved_only:
            modules = [m for m in modules if m.approved]
        
        # Sort by creation date (newest first)
        modules.sort(key=lambda m: m.created_at, reverse=True)
        
        return modules
    
    def get_modules_by_phoneme(self, phoneme: str, approved_only: bool = True) -> List[ModuleGenerateResponse]:
        """
        Retrieve modules for a specific phoneme.
        
        Args:
            phoneme: Phoneme to filter by
            approved_only: If True, only return approved modules
            
        Returns:
            List of matching modules
        """
        modules = list(self.modules.values())
        
        if approved_only:
            modules = [m for m in modules if m.approved and m.phoneme == phoneme]
        else:
            modules = [m for m in modules if m.phoneme == phoneme]
        
        # Sort by creation date (newest first)
        modules.sort(key=lambda m: m.created_at, reverse=True)
        
        return modules
    
    def approve_module(self, module_id: str, approval_request: ModuleApproveRequest) -> Optional[ModuleGenerateResponse]:
        """
        Approve or reject a module.
        
        Args:
            module_id: Module identifier
            approval_request: Approval request with approver and decision
            
        Returns:
            Updated module if found, None otherwise
        """
        module = self.modules.get(module_id)
        if not module:
            return None
        
        # Update approval status
        module.approved = approval_request.approved
        module.approved_by = approval_request.approved_by
        
        if approval_request.approved:
            module.approved_at = datetime.utcnow().isoformat()
        else:
            module.approved_at = None
        
        # In production, this would be a Supabase UPDATE operation:
        # supabase.table('modules').update({
        #     'approved': module.approved,
        #     'approved_by': module.approved_by,
        #     'approved_at': module.approved_at
        # }).eq('id', module_id).execute()
        
        return module
    
    def delete_module(self, module_id: str) -> bool:
        """
        Delete a module from storage.
        
        Args:
            module_id: Module identifier
            
        Returns:
            True if deleted, False if not found
        """
        if module_id in self.modules:
            del self.modules[module_id]
            
            # In production, this would be a Supabase DELETE operation:
            # supabase.table('modules').delete().eq('id', module_id).execute()
            
            return True
        return False
    
    def get_module_library_entries(self, approved_only: bool = True) -> List[dict]:
        """
        Get modules in the frozen ModuleLibraryEntry shape for the shared contract.
        
        This ensures exact compliance with the frozen contract:
        - id: str
        - phoneme: str
        - age_band: str
        - language: str
        - title: str
        - duration_seconds: int (converted from ms)
        - narration_audio_url: Optional[str]
        - approved: bool
        
        Args:
            approved_only: If True, only return approved modules
            
        Returns:
            List of dictionaries matching ModuleLibraryEntry shape exactly
        """
        modules = self.get_all_modules(approved_only)
        
        # Convert to ModuleLibraryEntry shape (frozen contract)
        library_entries = []
        for module in modules:
            entry = {
                "id": module.id,
                "phoneme": module.phoneme,
                "age_band": module.age_band,
                "language": module.language,
                "title": module.title,
                "duration_seconds": int(module.total_duration_ms / 1000),  # Convert ms to seconds as int
                "narration_audio_url": module.narration_audio_url,
                "approved": module.approved
            }
            library_entries.append(entry)
        
        return library_entries
    
    def search_modules(self, query: str, approved_only: bool = True) -> List[ModuleGenerateResponse]:
        """
        Search modules by phoneme, title, or language.
        
        Args:
            query: Search query string
            approved_only: If True, only return approved modules
            
        Returns:
            List of matching modules
        """
        modules = self.get_all_modules(approved_only)
        query_lower = query.lower()
        
        matching_modules = []
        for module in modules:
            if (query_lower in module.phoneme.lower() or
                query_lower in module.title.lower() or
                query_lower in module.language.lower() or
                query_lower in module.age_band.lower()):
                matching_modules.append(module)
        
        return matching_modules
    
    def filter_modules(
        self,
        phoneme: Optional[str] = None,
        age_band: Optional[str] = None,
        language: Optional[str] = None,
        approved_only: bool = True
    ) -> List[ModuleGenerateResponse]:
        """
        Filter modules by various criteria.
        
        Args:
            phoneme: Optional phoneme filter
            age_band: Optional age band filter
            language: Optional language filter
            approved_only: If True, only return approved modules
            
        Returns:
            List of filtered modules
        """
        modules = self.get_all_modules(approved_only)
        
        if phoneme:
            modules = [m for m in modules if m.phoneme == phoneme]
        
        if age_band:
            modules = [m for m in modules if m.age_band == age_band]
        
        if language:
            modules = [m for m in modules if m.language == language]
        
        return modules
    
    def get_statistics(self) -> dict:
        """
        Get storage statistics.
        
        Returns:
            Dictionary with storage statistics
        """
        total_modules = len(self.modules)
        approved_modules = len([m for m in self.modules.values() if m.approved])
        pending_modules = total_modules - approved_modules
        
        # Count by phoneme
        phoneme_counts = {}
        for module in self.modules.values():
            phoneme = module.phoneme
            phoneme_counts[phoneme] = phoneme_counts.get(phoneme, 0) + 1
        
        return {
            "total_modules": total_modules,
            "approved_modules": approved_modules,
            "pending_modules": pending_modules,
            "phoneme_distribution": phoneme_counts
        }


# Global instance
module_storage = ModuleStorage()
