import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';

type Props<T extends string> = {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function ScreenTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {tabs.map((t) => (
        <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.tab}>
          <Text style={[styles.label, value === t.key && styles.labelOn]}>{t.label}</Text>
          {value === t.key ? <View style={styles.dot} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tab: { alignItems: 'center', gap: 6 },
  label: { color: palette.inkMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  labelOn: { color: palette.ink },
  dot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: palette.accent },
});
