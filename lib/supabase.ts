// lib/supabase.ts
// Supabase browser client.
// NEXT_PUBLIC_ vars are embedded at build time in the client bundle,
// so they're always present when this runs in the browser.
// For server-side prerendering, pages that use Supabase must opt out
// of static generation with `export const dynamic = "force-dynamic"`.

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
