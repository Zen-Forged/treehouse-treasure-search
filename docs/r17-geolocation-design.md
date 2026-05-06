# R17 — Geolocation-aware discovery — Design record

> **Status:** 🟢 **Ready** as of session 117 (2026-05-06). Promoted 🟡 → 🟢 same-session — second R-row to graduate same-day after R16 (session 102).
> **Status history:** new this session → 🟢 Ready (117).
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r17--geolocation-aware-discovery) — R17.
> **Mockups:**
> - [`docs/mockups/r17-geolocation-v1.html`](mockups/r17-geolocation-v1.html) — V1 (3 structural frames spanning pill-anchor + CTA-shape axes). Frame A (top-right pill anchor + twin buttons) + Frame B (eyebrow-row pill + small-caps treatment) hybridized for V2.
> - [`docs/mockups/r17-geolocation-v2.html`](mockups/r17-geolocation-v2.html) — V2 (Frame A's twin-button CTAs + Frame B's eyebrow-row pill anchor; 3 frames spanning distance-copy axis only). **Frame α — `"2.7 MI"` minimal — PICKED.** System-wide rollout panel below.
> **Effort:** M (1–2 sessions: primitives + lib helpers in Arc 1, consumer wiring across 5 surfaces in Arc 2).
> **Purpose of this doc:** Freeze the decisions so the implementation runs against a spec, not a re-scoping pass.

---

## Origin (session 117)

David surfaced R17 at session-open after redirecting from the recommended Tier C polish bundle — *"redirect. for this session I want to enable geolocation functionality"* — with a reference mockup showing a card with distance pill ("2.7 mi ↗"), twin "View on Find Map" + "Navigate" buttons.

The feature unlocks the digital-to-physical bridge thesis at maximum sharpness: the app knows where you are, treehouses are real places nearby, distance + directions are the most concrete possible "go visit this real place" affordance. Per the [thesis memory](../../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/project_treehouse_thesis_digital_to_physical_bridge.md), Treehouse Finds is *"a digital tool for real-world exploration."* R17 is the first feature where the digital surface measures — not just describes — the physical bridge.

V1 → V2 iteration:
- **V1** spanned 3 structural axes (pill anchor / CTA shape / permission-denied state). Frame A (top-right pill, twin buttons) + Frame B (eyebrow-row pill, small-caps).
- David's pick: *"I like Frame A but with the distance pill shape of Frame B"* — initially interpreted as "pill floating over edge with Frame B's typography." David clarified: *"the pill should sit above the card in the eyebrow row like Frame B. Not floating over the edge like Frame A."* — so the pill anchor is fully Frame B, and only the CTAs (twin buttons) are from Frame A.
- **V2** locked Frame B's eyebrow-row anchor + small-caps pill + Frame A's twin-button CTAs. Spanned distance-copy axis only (α minimal / β verbose / γ distance + ETA).
- David's pick: **Frame α — `"2.7 MI"` minimal**. Reads as a postmark stamp; no API dependency.

---

## Scope

R17 ships:
1. A **`useUserLocation()` hook** (`lib/useUserLocation.ts`) — single-source-of-truth for the user's current coordinates. Silent prompt on first mount of any surface using the primitive. Caches lat/lng + timestamp in localStorage with TTL.
2. A **`<DistancePill>` primitive** (`components/DistancePill.tsx`) — small-caps "X.Y MI" pill. Hides entirely when location unavailable (denied / blocked / not yet granted / mall lacks coords).
3. A **`<LocationActions>` primitive** (`components/LocationActions.tsx`) — twin-button row "View on Find Map" + "Navigate." Hides entirely when location unavailable.
4. A **distance-calc helper** (`lib/distance.ts`) — haversine math for client-side distance computation. Pure function, miles output.
5. A **native-maps deep-link helper** (`lib/mapsDeepLink.ts`) — generates platform-aware URLs (Apple Maps `maps://` / Google Maps `comgooglemaps://` / Google Maps web fallback).
6. **Wiring across 5 surfaces:** `/find/[id]` (cartographic card) · `/shelf/[slug]` (BoothHero) · `/flagged` (BoothLockupCard wrappers) · `/shelves` (BoothLockupCard wrappers) · `/map` (PinCallout).
7. **R3 analytics events:** `location_prompted` · `location_granted` · `location_denied` · `find_navigate_tapped` · `find_view_on_map_tapped` (R3 events; consumed by `track()`).

