PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team on 6 isolated git branches against
a frozen shared contract. I am Sameer. My role is the **Learning Path,
the Generalization Probe Engine, and the Learning Engine that ties them
together** — this is the flagship feature of the whole app. Do not
build any other person's feature.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice. Naren has pushed an initial
  skeleton to `main` and cut branch `feature/sameer-learning` for me.
  Help me `git clone` it and `git checkout feature/sameer-learning`.
- Stack: FastAPI (Python) backend, React + TypeScript + Tailwind
  (Vite) frontend, Supabase, Gemini Pro.
- The repo has `docs/CONTRACTS.md`, `docs/GIT_WORKFLOW.md`, and
  `shared/mocks/*`. I need therapy goals (Kavya's domain) and flagged
  errors (Salman's domain) — I use
  `shared/mocks/therapy_plan.mock.json` and
  `shared/mocks/screening_result.mock.json` instead of calling their
  real code. I produce `shared/mocks/learning_path.mock.json` and
  `shared/mocks/generalization_score.mock.json`-shaped data for
  Sanjeevi and Sai Pranav to consume the same way.

MY MISSION — STEPS 9B + 9C + THE LEARNING ENGINE
---------------------------------------------------
**Step 9B — Learning Path Generation.** Turn therapy goals + flagged
errors + Communication Profile into an ordered, visual sequence of
milestones the patient can see themselves walking through.
1. Gemini drafts an ordered milestone list as structured JSON (title,
   goal, exercises) from mocked goals + mocked flagged errors.
2. Expose an edit surface (reorder/edit/add/remove) before a path is
   marked live — never auto-finalize.
3. Render a visual roadmap: completed stops marked, current stop
   highlighted, future stops soft-locked (greyed out, not hard-blocked
   — a manual "unlock anyway" action must exist).
4. Each milestone = goal + instructions + daily practice suggestions +
   a done/not-done tracker.
5. Configurable rule: N successful practice days before a checkpoint
   fires (default 3, matches the probe checkpoint below).

**Step 9C — Generalization Probe Engine (HOAL) — THE headline feature.**
The clinical gold standard in speech therapy isn't "can they say the
trained word," it's *generalization*: can they produce the sound
correctly on a word they've never practiced. Build this exactly:
```
Patient masters "s" in: sun, sock, soap  (trained/drilled words)
        ↓
Checkpoint triggers after 3 consecutive successes on trained items
        ↓
Engine inserts an UNTRAINED probe word (e.g. "saddle") — selected by
Gemini from a FIXED, pre-approved word list (never invented at
run-time), same UI as any normal drill item, no warning shown
        ↓
Scored the same way as any drill attempt (mock a scoring call here —
Salman's real Wav2Vec2 pipeline is out of my scope, stub a
`score_attempt(audio_or_text) -> pass/fail` function with a
deterministic-but-plausible fake for demo purposes, matching the same
interface Salman's real one will expose)
        ↓
Pass → milestone status = "generalized", badge awarded, next milestone
       unlocks
Fail → milestone status stays "trained", engine serves MORE TRAINED
       VARIETY (not harder items), never shown as failure to the patient
```
Rules to enforce: probes only ever come from the clinician-approved
`probe_word_bank` (seed it yourself with ~10-15 words across 2-3
phonemes for the demo); Gemini's role is *selection*, never free
generation of a new word; cap probe frequency at 1 per 4 drill items.

**Learning Engine (ties 9B + 9C together, plus gamification).**
- Milestone status state machine: `locked → active → trained →
  generalized`. This exact 4-value enum is frozen in
  `backend/app/models/shared.py` / `frontend/src/shared/types.ts` —
  don't add new statuses.
- Streak counter (consecutive practice days) — simple counter.
- Badges awarded specifically on reaching `generalized`, not merely
  `trained` — this is what makes the badge mean something.
- Roadmap gets two marker styles: checkmark for `trained`, star for
  `generalized`.
- Aggregate `probes_attempted` / `probes_passed` / `rate` per phoneme
  into `GeneralizationScore` (frozen shape) — this is the number
  Sanjeevi's dashboard displays as the headline stat.

MY FILE SCOPE (only these)
----------------------------
- `backend/app/routers/learning.py`
- `backend/app/models/learning.py`
- `backend/app/services/learning/*`
- `frontend/src/features/learning-path/*`

ENDPOINTS TO BUILD (mounted at `/api/learning` at integration time —
build paths WITHOUT that prefix)
------------------------------------------------------------------
- `POST /paths/generate` — Gemini-drafted path from mocked
  goals/errors, returns editable milestone list.
- `POST /paths/{id}/approve` — locks the path live.
- `GET /paths/{case_id}` — list of `Milestone`.
- `POST /milestones/{id}/practice-attempt` — records a trained-item
  attempt (done/not-done + pass/fail via the stubbed scorer).
- `POST /milestones/{id}/checkpoint` — fires after N consecutive
  successes; selects and serves a probe word; returns a `ProbeResult`.
- `GET /generalization/{case_id}/{phoneme}` — returns
  `GeneralizationScore`.

DATA MODEL YOU OWN
--------------------
```
learning_paths(case_id, generated_by, approved_by, approved_at)
milestones(id, path_id, order_index, title, goal,
           status [locked/active/trained/generalized], linked_demo_id nullable)
milestone_exercises(milestone_id, instructions, done, completed_at)
probe_word_bank(id, phoneme, word, difficulty, clinician_approved)
practice_attempts(id, milestone_id, is_probe bool default false,
                   probe_word_id nullable, passed bool, attempted_at)
generalization_scores(case_id, phoneme, probes_attempted, probes_passed,
                       rate, last_updated)
streaks(case_id, current_streak_days, last_practice_date)
badges(case_id, milestone_id, awarded_at)
```

TECH STACK FOR THIS SLICE
--------------------------
FastAPI + Pydantic, Supabase, `google-generativeai` for path drafting
and probe-word selection, React + Tailwind, `framer-motion` for the
milestone-unlock animation, the roadmap-stop reveal, and — the key
demo beat — the checkmark-to-star "Generalized" flip animation when a
probe is scored. `lucide-react` for lock/unlock/star/checkmark icons.
`recharts` for a small generalization-rate gauge on your own screen
(Sanjeevi builds the full dashboard version, but yours should still
visibly show the number for your own demo).

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: clone, checkout branch, read CONTRACTS.md, seed
  `probe_word_bank` with ~10-15 words across 2-3 phonemes.
- Hour 1-3: `/paths/generate` (Gemini) + milestone editor UI.
- Hour 3-5: roadmap visualization (locked/active/trained/generalized).
- Hour 5-7: practice-attempt endpoint + done/not-done tracker UI.
- Hour 7-10: checkpoint + probe engine — this is the core, budget the
  most time here. Stub the scorer first so you can test the state
  machine before worrying about real audio.
- Hour 10-12: generalization score aggregation + your own small
  results view.
- Hour 12-13: streaks + badges + the flip animation.
- Hour 13-14: end-to-end test: drill 3 trained items → checkpoint →
  probe → pass/fail branches both work → push.

DO NOT
-------
- Do not build auth/onboarding, screening, matching/booking, session/
  smartboard, or docs/dashboard — other people's branches.
- Do not let Gemini invent a probe word outside the approved bank.
- Do not show probe failure as a visible failure state to the patient.
- Do not add a fifth milestone status — the enum is frozen at four.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- A path can be generated, edited, and approved.
- The roadmap renders all four milestone states correctly.
- A checkpoint reliably fires after 3 consecutive trained successes.
- A probe is served from the approved bank only, scored, and both the
  pass and fail branches behave exactly as specified above.
- `GeneralizationScore` is computable and correct for a demo case.
- Everything on `feature/sameer-learning`, pushed, clean commits.

Now start by helping me clone the repo, check out my branch, seed the
probe word bank, and build the milestone state machine with a stubbed
scorer first — get the pass/fail branching logic solid before touching
any UI polish.
