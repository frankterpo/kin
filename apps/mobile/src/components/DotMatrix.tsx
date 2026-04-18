import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';

const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00000', '00100', '00000', '00000', '00000', '00100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  // 'E' = open eye (voice-listening state)
  'E': ['00000', '01110', '11111', '11111', '11111', '01110', '00000'],
  // 'e' = closed eye (blink frame)
  'e': ['00000', '00000', '00000', '11111', '11111', '00000', '00000'],
};

type Props = {
  value: string;
  dotSize?: number;
  gap?: number;
  fitToWidth?: number;
  color?: string;
  dimColor?: string;
};

// For N chars with gap = dotSize/3 and inter-char gap = 2*dotSize:
//   totalWidth ≈ dotSize * (25N - 6) / 3
// Solve for dotSize to fit the target width.
function sizeToFit(chars: number, targetWidth: number) {
  if (chars <= 0 || targetWidth <= 0) return { dotSize: 4, gap: 1 };
  const d = Math.max(1, Math.floor((3 * targetWidth) / (25 * chars - 6)));
  const g = Math.max(1, Math.round(d / 3));
  return { dotSize: d, gap: g };
}

export function DotMatrix({
  value,
  dotSize,
  gap,
  fitToWidth,
  color = palette.ink,
  dimColor = 'rgba(255,255,255,0.08)',
}: Props) {
  const chars = value.split('');
  const fit = fitToWidth ? sizeToFit(chars.length, fitToWidth) : null;
  const d = dotSize ?? fit?.dotSize ?? 6;
  const g = gap ?? fit?.gap ?? 2;

  const charWidth = 5 * d + 4 * g;
  const charGap = d * 2;

  return (
    <View style={styles.row}>
      {chars.map((ch, ci) => {
        const glyph = GLYPHS[ch] ?? GLYPHS[' '];
        return (
          <View
            key={ci}
            style={{
              width: charWidth,
              marginRight: ci < chars.length - 1 ? charGap : 0,
            }}
          >
            {glyph.map((rowStr, ri) => (
              <View key={ri} style={{ flexDirection: 'row', marginBottom: ri < 6 ? g : 0 }}>
                {rowStr.split('').map((p, pi) => (
                  <View
                    key={pi}
                    style={{
                      width: d,
                      height: d,
                      borderRadius: d / 2,
                      marginRight: pi < 4 ? g : 0,
                      backgroundColor: p === '1' ? color : dimColor,
                      shadowColor: color,
                      shadowOpacity: p === '1' ? 0.6 : 0,
                      shadowRadius: p === '1' ? 6 : 0,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