It does **not** ship:
- ETA / drive-time data. Frame γ ("2.7 MI · 8 MIN" Apple-Maps-style) was rejected — needs Mapbox Directions API call per render. Reconsider post-beta if user feedback wants drive-time.
- Tappable distance pill. Pill is decorative; CTAs cover the affordances.
- Background location updates. Location is fetched once on first mount + cached; no `watchPosition` listener.
- Booth-level coordinates. Distance is mall-anchored (booth lives inside the mall; mall has lat/lng).
- Permission-promotion UI. If user denies, the affordance silently hides — no "Enable location" promo card. Reconsider if telemetry shows high denial rate.
- `coming_soon` / `inactive` mall handling. Distance + Navigate hide when the mall isn't a place a shopper can actually visit (status filter at the data layer).

---

## Design decisions (frozen 2026-05-06)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Surface scope | **System-wide.** All 5 mall-anchored surfaces: `/find/[id]`, `/shelf/[slug]`, `/flagged`, `/shelves`, `/map`. | David, session 117 standup. |
| D2 | Augment vs replace existing card chrome | **Augment.** Distance pill + CTAs bolt onto existing card primitives without changing card body. Cartographic card on `/find/[id]` (session 71 collapse) + `BoothLockupCard` (session 82) + `BoothHero` (session 80) + `PinCallout` (session 107) all keep their current shape. | David, session 117 standup. |
| D3 | Permission UX | **Silent prompt on first mount of any surface using the primitive.** Whichever page the user lands on first — `/find/[id]`, `/map`, `/shelf/[slug]`, `/flagged`, `/shelves` — fires `navigator.geolocation.getCurrentPosition()` once. Subsequent surfaces read from cache. No promo card, no tap-to-enable affordance. | David, session 117 standup. |
| D4 | Permission-denied state | **Silent failure (option α).** Hide pill + both CTAs entirely. Card body reverts to current state. No "Enable location" link. | David, session 117 standup. |
| D5 | Pill anchor | **Eyebrow row above the cartographic card, right-aligned.** Paired with the existing italic Lora "Find this item at" eyebrow on the left. **NOT** floating over the card's top-right edge (V1 Frame A's anchor — explicitly rejected at V2 mid-draft per David: *"the pill should sit above the card in the eyebrow row like Frame B."*). | V1 Frame B + David clarification mid-V2-draft. |
| D6 | Pill visual | **Small-caps, paper-warm bg, no glyph.** Background `#ede6d5` (paper-warm token), 1px ink-hairline border, 999px radius, 3px × 10px padding, sys-font 10px / 700 weight / 0.12em letter-spacing / `text-transform: uppercase` / ink-muted color. Reads as a postmark stamp paired with the postal eyebrow vocabulary. | V1 Frame B's typography; verified V2 Frame α. |
| D7 | Pill copy | **`"X.Y MI"` minimal — Frame α.** Decimal mile to one place, "MI" suffix in small-caps. Examples: `"2.7 MI"`, `"0.4 MI"`, `"14.2 MI"`. Frames β (`"2.7 MI AWAY"`) + γ (`"2.7 MI · 8 MIN"`) explicitly rejected. | David, V2 pick: *"Frame A"* (= α). |
| D8 | Pill is tappable? | **No — decorative.** CTAs cover the navigation + map-view affordances; tappable pill would be redundant with the green "Navigate" button. | V2 lock; rejected V1 Q3 option ii. |
| D9 | CTA shape | **Twin buttons below the card.** Outline "View on Find Map" + filled green "Navigate." Equal width (`flex: 1`), 10px gap, 44px height, 8px radius. Outline button uses Lucide `Map` 16px glyph; primary button uses Lucide `Navigation` (or arrow) 16px glyph. | V1 Frame A's CTA shape, locked V2. |
| D10 | CTA labels | **"View on Find Map"** (left, outline) + **"Navigate"** (right, primary green). "Find Map" matches /map's product name from R10. | David's reference mockup; V2 lock. |
| D11 | Distance unit | **Miles.** Imperial-only for v1 (Kentucky-bound product). International unit handling deferred. | Kentucky beta scope. |
| D12 | Distance precision | **One decimal place.** `2.7 MI` not `2.69 MI` and not `3 MI`. Round half-up at calc time. | Reads cleanly in 10px small-caps. |
| D13 | Distance threshold to hide pill | **None — show pill at any distance.** A user 200 miles from a mall still sees `200 MI` (the data is informational). If David ships the app outside Kentucky later, reconsider. | V2 lock; no threshold question raised. |
| D14 | Stale coordinate handling | **TTL of 30 minutes.** If cached `geo_user_loc` is older than 30 min, re-prompt silently on next surface mount. Below 30 min, use cache. | Implementation-time; balances "user moved meaningfully" against "don't re-prompt aggressively." |
| D15 | Mall coords missing case | **Hide pill + CTAs entirely** (same shape as permission-denied). All 29 active malls have `latitude` + `longitude` populated (session 103 `add-mall.ts` reverse-geocodes), but defensive null-check anyway. | Defensive coding. |
| D16 | Native maps deep-link target | **iOS: Apple Maps via `maps://?daddr=<lat>,<lng>&dirflg=d` URL scheme** (driving directions). Falls back to `https://maps.apple.com/?daddr=...` if scheme unsupported. **Android + desktop:** `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (Google Maps web). | Standard iOS deep-link convention. |
| D17 | "View on Find Map" routing | **`/map?mall=<slug>`.** Routes to /map with the booth's mall pre-scoped. R10 already supports this URL shape. | R10 (session 108) infrastructure. |
| D18 | System-wide rollout — where pill attaches | **`/find/[id]`:** eyebrow row (Lora italic "Find this item at" left + pill right). **`/shelf/[slug]`:** BoothHero post-it eyebrow row (current "Booth" eyebrow left + pill right). **`/flagged`:** above each `BoothLockupCard`, right-aligned. **`/shelves`:** above each `BoothLockupCard`, right-aligned. **`/map`:** in `PinCallout` header next to mall name. | V2 system-wide rollout panel. |
| D19 | System-wide rollout — where CTAs attach | **`/find/[id]`:** below cartographic card. **`/shelf/[slug]`:** below BoothHero. **`/flagged`:** none — tap routes to `/shelf/[slug]` which carries them. **`/shelves`:** none — tap routes to `/shelf/[slug]`. **`/map`:** mini "Browse" + "Go" buttons in PinCallout body (compressed to fit callout chrome). | V2 system-wide rollout panel. |
| D20 | First-mount surface attribution | **Whichever surface fires `useUserLocation()` first wins.** No surface-specific prompt UX. The hook is mount-time idempotent (only prompts once per session storage state). | Per D3 — single global hook, multiple surfaces consume it. |
| D21 | Analytics events | **5 events under R3 vocabulary:** `location_prompted` (when prompt fires), `location_granted` (success callback), `location_denied` (error callback or PERMISSION_DENIED code), `find_navigate_tapped` (Navigate button tap on `/find/[id]` or `/shelf/[slug]` — payload includes `surface`, `mall_id`, `vendor_id`), `find_view_on_map_tapped` (View on Find Map button tap — same payload). All under existing `track()` infrastructure. | R3 vocabulary; no new event-shape work. |

---

## Component contracts

### `useUserLocation()` hook

```ts
// lib/useUserLocation.ts
type UserLocation = {
  status: "idle" | "prompting" | "granted" | "denied" | "unavailable";
  lat: number | null;
  lng: number | null;
  /** Unix timestamp (ms) of the last successful fix */
  capturedAt: number | null;
};

