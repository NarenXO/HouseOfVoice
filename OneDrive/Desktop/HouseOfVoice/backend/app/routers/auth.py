"""Naren's auth router — stub. Build out in Phase 2-5."""
from fastapi import APIRouter, HTTPException
from app.models.auth import RegisterRequest, RegisterResponse, UserRole
from app.core.supabase_client import get_supabase_admin

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
