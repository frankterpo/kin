import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { palette, radius } from '../theme';

type IconKind = 'checkin' | 'tracker' | 'mic';

type Tab<T extends string> = { key: T; label: string; icon?: IconKind };

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  centerAction?: { onPress: () => void; active?: boolean };
};

export function ScreenTabs<T extends string>({
  tabs,
  value,
  onChange,
  centerAction,
}: Props<T>) {
  if (centerAction && tabs.length === 2) {
    return (
      <View style={styles.wrap}>
        <SideTab tab={tabs[0]} active={value === tabs[0].key} onPress={() => onChange(tabs[0].key)} />
        <CenterAction onPress={centerAction.onPress} active={centerAction.active} />
        <SideTab tab={tabs[1]} active={value === tabs[1].key} onPress={() => onChange(tabs[1].key)} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {tabs.map((t) => (
        <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.tabSimple}>
          {t.icon ? <TabIcon kind={t.icon} active={value === t.key} /> : null}
          <Text style={[styles.label, value === t.key && styles.labelOn]}>{t.label}</Text>
          {value === t.key && !t.icon ? <View style={styles.dot} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function SideTab<T extends string>({
  tab,
  active,
  onPress,
}: {
  tab: Tab<T>;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.sideTab} hitSlop={8}>
      {tab.icon ? <TabIcon kind={tab.icon} active={active} /> : null}
      <Text style={[styles.sideLbl, active && styles.sideLblOn]}>{tab.label}</Text>
    </Pressable>
  );
}

function CenterAction({ onPress, active }: { onPress: () => void; active?: boolean }) {
  return (
    <View style={styles.centerWrap}>
      <Pressable onPress={onPress} style={[styles.centerBtn, active && styles.centerBtnOn]} hitSlop={8}>
        <TabIcon kind="mic" active={!!active} large />
      </Pressable>
      <Text style={styles.centerLbl}>Voice</Text>
    </View>
  );
}

function TabIcon({ kind, active, large }: { kind: IconKind; active: boolean; large?: boolean }) {
  const size = large ? 26 : 20;
  const color = large ? (active ? '#1a0509' : '#1a0509') : active ? palette.ink : palette.inkMuted;
  if (kind === 'checkin') {
    // 5x5 dot grid — sun-ish, matches dot-matrix family
    const dots = [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ];
    return (
      <Svg width={size} height={size} viewBox="0 0 20 20">
        {dots.map((row, r) =>
          row.map((v, c) =>
            v ? (
              <Circle key={`${r}-${c}`} cx={2 + c * 4} cy={2 + r * 4} r={1.4} fill={color} />
            ) : null
          )
        )}
      </Svg>
    );
  }
  if (kind === 'tracker') {
    return (
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Rect x="2" y="11" width="3" height="7" rx="0.6" fill={color} />
        <Rect x="7" y="6" width="3" height="12" rx="0.6" fill={color} />
        <Rect x="12" y="9" width="3" height="9" rx="0.6" fill={color} />
        <Rect x="17" y="3" width="1" height="15" rx="0.5" fill={color} opacity={0.4} />
      </Svg>
    );
  }
  // mic
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x="7" y="2" width="6" height="10" rx="3" fill={color} />
      <Path
        d="M 4 10 Q 4 15 10 15 Q 16 15 16 10"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Line x1={10} y1={15} x2={10} y2={18} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Simple (icon-less or text + dot) variant
  tabSimple: { alignItems: 'center', gap: 6 },
  label: { color: palette.inkMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  labelOn: { color: palette.ink },
  dot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: palette.accent },

  // 2-tabs + center variant
  sideTab: { alignItems: 'center', gap: 6, flex: 1 },
  sideLbl: { color: palette.inkMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  sideLblOn: { color: palette.ink },

  centerWrap: { alignItems: 'center', gap: 4, marginHorizontal: 12 },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    shadowColor: palette.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    marginTop: -14,
    borderWidth: 2,
    borderColor: 'rgba(26,5,9,0.85)',
  },
  centerBtnOn: { backgroundColor: palette.ink },
  centerLbl: { color: palette.inkMuted, fontSize: 10, letterSpacing: 0.5, fontWeight: '700' },
});
