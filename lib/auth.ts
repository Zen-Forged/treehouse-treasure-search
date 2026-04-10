// lib/auth.ts
// Lightweight anonymous auth for vendor identity.
// Uses Supabase Auth anonymous sign-in to create a stable device-level session.
// The resulting user.id is stored in localStorage alongside the vendor profile
// and linked to the vendor row in Supabase (vendors.user_id).
//
// This replaces the localStorage vendor_id comparison for owner detection
// with a proper session-based check — harder to spoof, survives page refresh.
//
// Cross-device auth (multiple devices, one vendor) is NOT in scope yet.
// The session persists as long as Supabase's cookie lives (~1 week by default).

import { supabase } from "./supabase";

const SESSION_USER_KEY = "treehouse_auth_uid";

/**
 * Ensure an anonymous Supabase Auth session exists for this device.
 * Returns the user.id (UUID) or null if auth is unavailable.
 *
 * Safe to call multiple times — returns existing session if already signed in.
 */
export async function ensureAnonSession(): Promise<string | null> {
  try {
    // Check for existing session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Cache in localStorage for fast synchronous reads
      try { localStorage.setItem(SESSION_USER_KEY, session.user.id); } catch {}
      return session.user.id;
    }

    // No session — sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user?.id) {
      console.warn("[auth] signInAnonymously failed:", error?.message);
      return null;
    }

    try { localStorage.setItem(SESSION_USER_KEY, data.user.id); } catch {}
    return data.user.id;
  } catch (err) {
    console.warn("[auth] ensureAnonSession error:", err);
    return null;
  }
}

/**
 * Get the current session user ID synchronously from localStorage cache.
 * Returns null if no session has been established yet.
 * Use ensureAnonSession() to guarantee a session exists.
 */
export function getCachedUserId(): string | null {
  try { return localStorage.getItem(SESSION_USER_KEY); } catch { return null; }
}

/**
 * Check if the current session owns a vendor row.
 * Used in find detail to gate owner controls without an extra Supabase query.
 * Falls back to localStorage vendor_id comparison for backwards compatibility.
 */
export async function isSessionOwner(postVendorUserId: string | null | undefined): Promise<boolean> {
  if (!postVendorUserId) return false;

  // Try session check first
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id === postVendorUserId;
    }
  } catch {}

  return false;
}
