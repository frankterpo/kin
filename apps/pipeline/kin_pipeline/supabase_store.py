from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

from .config import settings


def _client() -> Optional[Client]:
    s = settings()
    if not s.supabase_url or not s.supabase_service_role:
        return None
    return create_client(s.supabase_url, s.supabase_service_role)


def create_checkin(
    *,
    circle_id: str,
    author_id: str,
    source: str = "patient",
) -> Optional[str]:
    client = _client()
    if not client:
        return None
    res = (
        client.table("checkins")
        .insert(
            {
                "circle_id": circle_id,
                "author_id": author_id,
                "source": source,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .execute()
    )
    if res.data:
        return res.data[0]["id"]
    return None


def finalize_checkin(
    *,
    checkin_id: str,
    transcript: str,
    duration_ms: int,
) -> None:
    client = _client()
    if not client:
        return
    client.table("checkins").update(
        {
            "transcript": transcript,
            "duration_ms": duration_ms,
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", checkin_id).execute()


def save_biomarker_snapshot(
    *,
    checkin_id: str,
    policy_result: dict[str, Any],
    t_offset_ms: int = 0,
) -> None:
    client = _client()
    if not client:
        return

    r = policy_result.get("result", policy_result)
    bio = r.get("biomarkers", {}) or r.get("biomarker_summary", {}) or {}

    client.table("biomarker_snapshots").insert(
        {
            "checkin_id": checkin_id,
            "t_offset_ms": t_offset_ms,
            "helios": bio.get("helios"),
            "apollo": bio.get("apollo"),
            "psyche": bio.get("psyche"),
            "policy_result": policy_result,
            "concordance": r.get("concordance_analysis"),
        }
    ).execute()


def upsert_supporter_brief(
    *,
    circle_id: str,
    supporter_id: str,
    headline: str,
    guidance: str,
    tone_cues: list[str],
    derived_from: str | None = None,
) -> None:
    client = _client()
    if not client:
        return
    client.table("supporter_briefs").upsert(
        {
            "circle_id": circle_id,
            "supporter_id": supporter_id,
            "for_date": datetime.now(timezone.utc).date().isoformat(),
            "headline": headline,
            "guidance": guidance,
            "tone_cues": tone_cues,
            "derived_from": derived_from,
        },
        on_conflict="supporter_id,for_date",
    ).execute()
