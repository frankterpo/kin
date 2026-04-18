import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { DotMatrix } from '../components/DotMatrix';
import { HeroNumber } from '../components/HeroNumber';

export function SupporterBrief() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>TODAY · FOR YOU</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>EL</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <HeroNumber value={71} caption="Dad" sub="mood today · 12% slower speech" />

        <GlassCard style={styles.hero}>
          <Text style={styles.heroLead}>Quiet call tonight</Text>
          <Text style={styles.heroBody}>
            He slept badly and his speech rate is 12% slower than his Wednesday baseline. A short, warm call
            will land. <Text style={styles.heroDim}>Don't probe the tremor.</Text>
          </Text>
          <View style={styles.tonePills}>
            <View style={styles.pill}><Text style={styles.pillTxt}>Warm</Text></View>
            <View style={styles.pill}><Text style={styles.pillTxt}>Short</Text></View>
            <View style={[styles.pill, styles.pillOff]}><Text style={styles.pillTxtOff}>Not: clinical</Text></View>
          </View>
        </GlassCard>

        <View style={styles.row}>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLbl}>Sleep</Text>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <DotMatrix value="5:12" dotSize={4} gap={1.5} />
            </View>
            <Text style={styles.metricFoot}>-1h 48m vs Wed</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLbl}>Speech rate</Text>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <DotMatrix value="88" dotSize={4} gap={1.5} />
            </View>
            <Text style={styles.metricFoot}>12% slower</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.listCard}>
          <Text style={styles.listTitle}>What others are doing</Text>
          <Row when="08:40" who="Ayesha" what="Sent a photo from the dog walk" />
          <Row when="11:05" who="Max" what="Dropped off groceries" />
          <Row when="14:30" who="Mum" what="Called — 9 minutes" highlight />
          <Row when="Now" who="You" what="Quiet call suggested" pending />
        </GlassCard>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

function Row({
  when,
  who,
  what,
  highlight,
  pending,
}: {
  when: string;
  who: string;
  what: string;
  highlight?: boolean;
  pending?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.when}>{when}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[rowStyles.who, highlight && { color: palette.accent }]}>{who}</Text>
        <Text style={rowStyles.what}>{what}</Text>
      </View>
      {pending ? <View style={rowStyles.pendDot} /> : null}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 12,
    alignItems: 'center',
  },
  when: { color: palette.inkMuted, fontSize: 12, width: 54, letterSpacing: 0.3 },
  who: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  what: { color: palette.inkDim, fontSize: 13, marginTop: 1 },
  pendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent },
});

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kicker: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  avatar: {
    width: 42, height: 42, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: palette.cardBorder,
  },
  avatarTxt: { color: palette.ink, fontWeight: '700', fontSize: 13 },

  hero: { padding: 18, marginBottom: 12 },
  heroLead: { color: palette.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  heroBody: { color: palette.inkDim, fontSize: 15, lineHeight: 22, marginTop: 8 },
  heroDim: { color: palette.accent, fontWeight: '600' },

  tonePills: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: palette.cardBorder,
  },
  pillOff: { backgroundColor: 'transparent' },
  pillTxt: { color: palette.ink, fontSize: 12, fontWeight: '600' },
  pillTxtOff: { color: palette.inkMuted, fontSize: 12, fontWeight: '600' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, padding: 14 },
  metricLbl: { color: palette.inkDim, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' },
  metricFoot: { color: palette.inkMuted, fontSize: 11, marginTop: 4 },

  listCard: { padding: 16 },
  listTitle: { color: palette.ink, fontSize: 15, fontWeight: '700', marginBottom: 8 },
});
