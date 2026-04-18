import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { palette } from '../../theme';
import { AppSeries, CheckIn, PLACE_COLORS, PLACE_LABEL, PlaceSegment } from '../../data/tracker';

type Mode = 'day' | 'week' | 'month';

// ───────────────────────── Time ruler ─────────────────────────

export function TimeRuler({ width, mode, hours }: { width: number; mode: Mode; hours: number }) {
  const ticks = computeTicks(mode, hours);
  return (
    <View style={{ width }}>
      <Svg width={width} height={20}>
        {ticks.map((t, i) => {
          const x = (t.h / hours) * width;
          return (
            <Line
              key={i}
              x1={x}
              x2={x}
              y1={0}
              y2={t.major ? 9 : 5}
              stroke={palette.ink}
              strokeOpacity={t.major ? 0.55 : 0.22}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
      <View style={[styles.rulerLabels, { width }]}>
        {ticks
          .filter((t) => t.label)
          .map((t, i) => {
            const x = (t.h / hours) * width;
            return (
              <Text key={i} style={[styles.rulerLbl, { left: x - 14 }]} numberOfLines={1}>
                {t.label}
              </Text>
            );
          })}
      </View>
    </View>
  );
}

function computeTicks(mode: Mode, hours: number): { h: number; major: boolean; label?: string }[] {
  const ticks: { h: number; major: boolean; label?: string }[] = [];
  if (mode === 'day') {
    for (let h = 0; h <= hours; h++) {
      const major = h % 3 === 0;
      ticks.push({ h, major, label: major ? hourLabel(h) : undefined });
    }
  } else if (mode === 'week') {
    for (let h = 0; h <= hours; h += 6) {
      const major = h % 24 === 0;
      const dayIdx = Math.floor(h / 24);
      ticks.push({ h, major, label: major ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][dayIdx] ?? '' : undefined });
    }
  } else {
    for (let h = 0; h <= hours; h += 12) {
      const dayIdx = Math.floor(h / 24);
      const major = dayIdx % 5 === 0 && h % 24 === 0;
      ticks.push({ h, major, label: major ? String(dayIdx === 0 ? 1 : dayIdx) : undefined });
    }
  }
  return ticks;
}

function hourLabel(h: number) {
  if (h === 0 || h === 24) return '12';
  if (h === 12) return '12';
  return String(h % 12);
}

// ───────────────────────── Place lane ─────────────────────────

export function PlaceLane({
  width,
  segments,
  hours,
  showLabels = true,
}: {
  width: number;
  segments: PlaceSegment[];
  hours: number;
  showLabels?: boolean;
}) {
  const height = 30;
  return (
    <View style={{ width, marginBottom: 6 }}>
      <Svg width={width} height={height}>
        {segments.map((s, i) => {
          const x = (s.from / hours) * width;
          const w = ((s.to - s.from) / hours) * width;
          if (w < 0.5) return null;
          return (
            <Rect
              key={i}
              x={x + 0.5}
              y={4}
              width={Math.max(0, w - 1)}
              height={22}
              rx={11}
              fill={PLACE_COLORS[s.place]}
            />
          );
        })}
      </Svg>
      {showLabels ? (
        <View style={[styles.placeLabels, { width }]}>
          {segments
            .filter((s) => ((s.to - s.from) / hours) * width > 60)
            .map((s, i) => {
              const x = ((s.from + s.to) / 2 / hours) * width;
              return (
                <Text key={i} style={[styles.placeLbl, { left: Math.max(0, x - 30) }]} numberOfLines={1}>
                  {s.label ?? PLACE_LABEL[s.place]}
                </Text>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────── App lane (sparkline row) ─────────────────────────

export function AppRow({ width, app }: { width: number; app: AppSeries }) {
  const labelW = 88;
  const durW = 56;
  const sparkW = Math.max(0, width - labelW - durW - 20);
  const height = 22;
  const max = Math.max(...app.series, 0.0001);
  const path = app.series
    .map((v, i) => {
      const x = (i / (app.series.length - 1)) * sparkW;
      const y = height - (v / max) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={[styles.appRow, { width }]}>
      <Text style={[styles.appName, { width: labelW }]} numberOfLines={1}>
        {app.name}
      </Text>
      <View style={{ width: sparkW, height }}>
        <Svg width={sparkW} height={height}>
          <Path d={path} stroke={palette.accent} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={[styles.appDur, { width: durW }]}>{formatMins(app.mins)}</Text>
    </View>
  );
}

function formatMins(m: number) {
  if (m < 60) return `${m} min`;
  const h = m / 60;
  return h >= 10 ? `${Math.round(h)} h` : `${h.toFixed(1)} h`;
}

// ───────────────────────── Heart lane ─────────────────────────

export function HeartLane({
  width,
  values,
  range,
}: {
  width: number;
  values: number[];
  range: [number, number];
}) {
  const height = 56;
  const [lo, hi] = range;
  const span = Math.max(1, hi - lo);
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - lo) / span) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={{ width, marginTop: 6 }}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={palette.ink} strokeOpacity={0.06} />
        <Path d={path} stroke="#ff7aa3" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ───────────────────────── Voice biomarker lane ─────────────────────────

export function VoiceLane({
  width,
  checkins,
  hours,
}: {
  width: number;
  checkins: CheckIn[];
  hours: number;
}) {
  const height = 30;
  return (
    <View style={{ width, marginTop: 4 }}>
      <Svg width={width} height={height}>
        <Line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={palette.ink}
          strokeOpacity={0.1}
          strokeDasharray="2 4"
        />
        {checkins.map((c, i) => {
          const x = (c.hour / hours) * width;
          const y = height / 2 - ((c.mood - 70) / 30) * 10;
          const r = hours <= 24 ? 5 : hours <= 168 ? 3 : 2;
          const isSupporter = c.source === 'supporter';
          return isSupporter ? (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="none"
              stroke={palette.accent}
              strokeWidth={1.4}
              opacity={0.9}
            />
          ) : (
            <Circle key={i} cx={x} cy={y} r={r} fill={palette.accent} opacity={0.9} />
          );
        })}
      </Svg>
    </View>
  );
}

// ───────────────────────── Concordance strip ─────────────────────────

const CONCORD_COLORS: Record<NonNullable<CheckIn['concordance']>, string> = {
  aligned: '#7ad28a',  // soft green
  mild: '#ffd27a',     // accent gold
  gap: '#e36b7a',      // muted red
};

export function ConcordanceLane({
  width,
  checkins,
  hours,
}: {
  width: number;
  checkins: CheckIn[];
  hours: number;
}) {
  const height = 22;
  return (
    <View style={{ width, marginTop: 2 }}>
      <Svg width={width} height={height}>
        <Line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={palette.ink}
          strokeOpacity={0.06}
        />
        {checkins.map((c, i) => {
          const x = (c.hour / hours) * width;
          const tone = c.concordance ?? 'aligned';
          const r = hours <= 24 ? 4 : hours <= 168 ? 3 : 2;
          return <Circle key={i} cx={x} cy={height / 2} r={r} fill={CONCORD_COLORS[tone]} />;
        })}
      </Svg>
    </View>
  );
}

// ───────────────────────── Lane label ─────────────────────────

export function LaneHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.laneHead}>
      <Text style={styles.laneLbl}>{label}</Text>
      {hint ? <Text style={styles.laneHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rulerLabels: { height: 14, position: 'relative' },
  rulerLbl: {
    position: 'absolute',
    color: palette.inkMuted,
    fontSize: 10,
    letterSpacing: 0.3,
    width: 28,
    textAlign: 'center',
  },

  placeLabels: { height: 14, position: 'relative', marginTop: 2 },
  placeLbl: {
    position: 'absolute',
    color: palette.ink,
    fontSize: 10,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    marginVertical: 2,
    gap: 10,
  },
  appName: { color: palette.inkDim, fontSize: 12, fontWeight: '500' },
  appDur: { color: palette.ink, fontSize: 12, textAlign: 'right' },

  laneHead: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6, gap: 8 },
  laneLbl: { color: palette.inkMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  laneHint: { color: palette.accent, fontSize: 10, letterSpacing: 0.5, fontWeight: '600' },
});
