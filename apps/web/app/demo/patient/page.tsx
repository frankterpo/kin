"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, type DemoSession } from "@/lib/demoSession";
import { useRealtimeData } from "@/lib/useRealtimeData";
import { Card, DemoShell, Empty, formatTime } from "../_components/DemoShell";
import { BiomarkerGroup } from "../_components/BiomarkerBar";

export default function DemoPatientPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/demo/login");
      return;
    }
    if (s.role !== "patient") {
      router.replace("/demo/supporter");
      return;
    }
    setSession(s);
  }, [router]);

  const { data, toggleFixture } = useRealtimeData(session?.circle_id ?? null);

  if (!session) return null;

  const latestCheckin = data.checkins[0];
  const latestBio = data.biomarkers.find(
    (b) => b.checkin_id === latestCheckin?.id,
  );
  const latestBrief = data.briefs[0];

  return (
    <DemoShell
      session={session}
      fixtureMode={data.fixtureMode}
      onToggleFixture={toggleFixture}
    >
      <div className="grid gap-5">
        <Card
          title="Latest check-in"
          subtitle={
            latestCheckin ? formatTime(latestCheckin.started_at) : undefined
          }
        >
          {latestCheckin ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40">
                you said
              </div>
              <p className="mt-1 text-lg leading-relaxed">
                “{latestCheckin.transcript ?? "…"}”
              </p>
            </div>
          ) : (
            <Empty hint="Send a voice note on WhatsApp to see it here." />
          )}
        </Card>

        <Card title="What Kin heard">
          {latestBio ? (
            <div>
              <BiomarkerGroup title="Helios" scores={latestBio.helios} />
              <BiomarkerGroup title="Apollo" scores={latestBio.apollo} />
              <BiomarkerGroup title="Psyche" scores={latestBio.psyche} />
            </div>
          ) : (
            <Empty hint="Biomarkers appear after a check-in is processed." />
          )}
        </Card>

        <Card title="What Kin told your circle">
          {latestBrief ? (
            <div>
              <div className="text-base font-medium">{latestBrief.headline}</div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {latestBrief.guidance}
              </p>
              {latestBrief.tone_cues?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {latestBrief.tone_cues.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Empty hint="No supporter brief yet." />
          )}
        </Card>

        <Card
          title="WhatsApp activity"
          subtitle={`${data.messages.length} messages`}
        >
          {data.messages.length === 0 ? (
            <Empty hint="No WhatsApp activity yet." />
          ) : (
            <ul className="space-y-2">
              {data.messages.slice(0, 8).map((m) => (
                <li
                  key={m.id}
                  className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 ${
                    m.direction === "inbound"
                      ? "bg-emerald-500/5"
                      : "bg-white/[0.04]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-white/40">
                      {m.direction} · {m.msg_type}
                    </div>
                    <div className="truncate text-sm text-white/80">
                      {m.body ?? <em className="text-white/40">voice note</em>}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-white/30">
                    {formatTime(m.created_at)}
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
