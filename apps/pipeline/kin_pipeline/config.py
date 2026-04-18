import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))


class Settings(BaseModel):
    speechmatics_api_key: str = os.getenv("SPEECHMATICS_API_KEY", "")
    thymia_api_key: str = os.getenv("THYMIA_API_KEY", os.getenv("THIMYA_API_KEY", ""))

    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role: str = os.getenv("SUPABASE_SERVICE_ROLE", "")

    sample_rate: int = 16_000
    chunk_size: int = 4_096

    demo_circle_id: str = "00000000-0000-0000-0000-0000000000aa"
    demo_patient_id: str = "00000000-0000-0000-0000-000000000001"


@lru_cache
def settings() -> Settings:
    s = Settings()
    if not s.speechmatics_api_key:
        raise RuntimeError("SPEECHMATICS_API_KEY missing")
    if not s.thymia_api_key:
        raise RuntimeError("THYMIA_API_KEY missing")
    return s
