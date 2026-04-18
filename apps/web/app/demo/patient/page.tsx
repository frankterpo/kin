"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession, type DemoSession } from "@/lib/demoSession";
import { useRealtimeData } from "@/lib/useRealtimeData";
import { Card, DemoShell, Empty, formatTime } from "../_components/DemoShell";
import { BiomarkerGroup } from "../_components/BiomarkerBar";

function WaveBars() {
  return (
    <span className="wave-bars playing" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          style={{ height: `${30 + (i * 11) % 70}%` }}
        />
      ))}
    </span>
  );
}

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
  const firstName =
    session.profile.display_name?.split(" ")[0] ?? "there";

  return (
    <DemoShell
      session={session}
      fixtureMode={data.fixtureMode}
      onToggleFixture={toggleFixture}
      appTitle={`Hi, ${firstName}`}
      appSubtitle="15s of your voice, once a day."
    >
      <Card
        title="Latest check-in"
        subtitle={
          latestCheckin ? formatTime(latestCheckin.started_at) : undefined
        }
      >
        {latestCheckin ? (
          <div className="wa-bg rounded-xl px-3 py-3">
            <div className="flex justify-end">
              <div className="wa-bubble wa-bubble-out">
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm"
                    aria-label="Play voice note"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <WaveBars />
                  <span className="text-[11px] tabular-nums text-[#667781]">
                    {(() => {
                      const finished = latestCheckin.finished_at
                        ? new Date(latestCheckin.finished_at).getTime()
                        : null;
                      const started = new Date(latestCheckin.started_at).getTime();
                      const secs = finished
                        ? Math.max(1, Math.round((finished - started) / 1000))
                        : 15;
                      return `0:${String(secs).padStart(2, "0")}`;
                    })()}
                  </span>
                </div>
                {latestCheckin.transcript && (
                  <p className="mt-2 text-[13px] leading-snug text-[#111]/85">
                    “{latestCheckin.transcript}”
                  </p>
                )}
                <div className="wa-meta">
                  {new Date(latestCheckin.started_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="text-[#53bdeb]">✓✓</span>
                </div>
              </div>
            </div>
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
            <div className="text-[13px] font-medium leading-snug text-ink">
              {latestBrief.headline}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink/70">
              {latestBrief.guidance}
            </p>
            {latestBrief.tone_cues?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
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
          <Empty hint="No supporter brief yet." />
        )}
      </Card>

      <Card
        title="WhatsApp activity"
        subtitle={`${data.messages.length} msgs`}
      >
        {data.messages.length === 0 ? (
          <Empty hint="No WhatsApp activity yet." />
        ) : (
          <ul className="space-y-1.5">
            {data.messages.slice(0, 8).map((m) => (
              <li
                key={m.id}
                className={`flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 ${
                  m.direction === "inbound"
                    ? "bg-kin-50"
                    : "bg-ink/[0.03]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-medium uppercase tracking-wider text-ink/45">
                    {m.direction} · {m.msg_type}
                  </div>
                  <div className="truncate text-[12px] text-ink/80">
                    {m.body ?? (
                      <em className="text-ink/40">voice note</em>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-[9px] text-ink/35">
                  {formatTime(m.created_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DemoShell>
  );
}
