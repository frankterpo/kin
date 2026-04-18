# Kin — Product Requirements Document

*Voice AI Hack London · April 2026*

---

## 1. The Problem

Chronic conditions like Parkinson's, early-stage dementia, long COVID, anorexia, and serious mental illness are not managed by a patient — they're managed by a network. Partners, adult children, siblings, and close friends all want to help, but they don't know what to do, when to do it, or how the person is actually doing between clinic visits.

The patient ends up as the reluctant project manager of their own illness: repeating updates, calibrating who gets told what, and translating how they feel into words that land differently with each listener. Clinicians, meanwhile, see a 20-minute snapshot every three months and miss the trajectory entirely.

The result is a support network that loves someone deeply and still shows up inconsistently, and a care pathway that reacts to crises instead of preventing them.

---

## 2. The Product

**Kin is an AI layer that sits across the patient and their chosen support network, orchestrating the flow of care.**

It is a single Expo-built mobile app with a dual-mode toggle — **patient view** and **supporter view** — backed by a shared event model so both sides see two perspectives on the same care circle.

At the heart of the product is a **15-second daily voice check-in** built on the joint Speechmatics × thymia platform: the patient speaks naturally, and Kin returns both a transcript and 30+ clinical-grade voice biomarkers (fatigue, stress, mood, plus condition-specific signals like speech rate and pitch variability for Parkinson's).

Kin uses that signal, alongside contributions from the network, to:

- Generate **personalised briefs for each supporter** — *"Dad slept badly — a quiet call this evening would help, don't probe on the tremor"*
- Collect **structured observations back via voice notes** from the network
- Synthesise a **weekly pulse** that shows the patient, their people, and any clinician a richer picture than a clinic visit has ever produced

---

## 3. Why Now

Voice has become the lowest-friction clinical instrument available. **thymia and Speechmatics' April 2026 joint platform** makes it possible to extract health signals and transcription from a single 15-second utterance through one integration, with no extra hardware.

That unlocks a product that was impossible 12 months ago — **continuous, longitudinal monitoring of how someone is actually doing**, gathered through the most natural act a human performs.

---

## 4. V1 Scope (Hackathon Build)

The v1 hackathon build ships **four screens** in a single Expo app:

| # | Screen | Mode | Purpose |
|---|--------|------|---------|
| 1 | **Patient check-in** | Patient | Conversational Flow agent + biomarker panel from a 15-second utterance |
| 2 | **Supporter brief** | Supporter | Today's guidance + tone cues, personalised per supporter |
| 3 | **Contribute** | Supporter | 15-second voice observation back into the shared care circle |
| 4 | **Network pulse** | Both | Biomarker trajectory overlaid with network touchpoints |

### Core technical spine

- **Expo (React Native)** — single app, dual-mode toggle
- **Speechmatics × thymia joint platform** — transcription + 30+ voice biomarkers from one 15s utterance
- **Shared event model** — patient check-ins and supporter contributions are events on the same care circle, rendered differently per mode
- **Flow agent** — conversational patient check-in, not a form
- **LLM layer** — turns biomarker deltas + network events into per-supporter briefs and the weekly pulse

---

## 5. Success Criteria

Success for v1 is a **live demo** where one human flips between patient and supporter perspectives and the judges immediately understand that Kin has turned an uncoordinated support network into a caring, attentive, informed one — without any of them having to become a project manager.

Specifically, the demo should land three beats:

1. **The check-in feels human** — 15 seconds of natural speech, not a questionnaire
2. **The brief feels earned** — supporters see guidance that clearly comes from real signal, not a generic nudge
3. **The pulse feels new** — biomarker trajectory + network touchpoints together produce a view no clinic visit has ever produced

---

## 6. Out of Scope for V1

- Clinician-facing dashboard (implied by the pulse, not built)
- Multi-patient / multi-circle management
- Medication tracking, scheduling, reminders
- HIPAA/GDPR-grade data handling (hackathon-grade only)
- Onboarding flows beyond a single seeded demo circle
- Native push notifications (simulated in-app)

---

## 7. Target Conditions (Demo-Relevant)

- Parkinson's (speech rate, pitch variability, tremor-adjacent cues)
- Early-stage dementia
- Long COVID
- Anorexia (eating-disorder affect and speech patterning)
- Serious mental illness (depression, bipolar)

One condition is picked for the live demo persona; the architecture is condition-agnostic.
