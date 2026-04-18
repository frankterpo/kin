"use client";

import { useEffect, useRef, useState } from "react";

type PipelineEvent =
  | { type: "session.started"; checkin_id: string; sample_rate: number }
  | { type: "session.finished"; checkin_id: string; transcript: string; duration_ms: number; policy_result: unknown }
  | { type: "transcript.partial"; text: string }
  | { type: "transcript.final"; text: string }
  | { type: "biomarker.progress"; progress: { biomarkers?: Record<string, { speech_seconds?: number; trigger_seconds?: number }> } }
  | { type: "biomarker.policy"; result: Record<string, unknown> }
  | { type: "error"; where: string; msg: string };

type Props = {
  source?: "patient" | "supporter";
  circleId?: string;
  authorId?: string;
  durationMs?: number;
};

export function VoiceCheckin({ source = "patient", circleId, authorId, durationMs = 15000 }: Props) {
  const [phase, setPhase] = useState<"idle" | "connecting" | "listening" | "processing" | "done" | "error">("idle");
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [policy, setPolicy] = useState<Record<string, unknown> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const startedAt = useRef<number>(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    nodeRef.current?.disconnect();
    acRef.current?.close().catch(() => {});
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current?.close();
    nodeRef.current = null;
    acRef.current = null;
    mediaRef.current = null;
    wsRef.current = null;
  }

  async function start() {
    setErrorMsg(null);
    setPartial("");
    setFinalText("");
    setPolicy(null);
    setProgress({});
    setPhase("connecting");

    const base = process.env.NEXT_PUBLIC_PIPELINE_WS_URL || "ws://localhost:8787/ws/checkin";
    const url = new URL(base);
    url.searchParams.set("source", source);
    if (circleId) url.searchParams.set("circle_id", circleId);
    if (authorId) url.searchParams.set("author_id", authorId);

    const ws = new WebSocket(url.toString());
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as PipelineEvent;
        switch (msg.type) {
          case "session.started":
            setPhase("listening");
            startedAt.current = performance.now();
            stopTimer.current = setTimeout(() => stop(), durationMs);
            break;
          case "transcript.partial":
            setPartial(msg.text);
            break;
          case "transcript.final":
            setPartial("");
            setFinalText((t) => (t ? t + " " + msg.text : msg.text));
            break;
          case "biomarker.progress": {
            const next: Record<string, number> = {};
            const biomarkers = msg.progress?.biomarkers ?? {};
            for (const [name, info] of Object.entries(biomarkers)) {
              const speech = info?.speech_seconds ?? 0;
              const trigger = info?.trigger_seconds ?? 0;
              next[name] = trigger > 0 ? Math.min(1, speech / trigger) : 0;
            }
            setProgress(next);
            break;
          }
          case "biomarker.policy":
            setPolicy(msg.result ?? null);
            break;
          case "session.finished":
            setPhase("done");
            setFinalText(msg.transcript || "");
            setPolicy((msg.policy_result as Record<string, unknown>) ?? null);
            break;
          case "error":
            setErrorMsg(`${msg.where}: ${msg.msg}`);
            setPhase("error");
            break;
        }
      } catch (e) {
        console.warn("bad ws message", e);
      }
    };

    ws.onerror = () => {
      setErrorMsg("WebSocket error (is the pipeline running on port 8787?)");
      setPhase("error");
    };
    ws.onclose = () => {
      if (phase === "listening") setPhase("processing");
    };

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      setTimeout(() => reject(new Error("ws timeout")), 5000);
    }).catch((e) => {
      setErrorMsg(String(e));
      setPhase("error");
    });

    if (phase === "error") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaRef.current = stream;

      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC({ sampleRate: 16000 });
      acRef.current = ac;

      await ac.audioWorklet.addModule("/pcm-worklet.js");
      const src = ac.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ac, "pcm-worklet");
      nodeRef.current = node;

      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
        setElapsed(performance.now() - startedAt.current);
      };
      src.connect(node).connect(ac.destination);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    }
  }

  function stop() {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    setPhase("processing");
    try {
      wsRef.current?.send(JSON.stringify({ type: "stop" }));
    } catch {}
    nodeRef.current?.disconnect();
    mediaRef.current?.getTracks().forEach((t) => t.stop());
  }

  const pct = Math.min(1, elapsed / durationMs);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-serif text-2xl">
            {source === "patient" ? "Today's 15 seconds" : "Add a voice note"}
          </div>
          <span className="rounded-full bg-kin-100 px-3 py-1 text-xs text-kin-700">
            {phase}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={phase === "idle" || phase === "done" || phase === "error" ? start : stop}
            className="h-20 w-20 rounded-full border border-kin-700/10 bg-kin-500 text-white shadow-lg transition hover:bg-kin-700 disabled:opacity-50"
            disabled={phase === "connecting" || phase === "processing"}
            aria-label={phase === "listening" ? "Stop recording" : "Start recording"}
          >
            <span className="block font-serif text-xl">
              {phase === "listening" ? "■" : "●"}
            </span>
          </button>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full bg-kin-500 transition-[width] duration-200"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-ink/60">
              {phase === "listening"
                ? `${Math.ceil((durationMs - elapsed) / 1000)}s remaining`
                : phase === "idle"
                ? "Tap to start. Speak naturally about your day."
                : phase === "done"
                ? "Saved to your circle."
                : phase === "error"
                ? errorMsg ?? "Something went wrong."
                : "Working…"}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          {finalText && (
            <p className="font-serif text-lg leading-snug">{finalText}</p>
          )}
          {partial && <p className="italic text-ink/50">{partial}…</p>}
          {!finalText && !partial && phase === "listening" && (
            <p className="text-ink/40">listening…</p>
          )}
        </div>
      </div>

      <BiomarkerPanel progress={progress} policy={policy} />
    </div>
  );
}

