import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Props = {
  width?: number;
  height?: number;
  bars?: number;
  highlightIndex?: number;
  highlightColor?: string;
};

export function MiniBars({
  width,
  height = 46,
  bars = 28,
  highlightIndex,
  highlightColor = palette.accent,
}: Props) {
  const [measuredW, onLayout] = useMeasuredWidth();
  const w = width ?? measuredW;
  const gap = 2;
  const hi = highlightIndex ?? Math.floor(bars * 0.55);

  return (
    <View onLayout={onLayout} style={[styles.row, { width: width ?? '100%', height }]}>
      {w > 0 &&
        Array.from({ length: bars }).map((_, i) => {
          const t = i / (bars - 1);
          const h = height * (0.3 + 0.55 * Math.sin(t * Math.PI));
          const isHi = i === hi;
          const barW = (w - gap * (bars - 1)) / bars;
          return (
            <View
              key={i}
              style={{
                width: barW,
                marginRight: i < bars - 1 ? gap : 0,
                height: isHi ? height : h,
                backgroundColor: isHi ? highlightColor : 'rgba(255,255,255,0.35)',
                borderRadius: 1.5,
                alignSelf: 'flex-end',
              }}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
