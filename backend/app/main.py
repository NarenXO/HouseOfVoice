"""
HouseOfVoice API — entrypoint.

OWNERSHIP: Naren only. Nobody else edits this file during the 24h build.
Every other teammate builds their router in app/routers/<domain>.py and
their own domain stays completely un-registered (and therefore harmless
to everyone else) until integration time.

INTEGRATION STEP (done once, by Naren, after all 6 branches are merged
into `main`): uncomment the import + include_router lines below for each
router that now exists on disk. That is the ONLY change required to wire
the whole team's backend together.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HouseOfVoice API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "houseofvoice-api"}


# ============================================================
# ROUTER REGISTRATION — INTEGRATION STEP ONLY. Uncomment as each
# teammate's router lands on `main` after merge.
# ============================================================
# from app.routers import auth as auth_router
# from app.routers import screening as screening_router
# from app.routers import matching as matching_router
<<<<<<< HEAD
from app.routers import learning as learning_router
from app.routers import session as session_router
# from app.routers import docs as docs_router
#
# app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
# app.include_router(screening_router.router, prefix="/api/screening", tags=["screening"])
# app.include_router(matching_router.router, prefix="/api/matching", tags=["matching"])
<<<<<<< HEAD
app.include_router(learning_router.router, prefix="/api/learning", tags=["learning"])
app.include_router(session_router.router, prefix="/api/session", tags=["session"])
# app.include_router(docs_router.router, prefix="/api/docs", tags=["docs"])
