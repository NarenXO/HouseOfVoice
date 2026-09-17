"""
REAL END-TO-END INTEGRATION TEST FOR AUTH OPERATIONS
This script tests 100% real Supabase operations - NO MOCKS, NO SIMULATIONS
"""
import requests
import json
import time
from supabase import create_client
from app.core.config import settings

# Initialize Supabase client for direct DB verification
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

BASE_URL = "http://localhost:8000/api/auth"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_register_user():
    print_section("STEP 1: REGISTER REAL USER")
    
    # Generate unique email for this test
    timestamp = int(time.time())
    test_email = f"real_patient_test_{timestamp}@houseofvoice.io"
    
    register_data = {
        "email": test_email,
        "password": "test123456",
        "role": "patient",
        "name": "Real Test Patient",
        "dob": "2016-04-12",
        "gender": "male",
        "contact_info": {"phone": "+1234567890"}
    }
    
    print(f"Registering user with email: {test_email}")
    print(f"Request payload: {json.dumps(register_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/register", json=register_data)
    
    print(f"HTTP Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        user_id = response.json()["user_id"]
        print(f"[SUCCESS] User registered successfully with ID: {user_id}")
        return user_id, test_email
    else:
        print(f"[FAILED] Registration failed")
        return None, None

def test_communication_profile(user_id):
    print_section("STEP 2: SAVE COMMUNICATION PROFILE")
    
    profile_data = {
        "user_id": user_id,
        "profile": {
            "primary_language": "English",
            "secondary_language": "Spanish",
            "preferred_therapy_language": "English",
            "reading_ability": "developing",
            "typing_ability": "none",
            "preferred_communication_method": "voice",
            "guardian_assistance_required": True,
            "comfort_with_unfamiliar_people": "medium"
        }
    }
    
    print(f"Saving communication profile for user: {user_id}")
    print(f"Request payload: {json.dumps(profile_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/onboarding/communication-profile", json=profile_data)
    
    print(f"HTTP Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"[SUCCESS] Communication profile saved successfully")
        return True
    else:
        print(f"[FAILED] Communication profile save failed")
        return False

def test_patient_intake(user_id):
    print_section("STEP 3: SAVE PATIENT INTAKE")
    
    intake_data = {
        "user_id": user_id,
        "primary_concern": "Stuttering on s sound",
        "medical_history": "None",
        "prior_therapy": "None",
        "medications": "None",
        "therapy_goals": "Clear articulation at school",
        "daily_challenges": {
            "school": True,
            "public_speaking": True
        }
    }
    
    print(f"Saving patient intake for user: {user_id}")
    print(f"Request payload: {json.dumps(intake_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/intake", json=intake_data)
    
    print(f"HTTP Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        intake_id = response.json()["intake_id"]
        print(f"[SUCCESS] Patient intake saved successfully with ID: {intake_id}")
        return True
    else:
        print(f"[FAILED] Patient intake save failed")
        return False

def test_baseline_consent(user_id):
    print_section("STEP 4: SAVE BASELINE CONSENT")
    
    consent_data = {
        "user_id": user_id,
        "recording_consent": True,
        "supervisor_presence_consent": True
    }
    
    print(f"Saving baseline consent for user: {user_id}")
    print(f"Request payload: {json.dumps(consent_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/baseline-consent", json=consent_data)
    
    print(f"HTTP Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"[SUCCESS] Baseline consent saved successfully")
        return True
    else:
        print(f"[FAILED] Baseline consent save failed")
        return False

def verify_supabase_data(user_id, test_email):
    print_section("STEP 5: VERIFY SUPABASE DATABASE RECORDS")
    
    # Query profiles table
    print("Querying profiles table...")
    profile_result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    print(f"Profiles query result: {json.dumps(profile_result.data, indent=2)}")
    
    # Query communication_profiles table
    print("\nQuerying communication_profiles table...")
    comm_profile_result = supabase.table("communication_profiles").select("*").eq("user_id", user_id).execute()
    print(f"Communication profiles query result: {json.dumps(comm_profile_result.data, indent=2)}")
    
    # Query intake_forms table
    print("\nQuerying intake_forms table...")
    intake_result = supabase.table("intake_forms").select("*").eq("user_id", user_id).execute()
    print(f"Intake forms query result: {json.dumps(intake_result.data, indent=2)}")
    
    # Query consents table
    print("\nQuerying consents table...")
    consent_result = supabase.table("consents").select("*").eq("user_id", user_id).execute()
    print(f"Consents query result: {json.dumps(consent_result.data, indent=2)}")
    
    # Verify all records exist
    success = True
    if not profile_result.data:
        print("[FAILED] No profile found in Supabase")
        success = False
    else:
        print(f"[SUCCESS] Profile found: {profile_result.data[0]['name']}")
    
    if not comm_profile_result.data:
        print("[FAILED] No communication profile found in Supabase")
        success = False
    else:
        print(f"[SUCCESS] Communication profile found: {comm_profile_result.data[0]['primary_language']}")
    
    if not intake_result.data:
        print("[FAILED] No intake form found in Supabase")
        success = False
    else:
        print(f"[SUCCESS] Intake form found: {intake_result.data[0]['primary_concern']}")
    
    if not consent_result.data:
        print("[FAILED] No consent found in Supabase")
        success = False
    else:
        print(f"[SUCCESS] Consent found: recording_consent={consent_result.data[0]['recording_consent']}")
    
    return success

def cleanup_test_user(user_id):
    print_section("CLEANUP: DELETE TEST USER")
    
    try:
        # Delete from profiles (this should cascade to other tables)
        supabase.table("profiles").delete().eq("id", user_id).execute()
        print(f"[SUCCESS] Test user {user_id} deleted from Supabase")
    except Exception as e:
        print(f"[WARNING] Cleanup failed (may be due to foreign key constraints): {e}")

def main():
    print_section("REAL-DATA INTEGRATION TEST - NO MOCKS, NO SIMULATIONS")
    print("This test performs 100% real Supabase operations")
    print(f"Supabase URL: {settings.SUPABASE_URL}")
    print(f"USE_MOCKS setting: {settings.USE_MOCKS}")
    
    if settings.USE_MOCKS:
        print("\n[CRITICAL ERROR] USE_MOCKS is set to True!")
        print("All tests should use real Supabase operations.")
        return
    
    user_id = None
    test_email = None
    
    try:
        # Step 1: Register user
        user_id, test_email = test_register_user()
        if not user_id:
            return
        
        # Step 2: Communication profile
        if not test_communication_profile(user_id):
            return
        
        # Step 3: Patient intake
        if not test_patient_intake(user_id):
            return
        
        # Step 4: Baseline consent
        if not test_baseline_consent(user_id):
            return
        
        # Step 5: Verify Supabase data
        if verify_supabase_data(user_id, test_email):
            print_section("[SUCCESS] ALL TESTS PASSED - REAL DATA VERIFIED")
            print("All operations performed 100% real Supabase database operations")
            print("No mocks, no simulations, no fake values detected")
        else:
            print_section("[FAILED] VERIFICATION FAILED")
            print("Some data was not persisted to Supabase correctly")
    
    except Exception as e:
        print(f"\n[FAILED] TEST FAILED WITH ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if user_id:
            cleanup_test_user(user_id)

if __name__ == "__main__":
    main()