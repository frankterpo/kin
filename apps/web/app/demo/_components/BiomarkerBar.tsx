"use client";

export function BiomarkerBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const hue = Math.round(140 - pct * 140);
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-28 shrink-0 text-xs uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct * 100}%`,
            background: `hsl(${hue}, 80%, 55%)`,
          }}
        />
      </div>
      <div className="w-10 text-right text-xs tabular-nums text-white/60">
        {(pct * 100).toFixed(0)}
      </div>
    </div>
  );
}

export function BiomarkerGroup({
  title,
  scores,
}: {
  title: string;
  scores: Record<string, number> | null | undefined;
}) {
  if (!scores) return null;
  const entries = Object.entries(scores).filter(
    ([, v]) => typeof v === "number",
  );
  if (!entries.length) return null;
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-medium text-white/70">{title}</div>
      {entries.map(([k, v]) => (
        <BiomarkerBar key={k} label={k} value={Number(v)} />
      ))}
    </div>
  );
}
