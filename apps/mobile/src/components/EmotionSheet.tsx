import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';
import { EmotionGrid, Pick } from './EmotionGrid';

type Props = {
  visible: boolean;
  question: string;
  initial?: { row: number; col: number };
  onCancel: () => void;
  onCommit: (emotion: string) => void;
};

export function EmotionSheet({ visible, question, initial, onCancel, onCommit }: Props) {
  const [pick, setPick] = useState<Pick | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.question}>{question}</Text>

          <View style={styles.gridArea}>
            <EmotionGrid initial={initial} onChange={setPick} />
          </View>

          <Text style={styles.pickedName}>{(pick?.emotion ?? '').toUpperCase() || ' '}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.ghost} onPress={onCancel}>
              <Text style={styles.ghostLbl}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.commit}
              onPress={() => pick && onCommit(pick.emotion)}
            >
              <Text style={styles.commitLbl}>Commit{pick ? ` · ${pick.emotion}` : ''}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#250812',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: palette.cardBorder,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.32)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  question: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  gridArea: { marginBottom: 14 },
  pickedName: {
    color: palette.accent,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    minHeight: 28,
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 10 },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  ghostLbl: { color: palette.inkDim, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  commit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  commitLbl: { color: '#1a0509', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
});
