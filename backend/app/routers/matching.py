"""OWNERSHIP: Kavya. Steps 6-10 — therapist recommendation, booking, therapy plan, supervisor assignment."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping():
    return {"module": "matching", "status": "ok"}

# TODO(Kavya): build matching, booking, plan-draft endpoints here.
