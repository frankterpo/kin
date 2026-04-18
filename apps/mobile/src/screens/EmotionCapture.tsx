import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { palette, radius, type } from '../theme';
import { DotMatrix } from '../components/DotMatrix';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Zone = { lead: string; sub: string };

function zoneFor(v: number): Zone {
  if (v < 20) return { lead: 'Numb', sub: 'low affect · very flat' };
  if (v < 40) return { lead: 'Flat', sub: 'subdued · tired' };
  if (v < 60) return { lead: 'Steady', sub: 'baseline · neutral' };
  if (v < 80) return { lead: 'Bright', sub: 'engaged · warm' };
  return { lead: 'Glowing', sub: 'high affect · peak' };
}

const ANCHORS = [
  { v: 0, label: 'NUMB' },
  { v: 25, label: 'FLAT' },
  { v: 50, label: 'STEADY' },
  { v: 75, label: 'BRIGHT' },
  { v: 100, label: 'GLOW' },
];

export function EmotionCapture() {
  const [value, setValue] = useState(60);
  const [confirmed, setConfirmed] = useState(false);
  const [trackW, trackOnLayout] = useMeasuredWidth();
  const [heroW, heroOnLayout] = useMeasuredWidth();
  const heroFit = heroW > 0 ? Math.min(heroW * 0.5, 280) : undefined;

  const lastV = useRef(value);
  const setFromX = (x: number) => {
    if (trackW <= 0) return;
    const padding = 12;
    const usable = Math.max(1, trackW - padding * 2);
    const clamped = Math.min(Math.max(x - padding, 0), usable);
    const v = Math.round((clamped / usable) * 100);
    if (v !== lastV.current) {
      lastV.current = v;
      setValue(v);
      setConfirmed(false);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
      }),
    [trackW]
  );

  const zone = zoneFor(value);
  const warmth = value / 100;

  return (
    <View style={styles.root}>
      {/* Warmth overlay — warms as value rises */}
      <LinearGradient
        colors={[`rgba(255,210,122,${0.05 + warmth * 0.18})`, 'rgba(255,210,122,0)']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Text style={styles.kicker}>EMOTION CAPTURE</Text>
        <Text style={styles.kickerHint}>after your check-in · tune what Kin heard</Text>
      </View>

      <View style={styles.heroWrap} onLayout={heroOnLayout}>
        {/* Soft halo glow behind the number, intensifies with value */}
        <View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              backgroundColor: 'rgba(255,210,122,1)',
              opacity: 0.08 + warmth * 0.18,
              transform: [{ scale: 0.85 + warmth * 0.4 }],
            },
          ]}
        />
        {heroFit ? <DotMatrix value={String(value)} fitToWidth={heroFit} /> : null}
      </View>

      <View style={styles.zoneWrap}>
        <Text style={styles.zoneLead}>{zone.lead}</Text>
        <Text style={styles.zoneSub}>{zone.sub}</Text>
      </View>

      <View style={styles.compareRow}>
        <Compare label="Kin heard" v={71} dim />
        <View style={styles.compareDivider} />
        <Compare label="You feel" v={value} accent />
      </View>

      {/* Big scrub track */}
      <View style={styles.trackWrap}>
        <View style={styles.anchorRow}>
          {ANCHORS.map((a) => (
            <Text
              key={a.v}
              style={[
                styles.anchorLbl,
                Math.abs(value - a.v) < 10 && styles.anchorLblOn,
              ]}
            >
              {a.label}
            </Text>
          ))}
        </View>

        <View style={styles.track} onLayout={trackOnLayout} {...panResponder.panHandlers}>
          {trackW > 0 ? <Track width={trackW} value={value} /> : null}
        </View>
      </View>

      <Pressable
        style={[styles.capture, confirmed && styles.captureDone]}
        onPress={() => setConfirmed(true)}
      >
        <Text style={[styles.captureLbl, confirmed && styles.captureLblDone]}>
          {confirmed ? `Captured · ${value}` : `Capture · ${value}`}
        </Text>
      </Pressable>
    </View>
  );
}

function Compare({ label, v, dim, accent }: { label: string; v: number; dim?: boolean; accent?: boolean }) {
  return (
    <View style={styles.compareCol}>
      <Text style={styles.compareLbl}>{label}</Text>
      <Text
        style={[
          styles.compareVal,
          dim && { color: palette.inkDim },
          accent && { color: palette.accent },
        ]}
      >
        {v}
      </Text>
    </View>
  );
}

function Track({ width, value }: { width: number; value: number }) {
  const padding = 12;
  const usable = width - padding * 2;
  const tickCount = 51;
  const markerX = padding + (value / 100) * usable;
  const trackHeight = 92;

  return (
    <Svg width={width} height={trackHeight}>
      {Array.from({ length: tickCount }).map((_, i) => {
        const t = i / (tickCount - 1);
        const x = padding + t * usable;
        const dist = Math.abs(x - markerX);
        const near = dist < 40;
        const len = near ? 32 - dist * 0.5 : 18;
        const opacity = near ? 0.95 - dist * 0.012 : 0.3;
        return (
          <Line
            key={i}
            x1={x}
            y1={(trackHeight - len) / 2}
            x2={x}
            y2={(trackHeight + len) / 2}
            stroke={palette.ink}
            strokeWidth={i % 5 === 0 ? 1.4 : 1}
            opacity={opacity}
            strokeLinecap="round"
          />
        );
      })}
      {/* Marker dot */}
      <Circle cx={markerX} cy={trackHeight / 2} r={16} fill={palette.accent} />
      <Circle cx={markerX} cy={trackHeight / 2} r={22} stroke={palette.accent} strokeWidth={1} fill="none" opacity={0.4} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  header: { alignItems: 'center', marginBottom: 8 },
  kicker: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  kickerHint: { color: palette.inkDim, fontSize: 12, marginTop: 4, letterSpacing: 0.2 },

  heroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 180,
  },
  halo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 200,
    top: -60,
  },

  zoneWrap: { alignItems: 'center', marginTop: 6, marginBottom: 12 },
  zoneLead: { ...type.title, color: palette.ink, fontSize: 22, letterSpacing: -0.3 },
  zoneSub: { color: palette.inkDim, fontSize: 13, marginTop: 4, letterSpacing: 0.3 },

  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 18,
    gap: 12,
  },
  compareCol: { alignItems: 'center', minWidth: 90 },
  compareDivider: { width: 1, height: 28, backgroundColor: palette.cardBorder },
  compareLbl: { color: palette.inkMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  compareVal: { color: palette.ink, fontSize: 22, fontWeight: '300', letterSpacing: -0.5, marginTop: 4 },

  trackWrap: {
    marginTop: 'auto',
    marginBottom: 18,
  },
  anchorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  anchorLbl: {
    color: palette.inkMuted,
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  anchorLblOn: { color: palette.accent },
  track: {
    height: 92,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
  },

  capture: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.ink,
    alignItems: 'center',
    marginBottom: 12,
  },
  captureDone: { backgroundColor: palette.accent },
  captureLbl: { color: '#1a0509', fontSize: 14, fontWeight: '700', letterSpacing: 0.4 },
  captureLblDone: { color: '#1a0509' },
});
