"""OWNERSHIP: Salman. Step 3 + Step 5 — baseline recording + AI screening pipeline."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping():
    return {"module": "screening", "status": "ok"}

# TODO(Salman): build baseline assessment + screening pipeline endpoints here.
