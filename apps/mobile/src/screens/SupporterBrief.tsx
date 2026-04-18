import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { palette, radius } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { DotMatrix } from '../components/DotMatrix';
import { HeroNumber } from '../components/HeroNumber';
import { EmotionSheet } from '../components/EmotionSheet';
import { VoiceOverlay } from '../components/VoiceOverlay';
import { useSupporterBrief } from '../hooks/useSupporterBrief';
import {
  currentCircleId,
  currentPatientId,
  currentSupporterProfileId,
  insertCheckinStub,
  insertSelfReportTag,
} from '../data/queries';

export function SupporterBrief() {
  const { brief, loading } = useSupporterBrief();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [observed, setObserved] = useState<string | null>(null);

  const headline = brief?.headline ?? 'Quiet call tonight';
  const guidance =
    brief?.guidance ??
    "He slept badly and his speech rate is 12% slower than his Wednesday baseline. A short, warm call will land. Don't probe the tremor.";
  const toneCues = brief?.toneCues?.length
    ? brief.toneCues
    : ['warm', 'short', 'not clinical'];

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
          <Text style={styles.heroLead}>{headline}</Text>
          <Text style={styles.heroBody}>{guidance}</Text>
          <View style={styles.tonePills}>
            {toneCues.map((cue, i) => (
              <View key={i} style={styles.pill}>
                <Text style={styles.pillTxt}>{cue}</Text>
              </View>
            ))}
          </View>
          <ProvenanceChip label="from Margaret's check-in · 14m ago" />
        </GlassCard>

        <View style={styles.row}>
          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLbl}>Sleep</Text>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <DotMatrix value="5:12" dotSize={4} gap={1.5} />
            </View>
            <Text style={styles.metricFoot}>-1h 48m vs Wed</Text>
            <ProvenanceChip label="shared by Margaret · HealthKit" small />
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Text style={styles.metricLbl}>Speech rate</Text>
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <DotMatrix value="88" dotSize={4} gap={1.5} />
            </View>
            <Text style={styles.metricFoot}>12% slower</Text>
            <ProvenanceChip label="biomarker · circle visible" small />
          </GlassCard>
        </View>

        <GlassCard style={styles.privateCard}>
          <Text style={styles.privateLbl}>TRANSCRIPT · PRIVATE</Text>
          <View style={styles.privateBlur}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.privateBlurBar, { width: `${70 - i * 12}%` }]} />
            ))}
          </View>
          <Text style={styles.privateFoot}>Margaret's words · not shared with the circle</Text>
        </GlassCard>

        <View style={styles.observeRow}>
          <Pressable
            style={[styles.observePill, observed && styles.observePillOn]}
            onPress={() => setSheetOpen(true)}
          >
            <Text style={[styles.observeLbl, observed && styles.observeLblOn]}>
              {observed ? `Observation · ${observed}` : '+  Drop an observation'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.voiceBtn, voiceActive && styles.voiceBtnOn]}
            onPress={() => setVoiceActive(true)}
            hitSlop={8}
          >
            <MicGlyph active={voiceActive} />
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <EmotionSheet
        visible={sheetOpen}
        question="How does Dad seem to you today?"
        onCancel={() => setSheetOpen(false)}
        onCommit={(emotion) => {
          setObserved(emotion);
          setSheetOpen(false);
          insertSelfReportTag({
            circleId: currentCircleId(),
            authorId: currentSupporterProfileId(),
            subjectId: currentPatientId(),
            emotion,
            valence: 0,
            arousal: 0,
            visibility: 'circle',
          }).catch(() => {});
        }}
      />

      <VoiceOverlay
        visible={voiceActive}
        prompt="Hey Elena — how does Dad seem to you today?"
        onDismiss={(result) => {
          if (result) {
            insertCheckinStub({
              authorId: currentSupporterProfileId(),
              source: 'supporter',
              transcript: result.transcript,
              durationMs: 15000,
              visibility: 'circle',
            }).catch(() => {});
          }
          setVoiceActive(false);
        }}
      />
    </View>
  );
}

function ProvenanceChip({ label, small }: { label: string; small?: boolean }) {
  return (
    <View style={[styles.provChip, small && styles.provChipSm]}>
      <View style={styles.provDot} />
      <Text style={styles.provLbl}>{label}</Text>
    </View>
  );
}

function MicGlyph({ active }: { active: boolean }) {
  const color = active ? '#1a0509' : palette.ink;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Rect x="6" y="2" width="6" height="9" rx="3" fill={color} />
      <Path
        d="M 3.5 9 Q 3.5 14 9 14 Q 14.5 14 14.5 9"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <Line x1={9} y1={14} x2={9} y2={16.5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

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

  tonePills: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: palette.cardBorder,
  },
  pillTxt: { color: palette.ink, fontSize: 12, fontWeight: '600' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, padding: 14 },
  metricLbl: { color: palette.inkDim, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' },
  metricFoot: { color: palette.inkMuted, fontSize: 11, marginTop: 4 },

  privateCard: { padding: 16, marginBottom: 12 },
  privateLbl: { color: palette.inkMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  privateBlur: { gap: 6, marginTop: 12, marginBottom: 10 },
  privateBlurBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  privateFoot: { color: palette.inkMuted, fontSize: 11, fontStyle: 'italic' },

  provChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  provChipSm: { marginTop: 8 },
  provDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accent, opacity: 0.7 },
  provLbl: { color: palette.inkMuted, fontSize: 10, letterSpacing: 0.3, fontWeight: '500' },

  observeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  observePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  observePillOn: {
    backgroundColor: 'rgba(255,210,122,0.18)',
    borderColor: 'rgba(255,210,122,0.5)',
  },
  observeLbl: { color: palette.ink, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  observeLblOn: { color: palette.accent },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  voiceBtnOn: { backgroundColor: palette.accent, borderColor: palette.accent },
});
