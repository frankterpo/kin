import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, type } from '../theme';
import { ArcTrack } from '../components/ArcTrack';
import { DotMatrix } from '../components/DotMatrix';
import { GlassCard } from '../components/GlassCard';
import { MiniBars } from '../components/MiniBars';
import { ScatterCloud } from '../components/ScatterCloud';
import { BottomDock } from '../components/BottomDock';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

export function PatientCheckIn() {
  const [heroW, heroOnLayout] = useMeasuredWidth();
  const heroFit = heroW > 0 ? Math.min(heroW * 0.45, 220) : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.h1}>Check-in</Text>
        <Text style={styles.chev}>⌄</Text>
      </View>

      <View style={styles.hero} onLayout={heroOnLayout}>
        {heroFit ? <DotMatrix value="82" fitToWidth={heroFit} /> : null}
        <Text style={styles.degree}>°</Text>
      </View>
      <View style={styles.heroSub}>
        <Text style={styles.heroTitle}>Sat</Text>
        <Text style={styles.heroCity}>Steady · since Wed</Text>
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
              <DotMatrix value="15" dotSize={3} gap={1} />
            </View>
            <Text style={styles.arcLbl}>Good speech</Text>
          </View>
          <View style={styles.arcCol}>
            <Text style={styles.arcVal}>21:10</Text>
            <Text style={styles.arcLbl}>Wind down</Text>
          </View>
        </View>
      </View>

      <View style={styles.cards}>
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Steady</Text>
          <Text style={styles.cardSub}>Mood</Text>
          <View style={{ height: 12 }} />
          <View style={{ alignItems: 'center' }}>
            <DotMatrix value="93" dotSize={4} gap={1.5} />
          </View>
          <View style={{ height: 10 }} />
          <MiniBars height={38} bars={26} />
          <Text style={styles.cardFoot}>Warm</Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Speech</Text>
          <Text style={styles.cardSub}>Tremor</Text>
          <View style={{ height: 10 }} />
          <ScatterCloud height={100} />
          <View style={styles.cardAxis}>
            <Text style={styles.axisLbl}>AM</Text>
            <Text style={styles.axisLbl}>PM</Text>
          </View>
        </GlassCard>
      </View>

      <BottomDock markerLabel="M" progress={0.52} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { ...type.title, color: palette.ink, fontSize: 26 },
  chev: { color: palette.inkDim, fontSize: 18 },

  hero: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 18, width: '100%' },
  degree: { color: palette.ink, fontSize: 28, marginLeft: 6, fontWeight: '300' },

  heroSub: { alignItems: 'center', marginTop: 10 },
  heroTitle: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  heroCity: { color: palette.inkDim, fontSize: 14, marginTop: 2 },

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

  cards: { flexDirection: 'row', gap: 12, marginTop: 12, flex: 1 },
  card: { flex: 1, minHeight: 200, padding: 14 },
  cardTitle: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  cardSub: { color: palette.inkDim, fontSize: 13, marginTop: 2 },
  cardAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 0.6 },
  cardFoot: { color: palette.inkDim, fontSize: 12, marginTop: 10 },
});
