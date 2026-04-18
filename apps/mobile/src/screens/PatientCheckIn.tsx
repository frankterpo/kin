import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette, radius, type } from '../theme';
import { ArcTrack } from '../components/ArcTrack';
import { DotMatrix } from '../components/DotMatrix';
import { GlassCard } from '../components/GlassCard';
import { EmotionSheet } from '../components/EmotionSheet';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';
import { DAY_WINDOW, PLACE_COLORS, PLACE_LABEL, Place } from '../data/tracker';
import {
  currentCircleId,
  currentPatientId,
  insertSelfReportTag,
} from '../data/queries';
import { useHeroScore } from '../hooks/useHeroScore';

const SLEEP = {
  display: '5:12',
  delta: '-1h 48 vs Wed',
};

export function PatientCheckIn() {
  const [heroW, heroOnLayout] = useMeasuredWidth();
  const heroFit = heroW > 0 ? Math.min(heroW * 0.45, 220) : undefined;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const heroScore = useHeroScore();
  const displayScore = heroScore.value;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.h1}>Check-in</Text>
        <Text style={styles.chev}>⌄</Text>
      </View>

      <View style={styles.hero} onLayout={heroOnLayout}>
        {heroFit ? <DotMatrix value={String(displayScore)} fitToWidth={heroFit} /> : null}
        <Text style={styles.degree}>°</Text>
      </View>
      <View style={styles.heroSub}>
        <Text style={styles.heroTitle}>Sat</Text>
        <Text style={styles.heroCity}>Steady · since Wed</Text>
      </View>

      <View style={styles.tagRow}>
        <Pressable
          style={[styles.tagPill, captured && styles.tagPillOn]}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={[styles.tagLbl, captured && styles.tagLblOn]}>
            {captured ? `Tagged · ${captured}` : '+  Tag this moment'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.arcWrap}>
        <ArcTrack progress={0.58} />
        <View style={styles.arcMeta}>
          <View style={styles.arcCol}>
            <Text style={styles.arcVal}>08:42</Text>
            <Text style={styles.arcLbl}>First word</Text>
          </View>
          <View style={styles.arcCol}>
            <View style={styles.miniGlyph}>
              <DotMatrix value={String(DAY_WINDOW.checkins.length)} dotSize={3} gap={1} />
            </View>
            <Text style={styles.arcLbl}>check-ins</Text>
          </View>
          <View style={styles.arcCol}>
            <Text style={styles.arcVal}>21:10</Text>
            <Text style={styles.arcLbl}>Wind down</Text>
          </View>
        </View>
      </View>

      <View style={styles.cards}>
        <View style={styles.cardRow}>
          <SleepCard />
          <HeartCard />
        </View>
        <View style={styles.cardRow}>
          <VoiceCard />
          <PlaceCard />
        </View>
      </View>

      <EmotionSheet
        visible={sheetOpen}
        question={`What word fits ${displayScore}?`}
        onCancel={() => setSheetOpen(false)}
        onCommit={(emotion) => {
          setCaptured(emotion);
          setSheetOpen(false);
          insertSelfReportTag({
            circleId: currentCircleId(),
            authorId: currentPatientId(),
            subjectId: currentPatientId(),
            emotion,
            valence: 0,
            arousal: 0,
            visibility: 'private',
          }).catch(() => {});
        }}
      />

    </ScrollView>
  );
}

function SleepCard() {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle}>Sleep</Text>
      <Text style={styles.cardSub}>Last night</Text>
      <View style={styles.cardHero}>
        <DotMatrix value={SLEEP.display} dotSize={4} gap={1.5} />
      </View>
      <Text style={styles.cardFoot}>{SLEEP.delta}</Text>
    </GlassCard>
  );
}

function HeartCard() {
  const [w, onLayout] = useMeasuredWidth();
  const { heart, heartRange } = DAY_WINDOW;
  const avg = useMemo(
    () => Math.round(heart.reduce((a, b) => a + b, 0) / heart.length),
    [heart]
  );
  const [lo, hi] = heartRange;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle}>Heart</Text>
      <Text style={styles.cardSub}>Today</Text>
      <View style={styles.cardHero}>
        <Text style={styles.heartRange}>{lo}–{hi}</Text>
        <Text style={styles.heartUnit}>bpm</Text>
      </View>
      <View style={styles.sparkWrap} onLayout={onLayout}>
        {w > 0 ? <MiniSparkline width={w} height={36} values={heart} range={heartRange} /> : null}
      </View>
      <Text style={styles.cardFoot}>avg {avg}</Text>
    </GlassCard>
  );
}

