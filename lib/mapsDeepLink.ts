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

/**
 * Opens the best native-maps experience for the current platform.
 *
 * - iOS (maps:// scheme): assign window.location.href so the OS intercepts
 *   the scheme and hands off to Apple Maps. A new tab is wrong for a custom
 *   scheme.
 * - Everything else (https Google Maps web URL): open in a NEW tab via
 *   window.open. window.open always targets a top-level browser tab, so it
 *   works even when the app is running inside the desktop phone-frame iframe
 *   — assigning location.href there would try to navigate the *iframe* to
 *   Google Maps, which refuses to render in a frame (X-Frame-Options), so
 *   nothing opened on desktop. It also keeps the PWA in place rather than
 *   replacing it. Falls back to location.href if the popup is blocked.
 *
 * No-op on the server.
 */
export function openNavigation(destLat: number, destLng: number): void {
  if (typeof window === "undefined") return;
  const url = navigateUrl(destLat, destLng);
  if (url.startsWith("maps:")) {
    window.location.href = url;
    return;
  }
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}
