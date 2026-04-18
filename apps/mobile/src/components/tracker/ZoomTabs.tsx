import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../../theme';

export type Zoom = 'day' | 'week' | 'month';

const TABS: { key: Zoom; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export function ZoomTabs({ value, onChange }: { value: Zoom; onChange: (z: Zoom) => void }) {
  return (
    <View style={styles.wrap}>
      {TABS.map((t) => (
        <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.tab, value === t.key && styles.tabOn]}>
          <Text style={[styles.lbl, value === t.key && styles.lblOn]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  tabOn: { backgroundColor: 'rgba(255,255,255,0.95)' },
  lbl: { color: palette.inkDim, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  lblOn: { color: '#1a0509' },
});
