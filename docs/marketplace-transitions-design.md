---
status: Ready for build (testbed → rollout)
related-mockup: docs/mockups/marketplace-transitions-v1.html
ready-for: phase 4 testbed (/transition-test) → phase 5 surface rollout (session 78)
session: 77
---

# Marketplace shared-element transitions — design record

> Build doc, not decision doc. David approved D1–D14 in session 77 conversation;
> this file freezes those decisions for future Claude sessions and the rollout
> implementation. The mockup at `docs/mockups/marketplace-transitions-v1.html`
> wins on visual disagreement.

## Goal

Photograph travels as a shared element from a thumbnail tile to its detail page,
matching the FB Marketplace navigation feel. Three thumbnail surfaces in scope.
Pattern is bidirectional (forward + back).

## Frozen decisions

### D1 — Scope of the shared element
**Photograph only travels.** Tile post-it fades out (0–160ms); detail post-it
fades in (200–360ms). The post-it does not animate position. The 40ms gap with
no post-it visible reads as a clean handoff, not a flicker.

### D2 — Direction
**Both directions.** Forward (tap → detail) and back (back-tap → grid) both run
the layoutId animation. Back is 300ms (vs. forward 340ms — see D8) to reward
the back gesture as a fast exit.

### D3 — Chrome during transition
**Masthead persists at full opacity across both surfaces.** Page background
stays `paperCream` — no route-fade flash between source and destination.

### D4 — Surfaces in scope
Three thumbnail-to-detail surfaces (rollout in session 78):
1. Feed (`/`) → `/find/[id]` — find tile photograph travels.
2. Booths (`/shelves`) → `/shelf/[slug]` — vendor hero photograph travels.
3. Find Map (`/flagged`) → `/find/[id]` — find tile photograph travels.

`BoothPage` shelf rail tiles (the "More from this shelf…" strip on `/find/[id]`)
**are pulled to v2.** Nested chrome makes the layoutId scope ambiguous; revisit
once v1 is shipping cleanly.

### D5 — Performance fallback
**Universal, gated on `prefers-reduced-motion`.** Wrap the app shell with
`<MotionConfig reducedMotion="user">` from framer-motion. When the OS reports
reduced motion, transitions fall back to instant nav. No iOS-only UA gate —
framer-motion's transform-based layoutId is performant on Android too.

