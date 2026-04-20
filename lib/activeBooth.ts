// lib/activeBooth.ts
// Active-booth resolver — session 35 (multi-booth rework, Option A).
//
// Purpose: a single auth user can own N vendor rows after migration 006
// drops vendors_user_id_key. Surfaces that need "which booth are we
// operating as right now" (/my-shelf render, /post/preview identity,
// post-approval /setup landing) go through this module.
//
// Storage: `treehouse_active_vendor_id` in safeStorage (localStorage with
// sessionStorage + in-memory fallback for Safari ITP safety). Value is the
// Supabase vendors.id UUID string, or null/missing when unset.
//
// Design contract (approved session 34 mockup):
//   - Single-booth vendor (vendors.length === 1): resolver returns that row,
//     caller renders the existing /my-shelf chrome unchanged. No picker, no
//     masthead chevron.
//   - Multi-booth vendor (vendors.length > 1): caller renders the "Viewing ·
//     Name ▾" masthead affordance + <BoothPickerSheet>. Tapping a row calls
//     setActiveBoothId + re-reads.
//   - Empty (vendors.length === 0): returns null. Caller renders <NoBooth>.
//
// The resolver is deterministic: if the stored ID matches nothing in the
// passed list, it falls back to vendors[0] (which by getVendorsByUserId's
// `created_at ASC` contract is the oldest-approved booth) AND rewrites
// storage to match. That prevents the picker from pointing at a booth that
// was removed, renamed, or transferred.

"use client";

import { safeStorage } from "./safeStorage";
import type { Vendor } from "@/types/treehouse";

export const ACTIVE_BOOTH_KEY = "treehouse_active_vendor_id";

/**
 * Read the currently-stored active booth vendor ID, or null if unset.
 * Returns a UUID string; callers should validate against their vendor list
 * before rendering anything. Prefer `resolveActiveBooth` over calling this
 * directly when you also have the vendor list in hand.
 */
export function getActiveBoothId(): string | null {
  return safeStorage.getItem(ACTIVE_BOOTH_KEY);
}

/**
 * Persist the active booth vendor ID. Called by:
 *   - <BoothPickerSheet> onSelect — vendor explicitly switches booths
 *   - resolveActiveBooth — first-visit or stale-id recovery (writes vendors[0].id)
 *   - /setup success — writes vendors[0].id before the 3-second redirect
 */
export function setActiveBoothId(vendorId: string): void {
  safeStorage.setItem(ACTIVE_BOOTH_KEY, vendorId);
}

/**
 * Clear the active booth ID. Called on sign-out so the next user on the
 * device doesn't inherit the previous user's active-booth preference.
 */
export function clearActiveBoothId(): void {
  safeStorage.removeItem(ACTIVE_BOOTH_KEY);
}

/**
 * Resolve the active booth from a list of vendor rows.
 *
 * Contract:
 *   1. If vendors is empty → return null. Storage is cleared so a future
 *      sign-in starts fresh.
 *   2. If a stored ID matches any row → return that row.
 *   3. Otherwise → return vendors[0] and rewrite storage to vendors[0].id
 *      (self-healing fallback for stale or missing storage).
 *
 * The caller passes the full list so this module never makes a network
 * call itself; every resolution is deterministic given the same inputs.
 */
export function resolveActiveBooth(vendors: Vendor[]): Vendor | null {
  if (vendors.length === 0) {
    clearActiveBoothId();
    return null;
  }

  const storedId = getActiveBoothId();
  if (storedId) {
    const match = vendors.find(v => v.id === storedId);
    if (match) return match;
  }

  // Stale or missing stored ID — fall back to the oldest-approved booth
  // (vendors[0] by the `created_at ASC` contract) and persist so the picker
  // and any subsequent read converge on the same choice.
  const fallback = vendors[0];
  setActiveBoothId(fallback.id);
  return fallback;
}
