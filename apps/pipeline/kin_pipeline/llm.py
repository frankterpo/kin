"""Live LLM supporter brief — with a hard safety harness.

Goals:
- Under 2.5s total, or we return the deterministic template brief.
- Never hallucinate clinical claims. The LLM is told explicitly it sees
  voice biomarker signals, not medical diagnoses.
- Structured JSON output. If parsing fails, fall back.
- Provider-agnostic: tries Groq > Anthropic > OpenAI in that order.
  Missing keys = template fallback (never blocks).
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any

import httpx

from .brief import derive_brief

log = logging.getLogger("kin.llm")

HARD_TIMEOUT_S = 2.5
SOFT_BUDGET_S = 1.8

SYSTEM_PROMPT = """You are Kin, an AI layer that helps families support a loved one living with a chronic condition.

You will receive:
- A short transcript of what the patient just said during a 15-second voice check-in.
- Voice biomarker signals from Thymia Sentinel (stress, fatigue, mood, depression, anxiety scores 0-1).
- A "concordance" scenario comparing what the patient SAID vs what their voice SUGGESTS.

Your job: write ONE tiny brief for the supporter (e.g. the patient's daughter). Keep it humane, specific, non-clinical.

RULES (strict):
- NEVER give medical advice. NEVER diagnose. NEVER use words like "depressed", "anxious", "clinical", "disorder", "severe".
- Prefer soft, observational language: "voice sounds tired", "carrying tension", "quieter than usual", "warmth of tone low".
- Speak TO the supporter, ABOUT the patient. E.g. "She says she's fine. Her voice sounds tired today."
- Headline: <= 9 words, no period.
- Guidance: 1-2 sentences, concrete and warm. What could the supporter DO in the next hour?
- tone_cues: 2-4 short phrases (<= 3 words each) describing vocal qualities.
- Output JSON only, no prose outside JSON.

Schema:
{
  "headline": "string",
  "guidance": "string",
  "tone_cues": ["string", ...]
}"""


def _extract_signals(policy_result: dict[str, Any]) -> dict[str, Any]:
    r = policy_result.get("result", policy_result)
    classification = r.get("classification") or {}
    concordance = r.get("concordance_analysis") or {}
    bio = r.get("biomarkers") or r.get("biomarker_summary") or {}

    def _pick(obj: dict[str, Any], keys: list[str]) -> dict[str, float]:
        out: dict[str, float] = {}
        for k in keys:
            v = obj.get(k)
            if isinstance(v, (int, float)):
                out[k] = round(float(v), 2)
        return out

    return {
        "classification": {
            "level": classification.get("level"),
            "alert": classification.get("alert"),
        },
        "concordance": {
            "scenario": concordance.get("scenario"),
            "agreement_level": concordance.get("agreement_level"),
        },
        "biomarkers": {
            "helios": _pick(
                bio.get("helios") or {},
                ["stress", "fatigue", "distress", "energy"],
            ),
            "apollo": _pick(
                bio.get("apollo") or {},
                ["depression_score", "anxiety_score", "mood"],
            ),
            "psyche": _pick(
                bio.get("psyche") or {},
                ["valence", "arousal"],
            ),
        },
    }


def _user_prompt(transcript: str, signals: dict[str, Any]) -> str:
    tx = (transcript or "").strip() or "(no speech captured)"
    return (
        f"Transcript: {tx}\n\n"
        f"Signals (from voice biomarkers, not medical data):\n"
        f"{json.dumps(signals, indent=2)}\n\n"
        "Return the JSON brief now."
    )


async def _call_groq(prompt: str, api_key: str) -> dict[str, Any] | None:
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=SOFT_BUDGET_S) as c:
        r = await c.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        text = data["choices"][0]["message"]["content"]
        return json.loads(text)


async def _call_anthropic(prompt: str, api_key: str) -> dict[str, Any] | None:
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": "claude-haiku-4-5",
        "max_tokens": 300,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    async with httpx.AsyncClient(timeout=SOFT_BUDGET_S) as c:
        r = await c.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        text = data["content"][0]["text"]
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end < 0:
            return None
        return json.loads(text[start : end + 1])


async def _call_openai(prompt: str, api_key: str) -> dict[str, Any] | None:
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=SOFT_BUDGET_S) as c:
        r = await c.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        text = data["choices"][0]["message"]["content"]
        return json.loads(text)


def _sanitize(out: dict[str, Any]) -> dict[str, Any] | None:
    """Shape-check and de-fang the LLM output."""
    if not isinstance(out, dict):
        return None
    headline = str(out.get("headline") or "").strip().rstrip(".")
    guidance = str(out.get("guidance") or "").strip()
    cues_raw = out.get("tone_cues") or []
    if not headline or not guidance:
        return None
    if len(headline) > 80 or len(guidance) > 400:
        return None

    banned = {
        "depressed",
        "depression",
        "anxiety disorder",
        "mental illness",
        "diagnose",
        "diagnosis",
        "clinical",
        "severe",
        "pathology",
    }
    low = (headline + " " + guidance).lower()
    if any(b in low for b in banned):
        return None

    if not isinstance(cues_raw, list):
        cues_raw = []
    cues = [
        str(c).strip().lower()
        for c in cues_raw
        if isinstance(c, (str, int, float)) and str(c).strip()
    ]
    cues = [c for c in cues if len(c) <= 30][:4]

    return {"headline": headline, "guidance": guidance, "tone_cues": cues}


async def _try_llm(
    policy_result: dict[str, Any], transcript: str
) -> dict[str, Any] | None:
    """Try providers in order; first successful structured result wins."""
    signals = _extract_signals(policy_result)
    prompt = _user_prompt(transcript, signals)

    providers: list[tuple[str, Any]] = []
    if os.getenv("GROQ_API_KEY"):
        providers.append(("groq", _call_groq))
    if os.getenv("ANTHROPIC_API_KEY"):
        providers.append(("anthropic", _call_anthropic))
    if os.getenv("OPENAI_API_KEY"):
        providers.append(("openai", _call_openai))

    if not providers:
        return None

    for name, fn in providers:
        key_env = {
            "groq": "GROQ_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "openai": "OPENAI_API_KEY",
        }[name]
        try:
            t0 = time.time()
            raw = await asyncio.wait_for(
                fn(prompt, os.environ[key_env]), timeout=HARD_TIMEOUT_S
            )
            dt = time.time() - t0
            shaped = _sanitize(raw or {})
            if shaped:
                shaped["_provider"] = name
                shaped["_latency_ms"] = int(dt * 1000)
                log.info("LLM brief via %s in %dms", name, int(dt * 1000))
                return shaped
            log.warning("LLM brief via %s failed shape check", name)
        except asyncio.TimeoutError:
            log.warning("LLM brief via %s timed out (>%.1fs)", name, HARD_TIMEOUT_S)
        except Exception as e:
            log.warning("LLM brief via %s errored: %s", name, e)
    return None


async def compose_brief(
    policy_result: dict[str, Any], transcript: str
) -> dict[str, Any]:
    """Public entrypoint. Returns a brief dict, always.

    Strategy:
      1. Kick off LLM call with HARD_TIMEOUT_S ceiling.
      2. On success and safe shape: use LLM output.
      3. On any failure: use deterministic template brief.
    """
    template = derive_brief(policy_result, transcript)
    llm = await _try_llm(policy_result, transcript)
    if llm is None:
        template["_source"] = "template"
        return template
    # Merge: LLM writes headline/guidance/cues, template contributes nothing else.
    llm["_source"] = f"llm:{llm.get('_provider','?')}"
    # Tone cues: if LLM gave <2, supplement from template.
    if len(llm.get("tone_cues") or []) < 2 and template.get("tone_cues"):
        llm["tone_cues"] = (llm.get("tone_cues") or []) + template["tone_cues"]
        llm["tone_cues"] = list(dict.fromkeys(llm["tone_cues"]))[:4]
    return llm
