# Learning Path + Generalization Probe Engine

Built by Sameer for HouseOfVoice - Phase 8 Complete ✅

## Overview

This feature implements a clinical-grade learning path system with HOAL (Hierarchical Operation of Articulation Learning) generalization probes. It enables patients to progress through structured speech therapy milestones while ensuring true skill generalization through systematic probe testing.

## What Sameer Built

### Core Components

1. **Learning Path System** (`path_generator.py`)
   - AI-powered (Gemini) or mock-based generation of personalized therapy paths
   - Creates milestones based on screening results and flagged errors
   - Supports both mock (offline) and live (API) modes via `USE_MOCKS` environment variable

2. **Milestone State Machine** (`state_machine.py`)
   - Manages milestone progression: `locked` → `active` → `trained` → `generalized`
   - Enforces clinical therapy rules and valid transitions
   - Prevents invalid state changes

3. **Practice Tracker** (`practice_tracker.py`)
   - Records exercise attempts and completion status
   - Tracks consecutive successes (threshold: 3 for checkpoint readiness)
   - Manages patient motivation streaks (daily practice tracking)
   - Calculates progress metrics

4. **Generalization Probe Engine** (`probe_engine.py`)
   - HOAL-compliant probe serving from curated word banks
   - Two-phase checkpoint system: Serve → Score
   - Pass branch: Awards badges, transitions to "generalized", unlocks next milestone
   - Fail branch: Returns extra practice items, resets streak, maintains "trained" status
   - Badge system for motivation and achievement tracking

5. **Probe Bank** (`probe_bank.py`)
   - Curated word banks for /s/, /th/, /r/ across word positions
   - Prevents word repetition within milestone probes
   - Supports phoneme-specific probe selection

6. **Scoring System** (`scorer.py`)
   - Mock scoring for demo (always pass for practice, 70% for probes)
   - Prepared for live speech analysis API integration
   - Graceful fallback to mock on API failures

### Frontend Components

1. **LearningPathPage** - Main dashboard and navigation
2. **Roadmap** - Visual milestone progression timeline
3. **MilestoneCard** - Individual milestone display with status indicators
4. **PracticePanel** - Exercise completion interface
5. **ProbeSession** - Checkpoint probe testing interface
6. **GeneralizationGauge** - Visual progress meter for phoneme generalization
7. **BadgesShowcase** - Achievement badge display

## How the Generalization Probe Engine Works

The Generalization Probe Engine implements the clinical gold standard for ensuring speech sound generalization:

### Clinical Rationale

Traditional therapy often fails because patients can produce sounds in practiced words but not in novel contexts. The HOAL (Hierarchical Operation of Articulation Learning) approach addresses this by:

1. **Training Phase**: Patient practices structured exercises with trained words
2. **Checkpoint Trigger**: After 3 consecutive successful practice sessions
3. **Probe Phase**: Patient is tested with UNTRAINED words from the same phoneme
4. **Generalization Decision**: Only if they pass the probe do we consider the sound "generalized"

### Technical Implementation

**Phase 1: Serve Probe**
- System checks if `consecutive_successes >= 3`
- Selects a word from `PROBE_WORD_BANK` that the patient has NEVER practiced
- Ensures word is phonemically appropriate (correct position, context)
- Returns probe word with instructions

**Phase 2: Score Probe**
- Patient attempts the probe word (audio or text input)
- System scores the attempt (mock: 70% pass rate; live: speech analysis API)
- **Pass Branch**:
  - Milestone status → "generalized"
  - Award "Sound Master" badge
  - Unlock next milestone in sequence
  - Streak remains intact
- **Fail Branch**:
  - Milestone status stays "trained"
  - Return 3 extra practice items from `TRAINED_VARIETY`
  - Reset consecutive success counter to 0
  - No badge awarded

### Word Banks

**Probe Word Bank** (for testing generalization):
- `/s/`: sun, soap, soup, sand, sock, sing, socks, seven (initial), bus, kiss, mess, class, pass, glass, grass, dress (final), hissing, cactus, basin, mustard, pasta, mask, desk (medial)
- `/th/`: think, thank, thumb, thin, three, throw, thirty (initial), bath, path, math, both, mouth, truth, month (final), nothing, something, brother, feather, mother, father (medial)
- `/r/`: red, run, rabbit, rain, read, ring, road, rock (initial), car, star, door, bear, hair, four, ear, deer (final), orange, berry, carrot, parrot, arrow, mirror, forest (medial)

**Trained Variety** (for extra practice after probe failure):
- `/s/`: sand, soup, sail, seed, sing, soft
- `/r/`: rain, road, ring, red, run, roof
- `/th/`: think, three, thumb, thin, thank, thread

## API Endpoints

All endpoints are mounted under `/api/learning`:

### POST `/paths/generate`
Generate a learning path based on screening results.

