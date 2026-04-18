"""Helpers to normalize Thymia Sentinel biomarker output into the
Helios / Apollo / Psyche family buckets used by the UI and LLM brief.

Thymia's `policy_result.result.biomarker_summary` is a *flat* dict like:

    {"stress": 0.05, "fatigue": 0.9, "distress": 0.11,
     "low_self_esteem": 0.02, "neutral": 0.99, "<unk>": 0.01,
     "anxiety_probability": 0.0, "depression_probability": 0.0}

The three enabled biomarker families on the Sentinel client are:
  - helios  → wellbeing/stress/fatigue family
  - apollo  → clinical screening probabilities (depression / anxiety)
  - psyche  → affect / emotion distribution
"""

from __future__ import annotations

from typing import Any

HELIOS_KEYS = {
    "stress",
    "fatigue",
    "distress",
    "low_self_esteem",
    "burnout",
    "energy",
    "wellbeing",
}

APOLLO_KEYS = {
    "depression_probability",
    "anxiety_probability",
    "depression_score",
    "anxiety_score",
    "mood",
    "depression",
    "anxiety",
}

PSYCHE_KEYS = {
    "neutral",
    "happy",
    "sad",
    "angry",
    "fear",
    "disgust",
    "surprise",
    "calm",
    "valence",
    "arousal",
    "joy",
}


def _round(v: Any) -> float | None:
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return round(float(v), 3)
    return None


def bucket_biomarkers(policy_result: dict[str, Any]) -> dict[str, dict[str, float]]:
    """Split Thymia's flat biomarker_summary into helios/apollo/psyche dicts.

    Always returns the three keys; each maps to a dict of scalar scores that
    can be rendered directly in the UI.
    """
    r = (policy_result or {}).get("result", policy_result) or {}
    bio: dict[str, Any] = {}

    # If the upstream already organized by family, keep that shape.
    if isinstance(r.get("biomarkers"), dict):
        src = r["biomarkers"]
        if any(isinstance(src.get(k), dict) for k in ("helios", "apollo", "psyche")):
            return {
                "helios": {k: _round(v) for k, v in (src.get("helios") or {}).items() if _round(v) is not None},
                "apollo": {k: _round(v) for k, v in (src.get("apollo") or {}).items() if _round(v) is not None},
                "psyche": {k: _round(v) for k, v in (src.get("psyche") or {}).items() if _round(v) is not None},
            }

    # Otherwise pull the flat summary.
    flat = r.get("biomarker_summary") or r.get("biomarkers") or {}
    if isinstance(flat, dict):
        bio.update(flat)

    # Also look inside raw_response.biomarker_summary for probabilities.
    raw = r.get("raw_response") or {}
    raw_flat = raw.get("biomarker_summary") or {}
    for k, v in raw_flat.items():
        bio.setdefault(k, v)

    helios: dict[str, float] = {}
    apollo: dict[str, float] = {}
    psyche: dict[str, float] = {}

    for key, val in bio.items():
        if key == "interpretation" or key == "critical_symptoms":
            continue
        rv = _round(val)
        if rv is None:
            continue
        lk = key.lower()
        if lk in HELIOS_KEYS:
            helios[lk] = rv
        elif lk in APOLLO_KEYS:
            apollo[lk] = rv
        elif lk in PSYCHE_KEYS:
            psyche[lk] = rv
        # `<unk>` and other unknowns are ignored.

    return {"helios": helios, "apollo": apollo, "psyche": psyche}