export function useUserLocation(): UserLocation;
```

- On first mount in any surface, if `localStorage["geo_user_loc"]` is missing OR older than 30 minutes:
  - Set status `"prompting"`.
  - Fire `track("location_prompted")`.
  - Call `navigator.geolocation.getCurrentPosition(success, error)` with `{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }`.
- On success: write `{ lat, lng, capturedAt }` to localStorage; set status `"granted"`. Fire `track("location_granted")`.
- On error (any reason — denied, position unavailable, timeout): set status `"denied"` (single bucket; don't surface error sub-codes to consumers). Fire `track("location_denied", { code: error.code })`.
- Cross-instance sync via storage events so all surfaces using the hook stay in lockstep.
- The hook does NOT broadcast a "request to re-prompt" — TTL expiry triggers re-prompt only on next surface mount, never mid-session.

### `<DistancePill>` primitive

```tsx
// components/DistancePill.tsx
interface DistancePillProps {
  /** Distance in miles. Component renders nothing if null. */
  miles: number | null;
}
```

- Renders nothing when `miles === null` (mall coords missing OR user location unavailable).
- Renders `"{miles.toFixed(1)} MI"` in the locked V2 visual treatment.
- No internal state, no event listeners — pure presentational.

### `<LocationActions>` primitive

```tsx
// components/LocationActions.tsx
interface LocationActionsProps {
  mallSlug: string | null;
  mallLat: number | null;
  mallLng: number | null;
  /** Used in analytics event payload. */
  surface: "find" | "booth";
  postId?: string | null;
  vendorId?: string | null;
}
```

- Renders nothing when `mallLat === null || mallLng === null`.
- Renders nothing when `useUserLocation().status !== "granted"` (silent failure on denial — D4).
- Otherwise renders the twin-button row.
- Click handlers fire `track("find_navigate_tapped" | "find_view_on_map_tapped", { surface, mall_id, vendor_id, post_id })` and dispatch the appropriate route / deep-link.

### `<DistancePill>` consumer pattern at the surface

Each surface inserts the pill into its existing eyebrow row, paired with the existing eyebrow text:

```tsx
// /find/[id] — cartographic card eyebrow row
<div className="eyebrow-row">
  <div className="carto-eyebrow">Find this item at</div>
  <DistancePill miles={milesFromUser(userLoc, mallLat, mallLng)} />
