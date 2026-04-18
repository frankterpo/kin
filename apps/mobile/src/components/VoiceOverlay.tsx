import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
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

// TTS lives in App.tsx so it runs in the user-gesture chain. This component
// is purely the visual side of the capture.

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

  // Phase: speaking — fixed-time read window so the visual matches the TTS
  // duration. App.tsx fired the speech synchronously in the gesture handler.
  useEffect(() => {
    if (!visible || phase !== 'speaking') return;
    const ms = Math.max(2400, prompt.length * 65);
    const id = setTimeout(() => setPhase('listening'), ms);
    return () => clearTimeout(id);
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in (window as any)) {
      try { (window as any).speechSynthesis.cancel(); } catch {}
    }
    onDismiss();
  };

  // Reveal Speechmatics chip first (~400ms in), Thymia chip second (~900ms in)
  const showSpeechmaticsChip = phase === 'transcribing' || phase === 'done';
  const showThymiaChip = phase === 'done' || (phase === 'transcribing');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleBackdrop}>
      <View style={[styles.root, { width, height }]}>
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

        {/* Top: kicker + prominent prompt text */}
        <View pointerEvents="none" style={styles.topZone}>
          <Text style={styles.kickerLbl}>{phaseKicker(phase, secsLeft)}</Text>
          {phase === 'speaking' || phase === 'listening' ? (
            <Text style={styles.prompt} numberOfLines={4}>{prompt}</Text>
          ) : null}
        </View>

        {/* Cancel × top-right */}
        <Pressable style={styles.cancelBtn} onPress={handleBackdrop} hitSlop={12}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Line x1="3" y1="3" x2="13" y2="13" stroke={palette.ink} strokeWidth={1.6} strokeLinecap="round" />
            <Line x1="13" y1="3" x2="3" y2="13" stroke={palette.ink} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
        </Pressable>

        {/* Bottom: status / transcript / sub + processing handoff chips */}
        <View pointerEvents="none" style={styles.bottomZone}>
          {phase === 'transcribing' ? (
            <Text style={styles.lead}>analysing your voice…</Text>
          ) : null}
          {phase === 'done' && transcript ? (
            <Text style={styles.lead} numberOfLines={3}>"{transcript}"</Text>
          ) : null}
          <Text style={styles.sub}>{phaseSub(phase)}</Text>

          {(phase === 'transcribing' || phase === 'done') ? (
            <View style={styles.handoffRow}>
              <ProcessingChip
                label="Speechmatics"
                detail="transcript"
                done={phase === 'done'}
                shown={showSpeechmaticsChip}
              />
              <ProcessingChip
                label="Thymia"
                detail="biomarkers"
                done={phase === 'done'}
                shown={showThymiaChip}
              />
            </View>
          ) : null}
        </View>

        <Pressable style={styles.cancelBar} onPress={handleBackdrop} hitSlop={12}>
          <Text style={styles.cancelLbl}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function ProcessingChip({
  label,
  detail,
  done,
  shown,
}: {
  label: string;
  detail: string;
  done: boolean;
  shown: boolean;
}) {
  return (
    <View style={[styles.chip, !shown && { opacity: 0 }]}>
      <View style={[styles.chipDot, done && styles.chipDotDone]} />
      <View>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={styles.chipDetail}>{done ? `✓ ${detail}` : `${detail}…`}</Text>
      </View>
    </View>
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
    case 'speaking': return 'read the question · then answer';
    case 'listening': return 'speak naturally · 15 seconds';
    case 'transcribing': return 'analysing your voice…';
    case 'done': return 'one more thing · pick a word';
  }
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#0c0306' },
  topZone: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 14,
  },
  kickerLbl: {
    color: palette.accent,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  prompt: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 28,
  },
  bottomZone: {
    position: 'absolute',
    bottom: 86,
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
  cancelBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cancelBar: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cancelLbl: { color: palette.ink, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },

  handoffRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  chipDotDone: { backgroundColor: palette.accent },
  chipLabel: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipDetail: {
    color: palette.inkDim,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 1,
  },
});
