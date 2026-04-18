export type Place = 'home' | 'office' | 'mall' | 'out';

export type PlaceSegment = { from: number; to: number; place: Place; label?: string };

export type AppSeries = { name: string; mins: number; series: number[] };

export type CheckIn = {
  hour: number;
  mood: number;
  speech: number;
  tremor: number;
};

export type WindowData = {
  zoom: 'day' | 'week' | 'month';
  hours: number;
  label: string;
  places: PlaceSegment[];
  apps: AppSeries[];
  heart: number[];
  heartRange: [number, number];
  checkins: CheckIn[];
};

const series = (n: number, peakAt: number, peak: number, floor = 0.05) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const d = Math.exp(-Math.pow((t - peakAt) * 3, 2));
    return Math.max(floor, d * peak);
  });

// ───────────────────────── Day (24h) ─────────────────────────

const DAY_PLACES: PlaceSegment[] = [
  { from: 0, to: 9, place: 'home', label: 'Home' },
  { from: 9, to: 13, place: 'mall', label: 'Greecologies' },
  { from: 13, to: 17, place: 'home', label: 'Home' },
  { from: 17, to: 22, place: 'out', label: 'Walk' },
  { from: 22, to: 24, place: 'home', label: 'Home' },
];

const DAY_APPS: AppSeries[] = [
  { name: 'Slack', mins: 63, series: series(48, 0.4, 0.7) },
  { name: 'Calendar', mins: 59, series: series(48, 0.35, 0.55) },
  { name: 'Facebook', mins: 72, series: series(48, 0.7, 0.45) },
];

const DAY_HEART = Array.from({ length: 96 }, (_, i) => {
  const t = i / 95;
  const base = 56 + 18 * Math.sin(t * Math.PI * 2 + 0.6);
  const spike = i > 60 && i < 70 ? 70 : 0;
  const noise = Math.sin(i * 1.7) * 4;
  return Math.max(45, Math.min(160, Math.round(base + spike + noise)));
});

const DAY_CHECKINS: CheckIn[] = [
  { hour: 8.5, mood: 72, speech: 84, tremor: 0.2 },
  { hour: 14.4, mood: 71, speech: 88, tremor: 0.3 },
  { hour: 21.1, mood: 78, speech: 86, tremor: 0.2 },
];

export const DAY_WINDOW: WindowData = {
  zoom: 'day',
  hours: 24,
  label: 'Sat 28 Apr',
  places: DAY_PLACES,
  apps: DAY_APPS,
  heart: DAY_HEART,
  heartRange: [45, 153],
  checkins: DAY_CHECKINS,
};

// ───────────────────────── Synth helpers ─────────────────────────

function placesForDay(dayIdx: number): PlaceSegment[] {
  const archetype = dayIdx % 7;
  if (archetype === 0) {
    return [{ from: 0, to: 24, place: 'home' }];
  }
  if (archetype === 1 || archetype === 2 || archetype === 3) {
    return [
      { from: 0, to: 8, place: 'home' },
      { from: 8, to: 18, place: 'office' },
      { from: 18, to: 24, place: 'home' },
    ];
  }
  if (archetype === 4) {
    return [
      { from: 0, to: 9, place: 'home' },
      { from: 9, to: 19, place: 'out' },
      { from: 19, to: 24, place: 'home' },
    ];
  }
  return [
    { from: 0, to: 10, place: 'home' },
    { from: 10, to: 14, place: 'mall' },
    { from: 14, to: 19, place: 'home' },
    { from: 19, to: 24, place: 'out' },
  ];
}

function buildPlaces(days: number): PlaceSegment[] {
  const out: PlaceSegment[] = [];
  for (let d = 0; d < days; d++) {
    const off = d * 24;
    placesForDay(d).forEach((seg) => {
      out.push({ from: off + seg.from, to: off + seg.to, place: seg.place });
    });
  }
  return out;
}

function buildApp(name: string, mins: number, peakAt: number, peak: number, days: number): AppSeries {
  const samplesPerDay = 24;
  const total = samplesPerDay * days;
  const arr = Array.from({ length: total }, (_, i) => {
    const dayIdx = Math.floor(i / samplesPerDay);
    const within = (i % samplesPerDay) / (samplesPerDay - 1);
    const dayWeight = 0.6 + 0.4 * Math.sin((dayIdx / days) * Math.PI * 2);
    const d = Math.exp(-Math.pow((within - peakAt) * 3, 2));
    return Math.max(0.04, d * peak * dayWeight);
  });
  return { name, mins: Math.round(mins * days), series: arr };
}

