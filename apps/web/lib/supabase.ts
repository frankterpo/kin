import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_PUBLIC ??
  "";
const service = process.env.SUPABASE_SERVICE_ROLE ?? "";

export const DEMO_CIRCLE_ID = "00000000-0000-0000-0000-0000000000aa";
export const DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_PARTNER_ID = "00000000-0000-0000-0000-000000000002";

export function supabaseAnon() {
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export function supabaseService() {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
