import React, { useEffect, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../theme';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

const COLS = 16;
const ROWS = 8;

const EMOTIONS: string[][] = [
  ['Furious', 'Enraged', 'Hostile', 'Frantic', 'Alarmed', 'Astonished', 'Amazed', 'Excited', 'Thrilled', 'Elated', 'Ecstatic', 'Euphoric', 'Triumphant', 'Exhilarated', 'Radiant', 'Glowing'],
  ['Angry', 'Irritated', 'Stressed', 'Anxious', 'Tense', 'Eager', 'Surprised', 'Energetic', 'Animated', 'Joyful', 'Delighted', 'Cheerful', 'Inspired', 'Optimistic', 'Hopeful', 'Bright'],
  ['Frustrated', 'Annoyed', 'Agitated', 'Worried', 'Restless', 'Curious', 'Alert', 'Engaged', 'Lively', 'Happy', 'Pleased', 'Amused', 'Confident', 'Proud', 'Enthusiastic', 'Buoyant'],
  ['Resentful', 'Distressed', 'Uneasy', 'Nervous', 'Concerned', 'Attentive', 'Interested', 'Focused', 'Receptive', 'Friendly', 'Warm', 'Glad', 'Encouraged', 'Devoted', 'Affectionate', 'Kind'],
  ['Disappointed', 'Discouraged', 'Hurt', 'Wistful', 'Pensive', 'Thoughtful', 'Reflective', 'Quiet', 'Steady', 'Settled', 'Comfortable', 'Pleasant', 'Easy', 'Mellow', 'Soft', 'Tender'],
  ['Lonely', 'Glum', 'Down', 'Melancholy', 'Subdued', 'Reserved', 'Composed', 'Grounded', 'Centered', 'Calm', 'Relaxed', 'Content', 'Satisfied', 'Grateful', 'Caring', 'Loving'],
  ['Hopeless', 'Empty', 'Drained', 'Weary', 'Tired', 'Sluggish', 'Drowsy', 'Still', 'Restful', 'Peaceful', 'Serene', 'Tranquil', 'Cozy', 'Dreamy', 'Blissful', 'Beatific'],
  ['Numb', 'Depressed', 'Lethargic', 'Sleepy', 'Heavy', 'Idle', 'Hushed', 'Dormant', 'Placid', 'Stilled', 'Soothed', 'Lulled', 'Quiescent', 'Languorous', 'Becalmed', 'Slumbering'],
];

const CENTER = { row: 4, col: 8 };

export type Pick = {
  row: number;
  col: number;
  emotion: string;
  valence: number;
  arousal: number;
};

function pickFor(row: number, col: number): Pick {
  return {
    row,
    col,
    emotion: EMOTIONS[row][col],
    valence: (col / (COLS - 1)) * 2 - 1,
    arousal: 1 - (row / (ROWS - 1)) * 2,
  };
}

type Props = {
  initial?: { row: number; col: number };
  onChange?: (pick: Pick) => void;
};

export function EmotionGrid({ initial = CENTER, onChange }: Props) {
  const [gridW, gridOnLayout] = useMeasuredWidth();
  const [selected, setSelected] = useState(initial);

  useEffect(() => {
    onChange?.(pickFor(selected.row, selected.col));
  }, [selected, onChange]);

  const cell = gridW > 0 ? gridW / COLS : 0;
  const gridH = cell * ROWS;

  const setFromXY = (x: number, y: number) => {
    if (cell <= 0) return;
    const col = Math.max(0, Math.min(COLS - 1, Math.floor(x / cell)));
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor(y / cell)));
    if (row !== selected.row || col !== selected.col) {
      setSelected({ row, col });
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => setFromXY(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e) => setFromXY(e.nativeEvent.locationX, e.nativeEvent.locationY),
      }),
    [cell, selected]
  );

  return (
    <View>
      <Text style={styles.axisTop}>ENERGISED</Text>
      <View style={styles.row}>
        <Text style={styles.axisSide}>NEG</Text>
        <View style={styles.gridWrap} onLayout={gridOnLayout}>
          <View {...panResponder.panHandlers} style={{ width: '100%', height: gridH }}>
            {gridW > 0 ? (
              <Svg width={gridW} height={gridH}>
                {Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: COLS }).map((_, c) => {
                    const cx = c * cell + cell / 2;
                    const cy = r * cell + cell / 2;
                    const isSel = selected.row === r && selected.col === c;
                    const dCell = Math.sqrt(
                      Math.pow(c - selected.col, 2) + Math.pow(r - selected.row, 2)
                    );
                    const FALLOFF = 3;
                    const intensity = Math.max(0, 1 - dCell / FALLOFF);
                    const baseOpacity = 0.12;
                    const opacity = isSel ? 1 : baseOpacity + intensity * 0.6;
                    const radiusDot = isSel
                      ? cell * 0.32
                      : Math.max(1.5, cell * 0.13 + intensity * cell * 0.06);
                    return (
                      <Circle
                        key={`${r}-${c}`}
                        cx={cx}
                        cy={cy}
                        r={radiusDot}
                        fill={isSel ? palette.accent : palette.ink}
                        opacity={opacity}
                      />
                    );
                  })
                )}
              </Svg>
            ) : null}
          </View>
        </View>
        <Text style={styles.axisSide}>POS</Text>
      </View>
      <Text style={styles.axisBottom}>CALM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axisTop: {
    color: palette.inkMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  axisBottom: {
    color: palette.inkMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  axisSide: {
    color: palette.inkMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
  },
  gridWrap: { flex: 1 },
});
