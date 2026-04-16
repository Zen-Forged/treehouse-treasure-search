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
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
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
    return {
      ok: false,
      response: NextResponse.json({ error: "Service unavailable." }, { status: 503 }),
    };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data, error } = await service.auth.getUser(token);
  if (error || !data?.user) {
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
