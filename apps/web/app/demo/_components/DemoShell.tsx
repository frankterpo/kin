"use client";

import { useRouter } from "next/navigation";
import { clearSession, type DemoSession } from "@/lib/demoSession";

export function DemoShell({
  session,
  fixtureMode,
  onToggleFixture,
  children,
}: {
  session: DemoSession;
  fixtureMode: boolean;
  onToggleFixture: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function onLogout() {
    clearSession();
    router.push("/demo/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-6">
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl">kin</span>
          <span className="text-xs uppercase tracking-wider text-white/40">
            {session.role}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {fixtureMode && (
            <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300">
              fixture
            </span>
          )}
          <span className="text-white/50">
            {session.profile.display_name ?? session.profile.phone_e164}
          </span>
          <button
            onClick={onToggleFixture}
            className="rounded border border-white/10 px-2 py-1 text-white/60 hover:bg-white/5"
            title="Toggle fixture mode (or press F)"
          >
            F
          </button>
          <button
            onClick={onLogout}
            className="rounded border border-white/10 px-2 py-1 text-white/60 hover:bg-white/5"
          >
            logout
          </button>
        </div>
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm uppercase tracking-wider text-white/50">
          {title}
        </h2>
        {subtitle && <span className="text-xs text-white/40">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

export function Empty({ hint }: { hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
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
