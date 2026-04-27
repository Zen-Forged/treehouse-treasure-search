// lib/adminAuth.ts
// Server-side auth helpers for API routes.
//
// Pattern (Option B): client passes the Supabase access token in the
// `Authorization: Bearer <token>` header. Server validates the token with the
// service role client via `auth.getUser(token)` and checks admin email.
//
// This keeps admin-only API routes honestly gated on the server (not just UI),
// without adding @supabase/ssr or a cookie bridge.
//
// Used by:
//   /api/admin/posts            — requireAdmin
//   /api/admin/vendor-requests  — requireAdmin
//   /api/setup/lookup-vendor    — requireAuth (any signed-in user)
//
// Frontend helper: `authFetch()` in lib/authFetch.ts attaches the token.

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Build a Supabase client using the service role key.
 * Bypasses RLS — only use in server routes after auth checks.
 *
 * ─── Next.js data-cache opt-out (session 73, R3 stale-data fix) ─────────
 * Pass cache: "no-store" on every underlying fetch via supabase-js's
 * global.fetch hook. Without this, Next.js's HTTP-level data cache
 * intercepts every PostgREST request keyed on URL+method+headers, and
 * since supabase-js sends identical requests, the cache returns the
 * SAME stale snapshot indefinitely (~25–78 min observed). The route's
 * `export const dynamic = "force-dynamic"` only disables caching of the
 * route RESPONSE, not of fetches happening inside the route.
 *
 * Diagnosed via /api/admin/events vs /api/admin/events-raw side-by-side:
 * the raw probe (which set cache: "no-store" explicitly) returned fresh
 * data while the supabase-js path returned a 78-min-old snapshot at the
 * same instant. R3 design record §Amendment v1.2 carries the full write-up.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * Extract the bearer token from an Authorization header.
 * Returns null if absent or malformed.
 */
function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export type AuthResult =
  | { ok: true; user: User; service: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Require any authenticated user.
 * Returns the service client + the validated user on success.
 * Returns a ready-to-return NextResponse on failure.
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const service = getServiceClient();
  if (!service) {
    console.error("[requireAuth] service client unavailable — missing env vars?");
    return {
      ok: false,
      response: NextResponse.json({ error: "Service unavailable." }, { status: 503 }),
    };
  }

  const token = getBearerToken(req);
  if (!token) {
    const hasHeader = !!(req.headers.get("authorization") ?? req.headers.get("Authorization"));
    console.error(
      `[requireAuth] no bearer token. header present: ${hasHeader}. ` +
      `method: ${req.method}. url: ${req.url}`,
    );
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data, error } = await service.auth.getUser(token);
  if (error || !data?.user) {
    console.error(
      `[requireAuth] getUser rejected token. ` +
      `token length: ${token.length}. ` +
      `token prefix: ${token.slice(0, 12)}…. ` +
      `error: ${error?.message ?? "no user returned"}`,
    );
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true, user: data.user, service };
}

/**
 * Require the admin user (email matches NEXT_PUBLIC_ADMIN_EMAIL).
 * Returns the service client + the validated admin user on success.
 * Returns a ready-to-return NextResponse on failure (401 or 403).
 */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const userEmail = auth.user.email ?? "";
  if (!adminEmail || userEmail.toLowerCase() !== adminEmail.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return auth;
}
