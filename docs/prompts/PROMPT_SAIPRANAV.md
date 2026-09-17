PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team on 6 isolated git branches against
a frozen shared contract. I am Sai Pranav. My role is the **Live
Therapy Session (Jitsi + Smartboard), the AI Live Demonstration
feature, and the AI Animated Module Library** (Steps 11, 11B, and
11C of the product spec) — the most real-time-heavy slice of the app.
Do not build any other person's feature.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice. Naren has pushed an initial
  skeleton to `main` and cut branch `feature/saipranav-session` for
  me. Help me `git clone` it and `git checkout feature/saipranav-session`.
- Stack: FastAPI (Python) backend with a WebSocket relay, React +
  TypeScript + Tailwind (Vite) frontend, Supabase Storage, Gemini Pro
  for storyboard generation, Jitsi Meet SDK for video.
- The repo has `docs/CONTRACTS.md`, `docs/GIT_WORKFLOW.md`, and
  `shared/mocks/*`. I need flagged errors (Salman) and a therapy plan
  (Kavya) — use `shared/mocks/screening_result.mock.json` and
  `shared/mocks/therapy_plan.mock.json` instead of their real code.
  I produce `shared/mocks/session_record.mock.json` and
  `shared/mocks/module_library.mock.json`-shaped data for Sanjeevi
  and Sameer to consume the same way.

MY MISSION — STEP 11 + 11B + 11C
------------------------------------
**Step 11 — Therapy Session.** Jitsi Meet embedded call. Flashcards
(simple image-based exercise cards). A mandatory Smartboard: live
cursor tracking, a "your turn" indicator (only the active participant
can draw), 5-color drawing + text tool, 3 preloaded templates (mouth
diagram, alphabet grid, number line), tap-to-respond/picture-word
matching with instant feedback, draggable word-building letter tiles
synced live, sticker rewards (star/checkmark/thumbs-up), floating
emoji reactions, a text-chat sidebar fallback, and a "save snapshot"
action. Build the sync over a lightweight FastAPI WebSocket relay at
`/ws/board/{session_id}` — the backend ONLY relays JSON messages
between connected clients, all drawing/state logic lives client-side.
Add a low-bandwidth/audio-only fallback toggle (video off, everything
else keeps working) and a mandatory "Parent Present" checkbox gate for
pediatric cases (just a UI gate, no verification needed).

