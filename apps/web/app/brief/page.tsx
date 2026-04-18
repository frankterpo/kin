import { DEMO_CIRCLE_ID, supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Brief = {
  id: string;
  headline: string;
  guidance: string;
  tone_cues: string[] | null;
  for_date: string;
  derived_from: string | null;
};

type Checkin = {
  id: string;
  transcript: string | null;
  started_at: string;
  source: string;
};

async function loadData() {
  const sb = supabaseService();
  if (!sb) return { brief: null, checkin: null };

  const { data: briefs } = await sb
    .from("supporter_briefs")
    .select("id, headline, guidance, tone_cues, for_date, derived_from")
    .eq("circle_id", DEMO_CIRCLE_ID)
    .order("for_date", { ascending: false })
    .limit(1);

  const brief = (briefs?.[0] as Brief | undefined) ?? null;

  let checkin: Checkin | null = null;
  if (brief?.derived_from) {
    const { data } = await sb
      .from("checkins")
      .select("id, transcript, started_at, source")
      .eq("id", brief.derived_from)
      .limit(1);
    checkin = (data?.[0] as Checkin | undefined) ?? null;
  }
  return { brief, checkin };
}

export default async function BriefPage() {
  const { brief, checkin } = await loadData();

  return (
    <div className="space-y-6 pt-4">
      <header>
        <div className="text-sm uppercase tracking-widest text-ink/50">
          Supporter brief
        </div>
        <h1 className="font-serif text-3xl leading-tight">Today&rsquo;s brief</h1>
      </header>

      {!brief && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          No brief yet. Ask the patient to record a check-in, then refresh.
        </div>
      )}

      {brief && (
        <article className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-sm">
          <div className="text-xs text-ink/50">For {brief.for_date}</div>
          <h2 className="mt-1 font-serif text-2xl leading-snug">
            {brief.headline}
          </h2>
          <p className="mt-3 text-ink/80">{brief.guidance}</p>

          {brief.tone_cues && brief.tone_cues.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {brief.tone_cues.map((cue) => (
                <span
                  key={cue}
                  className="rounded-full bg-warm/20 px-3 py-1 text-xs text-ink/80"
                >
                  {cue}
                </span>
              ))}
            </div>
          )}

          {checkin?.transcript && (
            <div className="mt-5 border-t border-ink/10 pt-4">
              <div className="text-xs uppercase tracking-widest text-ink/40">
                Derived from
              </div>
              <blockquote className="mt-2 font-serif text-lg italic text-ink/70">
                &ldquo;{checkin.transcript}&rdquo;
              </blockquote>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
