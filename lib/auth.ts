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
