from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

from .biomarkers import bucket_biomarkers
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
    buckets = bucket_biomarkers(policy_result)

    client.table("biomarker_snapshots").insert(
        {
            "checkin_id": checkin_id,
            "t_offset_ms": t_offset_ms,
            "helios": buckets.get("helios") or None,
            "apollo": buckets.get("apollo") or None,
            "psyche": buckets.get("psyche") or None,
            "policy_result": policy_result,
            "concordance": r.get("concordance_analysis"),
        }
    ).execute()


def list_circle_recipients(
    circle_id: str,
    *,
    exclude_profile_id: str | None = None,
) -> list[dict[str, Any]]:
    """Return profiles in a circle that have a phone_e164 set.

    Includes both the patient and supporters. Used to fanout briefs.
    """
    client = _client()
    if not client:
        return []
    rows: list[dict[str, Any]] = []
    # Supporters (join supporters → profiles).
    sup = (
        client.table("supporters")
        .select("id, profile_id, relationship, profiles(id, display_name, phone_e164)")
        .eq("circle_id", circle_id)
        .execute()
    )
    for s in sup.data or []:
        p = s.get("profiles") or {}
        if p.get("phone_e164"):
            rows.append(
                {
                    "profile_id": p["id"],
                    "supporter_id": s["id"],
                    "phone_e164": p["phone_e164"],
                    "display_name": p.get("display_name"),
                    "role": "supporter",
                }
            )
    # Patient (from care_circles.patient_id → profiles).
    cc = (
        client.table("care_circles")
        .select("patient_id, profiles:patient_id(id, display_name, phone_e164)")
        .eq("id", circle_id)
        .limit(1)
        .execute()
    )
    if cc.data:
        p = cc.data[0].get("profiles") or {}
        if p.get("phone_e164"):
            rows.append(
                {
                    "profile_id": p["id"],
                    "supporter_id": None,
                    "phone_e164": p["phone_e164"],
                    "display_name": p.get("display_name"),
                    "role": "patient",
                }
            )
    if exclude_profile_id:
        rows = [r for r in rows if r["profile_id"] != exclude_profile_id]
    return rows


def profile_by_phone(phone_e164: str) -> dict[str, Any] | None:
    client = _client()
    if not client:
        return None
    p = phone_e164.lstrip("+")
    r = (
        client.table("profiles")
        .select("id, display_name, phone_e164")
        .eq("phone_e164", p)
        .limit(1)
        .execute()
    )
    if r.data:
        return r.data[0]
    return None


def log_whatsapp_message(
    *,
    direction: str,
    msg_type: str,
    wa_message_id: str | None = None,
    from_e164: str | None = None,
    to_e164: str | None = None,
    body: str | None = None,
    media_id: str | None = None,
    media_mime: str | None = None,
    profile_id: str | None = None,
    circle_id: str | None = None,
    checkin_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> str | None:
    client = _client()
    if not client:
        return None
    res = (
        client.table("whatsapp_messages")
        .insert(
            {
                "direction": direction,
                "msg_type": msg_type,
                "wa_message_id": wa_message_id,
                "from_e164": (from_e164 or "").lstrip("+") or None,
                "to_e164": (to_e164 or "").lstrip("+") or None,
                "body": body,
                "media_id": media_id,
                "media_mime": media_mime,
                "profile_id": profile_id,
                "circle_id": circle_id,
                "checkin_id": checkin_id,
                "payload": payload,
            }
        )
        .execute()
    )
    if res.data:
        return res.data[0]["id"]
    return None


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
