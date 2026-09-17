"""OWNERSHIP: Sai Pranav. Step 11/11B/11C — live session, smartboard, AI live demo, module library."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from typing import Dict, List, Optional
from datetime import datetime
import json
from app.models.session import (
    DemoGenerateRequest, 
    DemoGenerateResponse,
    ModuleGenerateRequest,
    ModuleGenerateResponse,
    ModuleApproveRequest,
    ModuleLibraryListResponse,
    ClinicalContextResponse,
    ModuleAttachmentCreate,
    ModuleAttachmentResponse,
    SessionEndRequest,
    SessionEndResponse
)
from app.services.session import storyboard_generator, module_storage, mock_loader

router = APIRouter()

# In-memory store for active WebSocket connections per session
active_connections: Dict[str, List[WebSocket]] = {}


@router.get("/ping")
def ping():
    return {"module": "session", "status": "ok"}


# ============================================================
# CLINICAL CONTEXT ENDPOINTS (Phase 7)
# ============================================================

@router.get("/context/{case_id}", response_model=ClinicalContextResponse)
def get_clinical_context(case_id: str):
    """
    Retrieve clinical context for a specific case.
    
    This endpoint loads mock data from screening results, therapy plans,
    and learning paths to provide comprehensive clinical context for
    live therapy sessions.
    """
    try:
        context = mock_loader.get_clinical_context(case_id)
        return ClinicalContextResponse(**context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load clinical context: {str(e)}")


@router.post("/demo/generate", response_model=DemoGenerateResponse)
def generate_demo(request: DemoGenerateRequest):
    """
    Generate a procedural animation storyboard for speech articulation demo.
    
    This endpoint creates a 5-15 second animated demonstration for a specific phoneme,
    with narrated steps and validated SVG assets. The demo is generated using the
    storyboard service with Gemini API integration and fallback to mock data.
    """
    try:
        # Validate request
        if not storyboard_generator.validate_request(request):
            raise HTTPException(status_code=400, detail="Invalid demo generation request")
        
        # Generate storyboard
        response = storyboard_generator.generate_storyboard(request)
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate demo: {str(e)}")


# ============================================================
# MODULE LIBRARY ENDPOINTS (Phase 6)
# ============================================================

@router.post("/modules/generate", response_model=ModuleGenerateResponse)
def generate_module(request: ModuleGenerateRequest):
    """
    Generate a 30-second procedural animation module for speech therapy.
    
    This endpoint creates a comprehensive training module with 6-10 scenes,
    transitions, and narration. Modules require approval before being available
    in the library. Uses Gemini API with asset validation and fallback to mock data.
    """
    try:
        # Validate request
        if not storyboard_generator.validate_module_request(request):
            raise HTTPException(status_code=400, detail="Invalid module generation request")
        
        # Generate module storyboard
        module_response = storyboard_generator.generate_module(request)
        
        # Save to storage
        saved_module = module_storage.save_module(module_response)
        
        return saved_module
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate module: {str(e)}")


@router.post("/modules/{module_id}/approve", response_model=ModuleGenerateResponse)
def approve_module(module_id: str, approval_request: ModuleApproveRequest):
    """
    Approve or reject a generated module.
    
    This endpoint handles the approval workflow for modules. Only approved modules
    are visible in the public library. Therapists can review and approve modules
    generated during sessions or by library admins.
    """
    try:
        updated_module = module_storage.approve_module(module_id, approval_request)
        
        if not updated_module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        return updated_module
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve module: {str(e)}")


@router.get("/modules", response_model=ModuleLibraryListResponse)
def get_modules(
    phoneme: Optional[str] = Query(None, description="Filter by phoneme"),
    age_band: Optional[str] = Query(None, description="Filter by age band"),
    language: Optional[str] = Query(None, description="Filter by language"),
    search: Optional[str] = Query(None, description="Search query"),
    approved_only: bool = Query(True, description="Only return approved modules"),
    cached: bool = Query(False, description="Return cached data indicator")
):
    """
    Retrieve therapy modules from the library.
    
    This endpoint returns modules with filtering and search capabilities.
    Only approved modules are returned by default. The response matches the
    frozen ModuleLibraryEntry contract shape exactly.
    """
    try:
        # First get the filtered modules based on criteria
        if search:
            modules = module_storage.search_modules(search, approved_only)
        elif phoneme or age_band or language:
            modules = module_storage.filter_modules(
                phoneme=phoneme,
                age_band=age_band,
                language=language,
                approved_only=approved_only
            )
        else:
            modules = module_storage.get_all_modules(approved_only)
        
        # Convert filtered modules to library entry format (frozen contract)
        # IMPORTANT: Must use camelCase field names to match frontend shared contract
        library_entries = []
        for module in modules:
            entry = {
                "id": module.id,
                "phoneme": module.phoneme,
                "ageBand": module.age_band,  # camelCase for contract compliance
                "language": module.language,
                "title": module.title,
                "durationSeconds": int(module.total_duration_ms / 1000),  # camelCase for contract compliance
                "narrationAudioUrl": module.narration_audio_url,  # camelCase for contract compliance
                "approved": module.approved
            }
            library_entries.append(entry)
        
        return ModuleLibraryListResponse(
            modules=library_entries,
            total=len(library_entries),
            cached=cached
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve modules: {str(e)}")


@router.get("/modules/{module_id}", response_model=ModuleGenerateResponse)
def get_module(module_id: str):
    """
    Retrieve a specific module by ID.
    
    This endpoint returns the full module details including all scenes,
    narration, and approval status. Used for module playback and review.
    """
    try:
        module = module_storage.get_module(module_id)
        
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        return module
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve module: {str(e)}")


@router.delete("/modules/{module_id}")
def delete_module(module_id: str):
    """
    Delete a module from storage.
    
    This endpoint permanently removes a module. Only available for
    unapproved modules or for admin users.
    """
    try:
        success = module_storage.delete_module(module_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Module not found")
        
        return {"message": "Module deleted successfully", "module_id": module_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete module: {str(e)}")


@router.post("/modules/attach", response_model=ModuleAttachmentResponse)
def attach_module_to_milestone(attachment: ModuleAttachmentCreate):
    """
    Attach a generated demo/module to a milestone.
    
    This endpoint simulates linking a generated demo or module to
    Sameer's milestone ID for learning path integration.
    """
    try:
        # In production, this would update the milestone in the learning path
        # For now, we simulate the attachment and return success
        
        attachment_id = f"att_{datetime.utcnow().timestamp()}"
        
        # Update the module if it exists
        if attachment.module_id:
            module = module_storage.get_module(attachment.module_id)
            if module:
                # In production, this would update the milestone link
                # For now, we just acknowledge the attachment
                pass
        
        return ModuleAttachmentResponse(
            success=True,
            linked_at=datetime.utcnow().isoformat(),
            attachment_id=attachment_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to attach module: {str(e)}")


@router.post("/end-session", response_model=SessionEndResponse)
def end_session(session_data: SessionEndRequest):
    """
    End a therapy session and export the session record.
    
    This endpoint compiles a valid SessionRecord shape for Sanjeevi's
    SOAP notes documentation and exports the session summary.
    """
    try:
        # Generate session record following the frozen contract
        # Note: Backend uses snake_case (Python convention), frontend expects camelCase
        # The actual SessionRecord frozen contract in shared.py uses snake_case
        session_record = {
            "session_id": f"session_{datetime.utcnow().timestamp()}",
            "case_id": session_data.case_id,
            "therapist_id": session_data.therapist_id,
            "activities_completed": [f"Demo: {demo}" for demo in session_data.demos_generated] + 
                                  [f"Module: {module}" for module in session_data.modules_used],
            "homework_assigned": ["Practice assigned based on session activities"],
            "clinical_observations": f"Session completed with {len(session_data.demos_generated)} demos and {len(session_data.modules_used)} modules. Parent {'present' if session_data.parent_present else 'absent'}. Mode: {'Low-bandwidth' if session_data.low_bandwidth_mode else 'Full-featured'}."
        }
        
        # Generate SOAP notes summary
        summary_for_soap = {
            "session_id": session_record["session_id"],
            "case_id": session_data.case_id,
            "therapist_id": session_data.therapist_id,
            "session_duration": f"{session_data.session_duration_seconds // 60} minutes",
            "parent_attendance": "Present" if session_data.parent_present else "Absent",
            "activities_completed": {
                "smartboard_snapshots": len(session_data.snapshots),
                "demos_generated": len(session_data.demos_generated),
                "modules_used": len(session_data.modules_used)
            },
            "clinical_notes": f"Session completed with {len(session_data.demos_generated)} demos and {len(session_data.modules_used)} modules. Parent {'present' if session_data.parent_present else 'absent'}.",
            "mode": "Low-bandwidth" if session_data.low_bandwidth_mode else "Full-featured"
        }
        
        # In production, this would save to database and export to shared/mocks/session_record.mock.json
        # For now, we return the compiled data
        
        return SessionEndResponse(
            status="completed",
            session_record=session_record,
            summary_for_soap=summary_for_soap
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


@router.websocket("/ws/board/{session_id}")
async def websocket_board_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Add connection to the session room
    if session_id not in active_connections:
        active_connections[session_id] = []
    active_connections[session_id].append(websocket)
    
    try:
        while True:
            # Wait for incoming message
            data = await websocket.receive_text()
            
            # Parse JSON and broadcast to other clients in the same session
            try:
                message_data = json.loads(data)
                
                # Broadcast to all other connections in this session (excluding sender)
                if session_id in active_connections:
                    for connection in active_connections[session_id]:
                        if connection != websocket:
                            try:
                                await connection.send_text(data)
                            except Exception:
                                # Connection might be dead, will be cleaned up on disconnect
                                pass
            except json.JSONDecodeError:
                # If not valid JSON, just echo as-is
                if session_id in active_connections:
                    for connection in active_connections[session_id]:
                        if connection != websocket:
                            try:
                                await connection.send_text(data)
                            except Exception:
                                pass
                                
    except WebSocketDisconnect:
        # Remove connection from the session room
        if session_id in active_connections:
            active_connections[session_id].remove(websocket)
            
            # Clean up empty session entries
            if not active_connections[session_id]:
                del active_connections[session_id]
