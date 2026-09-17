PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team. Six of us are building in total
isolation on six different git branches, against a frozen shared
contract, so our work merges into one working app with no conflicts.
I am Naren. My role is (a) Registration / Onboarding / Communication
Profile / Consent (Steps 1-4 of the product spec), and (b) repo owner
and final integration captain — I merge everyone else's branches at
the end and wire the pieces together. Do not build any other person's
feature. Treat everything below as ground truth for scope.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice (currently empty — I am
  pushing the initial skeleton myself, described below).
- Stack: FastAPI (Python) backend, React + TypeScript + Tailwind
  (Vite) frontend, Supabase for DB/Auth/Storage, Gemini Pro for any
  LLM reasoning.
- Branch: `feature/naren-auth`, cut from `main` after I push the
  skeleton.
- The skeleton already exists as a set of files I am giving you
  (backend/, frontend/, shared/, docs/, README.md, requirements.txt,
  package.json, .env.example files, and a docs/CONTRACTS.md +
  docs/GIT_WORKFLOW.md that define exactly how the six of us avoid
  touching each other's files). Your first job is to help me commit
  that skeleton as-is, then build my feature on top of it.

MY MISSION — STEPS 1-4
-----------------------
1. **Registration & Onboarding.** Single signup flow with a role
   selector (Patient / Guardian / Therapist / Supervisor) that adapts
   the form per role.
   - Patient profile: name, DOB, gender, contact info.
   - **Communication Profile** (the core reusable object): primary
     language, secondary language, preferred therapy language,
     reading ability (pre-reader/developing/fluent), typing ability
     (none/developing/fluent), preferred communication method
     (voice/text/images), guardian assistance required (bool),
     comfort with unfamiliar people (low/medium/high). This exact
     shape is frozen in `backend/app/models/shared.py` and
     `frontend/src/shared/types.ts` — don't redefine it, import it.
   - App-level language: preferred therapy language also sets the
     app's own display language, not just AI output tone (stub this
     as a language-context provider; full i18n is out of scope for
     24h, just make the hook exist).
   - Guardian registration: guardian manages a child's account,
     captures the child's DOB separately from their own.
   - Therapist registration: specialization, languages spoken, years
     of experience, weekly availability, session mode
     (online/offline/hybrid), status shown honestly as one of
     "Self Declared / Pending Verification / Institution Verified".
   - Supervisor registration: same streamlined flow as therapist.
2. **Patient Intake.** Multi-step structured assessment: primary
   communication concern, medical history, previous therapy history,
   current medications, therapy goals, daily communication challenges
   (school/office/public speaking/home/phone).
3. **Consent for Recording.** One plain-language screen covering
   recording + supervisor presence + "practice activities may include
   assessment-style items used to check progress." Accept/decline,
   timestamped and stored. Declining still allows the activity with
   manual notes instead of a recording — store that flag.
4. Skip baseline speech *recording* itself (that's Salman's domain —
   Step 5) but do provide the consent gate that sits in front of it.

MY FILE SCOPE (only these; everything else I only touch as skeleton
setup or later as integration captain)
--------------------------------------
- `backend/app/routers/auth.py`
- `backend/app/models/auth.py`
- `backend/app/services/auth/*`
- `frontend/src/features/auth-onboarding/*`
- Repo-wide skeleton files (`backend/app/main.py`, `backend/app/core/*`,
  `frontend/src/App.tsx`, `frontend/src/shared/types.ts`,
  `backend/app/models/shared.py`, `requirements.txt`, `package.json`)
  — I own these as the frozen contract, but during the 14-hour build
  window I do NOT change their content beyond what's already in the
  skeleton (no new fields, no new shared types) unless I message the
  team first. I only touch them for real at the integration step.

ENDPOINTS TO BUILD (mounted at `/api/auth` at integration time — build
the paths WITHOUT that prefix)
------------------------------------------------------------------
- `POST /register` — role-aware signup, writes to Supabase `auth.users`
  + a `profiles` table you create.
- `POST /onboarding/communication-profile` — saves a
  `CommunicationProfile` (frozen shape) against a user id.
- `POST /intake` — saves the Step 2 structured intake.
- `POST /baseline-consent` — saves accept/decline + timestamp.

DATA MODEL YOU OWN (add to `backend/app/models/auth.py`, which already
imports the frozen shared shapes for you)
------------------------------------------------------------------
```
profiles(id, role, name, dob, gender, contact_info, guardian_id nullable)
therapist_profiles(user_id, specialization, languages, years_experience,
                    weekly_availability, session_mode, verification_status)
intake_forms(user_id, primary_concern, medical_history, prior_therapy,
             medications, therapy_goals, daily_challenges)
consents(user_id, recording_consent bool, supervisor_presence_consent bool,
         accepted_at, declined_reason nullable)
```

MOCK DATA — you are the *producer* of `CurrentUser` /
`CommunicationProfile`, so you don't need anyone else's mocks. Build
against your own Supabase project directly.

TECH STACK FOR THIS SLICE
--------------------------
FastAPI + Pydantic, Supabase (Auth + Postgres), React + Tailwind,
`react-hook-form` (add it to your own branch, note it in the
requirements ADD-ONS section per GIT_WORKFLOW.md), `lucide-react` for
icons, `framer-motion` for the step-transition animation between
onboarding screens (this is the very first thing a judge sees, make it
feel smooth: animate each step in/out, animate the role-selector cards
on hover/select).

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: push the skeleton to `main`, cut all 6 branches, push them,
  share clone instructions with the team, read `docs/CONTRACTS.md`
  yourself so you can answer questions.
- Hour 1-3: Supabase project setup, `profiles` + related tables, wire
  `backend/app/core/supabase_client.py` for real.
- Hour 3-6: registration + role-adaptive form (frontend), `/register`
  endpoint.
- Hour 6-9: Communication Profile onboarding screen + endpoint — make
  this screen visually the nicest one, it's the "core innovation."
- Hour 9-11: intake form + endpoint.
- Hour 11-13: consent screen + endpoint.
- Hour 13-14: polish animations, push, write a short demo script for
  your own slice.
- Hour 14-20: (parallel with others still finishing) start acting as
  integration captain — as branches land, merge per
  `docs/GIT_WORKFLOW.md` §Merge order, uncomment the router/route
  registration lines, run both servers, smoke-test each domain.
- Hour 20-24: swap mocks → live calls with each teammate, freeze `main`.

DO NOT
-------
- Do not build screening, matching/booking, learning path, session/
  smartboard, or docs/dashboard features — those are other people's
  branches.
- Do not add new fields to the frozen shared types without telling the
  team first.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- A user can pick a role, fill the adaptive form, and land in Supabase.
- Communication Profile saves and is retrievable.
- Intake + consent both save and are retrievable.
- `GET /health` and `GET /api/auth/ping` both return 200 once my router
  is registered.
- Everything is on `feature/naren-auth`, pushed, with clean commits.

Now start by helping me scaffold/commit the provided skeleton exactly
as given, then build out my four endpoints and onboarding UI in the
order above. Ask me for my Supabase project keys when you need them —
don't invent placeholder secrets into committed files, only into
`.env` (gitignored), never `.env.example`.
