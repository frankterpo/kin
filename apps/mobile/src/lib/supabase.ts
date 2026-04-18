// Thin Supabase wrapper. Lazily loads @supabase/supabase-js when both
// env vars are set; otherwise exports a null client and `supabaseEnabled = false`
// so every consumer in src/data/queries.ts cleanly falls back to the mock data
// in src/data/tracker.ts.
//
// To wire real Supabase:
//   1. `npx expo install @supabase/supabase-js`
//   2. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your env
//   3. The client below picks them up automatically.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && key);

export type SupabaseLike = {
  from: (table: string) => any;
} | null;

let client: SupabaseLike = null;

if (supabaseEnabled) {
  try {
    // Lazy require so the build doesn't fail if the package isn't installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(url!, key!);
  } catch {
    client = null;
  }
}

export const supabase = client;

// Demo IDs from supabase/migrations/20260418120000_init.sql seed
export const DEMO_CIRCLE_ID = '00000000-0000-0000-0000-0000000000aa';
export const DEMO_PATIENT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_PARTNER_ID = '00000000-0000-0000-0000-000000000002';
