"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, type DemoSession } from "@/lib/demoSession";
import { useRealtimeData } from "@/lib/useRealtimeData";
import { Card, DemoShell, Empty, formatTime } from "../_components/DemoShell";
import { BiomarkerGroup } from "../_components/BiomarkerBar";

function ConcordDot({
  level,
}: {
  level: "aligned" | "mismatch" | "alert" | undefined;
}) {
  const cls = level ?? "aligned";
  const label =
    cls === "aligned"
      ? "in sync"
      : cls === "mismatch"
        ? "mixed signal"
        : "needs attention";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`concord-dot ${cls}`} />
      <span className="text-[10px] uppercase tracking-wider text-ink/55">
        {label}
      </span>
    </span>
  );
}

function biomarkerScenario(
  bio: { helios?: Record<string, number> | null; apollo?: Record<string, number> | null; psyche?: Record<string, number> | null } | undefined,
): "aligned" | "mismatch" | "alert" {
  if (!bio) return "aligned";
  const all = { ...(bio.helios ?? {}), ...(bio.apollo ?? {}), ...(bio.psyche ?? {}) };
  const vals = Object.values(all).filter((v) => typeof v === "number") as number[];
  if (!vals.length) return "aligned";
  const max = Math.max(...vals);
  if (max >= 0.7) return "alert";
  if (max >= 0.5) return "mismatch";
  return "aligned";
}

export default function DemoSupporterPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/demo/login");
      return;
    }
    if (s.role !== "supporter") {
      router.replace("/demo/patient");
      return;
    }
    setSession(s);
  }, [router]);

  const { data, toggleFixture } = useRealtimeData(session?.circle_id ?? null);

  if (!session) return null;

  const latestBrief = data.briefs[0];
  const latestCheckin = data.checkins[0];
  const latestBio = data.biomarkers.find(
    (b) => b.checkin_id === latestCheckin?.id,
  );
  const scenario = biomarkerScenario(latestBio);

  return (
    <DemoShell
      session={session}
      fixtureMode={data.fixtureMode}
      onToggleFixture={toggleFixture}
      appTitle="Sofia today"
      appSubtitle="A quiet update from Kin."
    >
      <Card
        title="Today's brief"
        subtitle={latestBrief ? formatTime(latestBrief.created_at) : undefined}
        accent={<ConcordDot level={scenario} />}
      >
        {latestBrief ? (
          <div>
            <div className="text-[14px] font-medium leading-snug text-ink">
              {latestBrief.headline}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink/75">
              {latestBrief.guidance}
            </p>
            {latestBrief.tone_cues?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {latestBrief.tone_cues.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-kin-50 px-2 py-0.5 text-[10px] font-medium text-kin-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Empty hint="Waiting for a brief from Kin." />
        )}
      </Card>

      <Card
        title="What Sofia said"
        subtitle={
          latestCheckin ? formatTime(latestCheckin.started_at) : undefined
        }
      >
        {latestCheckin ? (
          <div className="wa-bg rounded-xl px-3 py-3">
            <div className="flex justify-start">
              <div className="wa-bubble wa-bubble-in">
                <p className="text-[13px] leading-relaxed text-[#111]/85">
                  “{latestCheckin.transcript ?? "…"}”
                </p>
                <div className="wa-meta">
                  {new Date(latestCheckin.started_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Empty hint="No check-ins yet today." />
        )}
      </Card>

      <Card title="Under the words">
        {latestBio ? (
          <div>
            <BiomarkerGroup title="Helios" scores={latestBio.helios} />
            <BiomarkerGroup title="Apollo" scores={latestBio.apollo} />
            <BiomarkerGroup title="Psyche" scores={latestBio.psyche} />
          </div>
        ) : (
          <Empty hint="Biomarkers appear after Sofia checks in." />
        )}
      </Card>

      <Card
        title="Add an observation"
        subtitle="WhatsApp Kin"
      >
        <div className="text-[12px] leading-relaxed text-ink/65">
          Reply to Kin with a quick voice note. It will show up here and in the
          network pulse.
        </div>
        {data.messages.filter((m) => m.direction === "inbound").length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {data.messages
              .filter((m) => m.direction === "inbound")
              .slice(0, 5)
              .map((m) => (
                <li
                  key={m.id}
                  className="rounded-lg bg-ink/[0.03] px-2 py-1.5"
                >
                  <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-wider text-ink/45">
                    <span>
                      {m.from_e164 ?? "unknown"} · {m.msg_type}
                    </span>
                    <span>{formatTime(m.created_at)}</span>
                  </div>
                  <div className="text-[12px] text-ink/80">
                    {m.body ?? <em className="text-ink/40">voice note</em>}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </DemoShell>
  );
}
