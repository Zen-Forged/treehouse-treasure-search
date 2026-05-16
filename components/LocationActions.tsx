// components/LocationActions.tsx
// R17 Arc 1 — single full-width "Take the Trip" CTA composing useUserLocation +
// native maps deep link + R3 analytics events.
//
// Hides entirely when:
//   - mallLat or mallLng is null (D15 — defensive null-check)
//   - useUserLocation().status !== "granted" (D4 — silent failure on
//     denial; consumer doesn't see any prompt-promotion UI)
//
// CTA shape:
//   - Single full-width button, 44px height, 8px radius
//   - Filled: "Take the Trip" + Lucide <Navigation> 16px → native maps deep-link
//
// Session 134 — "View on Find Map" Browse button retired across all
// LocationActions consumers (/find/[id] + /shelf/[slug] + /geolocation-test).
// David's call: "Remove from all except /map." /map's PinCallout uses an
// inline Browse + Go pair (not LocationActions), unaffected. Original
// twin-button shape from session 117 D9+D10 is now half-width-twin →
// full-width-single. The Browse half was redundant by R17 Arc 2: from
// /find/[id] the user can already tap the booth/mall card to reach
// /shelf/[slug], and from /shelf/[slug] the user is already at the booth
// — there's nowhere to "browse to" that the surrounding chrome doesn't
// already provide. The Take the Trip half (native-maps deep-link) was always
// the only LocationActions affordance you couldn't reach any other way.
//
// Reverses R17 Arc 1 D9 + D10 (twin-button shape) per
// feedback_surface_locked_design_reversals — David acknowledged the
// reversal at session-134 triage Q3 ("Remove from all except /map").
//
// Copy evolution: "Navigate" → "Take Trip" (session 134, commit 4) →
// "Take the Trip" (session 169 Review Board Saved #1 — vocabulary
// unification with SavedMallCardV2's CTA; David: "change 'Find your
// way' to 'Take the Trip'"). Article-bearing form reads as a fuller
// invitation in user posture, not affordance description.
//
// Analytics fired on tap (D21):
//   - "find_navigate_tapped" → { surface, mall_slug, vendor_id, post_id }
//     (event name preserved per feedback_user_facing_copy_scrub_skip_db_identifiers
//     — event keys are internal identifiers; only user-facing button text changed)
//
// "find_view_on_map_tapped" event type kept in lib/clientEvents.ts —
// /map's PinCallout still fires it for its inline Browse pill.
//
// "Take the Trip" uses window.location.href to trigger the iOS scheme since
// router.push won't handle maps://. Keeps the user on the page if the
// scheme silently fails (Apple Maps almost never does on iOS).

"use client";

import * as React from "react";
import { Navigation } from "lucide-react";
import { useUserLocation } from "@/lib/useUserLocation";
import { navigateUrl }     from "@/lib/mapsDeepLink";
import { track }           from "@/lib/clientEvents";
import { v2, FONT_INTER }  from "@/lib/tokens";

export interface LocationActionsProps {
  mallSlug: string | null;
  mallLat:  number | null;
  mallLng:  number | null;
  /** Used in analytics event payload. */
  surface:  "find" | "booth";
  postId?:   string | null;
  vendorId?: string | null;
}

export default function LocationActions({
  mallSlug,
  mallLat,
  mallLng,
  surface,
  postId   = null,
  vendorId = null,
}: LocationActionsProps) {
  const loc = useUserLocation();

  if (mallLat == null || mallLng == null || mallSlug == null) return null;
  if (loc.status !== "granted") return null;

  const onTakeTrip = () => {
    track("find_navigate_tapped", {
      surface,
      mall_slug: mallSlug,
      vendor_id: vendorId,
      post_id:   postId,
    });
    window.location.href = navigateUrl(mallLat, mallLng);
  };

  return (
    <button
      type="button"
      onClick={onTakeTrip}
      style={{
        width:          "100%",
        background:     v2.accent.greenMid,
        color:          "#fff",
        border:         "none",
        borderRadius:   10,
        padding:        10,
        fontFamily:     FONT_INTER,
        fontSize:       11,
        fontWeight:     600,
        letterSpacing:  "0.12em",
        textTransform:  "uppercase",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            8,
        cursor:         "pointer",
      }}
    >
      <Navigation size={14} strokeWidth={2.2} aria-hidden />
      Take the Trip
    </button>
  );
}
