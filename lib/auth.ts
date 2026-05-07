// lib/auth.ts
// Supabase Auth — magic link (OTP) based authentication.
// Three tiers: unauth (browse only), vendor (one booth), admin (full access).
//
// Admin is determined by email match against NEXT_PUBLIC_ADMIN_EMAIL.
// Sessions persist across browser restarts (Supabase default with pkce flow).
//
// Key exports:
//   sendMagicLink(email, redirectTo?) — sends OTP email, returns { error }
//   getSession()              — returns current Supabase session or null
//   getUser()                 — returns current user or null
//   signOut()                 — clears session
//   isAdmin(user?)            — true if user email matches NEXT_PUBLIC_ADMIN_EMAIL
//   getCachedUserId()         — sync read from localStorage (for owner detection)
//   onAuthChange(cb)          — subscribe to auth state changes

import { supabase } from "./supabase";
import { authFetch } from "./authFetch";
import { LOCAL_VENDOR_KEY } from "@/types/treehouse";
import type { Session, User } from "@supabase/supabase-js";

const SESSION_USER_KEY = "treehouse_auth_uid";
const ADMIN_EMAIL      = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

// ── Magic link ────────────────────────────────────────────────────────────────

/**
 * Send a magic link OTP to the given email.
 * Supabase emails a 6-digit code + link. On click/entry the user is signed in.
 *
 * The redirect URL always lands back on /login?confirmed=1 (where the post-auth
 * polling loop lives). If `redirectTo` is provided, it is appended as a `next`
 * query param so /login can forward the user after confirmation completes.
 * /login validates `next` is a safe same-origin relative path before following it.
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string,
): Promise<{ error: string | null }> {
  const base = getBaseUrl();
  const confirmUrl = redirectTo
    ? `${base}/login?confirmed=1&next=${encodeURIComponent(redirectTo)}`
    : `${base}/login?confirmed=1`;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: confirmUrl,
      shouldCreateUser: true,
    },
  });
  if (error) {
    console.error("[auth] sendMagicLink:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

// ── Session helpers ───────────────────────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      try { localStorage.setItem(SESSION_USER_KEY, session.user.id); } catch {}
    }
    return session;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_USER_KEY);
    // Session 50: also clear the vendor-profile cache. It was previously
    // left behind on sign-out, which let a stale `vendor_id` match in
    // Find Detail's `detectOwnershipAsync` path 3 grant the edit pencil
    // to a guest user viewing their own prior post.
    localStorage.removeItem(LOCAL_VENDOR_KEY);
  } catch {}
}

/**
 * Subscribe to auth state changes (sign in / sign out).
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    if (user?.id) {
      try { localStorage.setItem(SESSION_USER_KEY, user.id); } catch {}
    } else {
      try { localStorage.removeItem(SESSION_USER_KEY); } catch {}
    }
    callback(user);
  });
  return () => subscription.unsubscribe();
}

// ── Admin check ───────────────────────────────────────────────────────────────

/**
 * Returns true if the given user (or current session user) is the admin.
 * Admin is determined by email match against NEXT_PUBLIC_ADMIN_EMAIL.
 */
export function isAdmin(user: User | null): boolean {
  if (!user?.email || !ADMIN_EMAIL) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// ── Role detection ───────────────────────────────────────────────────────────

export type UserRole = "admin" | "vendor" | "shopper" | "none";

/**
 * Resolve the user's primary role for post-sign-in routing decisions.
 *
 * Precedence: admin → vendor → shopper → none. Admin precedence wins because
 * admins manage the platform regardless of their own booth/account state.
 * Vendor precedence over shopper because vendors who also shop expect to
 * land on /my-shelf after sign-in (existing muscle memory); the shopper
 * destination /me is reachable via the masthead bubble afterward.
 *
 * Returns "none" if both DB queries fail (or user is null) so the caller's
 * fall-through path can preserve existing first-time-signup behavior
 * (typically /my-shelf) rather than leaving the user on the form.
 *
 * Single round trip: vendors + shoppers queried in parallel. Both are
 * indexed on user_id (UNIQUE on shoppers, UNIQUE on vendors) so each is a
 * single-row fetch. RLS allows authed user to read their own row in both
 * tables; the migration-020 partial-paste fix shipped session 113 sealed
 * shoppers' SELECT policy.
 */
export async function detectUserRole(user: User | null): Promise<UserRole> {
  if (!user) return "none";
  if (isAdmin(user)) return "admin";

  const [vendorRes, shopperRes] = await Promise.all([
    supabase.from("vendors") .select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("shoppers").select("id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (vendorRes.data)  return "vendor";
  if (shopperRes.data) return "shopper";
  return "none";
}

/**
 * Try to claim approved-but-unlinked vendor rows for the current user.
 *
 * Why this exists: admin approval at /api/admin/vendor-requests inserts
 * vendors rows with user_id=NULL. Linking happens later via
 * /api/setup/lookup-vendor (composite-key match on mall_id + booth_number
 * against the user's vendor_requests). Without this call, an
 * approved-but-unclaimed vendor's first sign-in falls through detectUserRole
 * to "none" and lands on /welcome with no path to their booth.
 *
 * Idempotent — the endpoint guards on `.is("user_id", null)` so repeated
 * calls are safe. Returns true only when rows were just newly linked, so
 * callers can decide whether to re-detect role.
 */
export async function tryAutoClaimVendorRows(): Promise<boolean> {
  try {
    const res = await authFetch("/api/setup/lookup-vendor", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null) as
      | { vendors?: unknown[]; alreadyLinked?: boolean }
      | null;
    return Array.isArray(data?.vendors)
      && data.vendors.length > 0
      && !data.alreadyLinked;
  } catch {
    return false;
  }
}

/**
 * detectUserRole with first-sign-in auto-claim retry.
 *
 * Routing surfaces (/login pickDest, /welcome mount) call this so an
 * approved-but-unclaimed vendor lands on /my-shelf instead of /welcome.
 * Pure `detectUserRole` (used by chrome like BottomNav) stays side-effect
 * free — it fires on every mount and shouldn't trigger network claims.
 *
 * Auto-claim fires for both "none" AND "shopper" — a user who picked a
 * handle at /login/email/handle in a prior session and was later approved
 * as a vendor must still get linked. Vendor precedence over shopper is
 * already encoded in detectUserRole's contract.
 */
export async function detectUserRoleWithAutoClaim(user: User | null): Promise<UserRole> {
  if (!user) return "none";
  const role = await detectUserRole(user);
  if (role === "admin" || role === "vendor") return role;
  const claimed = await tryAutoClaimVendorRows();
  if (!claimed) return role;
  return await detectUserRole(user);
}

// ── Sync helpers (for owner detection without async) ─────────────────────────

/**
 * Sync read of the cached user ID from localStorage.
 * Populated by getSession() / onAuthChange(). Use for owner detection.
 */
export function getCachedUserId(): string | null {
  try { return localStorage.getItem(SESSION_USER_KEY); } catch { return null; }
}

// ── Legacy anon session (no-op — kept so import sites don't break) ────────────

/** @deprecated Use getSession() instead. No-op stub for backwards compatibility. */
export async function ensureAnonSession(): Promise<string | null> {
  return (await getSession())?.user?.id ?? null;
}

// ── Internal ──────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://treehouse-treasure-search.vercel.app";
}
