---
status: Ready
session: 76
inventory: Explore-agent run 2026-04-27 (background subagent on the four primary tabs)
scope: Home (app/page.tsx), Booths (app/shelves/page.tsx), Find Map (app/flagged/page.tsx), My Booth (app/my-shelf/page.tsx). NOTE: Find Map IS /flagged — same route. The dark-reseller-layer app/finds/page.tsx ("My Picks") is OUT of scope.
---

# Animation consistency — primary tabs (Track E)

Track E of session 76. Item 5 of David's 6-item redirect bundle. Frozen
decisions E1–E5 + E7 below; E6 deferred. State-first answers from David
on 2026-04-27: `5.1 (a)` decisions doc only · `5.2 (b)` include /flagged ·
`5.3 (c)` add `whileTap` to Booths VendorCard, leave Home + Find Map alone.

## Why

The Explore-agent inventory (background subagent earlier this session)
surfaced three real inconsistencies:

1. **Card entrance easing forks across pages.** Home tiles use
   `cubic-bezier(0.22,1,0.36,1)` (intentional snappier feel for the hero
   photo grid). Booths uses `[0.25, 0.1, 0.25, 1]`. Find Map uses motion
   defaults. Find detail + /flagged sections use `[0.25, 0.46, 0.45, 0.94]`.
   Four different curves for the same logical action.

2. **Tap feedback asymmetry.** Home MasonryTile has rich spring feedback
   (scale + shadow + border + green tap overlay). Find Map FindCard has
   `whileTap: scale 0.97`. Booths VendorCard has **nothing** — taps don't
   signal at all.

3. **Empty-state animation forks.** Home: 0.45s fade+slide. Booths: no
   transition specified (motion default = instant). Find Map: 0.2s
   AnimatePresence fade. My Booth: 0.4s linear. Four different patterns.

The tokens table below resolves all three with shared values.

## Frozen decisions

| ID | Decision | Choice |
|----|----------|--------|
| **E1** | Card entrance easing | `MOTION_EASE_OUT = [0.25, 0.46, 0.45, 0.94]` for **Booths VendorCard, Find Map FindCard, /flagged tiles**. Home `MasonryTile` keeps its bespoke `cubic-bezier(0.22,1,0.36,1)` for transform — intentional polish on the hero photo grid (E5 (c) reasoning extends here: hero feed earns richness). |
| **E2** | Card entrance duration | `MOTION_CARD_DURATION = 0.32` for Booths/Find Map/flagged. Home tile keeps its bespoke 0.38s opacity / 0.44s transform staggered durations. |
| **E3** | Stagger timing | `MOTION_STAGGER = 0.04` (interval), `MOTION_STAGGER_MAX = 0.30` (cap). Apply uniformly. Home cap raised from 0.28s → 0.30s for parity. |
| **E4** | Empty-state animation | Single pattern across Home / Booths / Find Map / My Booth / /flagged: `{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: MOTION_EMPTY_DURATION, ease: MOTION_EASE_OUT } }` where `MOTION_EMPTY_DURATION = 0.34`. |
| **E5** | Tap feedback parity | Add `whileTap={{ scale: 0.97 }}` to **Booths VendorCard only**. Home + Find Map unchanged. Booths goes from no-feedback → tap-registered signal; the visual style stays differentiated by surface (hero gets richness, scope-list gets minimal acknowledgment). |
| **E6** | Scroll-restore safety | **DEFERRED** — Home's `skipEntrance` pattern depends on `useScrollReveal` (page-local), `pendingScrollY` ref, `scrollRestored` ref, and a sessionStorage key. Extracting to a shared hook is a refactor with its own design pass. Captured as carry-forward; flicker on back-nav between primary tabs remains as known limitation. |
| **E7** | Token centralization | New constants in [`lib/tokens.ts`](../lib/tokens.ts): `MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`. Replace inline literals on the touched pages. The local `const EASE = [...]` declarations in `app/page.tsx` and `app/flagged/page.tsx` get replaced by named imports. |

## Implementation surfaces

| File | Change |
|------|--------|
| [`lib/tokens.ts`](../lib/tokens.ts) | Add `MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION` exports. |
| [`app/page.tsx`](../app/page.tsx) | Replace local `EASE` const with token import. MasonryTile's bespoke CSS transitions unchanged. Section animations (FeedHero/FeaturedBanner/divider) reference tokens. |
| [`app/shelves/page.tsx`](../app/shelves/page.tsx) | VendorCard: `[0.25, 0.1, 0.25, 1]` → `MOTION_EASE_OUT`, 0.28s → `MOTION_CARD_DURATION`, cap 0.3 → `MOTION_STAGGER_MAX`. Add `whileTap={{ scale: 0.97 }}`. Empty state already uses 0.34s + correct ease — replace with tokens. |
| [`app/my-shelf/page.tsx`](../app/my-shelf/page.tsx) | NoBooth empty state: 0.4s linear → E4 pattern with tokens. |
| [`app/flagged/page.tsx`](../app/flagged/page.tsx) | Replace local `EASE` const with token import. Tile transitions referenced from tokens. |

## Acceptance criteria

- [x] All five surfaces use a single import from `lib/tokens.ts` for entrance easing/duration/stagger
- [x] Booths VendorCard responds to tap with a 0.97 scale spring (parity-of-signal with Find Map)
- [x] Empty states across Home / Booths / Find Map / My Booth / /flagged share one entrance treatment
- [x] No `[0.25, 0.1, 0.25, 1]` literal remains in the four primary-tab files (only `MOTION_EASE_OUT` survives)
- [x] Build clean
- [ ] iPhone QA post-ship: confirm Booths tap registers, empty states feel matched, no perceptible regression on Home tile entrance polish

## Carry-forwards

- **E6 — scroll-restore safety deferred.** Extract `useScrollReveal` from `app/page.tsx` into `hooks/useScrollReveal.ts`. Generalize the scroll-restore mechanism (sessionStorage key as a parameter) so Booths / Find Map / /flagged can adopt the skip-entrance-on-restore pattern. Likely 30–60 min in its own session.
- **Home MasonryTile bespoke easing intentionally diverges.** If real-content seeding reveals the polish gap reads as inconsistency rather than intentional richness, revisit E1 + E2.
- **Home / Find Map / /flagged tile entrance use `<motion.*>` with framer-motion variants; Home MasonryTile uses inline CSS transitions.** Two encodings of "the same" entrance. Token values centralize but the runtime is forked. Acceptable for now (CSS transitions on Home are a deliberate perf choice on the heavy photo grid).
- **Sheet/modal entrance patterns NOT touched in this pass** — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet, etc. all carry their own entrance animations. Inventory left for a separate consistency pass on overlay primitives.
