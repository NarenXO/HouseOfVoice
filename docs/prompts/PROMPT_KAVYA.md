PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team on 6 isolated git branches against
a frozen shared contract. I am Kavya. My role is **Therapist
Recommendation, Booking, Therapy Plan drafting, and Supervisor
Assignment** (Steps 6-10 of the product spec). Do not build any other
person's feature.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice. Naren has pushed an initial
  skeleton to `main` and cut branch `feature/kavya-matching` for me.
  Help me `git clone` it and `git checkout feature/kavya-matching`.
- Stack: FastAPI (Python) backend, React + TypeScript + Tailwind
  (Vite) frontend, Supabase for storage, Gemini Pro for plan drafting.
- The repo has `docs/CONTRACTS.md` (frozen data contract),
  `docs/GIT_WORKFLOW.md` (branch/merge rules), and `shared/mocks/*`.
- I need a `CurrentUser` / `CommunicationProfile` (Naren's domain,
  produced for real by his `/api/auth` endpoints) and a
  `ScreeningResult` (Salman's domain). I do **not** call their real
  endpoints while building solo — I import
  `shared/mocks/current_user.mock.json` and
  `shared/mocks/screening_result.mock.json` instead, exactly as
  shaped in `backend/app/models/shared.py` /
  `frontend/src/shared/types.ts`. I produce
  `shared/mocks/therapy_plan.mock.json`-shaped data for others
  (Sameer and Sai Pranav use it the same way).

MY MISSION — STEPS 6-10
--------------------------
**Step 6 — Therapist Recommendation.** Transparent scoring, not a
black box: specialization match, therapy-language match, availability,
session mode match, years of experience, Communication Profile
compatibility, current workload (fewer active cases = higher score).
Every recommendation must show its reasoning as a short list of
factors and their contribution — this transparency is a named "core
innovation," don't skip it, don't just show a bare number.

**Step 7 — Booking System.** Date/time/mode selection against the
recommended therapist's declared weekly availability, live
availability check (simple: query existing bookings, exclude
conflicts), automatic reminder record (store it, actual email/SMS
sending is out of scope for 24h — just create a `reminders` row).
Trial-session option before committing to an ongoing schedule.
No-response fallback: if a therapist "hasn't responded" (simulate with
a manual status toggle for the demo), reuse the Step 6 recommendation
list to show alternatives.

**Step 8 — Supervisor Assignment.** Happens only *after* the
therapist/slot is confirmed — enforce that ordering in your logic
(reject supervisor assignment if no confirmed booking exists yet).
Simple: assign the supervisor with the lowest current caseload.

**Step 9 — Therapy Plan.** Structured template. Gemini drafts a
starting plan from intake info (mocked — see below), the
`ScreeningResult` (mocked), and stated therapy goals. The draft is
fully editable; the therapist must explicitly approve it before it's
considered final — never auto-finalize.

MY FILE SCOPE (only these)
----------------------------
- `backend/app/routers/matching.py`
- `backend/app/models/matching.py`
- `backend/app/services/matching/*`
- `frontend/src/features/matching-booking-plan/*`

ENDPOINTS TO BUILD (mounted at `/api/matching` at integration time —
build paths WITHOUT that prefix)
------------------------------------------------------------------
- `GET /therapists/recommend?case_id=` — returns ranked therapists +
  per-factor reasoning.
- `POST /bookings` — creates a booking; validates against availability.
- `POST /bookings/{id}/no-response` — flips status, returns the
  alternates list (reuses the recommend logic).
- `POST /supervisor-assignment` — only succeeds if a confirmed booking
  exists for the case.
- `POST /plans/draft` — Gemini drafts a `TherapyPlan` from mocked
  intake + mocked `ScreeningResult` + stated goals.
- `POST /plans/{id}/approve` — marks a plan approved, locks it from
  further silent AI edits.

DATA MODEL YOU OWN
--------------------
```
therapists(id, name, specialization, languages, years_experience,
           weekly_availability json, session_mode, current_caseload)
supervisors(id, name, current_caseload)
bookings(id, case_id, therapist_id, datetime, mode, status
         [pending/confirmed/no_response/trial], reminder_sent bool)
supervisor_assignments(booking_id, supervisor_id, assigned_at)
therapy_plans(id, case_id, goals json, session_mode, gemini_draft json,
              approved_by nullable, approved_at nullable)
```
Output of `/plans/draft` must be consumable as
`shared/mocks/therapy_plan.mock.json`'s shape — keep the same keys:
`caseId, therapistId, goals, sessionMode, approvedBy, approvedAt`.

TECH STACK FOR THIS SLICE
--------------------------
FastAPI + Pydantic, Supabase (Postgres), `google-generativeai` for the
plan draft prompt, React + Tailwind, `lucide-react` icons,
`framer-motion` for the recommendation-cards reveal and the booking
calendar interactions. Use plain HTML date/time inputs or a small
free calendar component — don't burn hours on a fancy scheduler UI,
function over polish here, Sai Pranav's screen is the visual showcase.

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: clone, checkout branch, read CONTRACTS.md, seed a handful
  of fake `therapists`/`supervisors` rows directly in Supabase so you
  have real data to rank against.
- Hour 1-4: recommendation scoring endpoint + reasoning breakdown.
- Hour 4-5: recommendation cards UI (frontend), showing the reasoning.
- Hour 5-8: booking endpoint + availability conflict check + booking
  UI.
- Hour 8-9: no-response fallback flow.
- Hour 9-10: supervisor assignment endpoint (with the ordering guard).
- Hour 10-13: Gemini plan-draft endpoint + editable plan UI + approve
  action.
- Hour 13-14: end-to-end test using the mock `ScreeningResult` and
  mock `CurrentUser`, push.

DO NOT
-------
- Do not build auth/onboarding, screening, learning path, session/
  smartboard, or docs/dashboard — other people's branches.
- Do not call another teammate's real endpoint during solo dev — use
  the mocks in `shared/mocks/`.
- Do not let the plan-draft endpoint mark a plan as final on its own —
  only `/plans/{id}/approve`, called by a human action, does that.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- Recommendation list returns real ranked therapists with visible
  per-factor reasoning, from real seeded Supabase data.
- A booking can be created and conflicts are rejected.
- Supervisor assignment fails before a booking is confirmed and
  succeeds after.
- A Gemini-drafted plan is returned, editable in the UI, and only
  becomes "approved" via an explicit action.
- Everything on `feature/kavya-matching`, pushed, clean commits.

Now start by helping me clone the repo, check out my branch, and seed
a handful of realistic fake therapists and supervisors into Supabase
so the recommendation engine has something real to rank.
