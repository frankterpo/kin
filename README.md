# Kin

AI layer that coordinates care across a patient and their chosen support network, powered by the joint **Speechmatics × Thymia Sentinel** voice platform.

> Voice Medical Hackathon 2026 – Track 1 (Voice & Medical).

## Stack

- **Web** (`apps/web`) — Next.js 15 (App Router) + React 19 + Tailwind. Supabase auth + DB client. Four screens, dual patient/supporter mode toggle.
- **Voice pipeline** (`apps/pipeline`) — Python 3.11 + FastAPI WebSocket bridge. Receives 16 kHz PCM from the browser and forks it to **Speechmatics Realtime** (medical domain, ENHANCED operating point) and **Thymia Sentinel** (`wellbeing-awareness` policy; `helios`, `apollo`, `psyche` biomarkers). Persists check-ins to Supabase.
- **Supabase** — Postgres schema (users, care circles, check-ins, biomarker snapshots, supporter briefs, observations) + Storage for audio clips.

## V1 Scope (per `PRD.md`)

1. **Patient check-in** — 15-second voice capture with live partial transcript + streaming biomarker panel.
2. **Supporter brief** — Today's guidance + tone cues generated from the latest check-in.
3. **Contribute** — 15-second supporter voice note appended to the shared care timeline.
4. **Network pulse** — Biomarker trajectory over time overlaid with network touchpoints.

## Quick start

```bash
# 1. Prereqs
brew install portaudio          # macOS – only needed for pipeline mic tests
curl -LsSf https://astral.sh/uv/install.sh | sh  # if uv isn't installed

# 2. Env (copy the provided keys into .env at repo root)
cp .env.example .env    # fill SPEECHMATICS_API_KEY, THYMIA_API_KEY, SUPABASE_*

# 3. Supabase schema
npx supabase db push --db-url "$SUPABASE_CONNECTION_STRING"

# 4. Pipeline
cd apps/pipeline && uv sync && uv run uvicorn kin_pipeline.main:app --reload --port 8787

# 5. Web
cd apps/web && pnpm install && pnpm dev
open http://localhost:3000
```

## Layout

```
kin/
├── apps/
│   ├── web/         # Next.js UI
│   └── pipeline/    # FastAPI + Speechmatics + Thymia Sentinel bridge
├── supabase/
│   └── migrations/  # SQL schema
├── docs/
└── PRD.md
```

## License

MIT