**Request:**
```json
{
  "case_id": "case_123",
  "screening_result": {
    "case_id": "case_123",
    "speech_rate": 120.5,
    "pause_frequency": 2.3,
    "pronunciation_score": 0.75,
    "fluency_score": 0.80,
    "voice_stability": 0.70,
    "clarity_score": 0.65,
    "confidence_level": 0.60,
    "flagged_errors": ["s - initial position", "s - final position"],
    "plain_language_summary": "Patient shows difficulties with s sounds"
  }
}
```

**Response:**
```json
{
  "path_id": "path_case_123",
  "case_id": "case_123",
  "is_live": false,
  "milestones": [
    {
      "id": "m_case_123_1",
      "path_id": "path_case_123",
      "order_index": 1,
      "title": "s - initial position",
      "goal": "Master s - initial position in structured practice",
      "status": "active",
      "linked_demo_id": null
    }
  ]
}
```

**Mock/Live Behavior:**
- `USE_MOCKS=True`: Uses mock generator (100% offline, no API keys)
- `USE_MOCKS=False`: Would call Gemini API (currently stubbed with graceful fallback)

### POST `/paths/{id}/approve`
Approve and lock a learning path as live.

**Request:**
```json
{
  "case_id": "case_123"
}
```

**Response:**
```json
{
  "path_id": "path_case_123",
  "case_id": "case_123",
  "is_live": true,
  "milestones": [...]
}
```

### GET `/paths/{case_id}`
Get the learning path for a patient case.

**Response:**
```json
{
  "path_id": "path_case_123",
  "case_id": "case_123",
  "is_live": true,
  "milestones": [...]
}
```

### POST `/milestones/{id}/practice-attempt`
Record a practice attempt for a milestone exercise.

**Request:**
```json
{
  "case_id": "case_123",
  "exercise_index": 0,
  "audio_or_text": "sun"
}
```

**Response:**
```json
{
  "attempt_id": "uuid-123",
  "passed": true,
  "exercise_done": true,
  "consecutive_successes": 1,
  "checkpoint_ready": false,
  "streak": {
    "current_streak_days": 5,
    "last_practice_date": "2026-09-17"
  }
}
```

### POST `/milestones/{id}/checkpoint`
Handle checkpoint probe serving and scoring.

**Phase 1 (Serve) - Request:**
```json
{
  "case_id": "case_123",
  "phoneme": "/s/",
  "audio_or_text": ""
}
```

**Phase 1 (Serve) - Response:**
```json
{
  "phase": "probe_served",
  "item": {
    "is_probe": true,
    "probe_word_id": "probe_s_sun",
    "display_text": "sun",
    "instructions": "Say 'sun' clearly out loud"
  }
}
```

**Phase 2 (Score) - Request:**
```json
{
  "case_id": "case_123",
  "phoneme": "/s/",
  "audio_or_text": "sun"
}
```

**Phase 2 (Score) - Response (Pass):**
```json
{
  "phase": "probe_scored",
  "result": "pass",
  "milestone_status": "generalized",
  "badge_awarded": true,
  "badge": {
    "id": "badge-uuid",
    "title": "Sound Master: /s/",
    "description": "Successfully generalized /s/ to untrained words!",
    "icon": "star",
    "awarded_at": "2026-09-17T10:30:00"
  },
  "message": "Amazing! You can use this sound in brand new words!",
  "extra_practice_items": []
}
```

**Phase 2 (Score) - Response (Fail):**
```json
{
  "phase": "probe_scored",
  "result": "continue_practice",
  "milestone_status": "trained",
  "badge_awarded": false,
  "message": "Nice try! Let's practice a few more words to build muscle memory.",
  "extra_practice_items": ["sand", "soup", "sail"]
}
```

### GET `/generalization/{case_id}/{phoneme}`
Get generalization statistics for a case and phoneme.

**Response:**
```json
{
  "case_id": "case_123",
  "phoneme": "s",
  "probes_attempted": 5,
  "probes_passed": 4,
  "rate": 0.8,
  "last_updated": "2026-09-17T10:30:00"
}
```

### GET `/generalization/{case_id}`
Get generalization statistics summary for all phonemes.

**Response:**
```json
{
  "case_id": "case_123",
  "overall_rate": 0.75,
  "total_probes_attempted": 12,
  "total_probes_passed": 9,
  "phonemes": [
    {
      "phoneme": "/s/",
      "probes_attempted": 5,
      "probes_passed": 4,
      "rate": 0.8,
      "last_updated": "2026-09-17T10:30:00"
    }
  ]
}
```

### GET `/badges/{case_id}`
Get all badges awarded to a case.

**Response:**
```json
{
  "case_id": "case_123",
  "total_badges": 3,
  "badges": [
    {
      "id": "badge-uuid",
      "milestone_id": "m_case_123_1",
      "phoneme": "/s/",
      "title": "Sound Master: /s/",
      "description": "Successfully generalized /s/ to untrained words!",
      "icon": "star",
      "awarded_at": "2026-09-17T10:30:00"
    }
  ]
}
```

