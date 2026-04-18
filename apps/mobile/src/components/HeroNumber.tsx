import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';
import { DotMatrix } from './DotMatrix';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Props = {
  value: string | number;
  caption: string;
  sub?: string;
  unit?: string;
  fitFraction?: number;
  maxWidth?: number;
};

export function HeroNumber({
  value,
  caption,
  sub,
  unit,
  fitFraction = 0.42,
  maxWidth = 220,
}: Props) {
  const [w, onLayout] = useMeasuredWidth();
  const fit = w > 0 ? Math.min(w * fitFraction, maxWidth) : undefined;
  const text = String(value);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.numRow}>
        {fit ? <DotMatrix value={text} fitToWidth={fit} /> : null}
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <View style={styles.subWrap}>
        <Text style={styles.caption}>{caption}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', marginTop: 12, marginBottom: 18 },
  numRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  unit: { color: palette.ink, fontSize: 24, marginLeft: 6, marginTop: 4, fontWeight: '300' },
  subWrap: { alignItems: 'center', marginTop: 10 },
  caption: { color: palette.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sub: { color: palette.inkDim, fontSize: 13, marginTop: 2 },
});
