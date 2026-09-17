"""
Shared, frozen config loader. OWNERSHIP: Naren.
Everyone else: import `settings` from here, never edit this file.
Add any new env var your feature needs to .env.example (append-only)
and read it with os.getenv in your OWN router/service file instead of
editing this class, so nobody's PR touches the same lines.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
