# Demo Script - Naren's Auth & Onboarding Slice

## 60-Second Pitch Script

**"Welcome to HouseOfVoice. Speech therapy starts with understanding the WHOLE communicator, not just diagnosing a deficit."**

### Step 1: Role-Adaptive Registration (10 seconds)
- "First, users select their role - Patient, Guardian, Therapist, or Supervisor."
- "Each role gets a tailored registration form with role-specific fields."
- "For patients, we capture basic info like name, DOB, and contact details."

### Step 2: Communication Profile - The Core Innovation (20 seconds)
- "This is where HouseOfVoice stands out. We capture the complete communication profile."
- "Users select their primary and preferred therapy languages - this immediately adapts the entire app interface to their language preference."
- "We assess reading and typing abilities with visual selectors - Pre-reader, Developing, or Fluent."
- "Users choose their preferred communication method - Voice, Text, or Images/AAC."
- "We also understand comfort levels with unfamiliar people and whether guardian assistance is needed."
- "This holistic profile enables truly personalized therapy experiences."

### Step 3: Structured Patient Intake (15 seconds)
- "Next, we capture the clinical intake with structured fields."
- "Primary communication concerns, medical history, prior therapy experience."
- "Therapy goals and daily communication challenges."
- "The challenges checklist covers real-world scenarios like school, public speaking, phone calls, and social situations."

### Step 4: Transparent Consent Gate (15 seconds)
- "Finally, we have a transparent, plain-language consent screen."
- "Clear explanations for audio recording consent - used for AI speech analysis and progress tracking."
- "Supervisor presence consent for quality assurance."
- "Users can accept or decline with optional reasons, and we make it clear that declining still allows therapy with manual notes."
- "All consent decisions are timestamped and can be changed later in settings."

### Closing (5 seconds)
- "In just 4 steps, we've created a comprehensive profile that enables personalized, accessible speech therapy for every communicator."

---

## Integration Captain Merge Order Checklist

### Merge Sequence
1. **Merge 1:** `feature/naren-auth` ✅ (Base branch - already main)
2. **Merge 2:** `feature/salman-screening` 
3. **Merge 3:** `feature/kavya-matching`
4. **Merge 4:** `feature/sameer-learning`
5. **Merge 5:** `feature/saipranav-session`
6. **Merge 6:** `feature/sanjeevi-docs`

### Post-Merge Integration Steps

#### Backend Integration (`backend/app/main.py`)
1. Uncomment the teammate router imports:
   ```python
   from app.routers.screening import router as screening_router
   from app.routers.matching import router as matching_router
   from app.routers.learning import router as learning_router
   from app.routers.session import router as session_router
   from app.routers.docs import router as docs_router
   ```

2. Uncomment the router mounts:
   ```python
   app.include_router(screening_router, prefix="/api/screening", tags=["screening"])
   app.include_router(matching_router, prefix="/api/matching", tags=["matching"])
   app.include_router(learning_router, prefix="/api/learning", tags=["learning"])
   app.include_router(session_router, prefix="/api/session", tags=["session"])
   app.include_router(docs_router, prefix="/api/docs", tags=["docs"])
   ```

#### Frontend Integration (`frontend/src/App.tsx`)
1. Uncomment the feature imports:
   ```typescript
   import { ScreeningFlow } from './features/screening/ScreeningFlow'
   import { MatchingFlow } from './features/matching/MatchingFlow'
   import { LearningDashboard } from './features/learning/LearningDashboard'
   import { SessionRoom } from './features/session/SessionRoom'
   import { DocsDashboard } from './features/docs/DocsDashboard'
   ```

2. Uncomment the route definitions:
   ```typescript
   <Route path="/screening/*" element={<ScreeningFlow />} />
   <Route path="/matching/*" element={<MatchingFlow />} />
   <Route path="/learning/*" element={<LearningDashboard />} />
   <Route path="/session/*" element={<SessionRoom />} />
   <Route path="/docs/*" element={<DocsDashboard />} />
   ```

### Verification Steps
1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "ok"}
   ```

2. **Auth Service Check:**
   ```bash
   curl http://localhost:8000/api/auth/ping
   # Expected: {"message": "auth service alive"}
   ```

3. **Frontend Build:**
   ```bash
   cd frontend && npm run build
   # Expected: Zero TypeScript errors
   ```

4. **Full App Flow Test:**
   - Start backend server
   - Start frontend dev server
   - Test complete onboarding flow using the "⚡ Autofill Demo Data" button
   - Verify all 4 steps complete successfully
   - Check Supabase records for user profile, communication profile, intake, and consent

---

## Demo Accelerator Button

The "⚡ Autofill Demo Data" button in the top-right corner enables rapid demo completion:

### Autofilled Data
- **Role:** Patient
- **Profile:** Alex Rivera, DOB: 2016-04-12, Male
- **Communication Profile:**
  - Primary Language: English
  - Secondary Language: Spanish
  - Therapy Language: English
  - Reading: Developing
  - Typing: None
  - Method: Voice
  - Guardian Needed: True
  - Comfort: Medium
- **Intake:**
  - Concern: "Difficulty with 's' and 'th' phonemes, stuttering when excited"
  - Goals: "Clear articulation at school"
  - Daily Challenges: School & Public Speaking
- **Consent:**
  - Recording Accepted: True
  - Supervisor Accepted: True

This allows completing the full 4-step onboarding in under 10 seconds during live presentations.

---

## Contract Compliance Verification

### Backend Models (`backend/app/models/shared.py`)
✅ All frozen models remain untouched:
- `Role`, `ReadingAbility`, `TypingAbility`, `CommunicationMethod`, `ComfortLevel` enums
- `CommunicationProfile`, `CurrentUser`, `ScreeningResult`, `Milestone`, `ProbeResult`, `GeneralizationScore`, `SessionRecord`, `ModuleLibraryEntry` models

### Frontend Types (`frontend/src/shared/types.ts`)
✅ All type definitions remain consistent with backend contracts
✅ No modifications to shared type interfaces

### Documentation (`docs/CONTRACTS.md`)
✅ All endpoints and models documented as per contract requirements

---

## Phase 4 Completion Summary

- ✅ Demo accelerator button implemented with pre-filled realistic data
- ✅ Backend integration scaffold verified with commented placeholders
- ✅ Frontend integration scaffold verified with commented placeholders  
- ✅ Demo script and integration guide created
- ✅ Contract compliance verified
- ✅ Ready for team integration merge