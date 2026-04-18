import React, { useState } from 'react';
import { GestureResponderEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { palette, type } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { HeroNumber } from '../components/HeroNumber';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MOOD = [72, 68, 80, 74, 66, 62, 82];
const SPEECH = [78, 80, 84, 76, 70, 68, 72];

type DayDetail = {
  sleep: string;
  calls: number;
  notable: string;
  insight: string;
  highlight: string;
};

const DAY_DETAILS: DayDetail[] = [
  {
    sleep: '7h 02',
    calls: 1,
    notable: 'Ayesha visited in the morning',
    insight: 'Quiet Monday. Speech steady, tremor minimal.',
    highlight: 'Ayesha',
  },
  {
    sleep: '6h 40',
    calls: 2,
    notable: 'Skipped afternoon walk',
    insight: 'Mood dipped mid-afternoon after skipping the walk.',
    highlight: 'the walk',
  },
  {
    sleep: '7h 55',
    calls: 3,
    notable: "Mum's 12-min call lifted mood 20%",
    insight: "Best day of the week. Mum's call set the tone.",
    highlight: "Mum's 12-min call",
  },
  {
    sleep: '6h 20',
    calls: 1,
    notable: 'Dropped-off groceries from Max',
    insight: 'Speech rate slower pm. Social buffer from Max helped.',
    highlight: 'Max',
  },
  {
    sleep: '5h 48',
    calls: 0,
    notable: 'No network touch — quiet day',
    insight: 'Quiet day. Biomarkers soft. A short call would help.',
    highlight: 'quiet day',
  },
  {
    sleep: '5h 12',
    calls: 1,
    notable: 'Slept badly. Quiet call from Elena.',
    insight: 'Tough night. Speech rate 12% slower than baseline.',
    highlight: '12% slower',
  },
  {
    sleep: '7h 30',
    calls: 2,
    notable: "Mum's 9-min call rebounded the day",
    insight: "Speech rate rebounded today after Mum's 9-min call.",
    highlight: "Mum's 9-min call",
  },
];

const TOUCHPOINTS: { day: number; who: string; tint?: 'accent' }[] = [
  { day: 0, who: 'A' },
  { day: 2, who: 'M', tint: 'accent' },
  { day: 3, who: 'D' },
  { day: 5, who: 'E' },
  { day: 6, who: 'M', tint: 'accent' },
];

export function NetworkPulse() {
  const [selectedDay, setSelectedDay] = useState(MOOD.length - 1);
  const [chartW, chartOnLayout] = useMeasuredWidth();
  const detail = DAY_DETAILS[selectedDay];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>NETWORK PULSE · 7 DAYS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <HeroNumber
          value={MOOD[selectedDay]}
          caption={`Dad · ${DAY_NAMES[selectedDay]}`}
          sub={`mood · drag the chart to scrub`}
        />

        <GlassCard style={styles.chartCard}>
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: palette.ink }]} />
              <Text style={styles.legendLbl}>Mood</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: palette.accent }]} />
              <Text style={styles.legendLbl}>Speech</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.legendDay}>{DAY_NAMES[selectedDay]}</Text>
          </View>

          <View onLayout={chartOnLayout} style={{ width: '100%' }}>
            {chartW > 0 ? (
              <PulseChart
                width={chartW}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            ) : null}
          </View>

          <View style={styles.xAxis}>
            {DAYS.map((d, i) => (
              <Text
                key={i}
                style={[styles.xLbl, i === selectedDay && styles.xLblOn]}
              >
                {d}
              </Text>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.insight}>
          <Text style={styles.insightLbl}>{DAY_NAMES[selectedDay].toUpperCase()} · KIN NOTICED</Text>
          <Text style={styles.insightTxt}>
            {detail.insight.split(detail.highlight).map((part, i, arr) => (
              <Text key={i}>
                {part}
                {i < arr.length - 1 ? <Text style={styles.insightHi}>{detail.highlight}</Text> : null}
              </Text>
            ))}
          </Text>
        </GlassCard>

        <View style={styles.stats}>
          <Stat label="SLEEP" value={detail.sleep} />
          <Stat label="CALLS" value={String(detail.calls)} />
          <Stat label="MOOD" value={String(MOOD[selectedDay])} />
        </View>

        <GlassCard style={styles.noteCard}>
          <Text style={styles.noteLbl}>THE NETWORK</Text>
          <Text style={styles.noteTxt}>{detail.notable}</Text>
        </GlassCard>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

type ChartProps = {
  width: number;
  selectedDay: number;
  onSelectDay: (i: number) => void;
};

function PulseChart({ width, selectedDay, onSelectDay }: ChartProps) {
  const height = 200;
  const padX = 20;
  const padY = 30;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const yFor = (v: number) => padY + (1 - v / 100) * innerH;
  const xFor = (i: number) => padX + (i / (MOOD.length - 1)) * innerW;

  const buildPath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ');

  const pickDay = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    const clamped = Math.min(Math.max(x - padX, 0), innerW);
    const idx = Math.round((clamped / innerW) * (MOOD.length - 1));
    onSelectDay(idx);
  };

  return (
    <View
      onStartShouldSetResponder={() => true}
      onResponderGrant={pickDay}
      onResponderMove={pickDay}
    >
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.ink} stopOpacity="0.28" />
            <Stop offset="1" stopColor={palette.ink} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        {[25, 50, 75].map((v) => (
          <Path
            key={v}
            d={`M ${padX} ${yFor(v)} L ${width - padX} ${yFor(v)}`}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.8}
          />
        ))}
        <Path
          d={`${buildPath(MOOD)} L ${xFor(MOOD.length - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z`}
          fill="url(#moodFill)"
        />
        <Path d={buildPath(MOOD)} stroke={palette.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path
          d={buildPath(SPEECH)}
          stroke={palette.accent}
          strokeWidth={2}
          fill="none"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        {/* focus line at selected day */}
        <Path
          d={`M ${xFor(selectedDay)} ${padY - 4} L ${xFor(selectedDay)} ${padY + innerH + 4}`}
          stroke={palette.accent}
          strokeWidth={1.2}
          strokeDasharray="2 3"
          opacity={0.8}
        />
        {TOUCHPOINTS.map((tp, i) => (
          <Circle
            key={i}
            cx={xFor(tp.day)}
            cy={yFor(MOOD[tp.day]) - 12}
            r={6}
            fill={tp.tint === 'accent' ? palette.accent : 'rgba(255,255,255,0.95)'}
            stroke="#1a0509"
            strokeWidth={1.5}
          />
        ))}
        {MOOD.map((_, i) => (
          <Circle key={i} cx={xFor(i)} cy={yFor(MOOD[i])} r={3} fill={palette.ink} />
        ))}
        {/* focus ring on selected day's mood dot */}
        <Circle
          cx={xFor(selectedDay)}
          cy={yFor(MOOD[selectedDay])}
          r={8}
          fill="none"
          stroke={palette.accent}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard style={statStyles.box}>
      <Text style={statStyles.lbl}>{label}</Text>
      <Text style={statStyles.val}>{value}</Text>
    </GlassCard>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, padding: 12 },
  lbl: { color: palette.inkMuted, fontSize: 10, letterSpacing: 0.8, fontWeight: '600' },
  val: { color: palette.ink, fontSize: 22, fontWeight: '300', marginTop: 4, letterSpacing: -0.5 },
});

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 14 },
  kicker: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  h1: { ...type.title, color: palette.ink, fontSize: 30, marginTop: 4 },

  chartCard: { padding: 14, marginBottom: 12 },
  legend: { flexDirection: 'row', gap: 18, marginBottom: 8, alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLbl: { color: palette.inkDim, fontSize: 12 },
  legendDay: { color: palette.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  xAxis: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4, paddingHorizontal: 8 },
  xLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 0.5 },
  xLblOn: { color: palette.accent, fontWeight: '700' },

  insight: { padding: 16, marginBottom: 12 },
  insightLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  insightTxt: { color: palette.ink, fontSize: 15, lineHeight: 22, marginTop: 6 },
  insightHi: { color: palette.accent, fontWeight: '600' },

  stats: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  noteCard: { padding: 16, marginBottom: 8 },
  noteLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  noteTxt: { color: palette.ink, fontSize: 14, lineHeight: 20, marginTop: 6 },
});
