import os
import json
from datetime import datetime, timezone
from pathlib import Path

USE_MOCKS = os.getenv("USE_MOCKS", "True").lower() == "true"

MOCK_FILE_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / "shared" / "mocks" / "screening_result.mock.json"

async def run_full_pipeline(case_id: str, clip_urls: dict) -> dict:
    if USE_MOCKS:
        with open(MOCK_FILE_PATH, "r", encoding="utf-8") as f:
            mock_data = json.load(f)
        
        mock_data["case_id"] = case_id
        mock_data["created_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        return mock_data
    else:
        raise NotImplementedError("Full pipeline stages will be wired in Phase 3")
