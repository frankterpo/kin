import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, ScrollView, StyleSheet, View } from 'react-native';
import { palette } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { HeroNumber } from '../components/HeroNumber';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';
import { ZoomTabs, Zoom } from '../components/tracker/ZoomTabs';
import {
  AppRow,
  HeartLane,
  LaneHeader,
  PlaceLane,
  TimeRuler,
  VoiceLane,
} from '../components/tracker/Lanes';
import { SnapshotCard } from '../components/tracker/SnapshotCard';
import { getWindow } from '../data/tracker';

export function Tracker() {
  const [zoom, setZoom] = useState<Zoom>('day');
  const window = getWindow(zoom);
  const [hour, setHour] = useState(window.hours * 0.6);
  const [chartW, chartOnLayout] = useMeasuredWidth();

  useEffect(() => {
    setHour(window.hours * 0.6);
  }, [zoom, window.hours]);

  const lastHourRef = useRef(hour);

  const onScrub = (e: GestureResponderEvent) => {
    if (chartW <= 0) return;
    const x = Math.min(Math.max(e.nativeEvent.locationX, 0), chartW);
    const h = (x / chartW) * window.hours;
    if (Math.abs(h - lastHourRef.current) > window.hours * 0.001) {
      lastHourRef.current = h;
      setHour(h);
    }
  };

  const avgMood = useMemo(() => {
    if (window.checkins.length === 0) return 0;
    const sum = window.checkins.reduce((a, c) => a + c.mood, 0);
    return Math.round(sum / window.checkins.length);
  }, [window.checkins]);

  const subline = useMemo(() => {
    if (zoom === 'day') return `${window.checkins.length} check-ins · avg mood`;
    if (zoom === 'week') return `${window.checkins.length} check-ins · 7-day avg mood`;
    return `${window.checkins.length} check-ins · 30-day avg mood`;
  }, [zoom, window.checkins.length]);

  return (
    <View style={styles.root}>
      <View style={styles.zoomRow}>
        <ZoomTabs value={zoom} onChange={setZoom} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <HeroNumber value={avgMood} caption={window.label} sub={subline} />

        <GlassCard style={styles.canvasCard}>
          <View onLayout={chartOnLayout} style={{ width: '100%' }}>
            {chartW > 0 ? (
              <TimelineCanvas
                width={chartW}
                hour={hour}
                onScrub={onScrub}
                window={window}
              />
            ) : null}
          </View>
        </GlassCard>

        <SnapshotCard hour={hour} window={window} />

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

function TimelineCanvas({
  width,
  hour,
  onScrub,
  window,
}: {
  width: number;
  hour: number;
  onScrub: (e: GestureResponderEvent) => void;
  window: ReturnType<typeof getWindow>;
}) {
  const showPlaceLabels = window.zoom === 'day';
  return (
    <View
      onStartShouldSetResponder={() => true}
      onResponderGrant={onScrub}
      onResponderMove={onScrub}
    >
      <TimeRuler width={width} mode={window.zoom} hours={window.hours} />
      <View style={{ height: 8 }} />

      <LaneHeader label="PLACE" />
      <PlaceLane width={width} segments={window.places} hours={window.hours} showLabels={showPlaceLabels} />

      <LaneHeader label="APPS" hint={`${window.apps.length} apps`} />
      {window.apps.map((app) => (
        <AppRow key={app.name} width={width} app={app} />
      ))}

      <LaneHeader label="HEART" hint={`${window.heartRange[0]}–${window.heartRange[1]} bpm`} />
      <HeartLane width={width} values={window.heart} range={window.heartRange} />

      <LaneHeader label="VOICE BIOMARKERS" hint="Kin check-ins" />
      <VoiceLane width={width} checkins={window.checkins} hours={window.hours} />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (hour / window.hours) * width - 0.5,
          top: 22,
          width: 1,
          bottom: 0,
          backgroundColor: palette.accent,
          opacity: 0.7,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  zoomRow: { alignItems: 'center', marginBottom: 8 },

  canvasCard: { padding: 14, marginBottom: 6 },
});
