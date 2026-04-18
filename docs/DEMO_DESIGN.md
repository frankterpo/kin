# Kin — Hackathon Demo Design

**Event:** Voice Medical Hackathon 2026 — Track 1
**Headline:** *When "I'm fine" isn't — Kin hears it.*
**Runtime budget:** 60 seconds live, 30 seconds Q&A setup

---

## 1. One-liner

Kin is the AI layer that hears what chronic patients can't say. We turn a 15-second voice note into a warm, actionable brief for the people who love them.

## 2. The 60-second hero scene

**Stage setup:** One screen, two browser windows side-by-side. Left: iPhone mockup framing `app/checkin` (Mom, the patient). Right: laptop mockup framing `app/brief` in WhatsApp-style chat thread (Sarah, her daughter). Both share the same `care_circle_id`.

| t      | What judges see                                                                                                     | What's actually happening                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0:00   | Mom's phone: "How are you today?" prompt. Demoer taps record.                                                       | WebSocket opens → FastAPI → Speechmatics + Thymia Sentinel fan-out |
| 0:00–0:15 | Mom speaks: *"I'm fine, honey. Just a bit tired, nothing to worry about. Dinner was good."* Live transcript streams on her screen. | Speechmatics real-time STT; Thymia ingests raw PCM in parallel     |
| 0:15–0:19 | Stop. A subtle "Kin is listening…" shimmer on the voice note bubble.                                               | Grace window (4s) for Thymia policy evaluation → Supabase writes   |
| 0:19   | On Sarah's laptop: WhatsApp chat pings. New voice note from Mom appears with a small `Kin` chip.                    | Next.js realtime subscription on `supporter_briefs` table          |
| 0:21   | Sarah taps the voice note. A **Kin card slides up from underneath** the bubble.                                     | Hover-reveal UI (Approach C)                                       |
| 0:21–0:35 | Card reads: *"Mom says she's fine. Her voice suggests she's more tired than usual and a little flat today. She mentioned dinner — ask her about it. Don't pile on."* Concordance dot is amber. | Live LLM generates the brief from Thymia policy + transcript (safety harness, §6) |
| 0:35–0:37 | Demoer taps `</>` in the corner. Card flips to clinical view: Helios 62, Apollo 48, Psyche 71, concordance gap 0.34, policy label `wellbeing-awareness: tiredness + low mood`. | Same data, different template. Toggle is CSS + state, nothing new fetched. |
| 0:37–0:55 | Sarah holds record. Says: *"Hi Mum, I heard you. I'll come by Sunday and make the cassoulet. No rush, rest."* Voice note sends back. | Same pipeline, reverse direction. Optional: show Sarah's own concordance is green (she's genuinely warm).   |
| 0:55–1:00 | Cut to a pre-rendered **7-day strip** at the top of the chat: a sparkline of Mom's Helios over the week, climbing as the network engages. | Pre-rendered static image. This is the data payoff. Not live.      |

**Last line to camera:** *"Kin turned one voice note into a moment of care. Do that every day for a year. That's Kin."*

## 3. UI composition — Approach C with `</>` toggle

- **Default (emotional) view**: WhatsApp-fidelity chat. Green bubbles. Waveform voice messages. A small `Kin` chip on any message Kin has analyzed. Concordance shown as a single colored dot (green / amber / red).
- **Kin card (tap to reveal)**: Slides up from underneath the voice message. Contains: 1-sentence brief, 1 conversation starter, concordance dot + plain-English gloss.
- **Clinical view (`</>` toggle, top-right)**: Same data, new layout. Shows Helios / Apollo / Psyche scores, the Thymia policy label, the raw Speechmatics transcript, and the LLM prompt → response. Judges and tech partners (Speechmatics, Thymia) get their receipts here.
- **Nothing else on screen.** No nav bar, no settings, no logo wall. The product is the conversation.

## 4. What's live vs. staged vs. fallback

| Component                 | Status   | Notes |
| ------------------------- | -------- | ----- |
| Mic capture + PCM worklet | **Live** | Proven in smoke test |
| Speechmatics STT          | **Live** | Medical domain model, sub-second latency |
| Thymia Sentinel biomarkers | **Live** | Policy `wellbeing-awareness`, 4s grace window in place |
| Supabase writes           | **Live** | `checkins`, `biomarker_snapshots`, `supporter_briefs` |
| Supabase realtime subscribe on supporter tab | **Live** | New, needs to be wired this week |
| LLM brief generation       | **Live** with template fallback | See §6 |
| `</>` clinical toggle      | **Live** | Pure frontend state |
| Supporter round-trip reply | **Live** | Same pipeline reversed |
| 7-day recovery strip       | **Staged** | Pre-rendered PNG, ships in the repo |
| **One-keystroke fallback** | **Always ready** | `⌘+P` in the deck skips to a 45s screen recording of a canonical run. Nobody will know. |

