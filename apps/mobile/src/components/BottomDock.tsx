import React, { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { palette } from '../theme';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Props = {
  onDismiss?: () => void;
  onConfirm?: () => void;
  markerLabel?: string;
  progress?: number;
  segments?: number;
  labels?: string[];
  value?: number;
  onChange?: (index: number) => void;
};

export function BottomDock({
  onDismiss,
  onConfirm,
  markerLabel = 'M',
  progress = 0.5,
  segments,
  labels,
  value,
  onChange,
}: Props) {
  const [gaugeW, onLayout] = useMeasuredWidth();
  const height = 70;
  const ticks = 33;
  const baseY = 6;
  const padX = 14;

  const scrubbable = typeof segments === 'number' && segments > 1;
  const activeIndex = scrubbable ? Math.min(Math.max(value ?? segments - 1, 0), segments - 1) : undefined;

  const t = useMemo(() => {
    if (scrubbable && activeIndex !== undefined) return activeIndex / (segments - 1);
    return Math.min(Math.max(progress, 0), 1);
  }, [scrubbable, activeIndex, segments, progress]);

  const usableW = Math.max(gaugeW - padX * 2, 0);
  const markerX = padX + t * usableW;
  const bubbleLabel = scrubbable && labels ? labels[activeIndex!] ?? markerLabel : markerLabel;

  const lastIndexRef = useRef<number | null>(null);

  const snapFromX = (x: number) => {
    if (!scrubbable) return;
    const clampedX = Math.min(Math.max(x - padX, 0), usableW);
    const raw = usableW > 0 ? clampedX / usableW : 0;
    const idx = Math.round(raw * (segments - 1));
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      onChange?.(idx);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => scrubbable,
        onMoveShouldSetPanResponder: () => scrubbable,
        onPanResponderGrant: (e) => {
          lastIndexRef.current = null;
          snapFromX(e.nativeEvent.locationX);
        },
        onPanResponderMove: (e) => snapFromX(e.nativeEvent.locationX),
        onPanResponderRelease: () => {
          lastIndexRef.current = null;
        },
      }),
    [scrubbable, gaugeW, segments, usableW]
  );

  return (
    <View style={styles.wrap}>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={onDismiss} hitSlop={12}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Line x1="4" y1="4" x2="14" y2="14" stroke={palette.ink} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1="14" y1="4" x2="4" y2="14" stroke={palette.ink} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      </Pressable>

      <View style={styles.gauge} onLayout={onLayout} {...panResponder.panHandlers}>
        {gaugeW > 0 ? (
          <Svg width={gaugeW} height={height}>
            <G>
              {Array.from({ length: ticks }).map((_, i) => {
                const tt = i / (ticks - 1);
                const x = padX + tt * usableW;
                const dist = Math.abs(x - markerX);
                const near = dist < 30;
                const len = near ? 22 : 14;
                return (
                  <Line
                    key={i}
                    x1={x}
                    y1={baseY}
                    x2={x}
                    y2={baseY + len}
                    stroke={palette.ink}
                    strokeWidth={1}
                    opacity={near ? 0.85 : 0.35}
                    strokeLinecap="round"
                  />
                );
              })}
              <Circle cx={markerX} cy={baseY + 34} r={11} fill={palette.accent} />
            </G>
          </Svg>
        ) : null}
        {gaugeW > 0 ? (
          <Text style={[styles.markerLabel, { left: markerX - 6 }]}>{bubbleLabel}</Text>
        ) : null}
      </View>

      <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onConfirm} hitSlop={12}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Line x1="4" y1="11" x2="8" y2="15" stroke="#1a0509" strokeWidth={2} strokeLinecap="round" />
          <Line x1="8" y1="15" x2="16" y2="5" stroke="#1a0509" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  btnPrimary: { backgroundColor: palette.ink },
  gauge: { flex: 1, height: 70, alignItems: 'flex-start', justifyContent: 'flex-start' },
  markerLabel: {
    position: 'absolute',
    top: 38,
    fontSize: 11,
    fontWeight: '700',
    color: '#1a0509',
  },
});
