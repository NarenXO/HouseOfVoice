# CONTRACTS.md — the one document everyone reads before writing code

This file is the reason six people can build in total isolation and still
merge into one working app at hour 24. It is **frozen** — nobody edits it
during the build. If reality forces a change, that change is announced in
the team group chat immediately, not silently made in one person's branch.

## 1. The rule

Your feature must **produce** and/or **consume** data in exactly the shapes
below. You never call another teammate's real code to get that data during
solo development — you use the matching mock fixture in `/shared/mocks/`.
At merge time the shapes already line up, so wiring real calls together is
a 5-minute mechanical step, not a debugging session.

## 2. Shared types

Backend: `backend/app/models/shared.py` (Pydantic, frozen)
Frontend: `frontend/src/shared/types.ts` (TypeScript, frozen)

Both files define the same shapes side by side:

- `CommunicationProfile`
- `CurrentUser`
- `ScreeningResult`
- `Milestone`
- `ProbeResult`
- `GeneralizationScore`
- `SessionRecord`
- `ModuleLibraryEntry`

Never redeclare one of these inside your own feature folder. Import it.

## 3. Mock fixtures (use these instead of another person's live code)

| File | Who produces this for real | Who consumes it as a mock |
|---|---|---|
| `current_user.mock.json` | Naren (auth) | everyone |
| `screening_result.mock.json` | Salman (screening) | Sameer, Sai Pranav |
| `therapy_plan.mock.json` | Kavya (matching/plan) | Sameer, Sai Pranav |
| `learning_path.mock.json` | Sameer (learning) | Sanjeevi, Sai Pranav |
| `generalization_score.mock.json` | Sameer (learning/probe) | Sanjeevi |
| `session_record.mock.json` | Sai Pranav (session) | Sanjeevi |
| `module_library.mock.json` | Sai Pranav (module library) | Sameer, Sanjeevi |

Load these with a plain `fetch`/`import` from `/shared/mocks/*.json` (frontend)
or `json.load()` (backend) behind a `USE_MOCKS = True` flag in your own
service file. Flip it later — never delete the mock path, it's your demo
fallback if a live integration hiccups on stage.

## 4. REST endpoint map (what each router will eventually expose)

Prefix note: every router is mounted under `/api/<domain>` at integration
time — see `backend/app/main.py`. Build your paths WITHOUT the prefix (the
prefix is added when Naren includes your router).

### `/api/auth` — Naren
- `POST /register` — role-aware signup
- `POST /onboarding/communication-profile`
- `POST /intake`
- `POST /baseline-consent`

### `/api/screening` — Salman
- `POST /baseline-recording` (upload audio)
- `POST /run-pipeline` → returns `ScreeningResult`
- `GET /result/{case_id}` → `ScreeningResult`

### `/api/matching` — Kavya
- `GET /therapists/recommend?case_id=`
- `POST /bookings`
- `POST /plans/draft` → Gemini-drafted plan
- `POST /plans/{id}/approve`
- `POST /supervisor-assignment`

### `/api/learning` — Sameer
- `POST /paths/generate` → Gemini-drafted path
- `GET /paths/{case_id}` → list of `Milestone`
- `POST /milestones/{id}/checkpoint` → triggers probe, returns `ProbeResult`
- `GET /generalization/{case_id}/{phoneme}` → `GeneralizationScore`

### `/api/session` — Sai Pranav
- `WS /ws/board/{session_id}` — smartboard relay
- `POST /demo/generate` (11B, 5-15s) → animation spec
- `POST /modules/generate` (11C, 30s) → storyboard, pending approval
- `POST /modules/{id}/approve`
- `GET /modules?phoneme=&age_band=&language=` → list of `ModuleLibraryEntry`

### `/api/docs` — Sanjeevi
- `POST /session-notes/draft` → Gemini SOAP draft
- `GET /dashboard/{case_id}` → aggregated metrics incl. `GeneralizationScore`
- `POST /urgent-flag`
- `POST /reassessment`
- `POST /feedback`
- `POST /supervisor-evaluation`
- `POST /case/{id}/close`

## 5. What "frozen" means in practice

- `backend/app/models/shared.py`, `frontend/src/shared/types.ts`,
  `backend/app/main.py`, `frontend/src/App.tsx`, `backend/requirements.txt`,
  `frontend/package.json` are **read-only for everyone except Naren**
  during the 24h build.
- Every other file you touch lives inside your own router/model/service
  file or your own `src/features/<your-domain>/` folder.
- This is what makes six parallel branches mergeable without conflicts.
