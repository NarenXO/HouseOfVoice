"""
Domain-specific pydantic models. OWNERSHIP: whoever owns app/routers/learning.py.
Extend freely — this file belongs only to you, so it can never conflict
with anyone else's PR. Import shared shapes from app.models.shared, don't
redefine them here.
"""
from pydantic import BaseModel
from app.models.shared import *  # noqa: F401,F403  (shared contract types)

# TODO: add your own request/response models below.