function buildHeart(days: number): number[] {
  const samplesPerDay = 48;
  const total = samplesPerDay * days;
  return Array.from({ length: total }, (_, i) => {
    const within = (i % samplesPerDay) / (samplesPerDay - 1);
    const dayIdx = Math.floor(i / samplesPerDay);
    const base = 58 + 14 * Math.sin(within * Math.PI * 2 + 0.6);
    const drift = Math.sin((dayIdx / days) * Math.PI * 3) * 3;
    const spike = within > 0.62 && within < 0.72 ? 60 : 0;
    return Math.max(45, Math.min(160, Math.round(base + drift + spike)));
  });
}

function buildCheckins(days: number): CheckIn[] {
  const out: CheckIn[] = [];
  for (let d = 0; d < days; d++) {
    const off = d * 24;
    const moodDrift = Math.sin((d / days) * Math.PI * 2) * 8;
    out.push({ hour: off + 8.5, mood: 70 + moodDrift, speech: 84, tremor: 0.2 });
    out.push({ hour: off + 14.4, mood: 72 + moodDrift, speech: 86, tremor: 0.3 });
    if (d % 4 !== 3) {
      out.push({ hour: off + 21.0, mood: 76 + moodDrift, speech: 86, tremor: 0.2 });
    }
  }
  return out;
}

// ───────────────────────── Week (168h) ─────────────────────────

export const WEEK_WINDOW: WindowData = {
  zoom: 'week',
  hours: 24 * 7,
  label: 'This week',
  places: buildPlaces(7),
  apps: [
    buildApp('Slack', 63, 0.4, 0.7, 7),
    buildApp('Calendar', 59, 0.35, 0.55, 7),
    buildApp('Facebook', 72, 0.7, 0.45, 7),
  ],
  heart: buildHeart(7),
  heartRange: [45, 158],
  checkins: buildCheckins(7),
};

// ───────────────────────── Month (720h) ─────────────────────────

export const MONTH_WINDOW: WindowData = {
  zoom: 'month',
  hours: 24 * 30,
  label: 'This month',
  places: buildPlaces(30),
  apps: [
    buildApp('Slack', 63, 0.4, 0.7, 30),
    buildApp('Calendar', 59, 0.35, 0.55, 30),
    buildApp('Facebook', 72, 0.7, 0.45, 30),
  ],
  heart: buildHeart(30),
  heartRange: [45, 162],
  checkins: buildCheckins(30),
};

// ───────────────────────── Palette / labels ─────────────────────────

export const PLACE_COLORS: Record<Place, string> = {
  home: 'rgba(255,255,255,0.22)',
  office: 'rgba(0,0,0,0.55)',
  mall: '#9c2231',
  out: 'rgba(255,255,255,0.48)',
};

export const PLACE_LABEL: Record<Place, string> = {
  home: 'Home',
  office: 'Office',
  mall: 'Mall',
  out: 'Out',
};

function aggregatePlacesByDay(places: PlaceSegment[], days: number): PlaceSegment[] {
  const result: PlaceSegment[] = [];
  for (let d = 0; d < days; d++) {
    const dayStart = d * 24;
    const dayEnd = (d + 1) * 24;
    const totals: Record<Place, number> = { home: 0, office: 0, mall: 0, out: 0 };
    for (const p of places) {
      const overlap = Math.max(0, Math.min(p.to, dayEnd) - Math.max(p.from, dayStart));
      totals[p.place] += overlap;
    }
    const entries = Object.entries(totals) as [Place, number][];
    const dominant = entries.sort((a, b) => b[1] - a[1])[0][0];
    result.push({ from: dayStart, to: dayEnd, place: dominant });
  }
  return result;
}

function aggregateSeriesByDay(series: number[], days: number): number[] {
  const per = Math.max(1, Math.floor(series.length / days));
  return Array.from({ length: days }, (_, d) => {
    const slice = series.slice(d * per, (d + 1) * per);
    if (slice.length === 0) return 0;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function aggregateHeartByDay(heart: number[], days: number): number[] {
  return aggregateSeriesByDay(heart, days).map((v) => Math.round(v));
}

function aggregateForMonth(w: WindowData): WindowData {
  const days = Math.round(w.hours / 24);
  return {
    ...w,
    places: aggregatePlacesByDay(w.places, days),
    apps: w.apps.map((a) => ({ ...a, series: aggregateSeriesByDay(a.series, days) })),
    heart: aggregateHeartByDay(w.heart, days),
  };
}

export function getWindow(zoom: 'day' | 'week' | 'month'): WindowData {
  if (zoom === 'week') return WEEK_WINDOW;
  if (zoom === 'month') return aggregateForMonth(MONTH_WINDOW);
  return DAY_WINDOW;
}
