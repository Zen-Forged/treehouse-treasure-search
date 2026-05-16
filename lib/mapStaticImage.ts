// lib/mapStaticImage.ts
// Mapbox Static Images API URL composer — produces a CDN-cached PNG
// for use as a non-interactive map snapshot (<img src={...} />) without
// the GL JS runtime cost.
//
// Used by /find/[id]'s cartographic block (session 169 round 2): a tap-
// able snapshot under the mall/booth card that links to /map?mall=<slug>
// for full spatial wayfinding. Cheaper than mounting TreehouseMap mini-
// embeds on every detail page (no map runtime, no tile lifecycle, no
// resize observer).
//
// Token: NEXT_PUBLIC_MAPBOX_TOKEN (shared with TreehouseMap; see
// components/TreehouseMap.tsx file-top for token plumbing notes).
//
// Operational gap (session 156 carry, 16-session carry): Mapbox token
// URL restrictions allowlist `app.kentuckytreehouse.com + localhost`
// only. Preview deployments at *.vercel.app will fail tile fetches
// silently (consumer-side `onError` fallback in /find/[id] handles
// graceful degradation). Production-PWA QA is the authoritative
// validation surface until a preview-only token gets provisioned.
//
// Style: mapbox/light-v11 (same base as TreehouseMap; the runtime
// palette overrides in TreehouseMap don't apply here, so static
// snapshots render at the Mapbox default light-v11 palette — that's
// acceptable for a small thumbnail; the brand-cream cartographic
// vocabulary lives on /map proper).

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// v2.accent.green (#1F4A31) per session 168 unified greens. Encoded as
// 6-char hex without the leading "#" per the Mapbox marker query format.
const PIN_COLOR_HEX = "1f4a31";

/**
 * Compose a Mapbox Static Images URL for a single-pin snapshot.
 *
 * @param lng           Mall longitude (e.g. -85.7585)
 * @param lat           Mall latitude  (e.g. 38.2527)
 * @param widthPx       Logical pixel width  (CSS px; multiplied 2× for retina)
 * @param heightPx      Logical pixel height (CSS px; multiplied 2× for retina)
 * @param zoom          Map zoom level (Mapbox 0–22; 12–14 reads well for a
 *                      "this is the neighborhood" snapshot at small dimensions)
 * @returns Fully-qualified Mapbox Static Images URL, or empty string if the
 *          token isn't plumbed (caller should branch on `if (!url) return null`
 *          to render a graceful fallback).
 */
export function mallSnapshotUrl(
  lng: number,
  lat: number,
  widthPx: number,
  heightPx: number,
  zoom = 13,
): string {
  if (!MAPBOX_TOKEN) return "";
  // Marker overlay: `pin-l-<icon>+<color>(<lng>,<lat>)` — `pin-l` = large
  // marker; no inner icon means the marker renders as a solid teardrop
  // (matches LeafBubblePin's silhouette in spirit if not pixel-perfect).
  const marker  = `pin-l+${PIN_COLOR_HEX}(${lng},${lat})`;
  // Anchor view at the marker lat/lng; @2x suffix asks Mapbox to return
  // a retina-density image so the snapshot stays crisp on iPhone screens.
  const view    = `${lng},${lat},${zoom},0`;
  const dims    = `${Math.round(widthPx)}x${Math.round(heightPx)}@2x`;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${marker}/${view}/${dims}?access_token=${MAPBOX_TOKEN}`;
}