## 5. The six locked premises

1. **WhatsApp is the visual metaphor.** Not a dashboard, not a medical UI. Judges understand it instantly, which means narration is optional.
2. **Concordance is the hero. Raw biomarkers are the proof.** Emotional beat first, clinical receipts via `</>`.
3. **Two-tab demo on one screen.** The network moment has to be seen, not described.
4. **LLM in the brief path is live, but harnessed.** See §6.
5. **60 seconds total.** Anything longer, the room tunes out. The 7-day close is the only thing that earns extra time.
6. **Fallback is already in the deck.** Not a video switcher. Just the next slide.

## 6. LLM safety harness (because #4 is the riskiest bet)

- **Model:** Claude Haiku 4.5 or Groq Llama 3.3 70B (sub-1s p50 latency)
- **Hard timeout:** 2.5 seconds. On timeout, fall back to deterministic template composed from Thymia policy label + transcript keywords. Judges won't know the difference — both live in the same UI slot.
- **Pre-warm:** Fire a warmup request 30s before the demo starts.
- **Cache the canonical input.** Record the expected Mom script once, hash the input, cache the LLM output. If the live run produces the same transcript, it's instant and stable.
- **Structured output (JSON):** `{ brief: string, starter: string, tone: "warm" | "check-in" | "encourage" }`. Parse and template. Any parse failure → template fallback.
- **Prompt discipline:** The prompt explicitly bars clinical advice, diagnoses, or urgency framing. Kin is a warm translator, not a triage tool.
- **Log every output.** Store in `supporter_briefs.llm_trace` for debrief.

## 7. Ruthless scope cuts (what we are NOT shipping for the demo)

- No auth. Demo profiles are hardcoded via `care_circle_id` URL param. RLS is disabled for the demo branch.
- No onboarding flow, no "create a care circle," no invite flow.
- No push notifications. The supporter tab uses Supabase realtime + a subtle in-page ping.
- No Weekly Pulse email. `app/pulse` exists as a static page and is shown only if Q&A goes there.
- No multi-condition support. Demo data is Type 2 diabetes + mild depression. Everything else is future work.
- No voice reply transcription persistence beyond the demo session.
- No mobile app. The iPhone mockup is a CSS frame around the Next.js web app.

## 8. 48-hour build plan

| Block | Hours | Work |
|-------|-------|------|
| **Now → +6h** | 6 | Supabase realtime subscription on `supporter_briefs`. Wire `app/brief` to live-update on new rows for the demo `care_circle_id`. Ship the WhatsApp-style CSS (chat bubbles, waveform voice bubbles, green theme). |
| **+6h → +14h** | 8 | Approach C hover-reveal card. Kin chip + concordance dot. `</>` toggle. Mobile-framed `app/checkin`. |
| **+14h → +22h** | 8 | LLM brief pipeline. Claude Haiku integration, safety harness, template fallback, prompt tuning against 10 canonical transcripts. |
| **+22h → +28h** | 6 | Supporter round-trip. Reverse flow. Concordance on supporter's own reply. |
| **+28h → +36h** | 8 | Pre-render 7-day strip. Build the demo deck (title card, story setup, `⌘+P` fallback video, Q&A slides). Rehearse with a stopwatch x 10. |
| **+36h → +44h** | 8 | Polish. Record the fallback video against the live run so they're indistinguishable. End-to-end rehearsal against slow wifi (tether a phone). |
| **+44h → +48h** | 4 | Buffer + sleep. Do not skip. Tired demos die. |

## 9. Success criteria

- **Primary:** A judge repeats the headline *"when 'I'm fine' isn't — Kin hears it"* in conversation after the demo.
- **Secondary:** Speechmatics and Thymia partners ask for a follow-up call.
- **Tertiary:** Someone in the audience tears up at the supporter reply beat. (It happens. Our demo Mom says she's fine. Every judge has called their mother this week.)

## 10. What to do if things go wrong mid-demo

| Failure mode | Response |
|-------------|---------|
| Mic permission denied | One more try, then `⌘+P` → fallback. Do not fight the browser. |
| Speechmatics drops | Press on. Transcript fills after the fact. The biomarkers and brief still render. |
| Thymia returns no policy | 4s grace window extends to 8s once. Then the card renders with "Kin is listening" instead of brief text. Move to `</>` and narrate the raw transcript. Still a story. |
| LLM timeout | Silent fallback to template. Nobody notices. |
| Full network failure | `⌘+P`. 45 seconds of pre-recorded gold. Keep eye contact with the judges. Narrate as if live. You practiced this. |

---

*This design doc is the contract. Anything not in here is future work. Build this. Ship it. Go to bed.*
