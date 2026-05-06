// lib/mapsDeepLink.ts
// R17 Arc 1 — native-maps deep-link URL builder.
//
// Pure UA-detection + URL builder. Returns the right URL for the user's
// platform so the "Navigate" CTA opens the native experience:
//   iOS         → maps://?daddr=<lat>,<lng>&dirflg=d   (Apple Maps, driving)
//   Android+web → https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>
//
// D16: Apple Maps URL scheme on iOS for driving directions. Android +
// desktop fall through to Google Maps web (universal — opens in the
// installed Google Maps app on Android via intent handler, in-browser
// elsewhere).
//
// SSR-safe: returns the Google Maps web URL when navigator is unavailable.
// Server-rendered <a href> still works on first paint; client hydration
// will replace with the iOS scheme if the user is on iOS.

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad on iOS 13+ reports as "MacIntel" but exposes touch points.
  // The maxTouchPoints check catches that case without false-positive
  // on actual macOS desktops (which have 0 touch points).
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (
    typeof navigator.platform === "string" &&
    navigator.platform === "MacIntel" &&
    typeof (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints === "number" &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1
  ) {
    return true;
  }
  return false;
}

/**
 * Returns the best native-maps URL for the current platform.
 *
 * @param destLat - destination latitude
 * @param destLng - destination longitude
 * @returns URL suitable for `window.location.href = ...` or `<a href>`.
 */
export function navigateUrl(destLat: number, destLng: number): string {
  if (isIOS()) {
    return `maps://?daddr=${destLat},${destLng}&dirflg=d`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
}
