// Typed queries that the screens call. Returns DB-shaped data when Supabase
// is configured; otherwise silently falls back to the mock data in tracker.ts
// so the demo stays runnable end-to-end without backend setup.

import { DAY_WINDOW, MONTH_WINDOW, WEEK_WINDOW, WindowData } from './tracker';
import {
  DEMO_CIRCLE_ID,
  DEMO_PARTNER_ID,
  DEMO_PATIENT_ID,
  supabase,
  supabaseEnabled,
} from '../lib/supabase';

// ---------- Hero score (from latest helios biomarker) ----------

export type HeroScore = {
  value: number;            // 0..100
  source: 'biomarker' | 'mock';
  derivedFrom?: string;     // checkin id
};

export async function fetchHeroScore(circleId: string = DEMO_CIRCLE_ID): Promise<HeroScore> {
  if (!supabaseEnabled || !supabase) {
    return { value: 82, source: 'mock' };
  }
  const { data, error } = await supabase
    .from('biomarker_snapshots')
    .select('id, helios, checkin_id, checkins!inner(circle_id)')
    .eq('checkins.circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { value: 82, source: 'mock' };
  }
  const helios = (data[0] as any).helios ?? {};
  const distress = Number(helios.distress ?? 0);
  return {
    value: Math.max(0, Math.min(100, Math.round(100 - distress * 100))),
    source: 'biomarker',
    derivedFrom: (data[0] as any).checkin_id,
  };
}

// ---------- Day window (Tracker + Check-in feed both consume this) ----------

export async function fetchTodayWindow(circleId: string = DEMO_CIRCLE_ID): Promise<WindowData> {
  if (!supabaseEnabled || !supabase) return DAY_WINDOW;
  // TODO: real Supabase queries — for now mock fallback even when configured,
  // until the integration tables have enough demo data per session.
  return DAY_WINDOW;
}

export async function fetchWeekWindow(circleId: string = DEMO_CIRCLE_ID): Promise<WindowData> {
  if (!supabaseEnabled || !supabase) return WEEK_WINDOW;
  return WEEK_WINDOW;
}

export async function fetchMonthWindow(circleId: string = DEMO_CIRCLE_ID): Promise<WindowData> {
  if (!supabaseEnabled || !supabase) return MONTH_WINDOW;
  return MONTH_WINDOW;
}

// ---------- Supporter brief ----------

export type SupporterBriefRow = {
  headline: string;
  guidance: string;
  toneCues: string[];
  derivedFrom: string | null;
  forDate: string;
};

const MOCK_BRIEF: SupporterBriefRow = {
  headline: 'Quiet call tonight',
  guidance:
    "He slept badly and his speech rate is 12% slower than his Wednesday baseline. A short, warm call will land. Don't probe the tremor.",
  toneCues: ['warm', 'short', 'not clinical'],
  derivedFrom: null,
  forDate: new Date().toISOString().slice(0, 10),
};

export async function fetchSupporterBrief(
  supporterId: string = DEMO_PARTNER_ID,
  date: Date = new Date(),
): Promise<SupporterBriefRow> {
  if (!supabaseEnabled || !supabase) return MOCK_BRIEF;
  const dateStr = date.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('supporter_briefs')
    .select('headline, guidance, tone_cues, derived_from, for_date')
    .eq('supporter_id', supporterId)
    .eq('for_date', dateStr)
    .limit(1);

  if (error || !data || data.length === 0) return MOCK_BRIEF;
  const r = data[0] as any;
  return {
    headline: r.headline,
    guidance: r.guidance,
    toneCues: r.tone_cues ?? [],
    derivedFrom: r.derived_from,
    forDate: r.for_date,
  };
}

// ---------- Self-report tag (EmotionGrid commit) ----------

export type SelfReportInput = {
  circleId?: string;
  authorId: string;
  subjectId: string;
  emotion: string;
  valence: number;
  arousal: number;
  checkinId?: string | null;
  visibility?: 'private' | 'circle' | 'clinician';
};

export async function insertSelfReportTag(input: SelfReportInput): Promise<string | null> {
  if (!supabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from('self_report_tags')
    .insert({
      circle_id: input.circleId ?? DEMO_CIRCLE_ID,
      author_id: input.authorId,
      subject_id: input.subjectId,
      checkin_id: input.checkinId ?? null,
      emotion: input.emotion,
      valence: input.valence,
      arousal: input.arousal,
      visibility: input.visibility ?? 'private',
    })
    .select('id')
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return (data[0] as any).id ?? null;
}

// ---------- Check-in stub (created when VoiceOverlay completes) ----------

export type CheckinStubInput = {
  circleId?: string;
  authorId: string;
  source?: 'patient' | 'supporter';
  transcript?: string | null;
  durationMs?: number;
  visibility?: 'private' | 'circle' | 'clinician';
};

export async function insertCheckinStub(input: CheckinStubInput): Promise<string | null> {
  if (!supabaseEnabled || !supabase) return null;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      circle_id: input.circleId ?? DEMO_CIRCLE_ID,
      author_id: input.authorId,
      source: input.source ?? 'patient',
      transcript: input.transcript ?? null,
      duration_ms: input.durationMs ?? null,
      visibility: input.visibility ?? 'circle',
      started_at: nowIso,
      finished_at: nowIso,
    })
    .select('id')
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return (data[0] as any).id ?? null;
}

// ---------- Identity helpers (for current "user") ----------

export const currentPatientId = (): string => DEMO_PATIENT_ID;
export const currentSupporterProfileId = (): string => DEMO_PARTNER_ID;
export const currentCircleId = (): string => DEMO_CIRCLE_ID;
