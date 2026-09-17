# GIT_WORKFLOW.md

## Branches

```
main                      <- protected, only Naren merges into this
├── feature/naren-auth
├── feature/salman-screening
├── feature/kavya-matching
├── feature/sameer-learning
├── feature/saipranav-session
└── feature/sanjeevi-docs
```

## Setup (Naren does this first, hour 0)

1. `git init`, commit this entire skeleton (backend/, frontend/, shared/, docs/) straight to `main`, push to `github.com/NarenXO/HouseOfVoice`.
2. Create the six branches above off `main`, push them.
3. Everyone clones the repo and checks out **only their own branch**.

```bash
git clone https://github.com/NarenXO/HouseOfVoice.git
cd HouseOfVoice
git checkout feature/<yourname>-<domain>
```

## During the 24 hours

- Commit often, on your own branch only, with clear messages:
  `git commit -m "screening: wire Wav2Vec2 phoneme scoring"`
- Push regularly: `git push origin feature/<yourname>-<domain>`
- **Never** `git checkout main` and edit there.
- **Never** edit a file this list marks as someone else's (see CONTRACTS.md §5).
- If you truly need a shared file changed, message the team — don't just change it.

## Merge order (hour ~20-24, Naren drives this)

Merge in this order — each one is low-conflict-risk because every branch
only touched its own folders:

1. `feature/naren-auth` → `main` (this is the "trunk", includes the initial scaffold anyway)
2. `feature/salman-screening` → `main`
3. `feature/kavya-matching` → `main`
4. `feature/sameer-learning` → `main`
5. `feature/saipranav-session` → `main`
6. `feature/sanjeevi-docs` → `main`

For each: `git checkout main && git pull && git merge feature/<branch> --no-ff`
Resolve conflicts (should be near-zero if scope was respected — the only
files that could realistically conflict are `main.py`, `App.tsx`,
`requirements.txt`, `package.json`, and only because Naren himself is
editing them during this step, not because of a real clash).

## Integration step (Naren, after all six are merged)

1. In `backend/app/main.py`: uncomment the six import + `include_router` lines.
2. In `frontend/src/App.tsx`: uncomment the six import lines + the route spread.
3. `pip install -r backend/requirements.txt`, `npm install` in `frontend/`.
4. Run both servers, click through all six domains end to end.
5. Swap `USE_MOCKS = True` to `False` one domain at a time, retest after each swap — if a live call fails during the demo, flip that one flag back to `True` as an instant fallback.

## Commit message convention (optional but recommended)

`<domain>: <what changed>` — e.g. `learning: add checkpoint + probe endpoint`
