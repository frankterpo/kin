import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { palette } from '../theme';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';

type Props = {
  width?: number;
  height?: number;
  progress?: number;
};

export function ArcTrack({ width, height = 150, progress = 0.55 }: Props) {
  const [measuredW, onLayout] = useMeasuredWidth();
  const w = width ?? measuredW;

  return (
    <View style={{ width: '100%', height: height + 40 }} onLayout={onLayout}>
      {w > 0 ? <ArcSvg width={w} height={height} progress={progress} /> : null}
    </View>
  );
}

function ArcSvg({ width, height, progress }: { width: number; height: number; progress: number }) {
  const pad = 16;
  const startX = pad;
  const endX = width - pad;
  const baseY = height - 20;
  const peakY = 30;
  const midX = (startX + endX) / 2;

  const arcPath = `M ${startX} ${baseY} Q ${midX} ${peakY - 20} ${endX} ${baseY}`;

  const t = Math.min(Math.max(progress, 0), 1);
  const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
  const py = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * (peakY - 20) + t * t * baseY;

  const dots = Array.from({ length: 28 }, (_, i) => {
    const x = startX + ((endX - startX) / 27) * i;
    const y = baseY + 18 + Math.sin((i / 27) * Math.PI) * 24;
    return { x, y };
  });

  return (
    <Svg width={width} height={height + 40}>
      <Defs>
        <LinearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.ink} stopOpacity="0.35" />
          <Stop offset="0.5" stopColor={palette.ink} stopOpacity="0.9" />
          <Stop offset="1" stopColor={palette.ink} stopOpacity="0.35" />
        </LinearGradient>
      </Defs>
      <Path d={arcPath} stroke="url(#arc)" strokeWidth={1.5} fill="none" />
      <Circle cx={startX} cy={baseY} r={3} fill={palette.ink} opacity={0.55} />
      <Circle cx={midX} cy={baseY} r={3} fill={palette.ink} opacity={0.55} />
      <Circle cx={endX} cy={baseY} r={3} fill={palette.ink} opacity={0.55} />
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={1.2} fill={palette.ink} opacity={0.28} />
      ))}
      <Circle cx={px} cy={py} r={16} fill={palette.bgMid} opacity={0.95} />
      <Circle cx={px} cy={py} r={16} stroke={palette.ink} strokeWidth={1} fill="none" opacity={0.4} />
      <Circle cx={px} cy={py} r={3.5} fill={palette.ink} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * Math.PI) / 4;
        const r1 = 7;
        const r2 = 11;
        return (
          <Path
            key={i}
            d={`M ${px + Math.cos(a) * r1} ${py + Math.sin(a) * r1} L ${px + Math.cos(a) * r2} ${py + Math.sin(a) * r2}`}
            stroke={palette.ink}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}
    </Svg>
  );
}