### D6 — Image source for the layoutId target
**Same `image_url` on both ends.** No size variants. Aspect ratio differs
between tile (3/4) and detail (4/5) — `object-fit: cover` morphs during flight.
This is the desired effect (anchors the user's tap point).

### D7 — Easing curve
**`cubic-bezier(0.32, 0.72, 0, 1)` — iOS-native spring-out.** Slight overshoot
into final position, decelerating arrival. Same curve `app/page.tsx` MasonryTile
uses (intentional polish on the hero feed grid).

### D8 — Duration
- **Forward:** 340ms.
- **Back:** 300ms.

Within the typical iOS-native range (300–400ms). Forward needs the extra 40ms
to read as "arriving" rather than "snapping"; back is shorter to reward the
back-tap as a fast exit.

### D9 — Surrounding chrome on the source page during flight
**Other tiles + filter chips fade to ~18% opacity over 220ms ease-out.**
Masthead persists at full opacity (per D3). Page background stays paper. On
back, surround fades back to full opacity over 220ms.

### D10 — Z-index of flying photo vs. masthead
**Flying photo passes UNDER the masthead.** Photo `z-index: 20`, masthead
`z-index: 40` (existing). The blur band stays as the stable reference point
above; photo emerges out of the grid through the band into the detail layout.
This matches FB Marketplace's feel.

### D11 — Post-it crossfade timing
- Tile post-it fades out: **0 → 160ms** (opacity 1 → 0).
- Detail post-it fades in: **200 → 360ms** (opacity 0 → 1).
- 40ms empty gap (160–200ms) with no post-it visible reads as a handoff, not a flicker.

### D12 — Detail-page secondary content (title, caption, cartographic block)
**Stagger in after photo arrives, reusing session 76's MOTION tokens.**
- Title block: **delay 280ms, duration `MOTION_CARD_DURATION` (0.32s).**
- Caption: **delay 340ms.**
- Divider + cartographic card: **delay 400ms.**
- Stagger between successive items uses `MOTION_STAGGER` (0.04s).
- Easing for these uses `MOTION_EASE_OUT` (existing token).

The shared-element flight is the new motion; the detail-page entrance uses
existing primitives.

### D13 — Performance fallback (mechanism)
- App shell wraps `<MotionConfig reducedMotion="user">`.
- Reduced-motion users get an instant nav (framer-motion's native fallback for
  `layoutId` when reduced motion is set).
- Surround-chrome fade and detail entrance also respect this — the existing
  `motion.div initial="hidden" animate="visible"` already respects reduced
  motion via `MotionConfig`.

### D14 — Image source mechanism
- Same `image_url` rendered on both source tile and destination hero.
- `object-fit: cover` on both surfaces.
- During flight the layoutId animation interpolates the bounding box; the image
  inside reflows naturally because of `object-fit: cover`.

## Implementation notes (for session 78 rollout)

1. **App-shell `<MotionConfig>`.** Wrap `app/layout.tsx`'s body content with
   `<MotionConfig reducedMotion="user">`. One-line addition. Should be the first
   commit of session 78 so the gate exists before any transition is wired.

2. **Tile and detail must share a `layoutId`.** Use the post id (or vendor slug
   for /shelves) as the `layoutId` value. The `<motion.img>` (or `<motion.div>`
   wrapping the `<img>`) on both the tile and the detail page must use the same
   `layoutId`. Cross-route `layoutId` works in Next.js App Router because both
   surfaces mount within the same `<MotionConfig>` provider tree — but the
   `/transition-test` testbed must validate this before we touch any real
   surface.

3. **Tile layout reservations.** Source tile must reserve its layout slot during
   flight (otherwise the grid reflows when the photo lifts out). Use `position:
   relative` on the tile + `position: absolute; inset: 0` on the motion image
   so the tile's box stays in place; the photo lifts out via the layoutId
   animation but the box stays reserved.

4. **Surround chrome fade.** Use a parent `motion.div` wrapping non-flying tiles
   + filter chips with `animate={{ opacity: navigatingAway ? 0.18 : 1 }}` and
   `transition={{ duration: 0.22, ease: MOTION_EASE_OUT }}`. State on which
   tile was tapped lives in a per-page hook (`useNavigatingAway(targetId)`).

5. **Reverse direction.** When user taps back, the same layoutId animation runs
   in reverse — but framer-motion needs both surfaces still mounted briefly. The
   testbed must validate that `<AnimatePresence>` cross-route works without
   requiring artificial mount preservation.

6. **Photo lightbox interaction.** On `/find/[id]`, the photograph already opens
   a PhotoLightbox on tap (session 61). The shared-element wrapper must not
   intercept that tap once the entrance has settled.

## Out of scope (explicit, for v1)

- BoothPage shelf rail tiles → `/find/[id]` (D4 — pulled to v2).
- Sheet/modal entrance unification (different beast — overlay primitives).
- Same-route transitions (e.g., `/find/[id]` → `/find/[id2]` from "More from
  this shelf"). Session 78 may surface this as a stretch; if so, scope it then.

## Acceptance criteria

For session 78 rollout, the feature is shipped when:
1. `/transition-test` testbed renders a working forward + back layoutId
   transition between two minimal pages, validated on iPhone Safari.
2. All three real surfaces exhibit the transition forward and back without
   flicker, double-paint, or layout reflow on the source grid.
3. `prefers-reduced-motion` opts the user out cleanly (instant nav both ways).
4. The session 76 motion tokens (`MOTION_EASE_OUT` etc.) are reused; D12
   stagger sequencing matches the design record.
5. Masthead remains stable during all transitions — no remounts (this is now
   guaranteed by the session 77 unified-return fix on `/find/[id]`).

## Carry-forwards / parked

- **D4 BoothPage tiles → v2.** Captured here so future sessions don't reflexively
  scope it back in.
- **Same-route transitions** (More from this shelf strip on /find/[id]) parked
  unless a strong UX reason surfaces during testing.
