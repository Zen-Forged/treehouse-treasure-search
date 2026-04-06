// lib/supabase.ts
// Supabase client — browser instance (safe for "use client" components).
// Lazy-initialized so the client is never instantiated at build/prerender time,
// which would throw when NEXT_PUBLIC_ env vars are absent in the build environment.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to .env.local and Vercel environment variables."
    );
  }

  _client = createClient(url, anon);
  return _client;
}

// Convenience proxy — maintains the existing `supabase.from(...)` call pattern
// throughout the codebase without requiring a mass rename.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as never)[prop];
  },
});