</div>
<CartographicCard ... />
<LocationActions
  mallSlug={mall.slug}
  mallLat={mall.latitude}
  mallLng={mall.longitude}
  surface="find"
  postId={post.id}
  vendorId={post.vendor_id}
/>
```

### `lib/distance.ts`

```ts
/** Haversine distance in miles, rounded to 1 decimal. Returns null if any input is null. */
export function milesFromUser(
  user: { lat: number | null; lng: number | null },
  mallLat: number | null,
  mallLng: number | null
): number | null;
```

### `lib/mapsDeepLink.ts`

```ts
/** Returns the appropriate native-maps URL for the user agent. */
export function navigateUrl(destLat: number, destLng: number, label?: string): string;
```

---

## Implementation sequencing (smallest → largest)

Per `feedback_smallest_to_largest_commit_sequencing.md` (cumulative >93 firings):

### Arc 1 — Primitives in isolation (one session)

1. **`lib/distance.ts`** — pure haversine helper. Tested in isolation via a smoke-test page or unit test.
2. **`lib/mapsDeepLink.ts`** — pure UA-detection + URL builder.
3. **`useUserLocation()` hook** — independent of any consumer. Idempotent first-mount prompt + cache + cross-instance sync.
4. **`<DistancePill>` primitive** — pure presentational; takes `miles` prop.
5. **`<LocationActions>` primitive** — composes the hook + click handlers + tracks.
6. **`/geolocation-test` smoke page** — mounts all primitives in isolation. Mirrors `/postcard-test` (R10) and `/search-bar-test` (R16) patterns. iPhone QA validates: prompt fires, "granted" path renders pill + CTAs, "denied" path renders nothing, deep-links open Apple Maps, View-on-Map routes to `/map?mall=...`.

### Arc 2 — Consumer wiring (one session)

7. **`/find/[id]`** — wire pill into cartographic eyebrow row + LocationActions below the card.
8. **`/shelf/[slug]`** — wire pill into BoothHero post-it eyebrow row + LocationActions below BoothHero.
9. **`<BoothLockupCard>` extension** — accept optional `distancePill` prop, render above the card right-aligned. `/flagged` + `/shelves` consume.
10. **`<PinCallout>` extension** — accept optional `distance` prop + render in header next to mall name. Add mini "Browse" + "Go" buttons.
11. **R3 analytics events** — wire `track()` calls on each event boundary.

Arc 1 + Arc 2 can ship as one session if the smoke-test goes clean; more likely two sessions split at the Arc 1 → Arc 2 boundary.

---

## Open implementation questions

These are **NOT** design decisions — they're implementation-time picks deferred to the relevant arc:

| Question | Options | Notes |
|----------|---------|-------|
| Geolocation prompt copy | Browser-default / pre-prompt explainer | iOS Safari shows "<domain> wants to use your location" — there's no way to customize the system prompt. Pre-prompt explainer (in-app dialog before the system prompt fires) deferred unless telemetry shows high denial rate. |
| TTL on cached coords | 30 min (proposed) / 1 hour / session-only | Default 30 min per D14. Tunable based on telemetry. |
| Location accuracy mode | `enableHighAccuracy: false` (proposed) / `true` | Default `false` — saves battery, sufficient for ~50m precision which is fine for mall-distance. `true` if precision becomes a UX concern. |
| Cross-tab coordination | Storage events only / BroadcastChannel | Default storage events (matches `useShopperSaves` pattern from session 112). BroadcastChannel adds complexity for marginal benefit. |
| Mapbox Directions API for ETA | Reconsider post-beta? | Frame γ rejected at V2 lock per D7. Revisit if user feedback wants drive-time. |
| Permission-promotion UI | None (proposed) / banner card / settings link | Default silently hide. Add banner only if denial rate is high. |

---

## Reversal log

(R17 has no reversal entries yet — design pass landed clean in session 117.)

---

## Memory firings

This design pass touched several memory rules:

- **`feedback_reference_first_when_concept_unclear`** — 5th cumulative firing (sessions 99 / 102 / 111 / 115 / 117). Promotion-strength validated repeatedly.
- **`feedback_mockup_options_span_structural_axes`** — V1 spanned 3 genuinely different shapes (top-right pill / eyebrow pill / inline pill).
- **`feedback_v2_mockup_as_fill_refinement`** — V2 locked Frame A's structure + Frame B's pill anchor; spanned distance-copy axis only. ~3rd firing — promotion-ready.
- **`feedback_visual_reference_enumerate_candidates`** — David's reference mockup ("reference only") was treated as capability-level guidance, not pixel-level spec. The visual treatment got iterated to V2 Frame α + Frame B pill, NOT replicated 1:1 from David's reference. Single firing.
- **NEW (session 117):** *"User-clarification mid-mockup-draft surfaces hidden interpretive gap — restate before continuing."* Single firing — when David said *"I like Frame A but with the distance pill shape of Frame B"*, the initial interpretation (anchor A + typography B) was wrong; correct interpretation is anchor B + CTAs A. Restating the interpretation as a sentence before the user starts the next iteration would have caught the gap before V2 was drafted. Tech Rule on second firing.
