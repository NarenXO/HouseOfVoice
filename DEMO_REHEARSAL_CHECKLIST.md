# Phase 8 Demo Rehearsal Checklist
## Live Hackathon Presentation Flow (2-minute walkthrough)

### Setup Instructions
1. Start backend server: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Open browser to: `http://localhost:5173/session?room=demo-final`

---

### **REHEARSAL STEPS**

#### **1. Join Session & Parent Gate (0:00-0:20)**
- [ ] Navigate to `/session?room=demo-final`
- [ ] Verify room ID displays correctly in header
- [ ] Check "Parent Present" checkbox
- [ ] Confirm Jitsi video embed appears in left panel
- [ ] Verify video call loads without errors
- [ ] Check WebSocket connection status shows "Connected"

#### **2. Smartboard Co-Drawing (0:20-0:40)**
- [ ] Click clinical drawer toggle to show patient context
- [ ] Verify target phonemes display (/r/, /s/, /th/)
- [ ] Select "Mouth Anatomy" template from Smartboard
- [ ] Pick Red Pen from toolbar
- [ ] Draw articulatory cue on the canvas
- [ ] Stamp Gold Star ⭐ on the drawing
- [ ] Fire 🎉 emoji reaction from reaction bar
- [ ] Verify reaction appears and synchronizes
- [ ] Test chat functionality with a test message

#### **3. AI Live Demo (11B) (0:40-1:00)**
- [ ] Switch to "🎬 Procedural Demo" tab
- [ ] Click on target phoneme chip (e.g., /r/)
- [ ] Verify honest labeling: "Procedural Speech Articulation Demo"
- [ ] Click "Generate Articulation Demo" button
- [ ] Watch loading spinner during generation
- [ ] Verify demo modal appears with step-by-step animation
- [ ] Check articulatory cues display correctly
- [ ] Verify narration text appears and syncs with steps
- [ ] Test playback controls (play/pause/seek)
- [ ] Verify audio plays (server TTS or browser fallback)
- [ ] Test milestone attachment dropdown
- [ ] Select a milestone and click "Attach"
- [ ] Verify success confirmation badge appears

#### **4. AI Module Studio (11C) (1:00-1:20)**
- [ ] Switch to "📦 Module Studio" tab
- [ ] Verify honest labeling: "Generate Procedural Training Modules"
- [ ] Click on target phoneme chip (e.g., /s/)
- [ ] Click "Generate Training Module" button
- [ ] Watch loading spinner during generation
- [ ] Verify module approval workflow modal appears
- [ ] Review module details (phoneme, duration, scenes)
- [ ] Navigate through scenes using Previous/Next buttons
- [ ] Verify each scene shows articulatory cues and narration
- [ ] Test milestone attachment in module workflow
- [ ] Click "Approve Module" button
- [ ] Verify approval success message
- [ ] Confirm module is marked as approved

#### **5. Browse Library (1:20-1:35)**
- [ ] Switch to "📚 Library" tab
- [ ] Verify newly approved module appears in list
- [ ] Test search functionality with phoneme filter
- [ ] Verify ModuleLibraryEntry schema compliance (camelCase fields)
- [ ] Click on a module to view details
- [ ] Verify all required fields display correctly
- [ ] Test module playback functionality

#### **6. End Session & Export (1:35-2:00)**
- [ ] Click red "End Session" button in header
- [ ] Verify session summary dialog appears
- [ ] Check session duration displays correctly
- [ ] Verify demos generated count
- [ ] Verify modules used count
- [ ] Verify snapshots count
- [ ] Confirm parent attendance status
- [ ] Click "End Session" confirmation button
- [ ] Verify session record downloads as JSON
- [ ] Verify snapshot files download (if any)
- [ ] Check WebSocket session_ended broadcast
- [ ] Verify success confirmation message
- [ ] Confirm SOAP notes summary is generated

---

### **TECHNICAL VERIFICATION POINTS**

#### **Backend Contract Compliance**
- [ ] All 8 session endpoints return 200 OK
- [ ] `GET /api/session/context/case_101` returns target_phonemes array
- [ ] `POST /api/session/demo/generate` returns 5-15s duration with valid asset_ids
- [ ] `POST /api/session/modules/generate` returns 6-10 scenes with ~30s duration
- [ ] `GET /api/session/modules` uses camelCase field names (ageBand, durationSeconds, narrationAudioUrl)
- [ ] `POST /api/session/end-session` returns valid SessionRecord structure
- [ ] No snake_case fields in module library responses

#### **Frontend Contract Compliance**
- [ ] ModuleLibraryEntry interface matches frozen shared/types.ts
- [ ] SessionRecord interface matches frozen shared/types.ts
- [ ] No modifications to frozen shared contracts
- [ ] CamelCase to snake_case conversion for session record export

#### **Honest Copy & Safety**
- [ ] No "generative video AI" claims in UI
- [ ] All demos labeled as "Procedural Speech Articulation Animation"
- [ ] All modules labeled as "Procedural Training Modules"
- [ ] "AI-Directed Anatomical Motion" used where appropriate
- [ ] TTS fallback works without error popups
- [ ] Gemini API fallback loads mock storyboards instantly
- [ ] Zero console errors during full workflow

#### **UI/UX Verification**
- [ ] Tab switching maintains WebSocket connection
- [ ] Tab switching maintains Jitsi video call
- [ ] Clinical drawer collapses/expands smoothly
- [ ] Chat drawer works across all tabs
- [ ] Emoji reactions broadcast correctly
- [ ] Milestone attachment shows success feedback
- [ ] Session end dialog shows accurate summary
- [ ] File downloads trigger correctly

---

### **PERFORMANCE CHECKS**
- [ ] Demo generation completes within 5 seconds
- [ ] Module generation completes within 10 seconds
- [ ] WebSocket connection remains stable throughout
- [ ] Jitsi video call quality is acceptable
- [ ] No memory leaks during extended session
- [ ] Responsive design works on different screen sizes

---

### **ERROR HANDLING VERIFICATION**
- [ ] Invalid phoneme requests return appropriate errors
- [ ] Network failures show user-friendly messages
- [ ] Missing API keys trigger fallback gracefully
- [ ] Invalid milestone IDs handled without crashes
- [ ] Session end with empty data works correctly

---

### **SUCCESS CRITERIA**
✅ All 6 rehearsal steps complete without errors
✅ All backend contract tests pass
✅ All frontend contract validations pass
✅ Zero console errors throughout session
✅ Honest labeling verified across all components
✅ Fallback mechanisms work seamlessly
✅ Session record export matches frozen contract
✅ Module library entries match frozen contract

---

### **FINAL CHECK**
- [ ] Branch: `feature/saipranav-session`
- [ ] All changes committed with clear message
- [ ] No frozen shared contracts modified
- [ ] All test files created and passing
- [ ] Demo environment clean and ready
- [ ] Documentation updated (if needed)

**READY FOR HACKATHON PITCH: YES/NO**