function BiomarkerPanel({
  progress,
  policy,
}: {
  progress: Record<string, number>;
  policy: Record<string, unknown> | null;
}) {
  type ResultShape = {
    result?: Record<string, unknown>;
    classification?: { level?: string; alert?: string };
    concordance_analysis?: { scenario?: string; agreement_level?: string };
    biomarkers?: Record<string, Record<string, number>>;
    biomarker_summary?: Record<string, Record<string, number>>;
  };
  const r: ResultShape = (policy?.result as ResultShape) || (policy as ResultShape) || {};
  const bio = r.biomarkers || r.biomarker_summary || {};

  return (
    <div className="rounded-3xl border border-ink/10 bg-white/60 p-5">
      <div className="font-serif text-xl">Voice biomarkers</div>
      <div className="mt-3 space-y-3">
        {Object.entries(progress).map(([name, ratio]) => (
          <div key={name}>
            <div className="flex justify-between text-xs text-ink/60">
              <span className="capitalize">{name}</span>
              <span>{Math.round(ratio * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full bg-warm"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {!Object.keys(progress).length && (
          <p className="text-sm text-ink/40">
            Biomarker signals will stream in after a few seconds of speech.
          </p>
        )}
      </div>

      {policy && (
        <div className="mt-4 space-y-2 text-sm">
          {r.classification && (
            <div>
              <span className="text-ink/60">Classification: </span>
              <span className="font-medium">
                {String(r.classification.level)} · alert:{" "}
                {String(r.classification.alert)}
              </span>
            </div>
          )}
          {r.concordance_analysis && (
            <div>
              <span className="text-ink/60">Concordance: </span>
              <span className="font-medium">
                {String(r.concordance_analysis.scenario)} ·{" "}
                {String(r.concordance_analysis.agreement_level)}
              </span>
            </div>
          )}
          {Object.entries(bio).map(([name, values]) => (
            <div key={name}>
              <div className="capitalize text-ink/60">{name}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                {Object.entries(values as Record<string, number>).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-ink/50">{k}</span>
                    <span>{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
