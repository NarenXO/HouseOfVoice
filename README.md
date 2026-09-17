# HouseOfVoice — Team DEXTERS (6-person build)

AI-powered speech-language therapy & learning platform. Hackathon build,
24 hours, 6 people, 6 fully decoupled workstreams.

## Read these in order

1. `docs/CONTRACTS.md` — the frozen data/API contract everyone builds against.
2. `docs/GIT_WORKFLOW.md` — branches, merge order, integration step.
3. `docs/prompts/PROMPT_<yourname>.md` — your full build brief, paste into your own Claude.

## Quickstart

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 24-hour timeline (suggested)

| Hour | Milestone |
|---|---|
| 0 - 1 | Naren pushes this skeleton to `main`, cuts 6 branches, team clones, reads CONTRACTS.md |
| 1 - 14 | Everyone builds their domain end-to-end **against mocks**, on their own branch |
| 14 - 16 | Everyone pushes a working, demo-able version of their own domain |
| 16 - 20 | Naren merges branches in the documented order, does the integration step |
| 20 - 22 | Swap mocks for live calls one domain at a time, team-wide smoke test |
| 22 - 24 | Bugfix buffer, rehearse the demo script, freeze `main` |

## Who owns what

| Person | Branch | Domain |
|---|---|---|
| Naren | `feature/naren-auth` | Registration, onboarding, Communication Profile, consent, shared scaffold, final integration |
| Salman | `feature/salman-screening` | Baseline assessment + AI screening pipeline |
| Kavya | `feature/kavya-matching` | Therapist matching, booking, therapy plan, supervisor assignment |
| Sameer | `feature/sameer-learning` | Learning Path + Generalization Probe Engine + gamification |
| Sai Pranav | `feature/saipranav-session` | Live session, Smartboard, AI Live Demo, AI Animated Module Library |
| Sanjeevi | `feature/sanjeevi-docs` | Documentation assistant, dashboard, flags, reassessment, feedback, supervisor eval, case completion |
