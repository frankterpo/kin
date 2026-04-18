import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Background } from './src/components/Background';
import { ModeToggle, Mode } from './src/components/ModeToggle';
import { ScreenTabs } from './src/components/ScreenTabs';
import { VoiceOverlay } from './src/components/VoiceOverlay';
import { EmotionSheet } from './src/components/EmotionSheet';
import { PatientCheckIn } from './src/screens/PatientCheckIn';
import { SupporterBrief } from './src/screens/SupporterBrief';
import { Tracker } from './src/screens/Tracker';
import {
  currentCircleId,
  currentPatientId,
  currentSupporterProfileId,
  insertCheckinStub,
  insertSelfReportTag,
} from './src/data/queries';

type TabKey = 'home' | 'tracker';
type CaptureStep = 'idle' | 'voice' | 'emotion';

export default function App() {
  const [mode, setMode] = useState<Mode>('patient');
  const [tab, setTab] = useState<TabKey>('home');
  const [captureStep, setCaptureStep] = useState<CaptureStep>('idle');
  const pendingCheckinIdRef = useRef<string | null>(null);

  const tabs = useMemo(
    () =>
      mode === 'patient'
        ? [
            { key: 'home' as TabKey, label: 'Check-in', icon: 'checkin' as const },
            { key: 'tracker' as TabKey, label: 'Tracker', icon: 'tracker' as const },
          ]
        : [
            { key: 'home' as TabKey, label: 'Brief', icon: 'checkin' as const },
            { key: 'tracker' as TabKey, label: 'Tracker', icon: 'tracker' as const },
          ],
    [mode]
  );

  const active = tabs.find((t) => t.key === tab) ? tab : (tabs[0].key as TabKey);

  const renderScreen = () => {
    if (active === 'tracker') return <Tracker />;
    return mode === 'patient' ? <PatientCheckIn /> : <SupporterBrief />;
  };

  const isPatient = mode === 'patient';
  const voicePrompt = isPatient
    ? "Margaret — how are you doing today?"
    : 'Elena — how does Dad seem to you today?';
  const emotionPrompt = isPatient
    ? 'And in one word — how does that feel?'
    : "In one word — what fits Dad's state?";

  const startCapture = () => {
    pendingCheckinIdRef.current = null;
    setCaptureStep('voice');
  };

  const handleVoiceDone = async (result?: { transcript: string; score: number }) => {
    if (!result) {
      setCaptureStep('idle');
      return;
    }
    // Persist the checkin row immediately; remember its id for the tag we're about to write.
    try {
      const id = await insertCheckinStub({
        authorId: isPatient ? currentPatientId() : currentSupporterProfileId(),
        source: isPatient ? 'patient' : 'supporter',
        transcript: result.transcript,
        durationMs: 15000,
        visibility: 'circle',
      });
      pendingCheckinIdRef.current = id;
    } catch {
      pendingCheckinIdRef.current = null;
    }
    setCaptureStep('emotion');
  };

  const handleEmotionCommit = (emotion: string) => {
    insertSelfReportTag({
      circleId: currentCircleId(),
      authorId: isPatient ? currentPatientId() : currentSupporterProfileId(),
      subjectId: currentPatientId(),
      emotion,
      valence: 0,
      arousal: 0,
      checkinId: pendingCheckinIdRef.current ?? null,
      visibility: isPatient ? 'private' : 'circle',
    }).catch(() => {});
    setCaptureStep('idle');
  };

  const handleEmotionCancel = () => {
    setCaptureStep('idle');
  };

  return (
    <Background>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setTab('home'); }} />
        </View>
        <View style={{ flex: 1 }}>{renderScreen()}</View>
        <ScreenTabs
          tabs={tabs}
          value={active}
          onChange={setTab}
          centerAction={{
            onPress: startCapture,
            active: captureStep !== 'idle',
          }}
        />
      </SafeAreaView>

      <VoiceOverlay
        visible={captureStep === 'voice'}
        prompt={voicePrompt}
        onDismiss={handleVoiceDone}
      />

      <EmotionSheet
        visible={captureStep === 'emotion'}
        question={emotionPrompt}
        onCancel={handleEmotionCancel}
        onCommit={handleEmotionCommit}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
});
