import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme';
import { GlassCard } from '../GlassCard';
import { CheckIn, PLACE_LABEL, PlaceSegment, WindowData } from '../../data/tracker';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = { hour: number; window: WindowData };

export function SnapshotCard({ hour, window }: Props) {
  const place = findPlace(window.places, hour);
  const heartIdx = clamp(Math.round((hour / window.hours) * (window.heart.length - 1)), 0, window.heart.length - 1);
  const hr = window.heart[heartIdx];
  const topApp = window.apps.reduce(
    (best, app) => {
      const idx = clamp(Math.round((hour / window.hours) * (app.series.length - 1)), 0, app.series.length - 1);
      const v = app.series[idx];
      return v > best.v ? { v, name: app.name } : best;
    },
    { v: -Infinity, name: '' as string },
  );
  const lastCheckin = nearestCheckin(window.checkins, hour);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.time}>{formatMoment(hour, window)}</Text>
        <Text style={styles.day}>{window.label}</Text>
      </View>
      <Row icon="·" label={place ? place.label ?? PLACE_LABEL[place.place] : 'Unknown'} sub={place ? PLACE_LABEL[place.place] : undefined} />
      <Row icon="·" label={topApp.name || 'No app activity'} sub={topApp.v > 0.2 ? 'most active app' : 'idle'} />
      <Row icon="·" label={`${hr} bpm`} sub={`${window.heartRange[0]}–${window.heartRange[1]} bpm in window`} />
      {lastCheckin ? (
        <Row
          icon="·"
          label={`mood ${Math.round(lastCheckin.mood)} · speech ${lastCheckin.speech} · tremor ${lastCheckin.tremor.toFixed(1)}`}
          sub={`Kin check-in at ${formatMoment(lastCheckin.hour, window)}`}
        />
      ) : (
        <Row icon="·" label="No check-in nearby" sub="suggest a quick voice note" />
      )}
    </GlassCard>
  );
}

function Row({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.lbl}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

function findPlace(places: PlaceSegment[], hour: number) {
  return places.find((p) => hour >= p.from && hour < p.to) ?? null;
}

function nearestCheckin(checkins: CheckIn[], hour: number) {
  let best: CheckIn | null = null;
  let bestDist = Infinity;
  for (const c of checkins) {
    const d = Math.abs(c.hour - hour);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function formatMoment(hour: number, window: WindowData) {
  const dayIdx = Math.floor(hour / 24);
  const within = hour - dayIdx * 24;
  const hh = Math.floor(within);
  const mm = Math.round((within - hh) * 60);
  const ampm = hh >= 12 ? 'pm' : 'am';
  const display = hh % 12 === 0 ? 12 : hh % 12;
  const time = `${display}:${String(mm).padStart(2, '0')} ${ampm}`;
  if (window.zoom === 'day') return time;
  if (window.zoom === 'week') return `${DAY_NAMES[dayIdx % 7]} · ${time}`;
  return `Day ${dayIdx + 1} · ${time}`;
}

const styles = StyleSheet.create({
  card: { padding: 14, marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  time: { color: palette.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  day: { color: palette.inkMuted, fontSize: 12, letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  icon: { fontSize: 14, width: 14, color: palette.inkMuted },
  lbl: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  sub: { color: palette.inkDim, fontSize: 11, marginTop: 2 },
});
