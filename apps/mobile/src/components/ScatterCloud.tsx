import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { View } from 'react-native';
import { palette } from '../theme';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Dot = { x: number; y: number; r: number; tint?: 'accent' | 'ink' };

type Props = { width?: number; height?: number; dots?: Dot[] };

const DEFAULT_DOTS: Dot[] = [
  { x: 0.35, y: 0.45, r: 6, tint: 'ink' },
  { x: 0.42, y: 0.55, r: 8, tint: 'ink' },
  { x: 0.48, y: 0.38, r: 5, tint: 'accent' },
  { x: 0.52, y: 0.5, r: 9, tint: 'ink' },
  { x: 0.58, y: 0.46, r: 4, tint: 'ink' },
  { x: 0.55, y: 0.62, r: 6, tint: 'accent' },
  { x: 0.62, y: 0.58, r: 5, tint: 'ink' },
  { x: 0.68, y: 0.68, r: 7, tint: 'ink' },
  { x: 0.74, y: 0.72, r: 4, tint: 'ink' },
  { x: 0.8, y: 0.76, r: 3, tint: 'ink' },
  { x: 0.44, y: 0.72, r: 4, tint: 'ink' },
  { x: 0.38, y: 0.66, r: 3, tint: 'ink' },
];

export function ScatterCloud({ width, height = 110, dots = DEFAULT_DOTS }: Props) {
  const [measuredW, onLayout] = useMeasuredWidth();
  const w = width ?? measuredW;
  return (
    <View onLayout={onLayout} style={{ width: width ?? '100%', height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Line x1={0} y1={height / 2} x2={w} y2={height / 2} stroke={palette.ink} strokeWidth={0.5} opacity={0.25} />
          <Line x1={w / 2} y1={0} x2={w / 2} y2={height} stroke={palette.ink} strokeWidth={0.5} opacity={0.25} />
          {dots.map((d, i) => (
            <Circle
              key={i}
              cx={d.x * w}
              cy={d.y * height}
              r={d.r}
              fill={d.tint === 'accent' ? palette.accent : palette.ink}
              opacity={d.tint === 'accent' ? 1 : 0.88}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
