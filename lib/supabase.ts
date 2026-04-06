// lib/supabase.ts
// Supabase browser client.
// Guards against missing env vars at build time — Next.js bundles and evaluates
// this module during static generation even for "use client" pages.
// createClient throws if given an empty URL, so we fall back to a placeholder
// that satisfies the constructor. All real data fetching happens in the browser
// where NEXT_PUBLIC_ vars are always present.

import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (
  process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === undefined
) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Add them to .env.local and Vercel environment variables."
  );
}

export const supabase = createClient(url, anon);
