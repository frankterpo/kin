"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { pipelineUrl, saveSession, clearSession } from "@/lib/demoSession";

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export default function DemoLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    clearSession();
  }, []);

  const api = useMemo(pipelineUrl, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const p = normalizePhone(phone);
    if (!p) {
      setErr("Enter your phone number in international format.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${api}/api/whoami?phone=${encodeURIComponent(p)}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await r.json();
      if (!data.ok) {
        setErr(
          data.reason === "unknown_phone"
            ? "That number isn't in the demo circle yet."
            : "Couldn't sign you in. Try again.",
        );
        return;
      }
      saveSession({
        role: data.role,
        circle_id: data.circle_id,
        profile: data.profile,
      });
      router.push(data.role === "patient" ? "/demo/patient" : "/demo/supporter");
    } catch (error) {
      console.error(error);
      setErr("Couldn't reach the Kin pipeline. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="font-serif text-5xl tracking-tight">kin</div>
          <div className="mt-2 text-sm text-white/50">care that listens</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-white/40">
              Phone number
            </span>
            <input
              autoFocus
              type="tel"
              inputMode="tel"
              placeholder="+44 7712 513 416"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg outline-none focus:border-emerald-400/60"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Enter the demo"}
          </button>

          {err && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          )}
        </form>

        <div className="mt-10 border-t border-white/10 pt-5 text-xs text-white/40">
          <div className="mb-2 uppercase tracking-wider">Demo numbers</div>
          <ul className="space-y-1">
            <li>
              <span className="text-white/70">+44 7712 513 416</span> — patient
              (Sofia)
            </li>
            <li>
              <span className="text-white/70">+44 7810 141 152</span> — supporter
              (Emma)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
