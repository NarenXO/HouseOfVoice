PASTE EVERYTHING BELOW THIS LINE INTO YOUR OWN CLAUDE SESSION
================================================================

You are helping me build my slice of a 24-hour hackathon app called
HouseOfVoice — an AI-powered speech-language therapy and learning
platform, built by a 6-person team on 6 isolated git branches against
a frozen shared contract. I am Salman. My role is the **Baseline
Speech Assessment + AI Screening Pipeline** (Steps 3 and 5 of the
product spec). Do not build any other person's feature.

CONTEXT YOU MUST ACCEPT AS FACT
--------------------------------
- Repo: github.com/NarenXO/HouseOfVoice. Naren has pushed an initial
  skeleton to `main` and cut branch `feature/salman-screening` for me.
  Help me `git clone` it and `git checkout feature/salman-screening`.
- Stack: FastAPI (Python) backend, React + TypeScript + Tailwind
  (Vite) frontend, Supabase for storage, Gemini Pro for the plain-
  language explanation step.
- The repo has `docs/CONTRACTS.md` (the frozen data contract),
  `docs/GIT_WORKFLOW.md` (branch/merge rules), and `shared/mocks/*`
  (fixtures for any upstream data I might need — I don't need any,
  I'm the first stage of the pipeline).
- I must produce data in the exact shape of `ScreeningResult`, which
  is already frozen in `backend/app/models/shared.py` (Python) and
  `frontend/src/shared/types.ts` (TypeScript). Don't redefine it,
  import it.

MY MISSION — STEP 3 + STEP 5
------------------------------
**Step 3 — Baseline Speech Assessment (frontend + upload endpoint):**
patient records inside the app via three standardized prompts: a fixed
sentence reading, a picture description task, and a spontaneous speech
sample. Standardization is what makes future comparisons meaningful —
don't let the patient free-record something else. Build a simple
in-browser recorder (MediaRecorder API) with a 3-step wizard, upload
each clip to Supabase Storage.

**Step 5 — AI Screening Pipeline (backend, this is the heavy part):**
Not a diagnosis — an objective screening summary for the therapist.

```
Speech Recording
  → Whisper (speech-to-text)                — faster-whisper, local
  → Silero VAD (pause/silence detection)     — pretrained
  → librosa (acoustic feature extraction)    — pitch, energy, etc.
  → Wav2Vec2 (phoneme-level confidence)      — pretrained, HuggingFace
  → Resemblyzer (speaker embeddings,
    voice-stability vs. baseline)            — pretrained
  → scikit-learn classifier (speech metrics) — simple, trained fast
    on synthetic/small labeled data if needed for the demo
  → Gemini (plain-language explanation
    for the therapist)                       — final step only
```

Output must match the frozen `ScreeningResult` shape exactly: speech
rate, pause frequency, pronunciation score, fluency indicators, voice
stability, clarity, confidence level, and a list of specific
phoneme/word errors (e.g. `["s - end of words", "th - start of words"]`
— this exact string format matters, Sameer's Learning Path feature and
Sai Pranav's AI Demo feature both parse these strings to pick a
phoneme target, so keep the `"<phoneme> - <position>"` pattern).

TIME-BUDGET REALITY CHECK — read this before you start
---------------------------------------------------------
Six pretrained models in one pipeline in ~14 hours is genuinely tight.
Build it in this fallback-safe order so there is ALWAYS something that
works for the demo, even if you run out of time on the later stages:
1. Whisper transcription — get this working first, it's the spine.
2. Silero VAD — pause/silence detection, fast to add.
3. librosa features — speech rate, basic acoustic stats.
4. Wav2Vec2 phoneme confidence — this is the one most likely to eat
   your day; if it's not converging, use a simpler confidence proxy
   (e.g. per-word Whisper token confidence) and note it honestly as a
   "fallback scorer" rather than blocking on it.
5. Resemblyzer voice-stability — nice-to-have, add last.
6. scikit-learn classifier — keep this simple; even a hand-tuned
   threshold rule counts as "the classifier" for a 24h MVP, be honest
   about it internally, don't oversell it in the pitch.
7. Gemini plain-language explanation — quick, do this once the numbers
   exist.

MY FILE SCOPE (only these)
----------------------------
- `backend/app/routers/screening.py`
- `backend/app/models/screening.py`
- `backend/app/services/screening/*` (put the actual ML pipeline code
  here, one file per stage: `whisper_stage.py`, `vad_stage.py`,
  `feature_stage.py`, `phoneme_stage.py`, `voice_stage.py`,
  `classify_stage.py`, `explain_stage.py` — keeps it testable in
  isolation)
- `frontend/src/features/screening/*`

ENDPOINTS TO BUILD (mounted at `/api/screening` at integration time —
build paths WITHOUT that prefix)
------------------------------------------------------------------
- `POST /baseline-recording` — accepts an audio file upload (one of
  the three prompt types), stores it in Supabase Storage, returns a
  clip id.
- `POST /run-pipeline` — takes a `case_id` (and the three stored clip
  ids), runs the full pipeline, writes + returns a `ScreeningResult`.
- `GET /result/{case_id}` — returns the stored `ScreeningResult`.

DATA MODEL YOU OWN
--------------------
```
baseline_recordings(id, case_id, prompt_type [sentence/picture/spontaneous],
                     storage_url, recorded_at)
screening_results(case_id, speech_rate, pause_frequency, pronunciation_score,
                   fluency_score, voice_stability, clarity_score,
                   confidence_level, flagged_errors json, plain_language_summary,
                   created_at)
```

TECH STACK FOR THIS SLICE
--------------------------
`faster-whisper`, `silero-vad`, `torch`/`torchaudio`, `librosa`,
`transformers` (Wav2Vec2), `resemblyzer`, `scikit-learn`, `numpy`,
`pandas`, `google-generativeai` (Gemini). All already listed in the
repo's root `backend/requirements.txt` — don't edit that file, it's
frozen; if you need one more package, add it under the ADD-ONS section
at the bottom per `docs/GIT_WORKFLOW.md`. Frontend: plain
`MediaRecorder` Web API, no extra library needed for recording.

SUGGESTED HOUR-BY-HOUR
------------------------
- Hour 0-1: clone, checkout branch, read CONTRACTS.md, set up a local
  venv, install requirements, confirm `faster-whisper` runs on one
  sample clip from the command line before touching FastAPI at all.
- Hour 1-3: baseline recording wizard (frontend) + upload endpoint.
- Hour 3-6: Whisper + VAD stages wired into `/run-pipeline`.
- Hour 6-9: librosa features + Wav2Vec2 phoneme confidence.
- Hour 9-11: Resemblyzer + scikit-learn classifier (simple rule-based
  fallback is fine).
- Hour 11-12: Gemini plain-language explanation step.
- Hour 12-13: wire the frontend results screen to display the
  `ScreeningResult` nicely (Recharts for the score breakdown).
- Hour 13-14: test end to end on 2-3 real recorded clips, push.

DO NOT
-------
- Do not build auth/onboarding, matching/booking, learning path,
  session/smartboard, or docs/dashboard — other people's branches.
- Do not change the `ScreeningResult` shape — Sameer and Sai Pranav's
  features parse it exactly as frozen.

DEFINITION OF DONE FOR MY SLICE
---------------------------------
- Patient can record all 3 baseline prompts in-browser and they upload.
- `POST /run-pipeline` returns a fully-populated `ScreeningResult`
  matching the frozen shape, for at least one real test recording.
- Results render on a results screen with real numbers, not placeholders.
- Everything on `feature/salman-screening`, pushed, clean commits.

Now start by helping me clone the repo, check out my branch, and get
`faster-whisper` running standalone on a test file before we touch
FastAPI at all — that's the highest-risk dependency, prove it works
first.