## Demo Cheat Sheet

### Quick Start Demo Flow

1. **Generate Learning Path**
   - Call `POST /paths/generate` with screening results
   - Review generated milestones (first is active, rest locked)

2. **Practice Exercises**
   - Click on the **Active** milestone (green)
   - Complete 3 exercises by marking them "Done"
   - Watch the progress bar fill up
   - After 3 consecutive successes, "Take Checkpoint" button appears

3. **Take Checkpoint (Generalization Probe)**
   - Click "Take Checkpoint" button
   - System serves a word you've NEVER practiced before
   - Say the word clearly out loud
   - Click "Submit" to record your attempt

4. **Watch the Magic Happen**
   - **If you pass**: Node flips to Gold Star, Badge unlocks, Next milestone becomes Active
   - **If you fail**: Node stays at "Trained", Extra practice words appear, Streak resets

5. **Track Progress**
   - Check the Generalization Gauge for your phoneme mastery rate
   - View your earned badges in the Badges Showcase
   - Monitor your daily practice streak

### Keyboard Shortcuts (Future Enhancement)
- `N` - Next exercise
- `P` - Previous exercise
- `C` - Take checkpoint
- `S` - Submit attempt

## Environment Variables

### Backend
- `USE_MOCKS` - Toggle between mock and live modes (default: "True")
  - `"True"`: 100% offline, no API keys required
  - `"False"`: Would call Gemini/speech analysis APIs (with graceful fallback)

### Frontend
- `VITE_API_BASE_URL` - Backend API base URL (default: "http://localhost:8000/api")

## Testing

### E2E Smoke Test
Run the comprehensive end-to-end test suite:
```bash
cd backend
python test_learning_e2e.py
```

This tests:
1. Path generation and approval
2. Practice and checkpoint triggering
3. Generalization probe pass branch
4. Generalization probe fail branch
5. Metrics and badges endpoints

**Expected output:** `Test Summary: 19/19 passed - SUCCESS: All tests passed!`

### Frontend Build
```bash
cd frontend
npm run build
```

## Architecture Decisions

1. **In-Memory Storage**: Used for hackathon/demo purposes. Production should use Supabase/PostgreSQL
2. **Mock-First Design**: All services work 100% offline with zero API dependencies
3. **Graceful Degradation**: Live APIs fall back to mocks on failure, never returning 500 errors
4. **Clinical Compliance**: HOAL probe methodology ensures real generalization, not just memorization
5. **Motivation Engineering**: Streaks, badges, and visual progress drive engagement

## Future Enhancements

1. **Real Speech Analysis**: Integrate actual speech-to-text and pronunciation scoring APIs
2. **Gemini Integration**: Connect to Gemini for personalized path generation
3. **Database Persistence**: Replace in-memory stores with Supabase
4. **Adaptive Difficulty**: Adjust probe difficulty based on patient performance
5. **Therapist Dashboard**: Allow therapists to customize paths and review progress
6. **Gamification**: Add more badge types, leaderboards, and achievement tiers

## File Structure

```
backend/
├── app/
│   ├── routers/
│   │   └── learning.py              # FastAPI endpoints
│   ├── models/
│   │   ├── learning.py              # Domain-specific models
│   │   └── shared.py                # Frozen contract types
│   └── services/
│       └── learning/
│           ├── __init__.py           # Service exports
│           ├── path_generator.py    # AI path generation
│           ├── state_machine.py     # Milestone transitions
│           ├── practice_tracker.py   # Exercise & streak tracking
│           ├── probe_engine.py      # HOAL probe logic
│           ├── probe_bank.py        # Curated word banks
│           └── scorer.py            # Speech scoring
└── test_learning_e2e.py             # Comprehensive test suite

frontend/
└── src/
    └── features/
        └── learning-path/
            ├── LearningPathPage.tsx  # Main dashboard
            ├── Roadmap.tsx           # Visual timeline
            ├── MilestoneCard.tsx     # Milestone display
            ├── PracticePanel.tsx     # Exercise interface
            ├── ProbeSession.tsx      # Checkpoint interface
            ├── GeneralizationGauge.tsx # Progress meter
            ├── BadgesShowcase.tsx    # Achievement display
            └── routes.tsx            # Route definitions

shared/
└── mocks/
    ├── learning_path.mock.json      # Sample path data
    └── generalization_score.mock.json # Sample score data
```

## Credits

- **Built by**: Sameer
- **Phase**: 8 (Final Polish & E2E Testing)
- **Status**: ✅ Complete - All tests passing, ready for integration
- **Branch**: feature/sameer-learning

---

*This implementation follows the clinical HOAL methodology for ensuring true speech sound generalization, not just word memorization.*