import { DEMO_CIRCLE_ID, supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  checkin_id: string;
  started_at: string;
  source: string;
  transcript: string | null;
  helios: Record<string, number> | null;
  apollo: Record<string, number> | null;
  psyche: Record<string, number> | null;
  concordance: { scenario?: string } | null;
};

function score(r: Row): { stress: number; fatigue: number; mood: number } {
  const helios = r.helios ?? {};
  const apollo = r.apollo ?? {};
  const stress = Number(helios.stress ?? helios.distress ?? 0);
  const fatigue = Number(helios.fatigue ?? 0);
  // mood: invert depression_score into positivity (0..1)
  const depression = Number(apollo.depression_score ?? 0);
  const mood = Math.max(0, Math.min(1, 1 - depression));
  return { stress, fatigue, mood };
}

function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(0.2, ...values);
  return (
    <div className="flex h-10 items-end gap-0.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm"
          style={{ height: `${Math.max(2, (v / max) * 100)}%`, background: color }}
        />
      ))}
    </div>
  );
}

async function loadPulse() {
  const sb = supabaseService();
  if (!sb) return [] as Row[];
  const { data } = await sb
    .from("network_pulse")
    .select(
      "checkin_id, started_at, source, transcript, helios, apollo, psyche, concordance"
    )
    .eq("circle_id", DEMO_CIRCLE_ID)
    .order("started_at", { ascending: true })
    .limit(30);
  return (data as Row[]) ?? [];
}

export default async function PulsePage() {
  const rows = await loadPulse();
  const scored = rows.map(score);
  const stress = scored.map((s) => s.stress);
  const fatigue = scored.map((s) => s.fatigue);
  const mood = scored.map((s) => s.mood);

  const latest = rows.length ? rows[rows.length - 1] : null;

  return (
    <div className="space-y-6 pt-4">
      <header>
        <div className="text-sm uppercase tracking-widest text-ink/50">
          Network pulse
        </div>
        <h1 className="font-serif text-3xl leading-tight">The circle over time</h1>
      </header>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Once the circle records a few check-ins, the pulse will appear here.
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid gap-3">
            <MetricCard
              title="Stress"
              values={stress}
              color="#D95C3B"
              latest={scored.at(-1)?.stress ?? 0}
            />
            <MetricCard
              title="Fatigue"
              values={fatigue}
              color="#E8A87C"
              latest={scored.at(-1)?.fatigue ?? 0}
            />
            <MetricCard
              title="Mood"
              values={mood}
              color="#2F8560"
              latest={scored.at(-1)?.mood ?? 0}
            />
          </div>

          <section className="space-y-3">
            <h2 className="font-serif text-xl">Recent moments</h2>
            <ul className="space-y-2 text-sm">
              {rows
                .slice(-8)
                .reverse()
                .map((r) => (
                  <li
                    key={r.checkin_id}
                    className="rounded-2xl border border-ink/10 bg-white/60 p-4"
                  >
                    <div className="flex justify-between text-xs text-ink/50">
                      <span className="capitalize">{r.source}</span>
                      <time>{new Date(r.started_at).toLocaleString()}</time>
                    </div>
                    {r.transcript && (
                      <p className="mt-1 font-serif italic text-ink/80">
                        &ldquo;{r.transcript}&rdquo;
                      </p>
                    )}
                    {r.concordance?.scenario &&
                      r.concordance.scenario !== "aligned" && (
                        <div className="mt-2 inline-block rounded-full bg-alert/10 px-2 py-0.5 text-xs text-alert">
                          concordance: {r.concordance.scenario}
                        </div>
                      )}
                  </li>
                ))}
            </ul>
          </section>

          {latest && (
            <p className="text-xs text-ink/40">
              Last update: {new Date(latest.started_at).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  values,
  color,
  latest,
}: {
  title: string;
  values: number[];
  color: string;
  latest: number;
}) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-serif text-lg">{title}</div>
        <div className="font-mono text-sm text-ink/70">
          {Math.round(latest * 100)}%
        </div>
      </div>
      <div className="mt-3">
        <SparkBar values={values} color={color} />
      </div>
    </div>
  );
}
