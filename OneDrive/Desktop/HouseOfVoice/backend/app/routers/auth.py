"""Naren's auth router — stub. Build out in Phase 2-5."""
from fastapi import APIRouter

router = APIRouter()

@router.get("/ping")
async def ping():
    return {"message": "auth service alive"}
