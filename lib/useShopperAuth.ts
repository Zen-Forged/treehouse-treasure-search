// lib/useShopperAuth.ts
// R1 Arc 3 — shopper auth-state hook per design record D5 + D14 + D16.
//
// Source of truth for "is this user a signed-in shopper?" across the app:
//   - Masthead profile bubble swap (initials vs CircleUser glyph)
//   - Sync-your-finds footer on the Saved tab (guest-only)
//   - Future: /me page hydration (Arc 3 currently mocks; Arc 3 last commit
//     or Arc 4 wires real data — same hook either way)
//   - Future: useShopperSaves() in Arc 4 composes with this for hybrid read
//
// State shape:
//   isLoading — initial Supabase session check pending
//   isAuthed  — any auth session, even without a shoppers row (e.g. a
//               vendor user who hasn't claimed shopper identity). Distinct
//               from `shopper !== null` because routing decisions differ:
//               an authed user with no shopper row should be sent through
//               the claim flow, not a sign-in screen.
//   shopper   — null if no shoppers row, populated with identity fields
//               otherwise. handle drives initials; created_at backs the
//               "scouting since" eyebrow on /me.
//
// Lifecycle: subscribes to onAuthChange so sign-in / sign-out reflects
// reactively across consumers without a manual refresh. The shoppers
// row fetch re-runs on every auth state change so a fresh sign-in's
// claim flow picks up the new row.

"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { supabase }      from "./supabase";
import { onAuthChange }  from "./auth";
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

    async function loadShopper(userId: string) {
      const { data: row, error } = await supabase
        .from("shoppers")
        .select("id, handle, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        // RLS denies anon reads, but an authed user with a session and
        // their own row should always succeed. Log + treat as no-shopper
        // so the user lands in the claim flow rather than a black box.
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
      } else {
        commit({ isLoading: false, isAuthed: true, shopper: null });
      }
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
