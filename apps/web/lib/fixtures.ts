import { DEMO_CIRCLE_ID, DEMO_PATIENT_ID, DEMO_PARTNER_ID } from "@/lib/supabase";

export type Checkin = {
  id: string;
  circle_id: string;
  author_id: string;
  source: string;
  transcript: string | null;
  started_at: string;
  finished_at: string | null;
};

export type Biomarker = {
  id: string;
  checkin_id: string;
  t_offset_ms: number;
  helios: Record<string, number> | null;
  apollo: Record<string, number> | null;
  psyche: Record<string, number> | null;
  concordance: Record<string, unknown> | null;
  created_at: string;
};

export type SupporterBrief = {
  id: string;
  circle_id: string;
  supporter_id: string;
  for_date: string;
  headline: string;
  guidance: string;
  tone_cues: string[];
  created_at: string;
};

export type WhatsAppMsg = {
  id: string;
  direction: "inbound" | "outbound";
  msg_type: string;
  from_e164: string | null;
  to_e164: string | null;
  body: string | null;
  created_at: string;
};

const now = () => new Date().toISOString();
const ago = (s: number) => new Date(Date.now() - s * 1000).toISOString();

export const fixtureCheckins: Checkin[] = [
  {
    id: "fx-checkin-1",
    circle_id: DEMO_CIRCLE_ID,
    author_id: DEMO_PATIENT_ID,
    source: "patient",
    transcript:
      "I'm fine. Slept badly again — the pain kept me up. Didn't eat much breakfast but I'm heading out for a short walk soon.",
    started_at: ago(60),
    finished_at: ago(45),
  },
];

export const fixtureBiomarkers: Biomarker[] = [
  {
    id: "fx-bio-1",
    checkin_id: "fx-checkin-1",
    t_offset_ms: 12000,
    helios: { distress: 0.62, stress: 0.68, fatigue: 0.74, burnout: 0.41, low_self_esteem: 0.22 },
    apollo: { depression: 0.31, anxiety: 0.55 },
    psyche: { happy: 0.08, sad: 0.42, angry: 0.12, neutral: 0.28, calm: 0.1 },
    concordance: { scenario: "masking", agreement_level: "low" },
    created_at: ago(55),
  },
];

export const fixtureBriefs: SupporterBrief[] = [
  {
    id: "fx-brief-1",
    circle_id: DEMO_CIRCLE_ID,
    supporter_id: DEMO_PARTNER_ID,
    for_date: now().slice(0, 10),
    headline: "Sofia said 'fine' — signals say rough night",
    guidance:
      "Offer to sit with her for breakfast instead of asking how she slept. Keep tone soft and slow — fatigue and stress both elevated. Suggest pushing the walk to after lunch if energy doesn't lift.",
    tone_cues: ["gentle", "unhurried", "non-clinical"],
    created_at: ago(50),
  },
];

export const fixtureMessages: WhatsAppMsg[] = [
  {
    id: "fx-msg-1",
    direction: "inbound",
    msg_type: "audio",
    from_e164: "447712513416",
    to_e164: null,
    body: "I'm fine. Slept badly again…",
    created_at: ago(60),
  },
  {
    id: "fx-msg-2",
    direction: "outbound",
    msg_type: "text",
    from_e164: null,
    to_e164: "447810141152",
    body: "Kin: Sofia said 'fine' — signals say rough night. Want a soft playbook?",
    created_at: ago(50),
  },
];

export const DEMO_IDS = { DEMO_CIRCLE_ID, DEMO_PATIENT_ID, DEMO_PARTNER_ID };
