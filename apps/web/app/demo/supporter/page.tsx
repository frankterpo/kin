"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, type DemoSession } from "@/lib/demoSession";
import { useRealtimeData } from "@/lib/useRealtimeData";
import { Card, DemoShell, Empty, formatTime } from "../_components/DemoShell";
import { BiomarkerGroup } from "../_components/BiomarkerBar";

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

  return (
    <DemoShell
      session={session}
      fixtureMode={data.fixtureMode}
      onToggleFixture={toggleFixture}
    >
      <div className="grid gap-5">
        <Card
          title="Today's brief"
          subtitle={latestBrief ? formatTime(latestBrief.created_at) : undefined}
        >
          {latestBrief ? (
            <div>
              <div className="text-lg font-medium leading-snug">
                {latestBrief.headline}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {latestBrief.guidance}
              </p>
              {latestBrief.tone_cues?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {latestBrief.tone_cues.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
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
            <p className="text-base leading-relaxed text-white/80">
              “{latestCheckin.transcript ?? "…"}”
            </p>
          ) : (
            <Empty hint="No check-ins yet today." />
          )}
        </Card>

        <Card title="What Kin heard under the words">
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
          subtitle="Send a voice note via WhatsApp"
        >
          <div className="text-sm text-white/60">
            Reply to Kin on WhatsApp with a quick voice note. It will show up
            here and in the network pulse.
          </div>
          {data.messages.filter((m) => m.direction === "inbound").length > 0 && (
            <ul className="mt-4 space-y-2">
              {data.messages
                .filter((m) => m.direction === "inbound")
                .slice(0, 5)
                .map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg bg-white/[0.04] px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>
                        {m.from_e164 ?? "unknown"} · {m.msg_type}
                      </span>
                      <span>{formatTime(m.created_at)}</span>
                    </div>
                    <div className="text-sm text-white/80">
                      {m.body ?? <em className="text-white/40">voice note</em>}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </DemoShell>
  );
}
