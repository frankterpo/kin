import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';

export type Mode = 'patient' | 'supporter';

type Props = { mode: Mode; onChange: (m: Mode) => void };

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => onChange('patient')} style={[styles.pill, mode === 'patient' && styles.on]}>
        <Text style={[styles.label, mode === 'patient' && styles.labelOn]}>Patient</Text>
      </Pressable>
      <Pressable onPress={() => onChange('supporter')} style={[styles.pill, mode === 'supporter' && styles.on]}>
        <Text style={[styles.label, mode === 'supporter' && styles.labelOn]}>Supporter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  on: { backgroundColor: 'rgba(255,255,255,0.95)' },
  label: { color: palette.inkDim, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  labelOn: { color: '#1a0509' },
});
