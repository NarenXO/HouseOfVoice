"""
Shared Supabase client factory. OWNERSHIP: Naren.
Import `get_supabase()` in your own service file — don't edit this file.
"""
from supabase import create_client, Client
from app.core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client
