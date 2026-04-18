"""Kin voice pipeline FastAPI server.

The browser captures 16 kHz mono PCM and streams it over a WebSocket.
We fork the audio to Speechmatics Realtime (medical domain) for transcription
and Thymia Sentinel (wellbeing-awareness policy) for voice biomarkers.
Results stream back to the browser and are persisted to Supabase."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from speechmatics.rt import AudioEncoding
from speechmatics.voice import (
    AgentServerMessageType,
    SegmentMessage,
    VoiceAgentClient,
    VoiceAgentConfig,
    VoiceAgentConfigPreset,
)
from thymia_sentinel import SentinelClient

from . import whatsapp
from .audio_batch import process_voice_note
from .config import settings
from .llm import compose_brief
from .supabase_store import (
    _client,
    create_checkin,
    finalize_checkin,
    list_circle_recipients,
    log_whatsapp_message,
    profile_by_phone,
    save_biomarker_snapshot,
    upsert_supporter_brief,
)

log = logging.getLogger("kin.pipeline")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="Kin voice pipeline")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, Any]:
    s = settings()
    return {
        "ok": True,
        "sample_rate": s.sample_rate,
        "has_supabase": bool(s.supabase_url and s.supabase_service_role),
        "has_whatsapp": whatsapp.is_configured(),
    }


def _normalize_phone(raw: str) -> str:
    digits = "".join(c for c in (raw or "") if c.isdigit())
    return digits


@app.get("/api/whoami")
async def whoami(phone: str = "") -> dict[str, Any]:
    """Phone-only login lookup for the demo UI.

    Given an E.164-ish phone, returns the profile id + role (patient|supporter)
    and the circle_id to subscribe to. Returns {ok:false} if unknown.
    """
    p = _normalize_phone(phone)
    if not p:
        return {"ok": False, "reason": "missing_phone"}
    profile = profile_by_phone(p)
    if not profile:
        return {"ok": False, "reason": "unknown_phone"}
    cfg = settings()
    circle_id = cfg.demo_circle_id
    role = "patient" if profile["id"] == cfg.demo_patient_id else "supporter"
    return {
        "ok": True,
        "profile": {
            "id": profile["id"],
            "display_name": profile.get("display_name"),
            "phone_e164": profile.get("phone_e164"),
        },
        "role": role,
        "circle_id": circle_id,
    }


class CheckinSession:
    """One voice check-in: bridges a browser WS to Speechmatics + Sentinel."""

    def __init__(self, ws: WebSocket, circle_id: str, author_id: str, source: str):
        self.ws = ws
        self.circle_id = circle_id
        self.author_id = author_id
        self.source = source
        self.cfg = settings()

        self.checkin_id: str | None = None
        self.started_at = time.time()
        self.transcript_parts: list[str] = []
        self.latest_policy: dict[str, Any] | None = None

        self._send_lock = asyncio.Lock()

    async def send_json(self, payload: dict[str, Any]) -> None:
        async with self._send_lock:
            try:
                await self.ws.send_text(json.dumps(payload))
            except Exception:
                pass

    async def run(self) -> None:
        self.checkin_id = create_checkin(
            circle_id=self.circle_id,
            author_id=self.author_id,
            source=self.source,
        )
        await self.send_json(
            {
                "type": "session.started",
                "checkin_id": self.checkin_id,
                "sample_rate": self.cfg.sample_rate,
            }
        )

        sentinel = SentinelClient(
            api_key=self.cfg.thymia_api_key,
            user_label=f"kin-{self.author_id[:8]}",
            policies=["wellbeing-awareness"],
            biomarkers=["helios", "apollo", "psyche"],
            sample_rate=self.cfg.sample_rate,
        )

        @sentinel.on_policy_result
        async def _on_policy(result: dict[str, Any]) -> None:
            self.latest_policy = result
            if self.checkin_id:
                try:
                    save_biomarker_snapshot(
                        checkin_id=self.checkin_id,
                        policy_result=result,
                        t_offset_ms=int((time.time() - self.started_at) * 1000),
                    )
                except Exception as e:
                    log.warning("save_biomarker_snapshot failed: %s", e)
            await self.send_json({"type": "biomarker.policy", "result": result})

        @sentinel.on_progress
        async def _on_progress(progress: dict[str, Any]) -> None:
            await self.send_json({"type": "biomarker.progress", "progress": progress})

        voice_config = VoiceAgentConfigPreset.ADAPTIVE(
            VoiceAgentConfig(
                domain="medical",
                audio_encoding=AudioEncoding.PCM_S16LE,
                chunk_size=self.cfg.chunk_size,
                sample_rate=self.cfg.sample_rate,
            )
        )

        try:
            await sentinel.connect()
        except Exception as e:
            log.exception("Sentinel connect failed")
            await self.send_json({"type": "error", "where": "sentinel", "msg": str(e)})
            return

        async with VoiceAgentClient(
            api_key=self.cfg.speechmatics_api_key, config=voice_config
        ) as sm:

            loop = asyncio.get_running_loop()

            def _format(segments: Any) -> str:
                return " ".join([s.text for s in segments if getattr(s, "text", None)])

            @sm.on(AgentServerMessageType.ADD_PARTIAL_SEGMENT)
            def _on_partial(message: Any) -> None:
                seg = SegmentMessage.from_message(message)
                text = _format(seg.segments)
                if text:
                    asyncio.run_coroutine_threadsafe(
                        self.send_json({"type": "transcript.partial", "text": text}),
                        loop,
                    )

            @sm.on(AgentServerMessageType.ADD_SEGMENT)
            def _on_final(message: Any) -> None:
                seg = SegmentMessage.from_message(message)
                text = _format(seg.segments)
                if not text:
                    return
                self.transcript_parts.append(text)
                asyncio.run_coroutine_threadsafe(
                    self.send_json({"type": "transcript.final", "text": text}), loop
                )
                asyncio.run_coroutine_threadsafe(
                    sentinel.send_user_transcript(text, is_final=True), loop
                )

            await self._pump(sm, sentinel)

        # Give Thymia Sentinel a grace window to emit a policy result after
        # the final transcript. Without this, short check-ins close before the
        # biomarker evaluation fires.
        grace_seconds = 4.0
        deadline = time.time() + grace_seconds
        while self.latest_policy is None and time.time() < deadline:
            await asyncio.sleep(0.1)

        try:
            await sentinel.close()
        except Exception:
            pass

        transcript = " ".join(self.transcript_parts).strip()
        duration_ms = int((time.time() - self.started_at) * 1000)
        if self.checkin_id:
            try:
                finalize_checkin(
                    checkin_id=self.checkin_id,
                    transcript=transcript,
                    duration_ms=duration_ms,
                )
            except Exception as e:
                log.warning("finalize_checkin failed: %s", e)

            if self.latest_policy and self.source == "patient":
                try:
                    brief = await compose_brief(self.latest_policy, transcript)
                    log.info(
                        "brief source=%s latency=%sms",
                        brief.get("_source"),
                        brief.get("_latency_ms"),
                    )
                    from .supabase_store import _client

                    c = _client()
                    if c:
                        sup = (
                            c.table("supporters")
                            .select("id")
                            .eq("circle_id", self.circle_id)
                            .limit(1)
                            .execute()
                        )
                        if sup.data:
                            upsert_supporter_brief(
                                circle_id=self.circle_id,
                                supporter_id=sup.data[0]["id"],
                                headline=brief["headline"],
                                guidance=brief["guidance"],
                                tone_cues=brief.get("tone_cues") or [],
                                derived_from=self.checkin_id,
                            )

                    # Fanout to the care circle via WhatsApp (supporters only).
                    if whatsapp.is_configured():
                        asyncio.create_task(
                            _fanout_brief_whatsapp(
                                circle_id=self.circle_id,
                                checkin_id=self.checkin_id,
                                author_id=self.author_id,
                                brief=brief,
                            )
                        )
                except Exception as e:
                    log.warning("brief upsert failed: %s", e)

        await self.send_json(
            {
                "type": "session.finished",
                "checkin_id": self.checkin_id,
                "transcript": transcript,
                "duration_ms": duration_ms,
                "policy_result": self.latest_policy,
            }
        )

    async def _pump(self, sm: VoiceAgentClient, sentinel: SentinelClient) -> None:
        try:
            while True:
                msg = await self.ws.receive()
                if msg.get("type") == "websocket.disconnect":
                    break
                if "bytes" in msg and msg["bytes"] is not None:
                    audio = msg["bytes"]
                    await asyncio.gather(
                        sm.send_audio(audio),
                        sentinel.send_user_audio(audio),
                    )
                elif "text" in msg and msg["text"] is not None:
                    try:
                        evt = json.loads(msg["text"])
                    except Exception:
                        continue
                    if evt.get("type") == "stop":
                        break
        except WebSocketDisconnect:
            pass
        except Exception as e:
            log.exception("pump failed")
            await self.send_json({"type": "error", "where": "pump", "msg": str(e)})


async def _fanout_brief_whatsapp(
    *,
    circle_id: str,
    checkin_id: str | None,
    author_id: str,
    brief: dict[str, Any],
) -> None:
    """Send a supporter brief as text to every circle member with a phone, except
    the author (usually the patient who just spoke)."""
    try:
        recipients = list_circle_recipients(circle_id, exclude_profile_id=author_id)
        if not recipients:
            log.info("wa.fanout skipped: no recipients with phones")
            return
        headline = brief.get("headline") or ""
        guidance = brief.get("guidance") or ""
        cues = brief.get("tone_cues") or []
        body_parts = [f"Kin: {headline}", "", guidance]
        if cues:
            body_parts.append("")
            body_parts.append("Cues: " + " · ".join(cues))
        body = "\n".join(body_parts).strip()

        for r in recipients:
            phone = r["phone_e164"]
            msg_id = await whatsapp.send_text(phone, body)
            try:
                log_whatsapp_message(
                    direction="outbound",
                    msg_type="text",
                    wa_message_id=msg_id,
                    to_e164=phone,
                    body=body,
                    profile_id=r["profile_id"],
                    circle_id=circle_id,
                    checkin_id=checkin_id,
                )
            except Exception as e:
                log.warning("wa.log outbound fail: %s", e)
        log.info("wa.fanout sent count=%d circle=%s", len(recipients), circle_id)
    except Exception:
        log.exception("wa.fanout failed")


@app.get("/webhook/whatsapp")
async def whatsapp_verify(request: Request) -> Any:
    qp = request.query_params
    mode = qp.get("hub.mode", "")
    token = qp.get("hub.verify_token", "")
    challenge = qp.get("hub.challenge", "")
    ok = whatsapp.verify_challenge(mode, token, challenge)
    if ok is None:
        return PlainTextResponse("forbidden", status_code=403)
    return PlainTextResponse(ok)


@app.post("/webhook/whatsapp")
async def whatsapp_events(request: Request) -> dict[str, Any]:
    raw = await request.body()
    if not whatsapp.verify_signature(raw, request.headers.get("x-hub-signature-256")):
        return {"ok": False, "reason": "bad_signature"}
    try:
        payload = json.loads(raw.decode() or "{}")
    except Exception:
        payload = {}

    messages = whatsapp.parse_webhook(payload)
    cfg = settings()
    for m in messages:
        sender = m.get("from") or ""
        profile = profile_by_phone(sender) or {}
        profile_id = profile.get("id")
        t = m.get("type")
        try:
            log_whatsapp_message(
                direction="inbound",
                msg_type=t if t in ("text", "audio", "voice", "image") else "other",
                wa_message_id=m.get("wa_id"),
                from_e164=sender,
                body=m.get("text"),
                media_id=m.get("audio_id"),
                media_mime=m.get("mime"),
                profile_id=profile_id,
                circle_id=cfg.demo_circle_id,
                payload=m,
            )
        except Exception as e:
            log.warning("wa.log inbound fail: %s", e)

        # Quick-ack so supporter sees Kin respond live on WhatsApp.
        if t == "text" and m.get("text"):
            asyncio.create_task(
                whatsapp.send_text(
                    sender,
                    "Kin: got it — logged for the circle. 🫶",
                )
            )
        elif t in ("audio", "voice") and m.get("audio_id"):
            asyncio.create_task(
                whatsapp.send_text(
                    sender,
                    "Kin: got your voice note — processing…",
                )
            )
            role = "patient"
            if profile_id and cfg.demo_patient_id and profile_id != cfg.demo_patient_id:
                role = "supporter"
            author_id = profile_id or cfg.demo_patient_id
            asyncio.create_task(
                _handle_inbound_audio(
                    circle_id=cfg.demo_circle_id,
                    author_id=author_id,
                    source=role,
                    sender=sender,
                    media_id=m.get("audio_id"),
                    mime=m.get("mime"),
                    wa_message_id=m.get("wa_id"),
                )
            )
    return {"ok": True, "received": len(messages)}


async def _handle_inbound_audio(
    *,
    circle_id: str,
    author_id: str,
    source: str,
    sender: str,
    media_id: str,
    mime: str | None,
    wa_message_id: str | None,
) -> None:
    """Download WA voice note → run pipeline → ack/fanout."""
    try:
        fetched = await whatsapp.fetch_media_bytes(media_id)
        if not fetched:
            await whatsapp.send_text(sender, "Kin: couldn't fetch that voice note — try again?")
            return
        data, real_mime = fetched
        log.info("wa.inbound audio bytes=%d mime=%s", len(data), real_mime)

        summary = await process_voice_note(
            circle_id=circle_id,
            author_id=author_id,
            source=source,
            audio_bytes=data,
            mime=real_mime or mime,
            wa_message_id=wa_message_id,
        )

        checkin_id = summary.get("checkin_id")
        transcript = (summary.get("transcript") or "").strip()
        if source == "supporter":
            body = "Kin: observation logged"
            if transcript:
                body += f" — “{transcript[:160]}”"
            await whatsapp.send_text(sender, body)
        else:
            brief = summary.get("brief") or {}
            head = brief.get("headline") or "check-in saved"
            await whatsapp.send_text(sender, f"Kin: {head} — circle has been briefed.")

        try:
            log_whatsapp_message(
                direction="inbound",
                msg_type="audio",
                wa_message_id=wa_message_id,
                from_e164=sender,
                body=transcript or None,
                media_id=media_id,
                media_mime=real_mime or mime,
                profile_id=author_id if author_id != settings().demo_patient_id or source == "patient" else None,
                circle_id=circle_id,
                checkin_id=checkin_id,
                payload={"processed": True, "source": source},
            )
        except Exception as e:
            log.warning("wa.log processed audio fail: %s", e)
    except Exception:
        log.exception("inbound audio processing failed")
        try:
            await whatsapp.send_text(
                sender, "Kin: something went wrong processing that voice note."
            )
        except Exception:
            pass


@app.post("/whatsapp/fanout_demo")
async def whatsapp_fanout_demo(body: dict[str, Any]) -> dict[str, Any]:
    """Manual fanout for rehearsal.

    POST {message?, circle_id?, template?, language?}
    If `template` is provided, sends a template (required for first-contact / outside 24h window).
    Otherwise sends a free-form text (only works inside an open 24h window).
    """
    if not whatsapp.is_configured():
        return {"ok": False, "reason": "whatsapp_not_configured"}
    cfg = settings()
    circle_id = body.get("circle_id") or cfg.demo_circle_id
    template = body.get("template")
    language = body.get("language") or "en_US"
    text = (body.get("message") or "Kin: hello from the hackathon demo.").strip()
    recipients = list_circle_recipients(circle_id)
    sent: list[dict[str, Any]] = []
    for r in recipients:
        if template:
            mid = await whatsapp.send_template(r["phone_e164"], name=template, language=language)
            log_body = f"[template:{template}]"
        else:
            mid = await whatsapp.send_text(r["phone_e164"], text)
            log_body = text
        msg_type = "text"  # enum is {text,audio}; template logged as text
        log_whatsapp_message(
            direction="outbound",
            msg_type=msg_type,
            wa_message_id=mid,
            to_e164=r["phone_e164"],
            body=log_body,
            profile_id=r["profile_id"],
            circle_id=circle_id,
        )
        sent.append({"to": r["phone_e164"], "id": mid, "role": r["role"]})
    return {"ok": True, "sent": sent}


@app.websocket("/ws/checkin")
async def ws_checkin(ws: WebSocket) -> None:
    await ws.accept()
    params = ws.query_params
    cfg = settings()
    circle_id = params.get("circle_id") or cfg.demo_circle_id
    author_id = params.get("author_id") or cfg.demo_patient_id
    source = params.get("source") or "patient"

    session = CheckinSession(ws, circle_id=circle_id, author_id=author_id, source=source)
    try:
        await session.run()
    finally:
        try:
            await ws.close()
        except Exception:
            pass
