"use client";

export type DemoRole = "patient" | "supporter";

export type DemoSession = {
  role: DemoRole;
  circle_id: string;
  profile: {
    id: string;
    display_name: string | null;
    phone_e164: string | null;
  };
};

const KEY = "kin.demo.session";

export function saveSession(s: DemoSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function pipelineUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PIPELINE_URL ??
    "http://localhost:8000"
  ).replace(/\/+$/, "");
}
