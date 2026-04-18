import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, radius, type } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { BottomDock } from '../components/BottomDock';

export function Contribute() {
  const [recording, setRecording] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const elapsed = useRef(new Animated.Value(0)).current;
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!recording) {
      pulse.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    const started = Date.now();
    const id = setInterval(() => {
      const s = Math.min(15, (Date.now() - started) / 1000);
      setSec(s);
      Animated.timing(elapsed, { toValue: s / 15, duration: 80, useNativeDriver: false }).start();
      if (s >= 15) {
        clearInterval(id);
        setRecording(false);
      }
    }, 80);
    return () => clearInterval(id);
  }, [recording]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const size = 230;
  const r = 100;
  const c = 2 * Math.PI * r;
  const progress = Math.min(sec / 15, 1);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>CONTRIBUTE</Text>
        <Text style={styles.h1}>How was he today?</Text>
        <Text style={styles.sub}>15 seconds · no prompts · just speak</Text>
      </View>

      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={2} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={palette.accent}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c}`}
            strokeDashoffset={c * (1 - progress)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Pressable
          onPress={() => setRecording((r) => !r)}
          style={[styles.mic, recording && styles.micOn]}
        >
          <View style={styles.micInner}>
            <View style={[styles.micBar, recording && styles.micBarOn]} />
            <View style={[styles.micStem, recording && styles.micStemOn]} />
          </View>
        </Pressable>
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterNum}>{Math.max(0, 15 - Math.floor(sec))}</Text>
        <Text style={styles.counterLbl}>seconds left</Text>
      </View>

      <GlassCard style={styles.prompt}>
        <Text style={styles.promptLbl}>KIN SUGGESTS</Text>
        <Text style={styles.promptTxt}>
          "Tell me one moment from today with Dad — could be tiny. What did you notice?"
        </Text>
      </GlassCard>

      <BottomDock markerLabel="M" progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'center', marginBottom: 8 },
  kicker: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: '600' },
  h1: { ...type.title, color: palette.ink, fontSize: 26, marginTop: 6, textAlign: 'center' },
  sub: { color: palette.inkDim, fontSize: 13, marginTop: 4 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.accent,
  },
  mic: {
    width: 108, height: 108, borderRadius: 54,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: palette.cardBorder,
  },
  micOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  micInner: { alignItems: 'center' },
  micBar: {
    width: 22, height: 34, borderRadius: 11,
    backgroundColor: palette.ink,
  },
  micBarOn: { backgroundColor: '#1a0509' },
  micStem: {
    width: 30, height: 4, marginTop: 4,
    backgroundColor: palette.ink, borderRadius: 2,
  },
  micStemOn: { backgroundColor: '#1a0509' },

  counter: { alignItems: 'center', marginBottom: 12 },
  counterNum: { color: palette.ink, fontSize: 36, fontWeight: '300', letterSpacing: -1 },
  counterLbl: { color: palette.inkDim, fontSize: 12, letterSpacing: 0.3 },

  prompt: { padding: 16, marginBottom: 8 },
  promptLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: '600' },
  promptTxt: { color: palette.ink, fontSize: 15, lineHeight: 22, marginTop: 6 },
});
