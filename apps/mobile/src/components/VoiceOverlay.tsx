import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../theme';

const EYE_OPEN: number[][] = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

const EYE_BLINK: number[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

type Phase = 'speaking' | 'listening' | 'transcribing' | 'done';

type Result = { transcript: string; score: number };

type Props = {
  visible: boolean;
  prompt: string;
  onDismiss: (result?: Result) => void;
  duration?: number;
};

// Mock transcripts that flow back into the hero score
const TRANSCRIPTS: Result[] = [
  { transcript: 'Slept rough, knees a bit sore today.', score: 71 },
  { transcript: 'Feeling alright, took my time this morning.', score: 78 },
  { transcript: 'Tired but okay. Looking forward to lunch with Sarah.', score: 74 },
  { transcript: 'Hands a bit stiff, mood is fine. Read the paper.', score: 73 },
];

function speak(text: string, onEnd: () => void): () => void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utter = new (window as any).SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.volume = 0.9;
      utter.onend = onEnd;
      utter.onerror = onEnd;
      (window as any).speechSynthesis.cancel();
      (window as any).speechSynthesis.speak(utter);
      return () => (window as any).speechSynthesis.cancel();
    } catch {
      // fall through to fake timing
    }
  }
  const ms = Math.max(1400, text.length * 70);
  const id = setTimeout(onEnd, ms);
  return () => clearTimeout(id);
}

export function VoiceOverlay({ visible, prompt, onDismiss, duration = 15 }: Props) {
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('speaking');
  const [secsLeft, setSecsLeft] = useState(duration);
  const [blink, setBlink] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const resultRef = useRef<Result | null>(null);

  // Reset on open / close
  useEffect(() => {
    if (visible) {
      setPhase('speaking');
      setSecsLeft(duration);
      setBlink(false);
      setTranscript(null);
      resultRef.current = null;
    }
  }, [visible, duration]);

  // Phase: speaking — TTS the prompt, then transition to listening
  useEffect(() => {
    if (!visible || phase !== 'speaking') return;
    const cancel = speak(prompt, () => setPhase('listening'));
    return cancel;
  }, [visible, phase, prompt]);

  // Phase: listening — countdown 15s
  useEffect(() => {
    if (!visible || phase !== 'listening') return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setSecsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase('transcribing');
      }
    }, 100);
    return () => clearInterval(id);
  }, [visible, phase, duration]);

  // Phase: transcribing — fake the LLM/transcript
  useEffect(() => {
    if (!visible || phase !== 'transcribing') return;
    const pick = TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)];
    resultRef.current = pick;
    const t1 = setTimeout(() => {
      setTranscript(pick.transcript);
      setPhase('done');
    }, 1100);
    return () => clearTimeout(t1);
  }, [visible, phase]);

  // Phase: done — auto-dismiss with the result
  useEffect(() => {
    if (!visible || phase !== 'done') return;
    const t = setTimeout(() => {
      const r = resultRef.current;
      onDismiss(r ?? undefined);
    }, 1600);
    return () => clearTimeout(t);
  }, [visible, phase, onDismiss]);

  // Blink behavior — slow during listening, faster during transcribing
  useEffect(() => {
    if (!visible) return;
    if (phase === 'speaking' || phase === 'done') return;
    const interval = phase === 'transcribing' ? 600 : 2200;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setBlink(true);
      setTimeout(() => !cancelled && setBlink(false), 140);
    };
    const id = setInterval(tick, interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [visible, phase]);

  const cell = 22;
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);

  const eyeRows = EYE_OPEN.length;
  const eyeCols = EYE_OPEN[0].length;
  const eyeGap = 4;
  const totalEyeCols = eyeCols * 2 + eyeGap;
  const startCol = Math.floor((cols - totalEyeCols) / 2);
  const startRow = Math.floor((rows - eyeRows) / 2) - 2;

  const pattern = blink ? EYE_BLINK : EYE_OPEN;

  const isEye = (r: number, c: number) => {
    const er = r - startRow;
    if (er < 0 || er >= eyeRows) return false;
    const lc = c - startCol;
    if (lc >= 0 && lc < eyeCols) return pattern[er][lc] === 1;
    const rc = c - (startCol + eyeCols + eyeGap);
    if (rc >= 0 && rc < eyeCols) return pattern[er][rc] === 1;
    return false;
  };

  const handleBackdrop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { (window as any).speechSynthesis.cancel(); } catch {}
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleBackdrop}>
      <Pressable style={[styles.root, { width, height }]} onPress={handleBackdrop}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const cx = c * cell + cell / 2;
              const cy = r * cell + cell / 2;
              const lit = isEye(r, c);
              return (
                <Circle
                  key={`${r}-${c}`}
                  cx={cx}
                  cy={cy}
                  r={lit ? cell * 0.34 : cell * 0.14}
                  fill={lit ? palette.accent : palette.ink}
                  opacity={lit ? 1 : 0.18}
                />
              );
            })
          )}
        </Svg>

        <View pointerEvents="none" style={styles.kicker}>
          <Text style={styles.kickerLbl}>{phaseKicker(phase, secsLeft)}</Text>
        </View>

        <View pointerEvents="none" style={styles.label}>
          {phase === 'speaking' || phase === 'listening' ? (
            <Text style={styles.lead} numberOfLines={3}>"{prompt}"</Text>
          ) : null}
          {phase === 'transcribing' ? (
            <Text style={styles.lead}>thinking…</Text>
          ) : null}
          {phase === 'done' && transcript ? (
            <Text style={styles.lead} numberOfLines={3}>"{transcript}"</Text>
          ) : null}
          <Text style={styles.sub}>{phaseSub(phase)}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

function phaseKicker(phase: Phase, secsLeft: number) {
  switch (phase) {
    case 'speaking': return 'KIN IS ASKING';
    case 'listening': return `LISTENING · ${Math.ceil(secsLeft)}s`;
    case 'transcribing': return 'TRANSCRIBING';
    case 'done': return 'GOT IT';
  }
}

function phaseSub(phase: Phase) {
  switch (phase) {
    case 'speaking': return 'wait for the prompt';
    case 'listening': return 'speak naturally · tap anywhere to stop';
    case 'transcribing': return 'biomarkers updating…';
    case 'done': return 'score updated · closing';
  }
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#0c0306' },
  kicker: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  kickerLbl: {
    color: palette.accent,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  label: {
    position: 'absolute',
    bottom: 56,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  lead: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 24,
  },
  sub: {
    color: palette.inkDim,
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
