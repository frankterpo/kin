"use client";

export function BiomarkerBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const hue = Math.round(140 - pct * 140);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="w-24 shrink-0 truncate text-[10px] uppercase tracking-wider text-ink/55">
        {label.replace(/_/g, " ")}
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct * 100}%`,
            background: `hsl(${hue}, 65%, 45%)`,
          }}
        />
      </div>
      <div className="w-7 text-right text-[10px] tabular-nums text-ink/55">
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
    <div className="mb-2.5">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-kin-700">
        {title}
      </div>
      {entries.map(([k, v]) => (
        <BiomarkerBar key={k} label={k} value={Number(v)} />
      ))}
    </div>
  );
}
