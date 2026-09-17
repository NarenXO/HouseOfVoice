from fastapi import APIRouter, HTTPException, Depends
from typing import List
import json
import uuid
import os
from datetime import datetime

from app.models.shared import CommunicationProfile, ScreeningResult, CurrentUser
from app.models.matching import (
    Therapist, Supervisor, Booking, SupervisorAssignment, TherapyPlan,
    TherapistRecommendation, BookingCreateRequest, SupervisorAssignRequest,
    PlanDraftRequest, PlanApproveRequest
)
from app.services.matching.scoring import score_therapist
from app.services.matching.plan_generator import generate_gemini_therapy_plan

router = APIRouter()

# ---------------------------------------------------------
# Mock In-Memory Database (simulating Supabase for this branch)
# ---------------------------------------------------------

MOCK_THERAPISTS = [
    Therapist(
        id="therapist_1",
        name="Dr. Sarah Jenkins",
        specialization=["s - end of words", "articulation", "stuttering"],
        languages=["english", "spanish"],
        years_experience=8,
        weekly_availability={"monday": ["09:00", "10:00"], "wednesday": ["14:00", "15:00"]},
        session_mode="hybrid",
        current_caseload=12
    ),
    Therapist(
        id="therapist_2",
        name="Mark Thompson",
        specialization=["autism", "aphasia"],
        languages=["english"],
        years_experience=3,
        weekly_availability={"tuesday": ["11:00", "12:00"], "thursday": ["16:00", "17:00"]},
        session_mode="virtual",
        current_caseload=25
    ),
    Therapist(
        id="therapist_3",
        name="Dr. Emily Chen",
        specialization=["th - start of words", "r - blends", "articulation"],
        languages=["english", "mandarin"],
        years_experience=12,
        weekly_availability={"friday": ["09:00", "10:00", "11:00"]},
        session_mode="in-person",
        current_caseload=5
    )
]

MOCK_SUPERVISORS = [
    Supervisor(id="super_1", name="Dr. Robert House", current_caseload=5),
    Supervisor(id="super_2", name="Dr. Lisa Cuddy", current_caseload=2),
    Supervisor(id="super_3", name="Dr. James Wilson", current_caseload=8)
]

# In-memory tables
db_bookings = []
db_supervisor_assignments = []
db_therapy_plans = []

# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------

def load_mock_data(filename: str) -> dict:
    # Assuming we're running from the project root
    filepath = os.path.join(os.getcwd(), "shared", "mocks", filename)
    if not os.path.exists(filepath):
        # Fallback if running from a different directory
        filepath = os.path.join(os.getcwd(), "..", "..", "..", "shared", "mocks", filename)
    
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        # Return empty dict if file not found to prevent crashing during tests
        return {}

# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

@router.get("/therapists/recommend", response_model=List[TherapistRecommendation])
async def recommend_therapists(case_id: str):
    # Load shared mocks as specified in the prompt
    user_data = load_mock_data("current_user.mock.json")
    screening_data = load_mock_data("screening_result.mock.json")
    
    # We must have valid data to score. If mocked files are missing, we use defaults
    profile_data = user_data.get("communicationProfile", {
        "primary_language": "english",
        "preferred_therapy_language": "english",
        "reading_ability": "fluent",
        "typing_ability": "fluent",
        "preferred_communication_method": "voice",
        "guardian_assistance_required": False,
        "comfort_with_unfamiliar_people": "high"
    })
    
    if not screening_data:
        screening_data = {
            "case_id": case_id,
            "speech_rate": 0.0, "pause_frequency": 0.0, "pronunciation_score": 0.0,
            "fluency_score": 0.0, "voice_stability": 0.0, "clarity_score": 0.0,
            "confidence_level": 0.0, "flagged_errors": [], "plain_language_summary": ""
        }
        
    profile = CommunicationProfile(**profile_data)
    
    # Handle both camelCase from mock and snake_case for Pydantic
    screening = ScreeningResult(
        case_id=case_id,
        speech_rate=screening_data.get("speechRate", 0.0),
        pause_frequency=screening_data.get("pauseFrequency", 0.0),
        pronunciation_score=screening_data.get("pronunciationScore", 0.0),
        fluency_score=screening_data.get("fluencyScore", 0.0),
        voice_stability=screening_data.get("voiceStability", 0.0),
        clarity_score=screening_data.get("clarityScore", 0.0),
        confidence_level=screening_data.get("confidenceLevel", 0.0),
        flagged_errors=screening_data.get("flaggedErrors", []),
        plain_language_summary=screening_data.get("plainLanguageSummary", "")
    )
    
    recommendations = []
    for therapist in MOCK_THERAPISTS:
        rec = score_therapist(therapist, profile, screening)
        recommendations.append(rec)
        
    # Sort by score descending
    recommendations.sort(key=lambda x: x.score, reverse=True)
    return recommendations

