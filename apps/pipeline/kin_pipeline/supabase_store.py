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
    visibility: str = "circle",
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
                "visibility": visibility,
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
    visibility: str = "circle",
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
            "visibility": visibility,
            "helios": bio.get("helios"),
            "apollo": bio.get("apollo"),
            "psyche": bio.get("psyche"),
            "policy_result": policy_result,
            "concordance": r.get("concordance_analysis"),
        }
    ).execute()


def create_self_report_tag(
    *,
    circle_id: str,
    author_id: str,
    subject_id: str,
    emotion: str,
    valence: float,
    arousal: float,
    checkin_id: str | None = None,
    visibility: str = "private",
) -> Optional[str]:
    """Persist a 16x8 EmotionGrid commit. Defaults to private visibility."""
    client = _client()
    if not client:
        return None
    res = (
        client.table("self_report_tags")
        .insert(
            {
                "circle_id": circle_id,
                "author_id": author_id,
                "subject_id": subject_id,
                "checkin_id": checkin_id,
                "emotion": emotion,
                "valence": valence,
                "arousal": arousal,
                "visibility": visibility,
            }
        )
        .execute()
    )
    if res.data:
        return res.data[0]["id"]
    return None


def insert_sleep_log(
    *,
    profile_id: str,
    night_of: str,
    duration_minutes: int,
    delta_baseline_minutes: int | None = None,
    source: str = "manual",
    visibility: str = "circle",
) -> None:
    client = _client()
    if not client:
        return
    client.table("sleep_logs").upsert(
        {
            "profile_id": profile_id,
            "source": source,
            "night_of": night_of,
            "duration_minutes": duration_minutes,
            "delta_baseline_minutes": delta_baseline_minutes,
            "visibility": visibility,
        },
        on_conflict="profile_id,night_of",
    ).execute()


def insert_heart_sample(
    *,
    profile_id: str,
    bucket_at: str,
    bpm_min: int | None = None,
    bpm_max: int | None = None,
    bpm_avg: int | None = None,
    source: str = "manual",
    visibility: str = "circle",
) -> None:
    client = _client()
    if not client:
        return
    client.table("heart_samples").insert(
        {
            "profile_id": profile_id,
            "source": source,
            "bucket_at": bucket_at,
            "bpm_min": bpm_min,
            "bpm_max": bpm_max,
            "bpm_avg": bpm_avg,
            "visibility": visibility,
        }
    ).execute()


def insert_place_visit(
    *,
    profile_id: str,
    place_label: str,
    started_at: str,
    ended_at: str | None = None,
    place_name: str | None = None,
    source: str = "manual",
    visibility: str = "circle",
) -> None:
    client = _client()
    if not client:
        return
    client.table("place_visits").insert(
        {
            "profile_id": profile_id,
            "source": source,
            "place_label": place_label,
            "place_name": place_name,
            "started_at": started_at,
            "ended_at": ended_at,
            "visibility": visibility,
        }
    ).execute()


def insert_app_session(
    *,
    profile_id: str,
    app_name: str,
    bucket_on: str,
    duration_minutes: int,
    source: str = "manual",
    visibility: str = "private",
) -> None:
    client = _client()
    if not client:
        return
    client.table("app_sessions").insert(
        {
            "profile_id": profile_id,
            "source": source,
            "app_name": app_name,
            "bucket_on": bucket_on,
            "duration_minutes": duration_minutes,
            "visibility": visibility,
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
