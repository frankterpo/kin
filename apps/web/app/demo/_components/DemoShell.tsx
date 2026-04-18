"use client";

import { useRouter } from "next/navigation";
import { clearSession, type DemoSession } from "@/lib/demoSession";

export function DemoShell({
  session,
  fixtureMode,
  onToggleFixture,
  children,
  appTitle = "kin",
  appSubtitle,
}: {
  session: DemoSession;
  fixtureMode: boolean;
  onToggleFixture: () => void;
  children: React.ReactNode;
  appTitle?: string;
  appSubtitle?: string;
}) {
  const router = useRouter();

  function onLogout() {
    clearSession();
    router.push("/demo/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 pb-10 pt-6">
      <header className="mb-5 flex w-full max-w-md items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl text-ink">kin</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink/45">
            {session.role}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {fixtureMode && (
            <span className="rounded-full bg-warm/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink/70">
              fixture
            </span>
          )}
          <span className="hidden truncate text-ink/50 sm:inline">
            {session.profile.display_name ?? session.profile.phone_e164}
          </span>
          <button
            onClick={onToggleFixture}
            className="rounded-md border border-ink/15 bg-white/60 px-2 py-1 text-ink/65 transition hover:bg-white"
            title="Toggle fixture mode (or press F)"
          >
            F
          </button>
          <button
            onClick={onLogout}
            className="rounded-md border border-ink/15 bg-white/60 px-2 py-1 text-ink/65 transition hover:bg-white"
          >
            logout
          </button>
        </div>
      </header>

      <div
        className="iphone-frame"
        style={{ maxWidth: 360, aspectRatio: "9 / 19.5" }}
      >
        <div className="iphone-notch" />
        <div className="iphone-screen flex flex-col">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-ink/70">
            <span className="tabular-nums">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="tracking-wider">•••• LTE</span>
          </div>

          {/* app header */}
          <div className="border-b border-ink/5 px-5 pb-3 pt-2">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-serif text-lg leading-tight text-ink">
                  {appTitle}
                </div>
                {appSubtitle && (
                  <div className="text-[11px] text-ink/55">{appSubtitle}</div>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-kin-700">
                live
              </div>
            </div>
          </div>

          {/* scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
            {children}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-ink/45">
        Press <kbd className="rounded border border-ink/15 bg-white/60 px-1 py-0.5 font-mono text-[10px]">F</kbd> to toggle fixtures
      </div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  accent,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-2xl border border-ink/5 bg-white/70 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {accent}
          {subtitle && (
            <span className="text-[10px] text-ink/40">{subtitle}</span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Empty({ hint }: { hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/15 px-3 py-4 text-center text-[11px] leading-snug text-ink/45">
      {hint}
    </div>
  );
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffS = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffS < 10) return "just now";
  if (diffS < 60) return `${diffS}s ago`;
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