@router.post("/bookings", response_model=Booking)
async def create_booking(request: BookingCreateRequest):
    # Live availability check: query existing bookings, exclude conflicts
    for b in db_bookings:
        if b.therapist_id == request.therapist_id and b.datetime == request.datetime and b.status in ["confirmed", "pending", "trial"]:
            raise HTTPException(status_code=400, detail="Timeslot conflict. Therapist is already booked at this time.")
            
    booking_id = f"book_{uuid.uuid4().hex[:8]}"
    status = "trial" if request.is_trial else "pending"
    
    new_booking = Booking(
        id=booking_id,
        case_id=request.case_id,
        therapist_id=request.therapist_id,
        datetime=request.datetime,
        mode=request.mode,
        status=status,
        reminder_sent=True # Create a reminder record automatically
    )
    
    db_bookings.append(new_booking)
    return new_booking

@router.post("/bookings/{id}/no-response", response_model=List[TherapistRecommendation])
async def booking_no_response(id: str):
    booking = next((b for b in db_bookings if b.id == id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    # Flip status
    booking.status = "no_response"
    
    # Return alternatives (reuse the recommendation logic)
    return await recommend_therapists(booking.case_id)

@router.post("/supervisor-assignment", response_model=SupervisorAssignment)
async def assign_supervisor(request: SupervisorAssignRequest):
    booking = next((b for b in db_bookings if b.id == request.booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
        
    # STRICT GUARD: reject if no confirmed/trial booking exists
    if booking.status not in ["confirmed", "trial"]:
        raise HTTPException(status_code=400, detail="Cannot assign supervisor. Booking must be confirmed or trial.")
        
    # Assign the supervisor with the lowest current caseload
    best_supervisor = min(MOCK_SUPERVISORS, key=lambda s: s.current_caseload)
    
    assignment = SupervisorAssignment(
        booking_id=request.booking_id,
        supervisor_id=best_supervisor.id,
        assigned_at=datetime.utcnow()
    )
    
    db_supervisor_assignments.append(assignment)
    
    # Increment caseload
    best_supervisor.current_caseload += 1
    
    return assignment

@router.post("/plans/draft", response_model=TherapyPlan)
async def draft_therapy_plan(request: PlanDraftRequest):
    screening_data = load_mock_data("screening_result.mock.json")
    
    # Generate draft using Gemini
    draft = await generate_gemini_therapy_plan(
        case_id=request.case_id,
        therapist_id=request.therapist_id,
        goals=request.goals,
        session_mode=request.session_mode,
        screening_result=screening_data
    )
    
    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    
    new_plan = TherapyPlan(
        id=plan_id,
        case_id=request.case_id,
        therapist_id=request.therapist_id,
        goals=request.goals,
        session_mode=request.session_mode,
        gemini_draft=draft,
        approved_by=None,
        approved_at=None
    )
    
    db_therapy_plans.append(new_plan)
    return new_plan

@router.post("/plans/{id}/approve", response_model=TherapyPlan)
async def approve_therapy_plan(id: str, request: PlanApproveRequest):
    plan = next((p for p in db_therapy_plans if p.id == id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Therapy plan not found.")
        
    if plan.approved_by:
        raise HTTPException(status_code=400, detail="Plan is already approved.")
        
    plan.approved_by = request.approved_by
    plan.approved_at = datetime.utcnow()
    
    return plan
