// lib/useShopperAuth.ts
// R1 Arc 3 — shopper auth-state hook per design record D5 + D14 + D16.
//
// Source of truth for "is this user a signed-in shopper?" across the app:
//   - Masthead profile bubble swap (initials vs CircleUser glyph)
//   - Sync-your-finds footer on the Saved tab (guest-only)
//   - /me page hydration (R1 Arc 4 wired session 112)
//   - useShopperSaves() / useShopperBoothBookmarks() compose with this
//     for hybrid local/remote read
//
// State shape:
//   isLoading — initial Supabase session check pending OR silent auto-claim
//               in flight (session 184 — keeps consumers from flashing
//               guest chrome while the shopper row is being created server-side)
//   isAuthed  — any auth session, even without a shoppers row. Distinct
//               from `shopper !== null` during the brief auto-claim window
//               and during recovery from a claim that failed.
//   shopper   — null if no shoppers row, populated with identity fields
//               otherwise. handle drives initials; created_at backs the
//               "scouting since" eyebrow on /me.
//
// Lifecycle: subscribes to onAuthChange so sign-in / sign-out reflects
// reactively across consumers without a manual refresh. The shoppers
// row fetch re-runs on every auth state change so a fresh sign-in's
// claim flow picks up the new row.
//
// Session 184 — handle retirement + silent auto-claim:
//   The explicit /login/email/handle picker page retired. Users no longer
//   pick a handle as a separate step; on first sign-in (or first call from
//   a vendor/admin who's never had a shopper row), this hook silently POSTs
//   to /api/shopper-claim with a handle derived from the email local-part
//   via suggestHandleFromEmail(). The endpoint is idempotent + race-safe;
//   the module-scope autoClaimPromise dedupes across concurrent useShopperAuth
//   consumer mounts (Masthead + /me + /flagged footer all subscribe at once
//   on warm nav). loadShopper re-queries after claim resolves so the
//   committed state lands populated. The handle is preserved DB-side per
//   feedback_user_facing_copy_scrub_skip_db_identifiers ✅ Promoted — the
//   shoppers.handle column + UNIQUE constraint stay; only the user-facing
//   picker UI + @handle display retire.

"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { supabase }      from "./supabase";
import { onAuthChange }  from "./auth";
import { authFetch }     from "./authFetch";
import { loadFollowedIds, loadBookmarkedBoothIds } from "./utils";
import { isReviewMode }  from "./reviewMode";
import { FIXTURE_SHOPPER } from "./fixtures";

export interface ShopperIdentity {
  shopperId:     string;
  handle:        string;
  initials:      string;  // 2 uppercase chars derived from handle
  scoutingSince: string;  // ISO timestamp from shoppers.created_at
}

export interface ShopperAuthState {
  isLoading: boolean;
  isAuthed:  boolean;
  shopper:   ShopperIdentity | null;
}

/**
 * Derive 2-char display initials from a shopper handle. Per design record
 * D11. Falls back to "??" only on empty/invalid input — every claimed
 * handle satisfies the CHECK constraint so the fallback never hits in
 * production.
 */
export function initialsFromHandle(handle: string): string {
  const cleaned = handle.replace(/[^a-z0-9]/gi, "");
  if (cleaned.length === 0) return "??";
  return cleaned.slice(0, 2).toUpperCase();
}

const INITIAL_STATE: ShopperAuthState = {
  isLoading: true,
  isAuthed:  false,
  shopper:   null,
};

// Session 168 round 5 finding 3 — module-scope cache mirrors the
// cachedRoleState pattern in lib/useUserRole.ts (round 5) and the
// cachedAuthUser pattern in app/my-shelf/page.tsx (round 4). Suppresses
// the MastheadProfileButton glyph→initials flash on warm nav between
// (tabs)/ surfaces — every consumer re-mount used to start at
// INITIAL_STATE (isLoading: true / no shopper) and flash CircleUser
// before the shoppers fetch settled.
let cachedShopperAuthState: ShopperAuthState | null = null;

// Session 184 handle retirement — module-scope auto-claim promise dedupes
// across concurrent useShopperAuth consumer mounts. The first instance to
// detect "authed + no shopper row" fires the POST; sibling instances await
// the same promise instead of POSTing again. Stays resolved for the page
// lifetime; next page load gets a fresh chance to retry if the first claim
// failed (the endpoint is idempotent so the retry is safe).
let autoClaimPromise: Promise<void> | null = null;

/**
 * Derive a handle from the email local-part. Mirrors the suggestion logic
 * that lived in the retired /login/email/handle picker (deleted session 184).
 * Strips non-alphanumeric, collapses hyphens, trims, falls back to a
 * scout-XXXX synthetic handle if the cleaned local-part is shorter than 3
 * chars. The output always satisfies the HANDLE_RE on /api/shopper-claim.
 */
function suggestHandleFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").toLowerCase();
  const cleaned = local
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (cleaned.length >= 3) return cleaned.slice(0, 32);
  const r = Math.random().toString(36).slice(2, 6);
  return `scout-${r}`;
}

/**
 * Silently POST to /api/shopper-claim with an auto-derived handle + any
 * pending localStorage saves/booth-bookmarks to migrate. Deduped via
 * autoClaimPromise so concurrent useShopperAuth consumers don't fire
 * redundant POSTs. Soft-fails on error — the next page load retries.
 */
async function autoClaimSilently(email: string): Promise<void> {
  if (autoClaimPromise) return autoClaimPromise;
  autoClaimPromise = (async () => {
    try {
      const handle = suggestHandleFromEmail(email);
      const savedPostIds        = Array.from(loadFollowedIds());
      const bookmarkedVendorIds = Array.from(loadBookmarkedBoothIds());
      const res = await authFetch("/api/shopper-claim", {
        method: "POST",
        body:   JSON.stringify({ handle, savedPostIds, bookmarkedVendorIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[useShopperAuth] auto-claim failed:", data);
      }
    } catch (e) {
      console.error("[useShopperAuth] auto-claim error:", e);
    }
  })();
  return autoClaimPromise;
}

export function useShopperAuth(): ShopperAuthState {
  const [state, setState] = useState<ShopperAuthState>(cachedShopperAuthState ?? INITIAL_STATE);

  // Review Board (session 150) — fixture-substitute. Hydrate state
  // synchronously before paint so /me + /login auth-gate redirects
  // never fire on reviewMode iframes. Skips the Supabase session
  // subscription below.
  useLayoutEffect(() => {
    if (!isReviewMode()) return;
    setState({
      isLoading: false,
      isAuthed:  true,
      shopper: {
        shopperId:     FIXTURE_SHOPPER.user_id,
        handle:        FIXTURE_SHOPPER.handle,
        initials:      initialsFromHandle(FIXTURE_SHOPPER.handle),
        scoutingSince: FIXTURE_SHOPPER.scouting_since,
      },
    });
  }, []);

  useEffect(() => {
    if (isReviewMode()) return; // fixture state populated above
    let cancelled = false;

    // Single settle point so cache + React state stay in lockstep.
    function commit(next: ShopperAuthState) {
      cachedShopperAuthState = next;
      setState(next);
    }

    async function loadShopper(userId: string, isRetry = false) {
      const { data: row, error } = await supabase
        .from("shoppers")
        .select("id, handle, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        // RLS denies anon reads, but an authed user with a session and
        // their own row should always succeed. Log + treat as no-shopper
        // so consumers stay in a known state.
        console.error("[useShopperAuth] fetch:", error.message);
        commit({ isLoading: false, isAuthed: true, shopper: null });
        return;
      }
      if (row) {
        commit({
          isLoading: false,
          isAuthed:  true,
          shopper: {
            shopperId:     row.id,
            handle:        row.handle,
            initials:      initialsFromHandle(row.handle),
            scoutingSince: row.created_at,
          },
        });
        return;
      }
      // No shopper row. Session 184 handle retirement — fire silent
      // auto-claim instead of stranding the user (the explicit handle
      // picker page /login/email/handle was retired this session).
      if (isRetry) {
        // Already tried claiming + still no row → endpoint failed. Render
        // authed-no-shopper state so caller surfaces a fallback path.
        // Next page load will retry (the deduped autoClaimPromise resets
        // on full page reload, not on warm nav).
        commit({ isLoading: false, isAuthed: true, shopper: null });
        return;
      }
      // Hold isLoading: true during the claim window so consumers don't
      // flash guest chrome (CircleUser glyph instead of initials in the
      // masthead; "Sync your finds" sync footer on /flagged). The claim
      // typically resolves in ~150–400ms (1 service-role INSERT + 1-2
      // bulk-migrate writes).
      commit({ isLoading: true, isAuthed: true, shopper: null });
      const { data: sessData } = await supabase.auth.getSession();
      const user = sessData.session?.user;
      if (!user?.email) {
        commit({ isLoading: false, isAuthed: true, shopper: null });
        return;
      }
      await autoClaimSilently(user.email);
      if (cancelled) return;
      loadShopper(userId, true);
    }

    // Initial session check.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) {
        loadShopper(data.session.user.id);
      } else {
        commit({ isLoading: false, isAuthed: false, shopper: null });
      }
    });

    // Reactive subscription — sign-in / sign-out / token refresh.
    const unsub = onAuthChange((user) => {
      if (cancelled) return;
      if (user) {
        loadShopper(user.id);
      } else {
        commit({ isLoading: false, isAuthed: false, shopper: null });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return state;
}