function MiniSparkline({
  width,
  height,
  values,
  range,
}: {
  width: number;
  height: number;
  values: number[];
  range: [number, number];
}) {
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
    <Svg width={width} height={height}>
      <Path d={path} stroke="#ff7aa3" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function VoiceCard() {
  const { checkins } = DAY_WINDOW;
  const avgMood = useMemo(
    () => Math.round(checkins.reduce((a, c) => a + c.mood, 0) / Math.max(1, checkins.length)),
    [checkins]
  );
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle}>Voice</Text>
      <Text style={styles.cardSub}>Mood today</Text>
      <View style={styles.cardHero}>
        <DotMatrix value={String(avgMood)} dotSize={4} gap={1.5} />
      </View>
      <Text style={styles.cardFoot}>{checkins.length} check-ins</Text>
    </GlassCard>
  );
}

function PlaceCard() {
  const [w, onLayout] = useMeasuredWidth();
  const { places, hours } = DAY_WINDOW;
  const breakdown = useMemo(() => {
    const totals: Record<Place, number> = { home: 0, office: 0, mall: 0, out: 0 };
    for (const p of places) totals[p.place] += p.to - p.from;
    return (Object.entries(totals) as [Place, number][])
      .filter(([, h]) => h > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [places]);
  const top = breakdown.slice(0, 2);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.cardTitle}>Place</Text>
      <Text style={styles.cardSub}>Today</Text>
      <View style={styles.placeStripWrap} onLayout={onLayout}>
        {w > 0 ? (
          <Svg width={w} height={20}>
            {places.map((s, i) => {
              const x = (s.from / hours) * w;
              const segW = ((s.to - s.from) / hours) * w;
              return (
                <Rect
                  key={i}
                  x={x + 0.5}
                  y={2}
                  width={Math.max(0, segW - 1)}
                  height={16}
                  rx={8}
                  fill={PLACE_COLORS[s.place]}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.placeFootRow}>
        {top.map(([place, h]) => (
          <Text key={place} style={styles.placeFoot}>
            {PLACE_LABEL[place]} {Math.round(h)}h
          </Text>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { ...type.title, color: palette.ink, fontSize: 26 },
  chev: { color: palette.inkDim, fontSize: 18 },

  hero: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 18, width: '100%' },
  degree: { color: palette.ink, fontSize: 28, marginLeft: 6, fontWeight: '300' },

  heroSub: { alignItems: 'center', marginTop: 10 },
  heroTitle: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  heroCity: { color: palette.inkDim, fontSize: 14, marginTop: 2 },

  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  tagPillOn: {
    backgroundColor: 'rgba(255,210,122,0.18)',
    borderColor: 'rgba(255,210,122,0.5)',
  },
  tagLbl: { color: palette.ink, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  tagLblOn: { color: palette.accent },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  voiceBtnOn: { backgroundColor: palette.accent, borderColor: palette.accent },

  arcWrap: { alignItems: 'stretch', marginTop: 6 },
  arcMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -14,
    paddingHorizontal: 8,
  },
  arcCol: { alignItems: 'center', minHeight: 40, flex: 1 },
  arcVal: { color: palette.ink, fontSize: 17, fontWeight: '600' },
  arcLbl: { color: palette.inkDim, fontSize: 12, marginTop: 2 },
  miniGlyph: { height: 22, justifyContent: 'center' },

  cards: { marginTop: 12, marginBottom: 12, gap: 10 },
  cardRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, height: 138, padding: 14 },
  cardTitle: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  cardSub: { color: palette.inkDim, fontSize: 12, marginTop: 2 },
  cardHero: { alignItems: 'center', marginTop: 10, marginBottom: 4 },
  cardFoot: { color: palette.inkDim, fontSize: 11, marginTop: 'auto' },
  heartRange: { color: palette.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  heartUnit: { color: palette.inkDim, fontSize: 10, letterSpacing: 0.6, marginTop: 2 },
  sparkWrap: { width: '100%', marginTop: 8 },
  placeStripWrap: { width: '100%', marginTop: 14 },
  placeFootRow: { flexDirection: 'row', gap: 8, marginTop: 'auto' },
  placeFoot: { color: palette.inkDim, fontSize: 11, fontWeight: '500' },
});