**Step 11B — AI Live Demonstration Generation.** Not real video
generation (doesn't exist free/real-time) — an AI-directed animated
visual demo, generated live during a session, 5-15 seconds, disposable.
1. Trigger: therapist clicks "Generate Demo" for a target phoneme/word.
2. Gemini (~1-2 sec): target + age + reading ability + language → strict
   JSON step list (visual asset id + narration text per step).
3. Map steps to a small pre-built SVG asset library you create
   yourself (mouth cross-sections, tongue positions, airflow arrows —
   draw ~15-20 simple SVGs covering 2-3 phonemes, that's enough for a
   demo). Drop any asset id Gemini returns that you don't recognize —
   never let it break the sequence.
4. Assemble client-side with CSS keyframes / `anime.js` into a 5-15s
   playback.
5. Narrate with Piper TTS (see TTS setup note below); Coqui as fallback.
6. Play animation + narration together next to the Smartboard.
7. Auto-attach the generated demo to the relevant milestone (call
   Sameer's endpoint shape conceptually, but during solo dev just
   store a `linked_demo_id` locally — real wiring happens at merge).

**Step 11C — AI Animated Module Library.** Same honest framing: Gemini
Pro does not generate video — this is the SAME mechanism as 11B,
extended to a **30-second** format and saved into a **persistent,
browsable library** instead of thrown away after one session.
1. Two triggers: mid-session "Generate Module Animation" (30s
   version), or an async "Library Admin" screen to pre-build modules
   without a live session.
2. Gemini storyboard: ~6-10 scenes summing to 30s, same JSON contract
   pattern as 11B, just longer.
3. Same asset-validation guardrail; if too few scenes resolve, fall
   back to the 11B short-form format instead of publishing something
   broken.
4. Assembly: reuse the 11B approach; for the mouth/tongue cross-
   section transitions specifically, use pre-built Lottie files via
   `lottie-react` for smoother longer playback (a couple of simple
   Lottie animations are enough — check lottiefiles.com for free
   mouth/anatomy-style assets, or hand-roll 2-3 in a Lottie editor if
   time allows; don't over-invest here, the SVG+anime.js path is the
   fallback and is fine for the demo).
5. Narration: Piper/Coqui, one track cut to scene timestamps.
6. **Every module requires an explicit approve/reject screen** before
   it enters the library — this is stricter than 11B because it's
   reused across patients, not a one-off.
7. Store approved modules in Supabase Storage (audio) +
   `module_library` table (metadata). Browsable/searchable list view.
8. Cache check: before generating, check if an approved module already
   exists for `(phoneme, age_band, language)` — skip regeneration if so.

PIPER TTS SETUP NOTE
----------------------
Piper is a CLI binary + voice model, not a pure pip package — download
a prebuilt binary + a small English voice model from the Piper GitHub
releases, shell out to it from a FastAPI service function, cache the
audio file in Supabase Storage. If Piper setup eats too much time,
fall back to any free browser-native TTS (Web Speech API
`SpeechSynthesis`) for the demo and note honestly that Piper is the
intended production path — a working audio-first demo beats a stalled
CLI install fight.

MY FILE SCOPE (only these)
----------------------------
- `backend/app/routers/session.py`
- `backend/app/models/session.py`
- `backend/app/services/session/*` (put the SVG asset map, storyboard
  generation, and TTS wrapper here)
- `frontend/src/features/session-smartboard/*`

ENDPOINTS TO BUILD (mounted at `/api/session` at integration time —
build paths WITHOUT that prefix)
------------------------------------------------------------------
- `WS /ws/board/{session_id}` — smartboard relay (raw JSON passthrough).
- `POST /demo/generate` — 11B, returns a 5-15s animation spec.
- `POST /modules/generate` — 11C, returns a pending-approval 30s
  storyboard.
- `POST /modules/{id}/approve` — marks a module approved + stores it.
- `GET /modules?phoneme=&age_band=&language=` — list of
  `ModuleLibraryEntry` (frozen shape — match it exactly).

DATA MODEL YOU OWN
--------------------
```
sessions(id, case_id, therapist_id, jitsi_room_id, parent_present bool,
         low_bandwidth_mode bool)
board_snapshots(session_id, snapshot_json, saved_at)
demo_generations(id, session_id, phoneme, storyboard_json, created_at)
module_library(id, phoneme, age_band, language, title, storyboard_json,
                narration_audio_url, duration_seconds,
                source [mid-session/library-admin], approved_by, approved_at)
module_attachments(module_id, milestone_id nullable, session_id nullable)
```
`module_library` rows must match `ModuleLibraryEntry`'s frozen shape
exactly (`id, phoneme, ageBand, language, title, durationSeconds,
narrationAudioUrl, approved`).

TECH STACK FOR THIS SLICE
--------------------------
Jitsi Meet SDK (free, embeddable iframe API), FastAPI `websockets` for
the board relay, `google-generativeai` for storyboards, hand-drawn SVG
asset library, `anime.js` for short animations, `lottie-react` for the
30s longer transitions, Piper TTS (Coqui/Web Speech fallback),
`framer-motion` for reaction/sticker pop animations, `lucide-react`
icons for board tools.

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: clone, checkout branch, read CONTRACTS.md, get a basic
  Jitsi iframe embedded and connecting between two browser tabs.
- Hour 1-4: WebSocket relay + basic Smartboard drawing sync (cursor +
  5-color pen) between two tabs.
- Hour 4-6: turn indicator, templates, sticker rewards, emoji
  reactions, chat fallback, low-bandwidth toggle, parent-present gate.
- Hour 6-8: draw the SVG asset library (mouth/tongue/airflow, 2-3
  phonemes worth).
- Hour 8-10: 11B — Gemini storyboard → asset mapping → anime.js
  playback → Piper narration.
- Hour 10-12: 11C — extend to 30s storyboard + Lottie transitions +
  approval screen.
- Hour 12-13: module library list/browse screen + cache check.
- Hour 13-14: end-to-end test both demo lengths, push.

DO NOT
-------
- Do not build auth/onboarding, screening, matching/booking, learning
  path, or docs/dashboard — other people's branches.
- Do not claim or imply real AI video generation anywhere in code
  comments, UI copy, or logs — it's procedural animation, say so.
- Do not let an unapproved module appear in the public library list.
- Do not synthesize any real person's face or voice.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- Two browser tabs can join the same session and see synced Smartboard
  drawing + cursor + turn indicator in real time.
- `/demo/generate` produces a playable 5-15s animation with narration
  for at least one phoneme.
- `/modules/generate` produces a playable 30s animation with
  narration, gated behind an approval step, then listable via
  `/modules`.
- Everything on `feature/saipranav-session`, pushed, clean commits.

Now start by helping me clone the repo, check out my branch, and get
the Jitsi iframe + a bare WebSocket echo working between two tabs
first — that's the riskiest real-time plumbing, prove it before
building the animation features on top of it.
