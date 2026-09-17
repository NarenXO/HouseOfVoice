from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HouseOfVoice API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health ---
@app.get("/health")
async def health():
    return {"status": "ok"}

# --- Router registration (uncomment during integration) ---
from app.routers.auth import router as auth_router
# from app.routers.screening import router as screening_router
# from app.routers.matching import router as matching_router
# from app.routers.learning import router as learning_router
# from app.routers.session import router as session_router
from app.routers.docs import router as docs_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
# app.include_router(screening_router, prefix="/api/screening", tags=["screening"])
# app.include_router(matching_router, prefix="/api/matching", tags=["matching"])
# app.include_router(learning_router, prefix="/api/learning", tags=["learning"])
# app.include_router(session_router, prefix="/api/session", tags=["session"])
app.include_router(docs_router, prefix="/api/docs", tags=["docs"])
