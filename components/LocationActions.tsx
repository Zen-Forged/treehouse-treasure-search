// components/LocationActions.tsx
// R17 Arc 1 — twin-button row composing useUserLocation + native maps deep
// link + R3 analytics events.
//
// Hides entirely when:
//   - mallLat or mallLng is null (D15 — defensive null-check)
//   - useUserLocation().status !== "granted" (D4 — silent failure on
//     denial; consumer doesn't see any prompt-promotion UI)
//
// CTA shape (D9 + D10):
//   - Twin buttons, equal width (flex: 1), 10px gap, 44px height, 8px radius
//   - Outline left:  "View on Find Map" + Lucide <Map> 16px → /map?mall=<slug>
//   - Filled right:  "Navigate"         + Lucide <Navigation> 16px → deep-link
//
// Analytics fired on tap (D21):
//   - "find_view_on_map_tapped" → { surface, mall_slug, vendor_id, post_id }
//   - "find_navigate_tapped"    → { surface, mall_slug, vendor_id, post_id }
//
// "Navigate" uses window.location.href to trigger the iOS scheme since
// router.push won't handle maps://. Keeps the user on the page if the
// scheme silently fails (Apple Maps almost never does on iOS).

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Map, Navigation } from "lucide-react";
import { useUserLocation } from "@/lib/useUserLocation";
import { navigateUrl }     from "@/lib/mapsDeepLink";
import { track }           from "@/lib/clientEvents";
import { v1, FONT_SYS }    from "@/lib/tokens";

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
  const router = useRouter();
  const loc    = useUserLocation();

  if (mallLat == null || mallLng == null || mallSlug == null) return null;
  if (loc.status !== "granted") return null;

  const payload = {
    surface,
    mall_slug: mallSlug,
    vendor_id: vendorId,
    post_id:   postId,
  };

  const onViewOnMap = () => {
    track("find_view_on_map_tapped", payload);
    router.push(`/map?mall=${encodeURIComponent(mallSlug)}`);
  };

  const onNavigate = () => {
    track("find_navigate_tapped", payload);
    window.location.href = navigateUrl(mallLat, mallLng);
  };

  return (
    <div
      style={{
        display: "flex",
        gap:     10,
        width:   "100%",
      }}
    >
      <button
        type="button"
        onClick={onViewOnMap}
        style={{
          flex:           1,
          height:         44,
          borderRadius:   8,
          background:     "transparent",
          border:         `1px solid ${v1.green}`,
          color:          v1.green,
          fontFamily:     FONT_SYS,
          fontSize:       13,
          fontWeight:     600,
          letterSpacing:  "0.01em",
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            6,
          cursor:         "pointer",
          padding:        0,
        }}
      >
        <Map size={16} strokeWidth={2} aria-hidden />
        View on Find Map
      </button>

      <button
        type="button"
        onClick={onNavigate}
        style={{
          flex:           1,
          height:         44,
          borderRadius:   8,
          background:     v1.green,
          border:         `1px solid ${v1.green}`,
          color:          v1.onGreen,
          fontFamily:     FONT_SYS,
          fontSize:       13,
          fontWeight:     600,
          letterSpacing:  "0.01em",
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            6,
          cursor:         "pointer",
          padding:        0,
          boxShadow:      v1.shadow.ctaGreenCompact,
        }}
      >
        <Navigation size={16} strokeWidth={2} aria-hidden />
        Navigate
      </button>
    </div>
  );
}
