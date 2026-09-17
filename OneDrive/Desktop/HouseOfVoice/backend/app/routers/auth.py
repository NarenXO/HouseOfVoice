"""Naren's auth router — stub. Build out in Phase 2-5."""
from fastapi import APIRouter, HTTPException
from app.models.auth import (
    RegisterRequest, RegisterResponse, UserRole,
    CommunicationProfileRequest, IntakeFormRequest, ConsentFormRequest
)
from app.core.supabase_client import get_supabase_admin
from datetime import datetime

router = APIRouter()

@router.get("/ping")
async def ping():
    return {"message": "auth service alive"}

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    supabase = get_supabase_admin()
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True
        })
        
        user_id = auth_response.user.id
        
        # Insert into profiles table
        profile_data = {
            "id": user_id,
            "role": request.role.value,
            "name": request.name,
            "dob": request.dob.isoformat() if request.dob else None,
            "gender": request.gender,
            "contact_info": request.contact_info
        }
        
        supabase.table("profiles").insert(profile_data).execute()
        
        child_id = None
        
        # Handle guardian child information (store in guardian's contact_info for now)
        if request.role == UserRole.GUARDIAN and request.child_name:
            child_info = {
                "child_name": request.child_name,
                "child_dob": request.child_dob.isoformat() if request.child_dob else None,
                "child_gender": request.child_gender
            }
            profile_data["contact_info"]["child_info"] = child_info
            child_id = "child_info_stored"  # Placeholder to indicate child info was stored
        
        # Handle therapist/supervisor profile creation
        if request.role in [UserRole.THERAPIST, UserRole.SUPERVISOR]:
            therapist_profile_data = {
                "user_id": user_id,
                "specialization": request.specialization,
                "languages": request.languages or [],
                "years_experience": request.years_experience or 0,
                "weekly_availability": request.weekly_availability or {},
                "session_mode": request.session_mode.value if request.session_mode else "online",
                "verification_status": request.verification_status.value if request.verification_status else "Self Declared"
            }
            
            supabase.table("therapist_profiles").insert(therapist_profile_data).execute()
        
        return RegisterResponse(
            user_id=user_id,
            role=request.role,
            email=request.email,
            name=request.name,
            message="Registration successful",
            child_id=child_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/onboarding/communication-profile")
async def communication_profile(request: CommunicationProfileRequest):
    supabase = get_supabase_admin()
    
    try:
        profile_data = {
            "user_id": request.user_id,
            "primary_language": request.profile.primary_language,
            "secondary_language": request.profile.secondary_language,
            "preferred_therapy_language": request.profile.preferred_therapy_language,
            "reading_ability": request.profile.reading_ability.value,
            "typing_ability": request.profile.typing_ability.value,
            "preferred_communication_method": request.profile.preferred_communication_method.value,
            "guardian_assistance_required": request.profile.guardian_assistance_required,
            "comfort_with_unfamiliar_people": request.profile.comfort_with_unfamiliar_people.value
        }
        
        # Upsert communication profile
        supabase.table("communication_profiles").upsert(profile_data).execute()
        
        return {
            "status": "success",
            "user_id": request.user_id,
            "communication_profile": profile_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Communication profile update failed: {str(e)}")

@router.post("/intake")
async def intake(request: IntakeFormRequest):
    supabase = get_supabase_admin()
    
    try:
        intake_data = {
            "user_id": request.user_id,
            "primary_concern": request.primary_concern,
            "medical_history": request.medical_history,
            "prior_therapy": request.prior_therapy,
            "medications": request.medications,
            "therapy_goals": request.therapy_goals,
            "daily_challenges": request.daily_challenges
        }
        
        result = supabase.table("intake_forms").insert(intake_data).execute()
        intake_id = result.data[0]["id"]
        
        return {
            "status": "success",
            "intake_id": str(intake_id)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Intake form submission failed: {str(e)}")

@router.post("/baseline-consent")
async def baseline_consent(request: ConsentFormRequest):
    supabase = get_supabase_admin()
    
    try:
        consent_data = {
            "user_id": request.user_id,
            "recording_consent": request.recording_consent,
            "supervisor_presence_consent": request.supervisor_presence_consent,
            "accepted_at": request.accepted_at or datetime.utcnow().isoformat(),
            "declined_reason": request.declined_reason
        }
        
        supabase.table("consents").insert(consent_data).execute()
        
        return {
            "status": "success",
            "recording_consent": request.recording_consent
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Consent submission failed: {str(e)}")
