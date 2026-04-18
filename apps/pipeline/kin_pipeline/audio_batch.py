"""Batch audio processing for inbound WhatsApp voice notes.

Reuses the realtime Speechmatics + Thymia Sentinel clients by:
1) Transcoding the incoming OGG/Opus blob to 16 kHz mono PCM16LE via ffmpeg.
2) Chunking the PCM into frame-size buffers and pumping them through the
   same clients we use for live browser check-ins.
3) Persisting the checkin + biomarker snapshot, then (for patient audio)
   composing a supporter brief and fanning it out over WhatsApp.

For a hackathon demo this is simpler than standing up Speechmatics' batch REST
path, and lets the Vercel UI subscribe to the same tables the live flow writes.
"""

from __future__ import annotations

import asyncio
import logging
import subprocess
import time
from typing import Any

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
from .config import settings
from .llm import compose_brief
from .supabase_store import (
    _client,
    create_checkin,
    finalize_checkin,
    list_circle_recipients,
    log_whatsapp_message,
    save_biomarker_snapshot,
    upsert_supporter_brief,
)

log = logging.getLogger("kin.audio_batch")


def ogg_to_pcm16k(data: bytes, sample_rate: int = 16000) -> bytes:
    """Transcode arbitrary container (ogg/opus/m4a/mp3) to raw PCM s16le mono."""
    proc = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "s16le",
            "-acodec", "pcm_s16le",
            "-ar", str(sample_rate),
            "-ac", "1",
            "pipe:1",
        ],
        input=data,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg transcode failed: {proc.stderr.decode(errors='ignore')[:500]}")
    return proc.stdout


async def process_voice_note(
    *,
    circle_id: str,
    author_id: str,
    source: str,
    audio_bytes: bytes,
    mime: str | None = None,
    wa_message_id: str | None = None,
) -> dict[str, Any]:
    """Full pipeline for a single inbound WA voice note.

    Returns a summary dict with checkin_id, transcript, policy_result, brief.
    """
    cfg = settings()
    started_at = time.time()

    pcm = ogg_to_pcm16k(audio_bytes, sample_rate=cfg.sample_rate)
    log.info(
        "batch.transcode ok bytes_in=%d pcm_out=%d mime=%s", len(audio_bytes), len(pcm), mime
    )

    checkin_id = create_checkin(circle_id=circle_id, author_id=author_id, source=source)

    transcript_parts: list[str] = []
    latest_policy: dict[str, Any] | None = None
    policy_event = asyncio.Event()

    sentinel = SentinelClient(
        api_key=cfg.thymia_api_key,
        user_label=f"kin-wa-{(author_id or 'anon')[:8]}",
        policies=["wellbeing-awareness"],
        biomarkers=["helios", "apollo", "psyche"],
        sample_rate=cfg.sample_rate,
    )

    @sentinel.on_policy_result
    async def _on_policy(result: dict[str, Any]) -> None:
        nonlocal latest_policy
        latest_policy = result
        if checkin_id:
            try:
                save_biomarker_snapshot(
                    checkin_id=checkin_id,
                    policy_result=result,
                    t_offset_ms=int((time.time() - started_at) * 1000),
                )
            except Exception as e:
                log.warning("batch.save_biomarker failed: %s", e)
        policy_event.set()

    voice_config = VoiceAgentConfigPreset.ADAPTIVE(
        VoiceAgentConfig(
            domain="medical",
            audio_encoding=AudioEncoding.PCM_S16LE,
            chunk_size=cfg.chunk_size,
            sample_rate=cfg.sample_rate,
        )
    )

    await sentinel.connect()

    async with VoiceAgentClient(api_key=cfg.speechmatics_api_key, config=voice_config) as sm:
        loop = asyncio.get_running_loop()

        def _format(segments: Any) -> str:
            return " ".join([s.text for s in segments if getattr(s, "text", None)])

        @sm.on(AgentServerMessageType.ADD_SEGMENT)
        def _on_final(message: Any) -> None:
            seg = SegmentMessage.from_message(message)
            text = _format(seg.segments)
            if not text:
                return
            transcript_parts.append(text)
            asyncio.run_coroutine_threadsafe(
                sentinel.send_user_transcript(text, is_final=True), loop
            )

        chunk = cfg.chunk_size * 2  # s16 = 2 bytes/sample
        bytes_per_sec = cfg.sample_rate * 2
        paced = chunk / bytes_per_sec  # real-time pacing so Sentinel windows fire
        for i in range(0, len(pcm), chunk):
            buf = pcm[i : i + chunk]
            if not buf:
                break
            await asyncio.gather(
                sm.send_audio(buf),
                sentinel.send_user_audio(buf),
            )
            await asyncio.sleep(paced)

    try:
        await asyncio.wait_for(policy_event.wait(), timeout=6.0)
    except asyncio.TimeoutError:
        log.info("batch.policy timeout — continuing with partial result")

    try:
        await sentinel.close()
    except Exception:
        pass

    transcript = " ".join(transcript_parts).strip()
    duration_ms = int((time.time() - started_at) * 1000)

    if checkin_id:
        try:
            finalize_checkin(
                checkin_id=checkin_id, transcript=transcript, duration_ms=duration_ms
            )
        except Exception as e:
            log.warning("batch.finalize failed: %s", e)

    brief: dict[str, Any] | None = None
    if latest_policy and source == "patient" and checkin_id:
        try:
            brief = await compose_brief(latest_policy, transcript)
            c = _client()
            if c:
                sup = (
                    c.table("supporters")
                    .select("id")
                    .eq("circle_id", circle_id)
                    .limit(1)
                    .execute()
                )
                if sup.data:
                    upsert_supporter_brief(
                        circle_id=circle_id,
                        supporter_id=sup.data[0]["id"],
                        headline=brief["headline"],
                        guidance=brief["guidance"],
                        tone_cues=brief.get("tone_cues") or [],
                        derived_from=checkin_id,
                    )
            if whatsapp.is_configured():
                asyncio.create_task(
                    _fanout_brief(
                        circle_id=circle_id,
                        author_id=author_id,
                        checkin_id=checkin_id,
                        brief=brief,
                    )
                )
        except Exception as e:
            log.warning("batch.brief failed: %s", e)

    return {
        "checkin_id": checkin_id,
        "transcript": transcript,
        "duration_ms": duration_ms,
        "policy_result": latest_policy,
        "brief": brief,
        "wa_message_id": wa_message_id,
    }


async def _fanout_brief(
    *,
    circle_id: str,
    author_id: str,
    checkin_id: str | None,
    brief: dict[str, Any],
) -> None:
    try:
        recipients = list_circle_recipients(circle_id, exclude_profile_id=author_id)
        if not recipients:
            return
        headline = brief.get("headline") or ""
        guidance = brief.get("guidance") or ""
        cues = brief.get("tone_cues") or []
        parts = [f"Kin: {headline}", "", guidance]
        if cues:
            parts += ["", "Cues: " + " · ".join(cues)]
        body = "\n".join(parts).strip()
        for r in recipients:
            mid = await whatsapp.send_text(r["phone_e164"], body)
            try:
                log_whatsapp_message(
                    direction="outbound",
                    msg_type="text",
                    wa_message_id=mid,
                    to_e164=r["phone_e164"],
                    body=body,
                    profile_id=r["profile_id"],
                    circle_id=circle_id,
                    checkin_id=checkin_id,
                )
            except Exception as e:
                log.warning("batch.log outbound failed: %s", e)
        log.info("batch.fanout sent=%d circle=%s", len(recipients), circle_id)
    except Exception:
        log.exception("batch.fanout failed")
