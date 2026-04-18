import React, { useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Background } from './src/components/Background';
import { ModeToggle, Mode } from './src/components/ModeToggle';
import { ScreenTabs } from './src/components/ScreenTabs';
import { PatientCheckIn } from './src/screens/PatientCheckIn';
import { SupporterBrief } from './src/screens/SupporterBrief';
import { Contribute } from './src/screens/Contribute';
import { Tracker } from './src/screens/Tracker';

type TabKey = 'home' | 'tracker' | 'contribute';

export default function App() {
  const [mode, setMode] = useState<Mode>('patient');
  const [tab, setTab] = useState<TabKey>('home');

  const tabs = useMemo(
    () =>
      mode === 'patient'
        ? [
            { key: 'home' as TabKey, label: 'Check-in' },
            { key: 'tracker' as TabKey, label: 'Tracker' },
          ]
        : [
            { key: 'home' as TabKey, label: 'Brief' },
            { key: 'contribute' as TabKey, label: 'Contribute' },
          ],
    [mode]
  );

  const active = tabs.find((t) => t.key === tab) ? tab : (tabs[0].key as TabKey);

  const renderScreen = () => {
    if (active === 'contribute') return <Contribute />;
    if (active === 'tracker') return <Tracker />;
    return mode === 'patient' ? <PatientCheckIn /> : <SupporterBrief />;
  };

  return (
    <Background>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setTab('home'); }} />
        </View>
        <View style={{ flex: 1 }}>{renderScreen()}</View>
        <ScreenTabs tabs={tabs} value={active} onChange={setTab} />
      </SafeAreaView>
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
