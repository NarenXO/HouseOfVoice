"""
Automated Backend Contract Test Suite for Session API (Phase 8)

This test suite verifies all 8 session endpoints and WebSocket contracts
for Steps 11, 11B, and 11C compliance with frozen schemas.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from typing import Dict, Any

client = TestClient(app)


class TestSessionAPIContracts:
    """Test suite for session API endpoint contracts and behavior."""

    def test_1_context_endpoint_returns_clinical_data(self):
        """Test GET /api/session/context/case_101 returns clinical context."""
        response = client.get("/api/session/context/case_demo_001")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "case_id" in data, "Missing case_id"
        assert "patient_name" in data, "Missing patient_name"
        assert "target_phonemes" in data, "Missing target_phonemes"
        assert "weekly_goals" in data, "Missing weekly_goals"
        assert "milestones" in data, "Missing milestones"
        assert "severity" in data, "Missing severity"
        assert "articulation_score" in data, "Missing articulation_score"
        
        # Verify target phonemes format
        assert isinstance(data["target_phonemes"], list), "target_phonemes should be a list"
        assert len(data["target_phonemes"]) > 0, "target_phonemes should not be empty"
        
        # Verify at least one expected phoneme is present
        expected_phonemes = ["/r/", "/s/", "/th/"]
        found_phonemes = [p for p in expected_phonemes if p in data["target_phonemes"]]
        assert len(found_phonemes) > 0, f"Expected at least one of {expected_phonemes} in target_phonemes"
        
        # Verify weekly goals
        assert isinstance(data["weekly_goals"], list), "weekly_goals should be a list"
        assert len(data["weekly_goals"]) > 0, "weekly_goals should not be empty"
        
        # Verify milestones
        assert isinstance(data["milestones"], list), "milestones should be a list"
        assert len(data["milestones"]) > 0, "milestones should not be empty"
        
        # Verify severity is one of expected values
        assert data["severity"] in ["mild", "moderate", "severe"], f"Invalid severity: {data['severity']}"
        
        # Verify articulation score is between 0 and 1
        assert 0 <= data["articulation_score"] <= 1, f"Invalid articulation_score: {data['articulation_score']}"

    def test_2_demo_generate_endpoint(self):
        """Test POST /api/session/demo/generate (11B) returns valid demo."""
        payload = {
            "phoneme": "/r/",
            "word": "rabbit",
            "age_band": "child-6-8",
            "reading_ability": "early-reader",
            "language": "en-US"
        }
        
        response = client.post("/api/session/demo/generate", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "id" in data, "Missing id"
        assert "phoneme" in data, "Missing phoneme"
        assert "total_duration_ms" in data, "Missing total_duration_ms"
        assert "steps" in data, "Missing steps"
        assert "created_at" in data, "Missing created_at"
        
        # Verify phoneme matches request
        assert data["phoneme"] == "/r/", f"Expected phoneme /r/, got {data['phoneme']}"
        
        # Verify duration is within expected range (5-15 seconds)
        assert 5000 <= data["total_duration_ms"] <= 15000, \
            f"Duration {data['total_duration_ms']}ms outside expected range 5000-15000ms"
        
        # Verify steps exist and have valid structure
        assert isinstance(data["steps"], list), "steps should be a list"
        assert len(data["steps"]) > 0, "steps should not be empty"
        
        # Verify each step has required fields
        for step in data["steps"]:
            assert "step_number" in step, "Missing step_number"
            assert "duration_ms" in step, "Missing duration_ms"
            assert "asset_ids" in step, "Missing asset_ids"
            assert "narration_text" in step, "Missing narration_text"
            assert "articulatory_cue" in step, "Missing articulatory_cue"
            
            # Verify asset_ids is a list
            assert isinstance(step["asset_ids"], list), "asset_ids should be a list"
            
            # Verify asset_ids are valid (non-empty strings)
            for asset_id in step["asset_ids"]:
                assert isinstance(asset_id, str), f"asset_id {asset_id} should be a string"
                assert len(asset_id) > 0, f"asset_id should not be empty"

    def test_3_module_generate_endpoint(self):
        """Test POST /api/session/modules/generate (11C) returns valid module."""
        payload = {
            "phoneme": "/s/",
            "age_band": "child-6-8",
            "language": "en-US",
            "source": "library-admin"
        }
        
        response = client.post("/api/session/modules/generate", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "id" in data, "Missing id"
        assert "phoneme" in data, "Missing phoneme"
        assert "title" in data, "Missing title"
        assert "total_duration_ms" in data, "Missing total_duration_ms"
        assert "scenes" in data, "Missing scenes"
        assert "approved" in data, "Missing approved"
        assert "created_at" in data, "Missing created_at"
        
        # Verify phoneme matches request
        assert data["phoneme"] == "/s/", f"Expected phoneme /s/, got {data['phoneme']}"
        
        # Verify module is not approved by default
        assert data["approved"] == False, f"Module should not be approved by default, got {data['approved']}"
        
        # Verify duration is approximately 30 seconds (25-35 seconds range)
        assert 25000 <= data["total_duration_ms"] <= 35000, \
            f"Duration {data['total_duration_ms']}ms outside expected range 25000-35000ms"
        
        # Verify scenes exist and are within expected range (6-10 scenes)
        assert isinstance(data["scenes"], list), "scenes should be a list"
        assert 6 <= len(data["scenes"]) <= 10, \
            f"Expected 6-10 scenes, got {len(data['scenes'])}"
        
        # Verify each scene has required fields
        for scene in data["scenes"]:
            assert "scene_number" in scene, "Missing scene_number"
            assert "duration_ms" in scene, "Missing duration_ms"
            assert "asset_ids" in scene, "Missing asset_ids"
            assert "narration_text" in scene, "Missing narration_text"
            assert "articulatory_cue" in scene, "Missing articulatory_cue"
            assert "transition_type" in scene, "Missing transition_type"
            
            # Verify asset_ids is a list
            assert isinstance(scene["asset_ids"], list), "asset_ids should be a list"

    def test_4_module_approve_endpoint(self):
        """Test POST /api/session/modules/{id}/approve sets approved status."""
        # First generate a module
        generate_payload = {
            "phoneme": "/th/",
            "age_band": "child-6-8",
            "language": "en-US",
            "source": "mid-session"
        }
        
        generate_response = client.post("/api/session/modules/generate", json=generate_payload)
        assert generate_response.status_code == 200
        module_data = generate_response.json()
        module_id = module_data["id"]
        
        # Verify initial approval status
        assert module_data["approved"] == False, "Module should start unapproved"
        
        # Approve the module
        approve_payload = {
            "approved": True,
            "approved_by": "test_therapist"
        }
        
        approve_response = client.post(f"/api/session/modules/{module_id}/approve", json=approve_payload)
        
        assert approve_response.status_code == 200, f"Expected 200, got {approve_response.status_code}"
        
        approved_data = approve_response.json()
        
        # Verify approval status changed
        assert approved_data["approved"] == True, f"Module should be approved, got {approved_data['approved']}"
        assert approved_data["approved_by"] == "test_therapist", f"Expected approved_by test_therapist, got {approved_data['approved_by']}"
        assert "approved_at" in approved_data, "Missing approved_at timestamp"

    def test_5_modules_list_endpoint_contract_compliance(self):
        """Test GET /api/session/modules matches frozen ModuleLibraryEntry schema."""
        # First generate and approve a module for testing
        generate_payload = {
            "phoneme": "/b/",
            "age_band": "child-6-8",
            "language": "en-US",
            "source": "library-admin"
        }
        
        generate_response = client.post("/api/session/modules/generate", json=generate_payload)
        assert generate_response.status_code == 200
        module_data = generate_response.json()
        module_id = module_data["id"]
        
        # Approve the module
        approve_payload = {"approved": True, "approved_by": "test_therapist"}
        client.post(f"/api/session/modules/{module_id}/approve", json=approve_payload)
        
        # Get modules list
        response = client.get("/api/session/modules")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "modules" in data, "Missing modules field"
        assert "total" in data, "Missing total field"
        assert isinstance(data["modules"], list), "modules should be a list"
        
        # Verify each module matches frozen ModuleLibraryEntry schema
        for module in data["modules"]:
            # Verify exact field names and types from frozen contract (camelCase)
            assert "id" in module and isinstance(module["id"], str), "Missing or invalid id field"
            assert "phoneme" in module and isinstance(module["phoneme"], str), "Missing or invalid phoneme field"
            assert "ageBand" in module and isinstance(module["ageBand"], str), "Missing or invalid ageBand field (camelCase required)"
            assert "language" in module and isinstance(module["language"], str), "Missing or invalid language field"
            assert "title" in module and isinstance(module["title"], str), "Missing or invalid title field"
            assert "durationSeconds" in module and isinstance(module["durationSeconds"], int), "Missing or invalid durationSeconds field (camelCase required, int type)"
            assert "narrationAudioUrl" in module, "Missing narrationAudioUrl field (camelCase required)"
            assert module["narrationAudioUrl"] is None or isinstance(module["narrationAudioUrl"], str), "narrationAudioUrl should be null or string"
            assert "approved" in module and isinstance(module["approved"], bool), "Missing or invalid approved field"
            
            # Verify unapproved modules are NOT present in the list
            assert module["approved"] == True, f"Unapproved module {module['id']} should not be in the list"

    def test_6_module_attach_endpoint(self):
        """Test POST /api/session/modules/attach attaches module to milestone."""
        payload = {
            "module_id": "test_module_123",
            "milestone_id": "m1",
            "session_id": "test_session_456"
        }
        
        response = client.post("/api/session/modules/attach", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Missing success field"
        assert "linked_at" in data, "Missing linked_at field"
        assert "attachment_id" in data, "Missing attachment_id field"
        
        # Verify success
        assert data["success"] == True, f"Expected success=True, got {data['success']}"
        assert isinstance(data["linked_at"], str), "linked_at should be a string (ISO timestamp)"
        assert isinstance(data["attachment_id"], str), "attachment_id should be a string"

    def test_7_end_session_endpoint(self):
        """Test POST /api/session/end-session returns valid SessionRecord."""
        payload = {
            "case_id": "case_demo_001",
            "therapist_id": "thr_demo_001",
            "session_id": "test_session_final",
            "parent_present": True,
            "low_bandwidth_mode": False,
            "snapshots": ["snapshot1", "snapshot2"],
            "demos_generated": ["demo1", "demo2"],
            "modules_used": ["module1"],
            "session_duration_seconds": 300
        }
        
        response = client.post("/api/session/end-session", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "status" in data, "Missing status field"
        assert "session_record" in data, "Missing session_record field"
        assert "summary_for_soap" in data, "Missing summary_for_soap field"
        
        # Verify status
        assert data["status"] == "completed", f"Expected status=completed, got {data['status']}"
        
        # Verify SessionRecord structure (follows frozen shared.py contract)
        session_record = data["session_record"]
        assert "session_id" in session_record, "Missing session_record.session_id"
        assert "case_id" in session_record, "Missing session_record.case_id"
        assert "therapist_id" in session_record, "Missing session_record.therapist_id"
        assert "activities_completed" in session_record, "Missing session_record.activities_completed"
        assert "homework_assigned" in session_record, "Missing session_record.homework_assigned"
        assert "clinical_observations" in session_record, "Missing session_record.clinical_observations"
        
        # Verify values match request
        assert session_record["case_id"] == "case_demo_001"
        assert session_record["therapist_id"] == "thr_demo_001"
        assert isinstance(session_record["activities_completed"], list)
        assert isinstance(session_record["homework_assigned"], list)
        assert isinstance(session_record["clinical_observations"], str)
        
        # Verify SOAP summary structure
        soap_summary = data["summary_for_soap"]
        assert "session_id" in soap_summary, "Missing summary.session_id"
        assert "case_id" in soap_summary, "Missing summary.case_id"
        assert "therapist_id" in soap_summary, "Missing summary.therapist_id"
        assert "session_duration" in soap_summary, "Missing summary.session_duration"
        assert "parent_attendance" in soap_summary, "Missing summary.parent_attendance"
        assert "activities_completed" in soap_summary, "Missing summary.activities_completed"
        assert "clinical_notes" in soap_summary, "Missing summary.clinical_notes"
        assert "mode" in soap_summary, "Missing summary.mode"

    def test_8_ping_endpoint(self):
        """Test GET /api/session/ping endpoint."""
        response = client.get("/api/session/ping")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "module" in data, "Missing module field"
        assert "status" in data, "Missing status field"
        assert data["module"] == "session", f"Expected module=session, got {data['module']}"
        assert data["status"] == "ok", f"Expected status=ok, got {data['status']}"


class TestWebSocketContract:
    """Test WebSocket endpoint availability and basic contract."""
    
    def test_websocket_endpoint_exists(self):
        """Test that WebSocket endpoint is registered."""
        # Check that the app has the websocket route registered
        routes = [route.path for route in app.routes]
        
        # The websocket route should be registered
        ws_route = "/api/session/ws/board/{session_id}"
        assert ws_route in routes, f"WebSocket route {ws_route} not found in registered routes"


class TestFrozenContractCompliance:
    """Test compliance with frozen shared contracts."""
    
    def test_module_library_entry_schema_compliance(self):
        """Verify GET /api/session/modules output matches frozen ModuleLibraryEntry schema."""
        response = client.get("/api/session/modules")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify camelCase field naming compliance with frontend shared contract
        for module in data["modules"]:
            # Must use camelCase to match frontend/src/shared/types.ts ModuleLibraryEntry
            expected_fields = ["id", "phoneme", "ageBand", "language", "title", "durationSeconds", "narrationAudioUrl", "approved"]
            for field in expected_fields:
                assert field in module, f"Required field {field} missing from module (camelCase required for contract compliance)"
            
            # Verify NO snake_case fields are present (common backend mistake)
            forbidden_fields = ["age_band", "duration_seconds", "narration_audio_url"]
            for field in forbidden_fields:
                assert field not in module, f"Forbidden snake_case field {field} found (must use camelCase)"
    
    def test_session_record_schema_compliance(self):
        """Verify POST /api/session/end-session output matches frozen SessionRecord schema."""
        payload = {
            "case_id": "case_demo_001",
            "therapist_id": "thr_demo_001",
            "session_id": "contract_test",
            "parent_present": True,
            "low_bandwidth_mode": False,
            "snapshots": [],
            "demos_generated": [],
            "modules_used": [],
            "session_duration_seconds": 60
        }
        
        response = client.post("/api/session/end-session", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        session_record = data["session_record"]
        
        # Verify SessionRecord structure matches frozen shared.py contract (snake_case)
        expected_fields = ["session_id", "case_id", "therapist_id", "activities_completed", "homework_assigned", "clinical_observations"]
        for field in expected_fields:
            assert field in session_record, f"Required field {field} missing from SessionRecord"


if __name__ == "__main__":
    # Run tests directly
    print("Running Session API Contract Tests...")
    pytest.main([__file__, "-v", "--tb=short"])