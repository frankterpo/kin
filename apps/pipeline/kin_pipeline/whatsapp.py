"""WhatsApp Cloud API client + webhook helpers.

Scope (hackathon): send text + audio to verified test recipients, receive inbound
text/voice notes via webhook, download incoming media to bytes so we can pipe
into Speechmatics / Thymia.

No retry logic, no queueing — demo path only.
"""

from __future__ import annotations

import hmac
import hashlib
import logging
import mimetypes
from io import BytesIO
from typing import Any, Iterable, Optional

import httpx

from .config import settings

log = logging.getLogger("kin.whatsapp")

GRAPH = "https://graph.facebook.com"


def _cfg() -> tuple[str, str, str]:
    s = settings()
    token = s.whatsapp_token
    pnid = s.whatsapp_phone_number_id
    version = s.whatsapp_graph_version
    if not token or not pnid:
        raise RuntimeError(
            "WhatsApp not configured: set META_WHATSAPP_API_KEY + "
            "WHATSAPP_PHONE_NUMBER_ID in .env"
        )
    return token, pnid, version


def is_configured() -> bool:
    s = settings()
    return bool(s.whatsapp_token and s.whatsapp_phone_number_id)


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------

async def send_text(to_e164: str, body: str) -> Optional[str]:
    """Send a free-form text. Returns WhatsApp message id or None on failure."""
    token, pnid, ver = _cfg()
    url = f"{GRAPH}/{ver}/{pnid}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_e164.lstrip("+"),
        "type": "text",
        "text": {"preview_url": False, "body": body[:4096]},
    }
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(url, headers=_auth_headers(token), json=payload)
    if r.status_code >= 300:
        log.error("wa.send_text fail %s %s", r.status_code, r.text)
        return None
    data = r.json()
    msg_id = (data.get("messages") or [{}])[0].get("id")
    log.info("wa.send_text ok to=%s id=%s", to_e164, msg_id)
    return msg_id


async def upload_media(
    data: bytes,
    mime: str = "audio/ogg",
    filename: str = "kin.ogg",
) -> Optional[str]:
    """Upload media; return media_id for subsequent send calls."""
    token, pnid, ver = _cfg()
    url = f"{GRAPH}/{ver}/{pnid}/media"
    files = {
        "file": (filename, BytesIO(data), mime),
        "messaging_product": (None, "whatsapp"),
        "type": (None, mime),
    }
    async with httpx.AsyncClient(timeout=60.0) as c:
        r = await c.post(url, headers=_auth_headers(token), files=files)
    if r.status_code >= 300:
        log.error("wa.upload_media fail %s %s", r.status_code, r.text)
        return None
    return r.json().get("id")


async def send_audio(to_e164: str, media_id: str, voice: bool = True) -> Optional[str]:
    """Send a previously-uploaded audio as a voice note (push-to-listen bubble)."""
    token, pnid, ver = _cfg()
    url = f"{GRAPH}/{ver}/{pnid}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_e164.lstrip("+"),
        "type": "audio",
        "audio": {"id": media_id, "voice": voice},
    }
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(url, headers=_auth_headers(token), json=payload)
    if r.status_code >= 300:
        log.error("wa.send_audio fail %s %s", r.status_code, r.text)
        return None
    return (r.json().get("messages") or [{}])[0].get("id")


async def fanout_text(recipients: Iterable[str], body: str) -> list[tuple[str, Optional[str]]]:
    out: list[tuple[str, Optional[str]]] = []
    for to in recipients:
        mid = await send_text(to, body)
        out.append((to, mid))
    return out


async def send_template(
    to_e164: str,
    name: str = "hello_world",
    language: str = "en_US",
    components: list[dict[str, Any]] | None = None,
) -> Optional[str]:
    """Send a pre-approved template message. Required for first-contact / 24h window reopen."""
    token, pnid, ver = _cfg()
    url = f"{GRAPH}/{ver}/{pnid}/messages"
    tpl: dict[str, Any] = {
        "name": name,
        "language": {"code": language},
    }
    if components:
        tpl["components"] = components
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_e164.lstrip("+"),
        "type": "template",
        "template": tpl,
    }
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(url, headers=_auth_headers(token), json=payload)
    if r.status_code >= 300:
        log.error("wa.send_template fail %s %s", r.status_code, r.text)
        return None
    data = r.json()
    msg_id = (data.get("messages") or [{}])[0].get("id")
    log.info("wa.send_template ok to=%s name=%s id=%s", to_e164, name, msg_id)
    return msg_id


# ---------------------------------------------------------------------------
# Inbound — media download
# ---------------------------------------------------------------------------

async def fetch_media_bytes(media_id: str) -> tuple[bytes, str] | None:
    """Resolve media_id → URL → bytes. Returns (data, mime) or None."""
    token, _, ver = _cfg()
    async with httpx.AsyncClient(timeout=30.0) as c:
        meta_url = f"{GRAPH}/{ver}/{media_id}"
        r = await c.get(meta_url, headers=_auth_headers(token))
        if r.status_code >= 300:
            log.error("wa.media meta fail %s %s", r.status_code, r.text)
            return None
        url = r.json().get("url")
        mime = r.json().get("mime_type", "application/octet-stream")
        if not url:
            return None
        r2 = await c.get(url, headers=_auth_headers(token))
        if r2.status_code >= 300:
            log.error("wa.media dl fail %s", r2.status_code)
            return None
        return r2.content, mime


# ---------------------------------------------------------------------------
# Webhook verification / signature
# ---------------------------------------------------------------------------

def verify_challenge(mode: str, token: str, challenge: str) -> Optional[str]:
    """GET handshake: return challenge if verify token matches."""
    s = settings()
    if mode == "subscribe" and token == s.whatsapp_verify_token:
        return challenge
    return None


def verify_signature(raw_body: bytes, header_sig: str | None) -> bool:
    """POST X-Hub-Signature-256 verification. Returns True if no secret set."""
    s = settings()
    if not s.whatsapp_app_secret:
        return True  # optional for hackathon
    if not header_sig or not header_sig.startswith("sha256="):
        return False
    expected = hmac.new(
        s.whatsapp_app_secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, header_sig.split("=", 1)[1])


# ---------------------------------------------------------------------------
# Inbound payload parsing
# ---------------------------------------------------------------------------

def parse_webhook(body: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten a Meta webhook payload to a list of message dicts.

    Each dict: {from, wa_id, type, text?, audio_id?, mime?, ts}
    """
    out: list[dict[str, Any]] = []
    for entry in body.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            value = change.get("value", {}) or {}
            messages = value.get("messages", []) or []
            for m in messages:
                msg: dict[str, Any] = {
                    "from": m.get("from"),
                    "wa_id": m.get("id"),
                    "type": m.get("type"),
                    "ts": m.get("timestamp"),
                }
                t = m.get("type")
                if t == "text":
                    msg["text"] = (m.get("text") or {}).get("body")
                elif t in ("audio", "voice"):
                    a = m.get("audio") or {}
                    msg["audio_id"] = a.get("id")
                    msg["mime"] = a.get("mime_type")
                    msg["voice"] = a.get("voice", False)
                out.append(msg)
    return out
