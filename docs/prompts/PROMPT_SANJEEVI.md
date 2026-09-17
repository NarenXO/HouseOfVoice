PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team on 6 isolated git branches against
a frozen shared contract. I am Sanjeevi. My role is **Session
Documentation, the AI Documentation Assistant, the Progress Dashboard,
and the rest of the case lifecycle** (Steps 12-20 of the product
spec). Do not build any other person's feature.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice. Naren has pushed an initial
  skeleton to `main` and cut branch `feature/sanjeevi-docs` for me.
  Help me `git clone` it and `git checkout feature/sanjeevi-docs`.
- Stack: FastAPI (Python) backend, React + TypeScript + Tailwind
  (Vite) frontend, Supabase, Gemini Pro, Recharts for visualization.
- The repo has `docs/CONTRACTS.md`, `docs/GIT_WORKFLOW.md`, and
  `shared/mocks/*`. I am the last stage of the pipeline — I consume
  almost everyone else's output. Use these mocks instead of anyone's
  real code:
  - `shared/mocks/session_record.mock.json` (Sai Pranav)
  - `shared/mocks/learning_path.mock.json` (Sameer)
  - `shared/mocks/generalization_score.mock.json` (Sameer)
  - `shared/mocks/screening_result.mock.json` (Salman)
  - `shared/mocks/current_user.mock.json` (Naren)
  I produce nothing anyone else's branch depends on, which makes my
  slice the safest to build fully standalone.

MY MISSION — STEPS 12-20
---------------------------
**Step 12 — Session Documentation.** Form capturing activities
completed, patient response, homework assigned, clinical observations
(use mocked `SessionRecord` as the shape of what a session hands you).

**Step 13 — AI Documentation Assistant.** Gemini generates a SOAP note,
a session summary, and a parent-friendly explanation, from the
session documentation + mocked prior context — all editable drafts,
therapist reviews before saving, never auto-finalized.
- First-session handling: if there's no prior session, draft from
  mocked baseline/intake data instead.
- Age/reading-ability-adaptive tone: pull `readingAbility` and `age`
  off the mocked `CurrentUser`/`CommunicationProfile` and adjust the
  Gemini prompt's requested complexity level accordingly.

**Step 14 — Homework Sessions.** Just a read-only display of the
milestone content from the mocked `learning_path.mock.json` — you are
not the source of truth for this, only render it.

**Step 15 — Progress Dashboard.** Charts (Recharts) for speech
clarity, fluency, pronunciation, voice stability (from mocked
`ScreeningResult`, plotted as if there were multiple time points —
generate a few synthetic historical points around the mocked baseline
for a believable trend line), attendance, and Learning Path milestone
progress over time. Add the **Generalization Rate** chart per phoneme
from mocked `GeneralizationScore` — make this the visual headline,
it's the most novel number in the whole app. Also build a simple
Isolation Forest regression/plateau alert: train `scikit-learn`'s
`IsolationForest` on a small synthetic history array (speech metrics +
practice pattern), flag the most recent point if it's anomalous,
surface it as a small alert banner on the dashboard.

**Step 16 — Urgent Concern Flag.** One-tap flag button, stores a
timestamped high-priority record.

**Step 17 — Reassessment.** At a predefined milestone, patient repeats
the standardized assessment; show Baseline → Current → Improvement as
a simple before/after comparison (again, synthesize a plausible
"current" from the mocked baseline for demo purposes).

**Step 18 — Feedback.** Patient/guardian session rating + satisfaction
level. Only patients rate; therapists never rate patients — don't
build a reverse rating path even as an oversight.

**Step 19 — Supervisor Evaluation.** Structured rubric form:
documentation quality, therapy planning, session quality, clinical
reasoning, professional communication — each a 1-5 scale field, not a
single approve/reject button.

