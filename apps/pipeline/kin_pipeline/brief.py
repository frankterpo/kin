"""Derive a supporter brief (headline + tone cues) from a Sentinel policy result."""

from __future__ import annotations

from typing import Any


def derive_brief(policy_result: dict[str, Any], transcript: str) -> dict[str, Any]:
    r = policy_result.get("result", policy_result)
    classification = r.get("classification", {}) or {}
    concordance = r.get("concordance_analysis", {}) or {}
    flags = r.get("flags", {}) or {}
    recs = r.get("recommended_actions", {}) or {}
    bio = r.get("biomarkers", {}) or r.get("biomarker_summary", {}) or {}

    level = classification.get("level", "neutral")
    alert = classification.get("alert", "none")
    scenario = concordance.get("scenario", "aligned")

    tone_cues: list[str] = []

    helios = bio.get("helios") or {}
    if isinstance(helios, dict):
        if (helios.get("fatigue") or 0) > 0.5:
            tone_cues.append("sounds tired")
        if (helios.get("stress") or 0) > 0.5:
            tone_cues.append("under stress")
        if (helios.get("distress") or 0) > 0.5:
            tone_cues.append("signs of distress")

    apollo = bio.get("apollo") or {}
    if isinstance(apollo, dict):
        if (apollo.get("depression_score") or 0) > 0.5:
            tone_cues.append("low mood")
        if (apollo.get("anxiety_score") or 0) > 0.5:
            tone_cues.append("anxious undertone")

    if scenario and scenario != "aligned":
        tone_cues.append(f"concordance: {scenario}")

    active_flags = [k for k, v in flags.items() if v]
    if active_flags:
        tone_cues.extend(active_flags)

    if alert and alert != "none":
        headline = f"Check in gently — {alert.replace('_', ' ')}"
    elif level in ("elevated", "high"):
        headline = "Today needs a lighter touch"
    elif level in ("low", "very_low"):
        headline = "Good day — share something light"
    else:
        headline = "Stay present and ask one open question"

    guidance = (
        recs.get("for_human_reviewer")
        or recs.get("for_agent")
        or (
            "Listen first. Reflect back one feeling you heard. "
            "Avoid advice unless asked."
        )
    )

    return {
        "headline": headline,
        "guidance": guidance,
        "tone_cues": tone_cues[:6],
    }
