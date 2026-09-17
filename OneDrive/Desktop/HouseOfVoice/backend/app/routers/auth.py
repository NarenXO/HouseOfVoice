"""OWNERSHIP: Naren. Steps 1-4 — registration, onboarding, Communication Profile, consent."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping():
    return {"module": "auth", "status": "ok"}

# TODO(Naren): build registration, onboarding, communication-profile, consent endpoints here.