**Step 20 — Case Completion.** Mark a case closed once goals are
achieved; store final progress + history summary (no PDF export, out
of scope on purpose). Add a follow-up check-in: a scheduled prompt
weeks later asking "how's progress since your last session," a
concerned response should be capturable as a flag for a new booking
request (just store the intent, don't wire real booking — that's
Kavya's domain and out of reach during solo dev).

MY FILE SCOPE (only these)
----------------------------
- `backend/app/routers/docs.py`
- `backend/app/models/docs.py`
- `backend/app/services/docs/*`
- `frontend/src/features/dashboard-docs/*`

ENDPOINTS TO BUILD (mounted at `/api/docs` at integration time — build
paths WITHOUT that prefix)
------------------------------------------------------------------
- `POST /session-notes` — save raw Step 12 documentation.
- `POST /session-notes/draft` — Gemini SOAP/summary/parent-friendly
  draft from the saved documentation (+ mocked context).
- `GET /dashboard/{case_id}` — aggregated metrics incl. trend arrays
  and the Isolation Forest alert flag.
- `POST /urgent-flag`
- `POST /reassessment`
- `POST /feedback`
- `POST /supervisor-evaluation`
- `POST /case/{id}/close`
- `POST /case/{id}/follow-up-response`

DATA MODEL YOU OWN
--------------------
```
session_notes(id, case_id, session_id, activities, patient_response,
              homework_assigned, clinical_observations)
ai_doc_drafts(session_note_id, soap_note, session_summary,
              parent_summary, approved bool)
urgent_flags(case_id, raised_by, raised_at, note)
reassessments(case_id, baseline_snapshot json, current_snapshot json,
              improvement_summary, assessed_at)
feedback(case_id, session_id, rating, satisfaction_level, comments)
supervisor_evaluations(case_id, therapist_id, documentation_quality,
                        therapy_planning, session_quality,
                        clinical_reasoning, professional_communication)
case_closures(case_id, closed_at, final_summary)
follow_up_checkins(case_id, prompted_at, response, wants_followup bool)
```

TECH STACK FOR THIS SLICE
--------------------------
FastAPI + Pydantic, `google-generativeai` for the three drafted texts,
`scikit-learn` (`IsolationForest`) for the plateau alert, `recharts`
for every chart (line for trends, radial/gauge for generalization
rate), React + Tailwind, `framer-motion` for the alert-banner
entrance and the SOAP-draft reveal, `lucide-react` icons (flag,
checkmark, star for the rubric).

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: clone, checkout branch, read CONTRACTS.md, load all the
  mock JSON files and sanity-check you can build synthetic time
  series from them.
- Hour 1-3: session documentation form + save endpoint.
- Hour 3-5: Gemini SOAP/summary/parent-friendly draft endpoint + UI,
  with the age/reading-ability tone adjustment.
- Hour 5-8: dashboard charts (clarity/fluency/pronunciation/voice
  stability/attendance/milestone progress) off synthetic trend data.
- Hour 8-9: generalization-rate headline chart.
- Hour 9-10: Isolation Forest plateau alert.
- Hour 10-11: urgent flag + reassessment before/after view.
- Hour 11-12: feedback form + supervisor rubric form.
- Hour 12-13: case completion + follow-up check-in.
- Hour 13-14: polish the dashboard as the "everything comes together"
  screen for the pitch, push.

DO NOT
-------
- Do not build auth/onboarding, screening, matching/booking, learning
  path, or session/smartboard — other people's branches.
- Do not build a therapist-rates-patient path anywhere.
- Do not wire real booking from the follow-up check-in — store intent
  only.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- A session note saves and a Gemini draft (SOAP + summary + parent
  version) is generated from it, tone-adjusted, editable.
- The dashboard renders real charts from synthetic-but-plausible data,
  including the generalization-rate headline and one working
  Isolation Forest alert.
- Urgent flag, reassessment, feedback, supervisor eval, and case
  closure all save correctly.
- Everything on `feature/sanjeevi-docs`, pushed, clean commits.

Now start by helping me clone the repo, check out my branch, and load
the mock JSON fixtures so we can generate a believable synthetic
time-series to build the dashboard charts against before wiring the
Gemini drafting endpoint.
