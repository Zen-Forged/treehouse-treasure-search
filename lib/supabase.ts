// lib/supabase.ts
// Supabase client — browser instance (safe for "use client" components).
// Reads from NEXT_PUBLIC_ env vars which are embedded at build time.

import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anon) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Add them to .env.local and Vercel environment variables."
  );
}

export const supabase = createClient(url, anon);
