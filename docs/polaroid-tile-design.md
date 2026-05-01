# &lt;PolaroidTile&gt; Primitive — Design Record

> **Type:** decision doc (not a build doc — see [`polaroid-tile-build-spec.md`](polaroid-tile-build-spec.md))
> Drafted: 2026-05-01 (session 95) · Owned by: Design + Dev agents
> Mockup: [`docs/mockups/polaroid-tile-primitive-v1.html`](mockups/polaroid-tile-primitive-v1.html)
> Phase 2 plan reference: [`docs/design-system-phase2-plan.md`](design-system-phase2-plan.md) — Session B
> Phase 1 audit reference: [`docs/design-system-audit-phase1.md`](design-system-audit-phase1.md) §F-1

---

## Why this primitive exists

Phase 1 audit found the polaroid wrapper inlined verbatim across 6 callsites:

- `app/page.tsx` — Home masonry MasonryTile (inside-mat, w/ border, w/ tap + highlighted, top-right heart, timestamp below)
- `app/flagged/page.tsx` — FindTile (outside-mat, top-right unsave, 76px caption block below)
- `components/BoothPage.tsx` — WindowTile (outside-mat, no overlay, 76px caption below)
- `components/BoothPage.tsx` — ShelfTile (same as WindowTile + carousel sizing)
- `app/post/preview/page.tsx` — PolaroidPreview (inside-mat, paperCream photo bg, contain fit, dim variant)
- `app/post/tag/page.tsx` — Polaroid (inside-mat, warm-tan photo bg #cdb88e, no lens, inset shadow, label rendered as caller's sibling)

Same polaroid box-shadow stack (`0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)`) duplicated 8 times verbatim across the codebase. Single typo silently desynchronizes the system. Per session 83's carry-forward — "extract on the 4th surface" trigger crossed at session 94 when /post/tag + /post/preview both adopted polaroid.

**Goal: zero visual delta.** Each callsite renders identically before and after extraction. Reduces ~250 lines of inline polaroid wrapper code to a single primitive plus thin per-surface props.

---

## Decisions D1-D7 (frozen 2026-05-01)

### D1 — Wrapper variant API
**Picked:** (a) `bottomMat: "inside" | "outside"` semantic enum.
- `"inside"` → wrapper padding `7px 7px 8px` (small mat between photo and below content; Home timestamp, /post/preview, /post/tag)
- `"outside"` → wrapper padding `7px 7px 0` (no mat; below content provides its own height; /flagged + /shelf 76px caption block)
- Default: `"inside"`.

### D2 — Photo inner background
**Picked:** (b) `photoBg?: string` pass-through.
- Default `v1.postit` (#fbf3df) — Home, /flagged, /shelf real-photo placeholder.
- /post/preview passes `v1.paperCream` (review-state contrast).
- /post/tag passes `"#cdb88e"` (warm-tan placeholder while photo loads).
- Three values isn't enough to justify an enum; the prop name carries intent.

### D3 — Tap interaction (Home only)
**Picked:** (a) primitive owns the tap state via `tap?: boolean`.
- When `tap` is `true`, primitive manages its own tap-flash overlay + scale animation (`scale(1.028)` on touchstart, returns over 320ms).
- When `tap` is `false` (default), no tap behavior.
- Self-contained interaction; future surfaces can opt in with one prop.

### D4 — "Last viewed" highlighted state (Home only)
**Picked:** (a) parent-controlled via `highlighted?: boolean`.
- Parent manages the timeout (current Home behavior: highlight for 1600ms after navigate-back, then unset).
- Primitive renders the visual state (1.5px green border + halo box-shadow) based on prop value.
- Keeps state ownership at the data layer; primitive stays pure.

### D5 — Lens filter
**Picked:** (a) `lens?: boolean` default `true`.
- 5 of 6 surfaces apply Treehouse Lens (`contrast(1.08) saturate(1.05) sepia(0.05)`).
- /post/tag explicitly opts out (raw photo on capture).
- Default-on minimizes prop noise on the common case.

### D6 — Render slots (with correction)
**Picked:** (ok) — but with one correction surfaced post-pick:
- `topRight?: ReactNode` — renders inside the photo slot, absolute-positioned `top: 8 right: 8 z-index: 3`. Used by Home heart and /flagged unsave bubble.
- `below?: ReactNode` — **renders inside the polaroid wrapper, as a sibling of the photo slot.** This is a correction from the V1 mockup wording, which said "after the polaroid wrapper closes" (i.e. outside the wrapper). Visual parity requires `below` to render inside the wrapper because /flagged + /shelf's 76px caption block sits on the polaroid mat per the session-83 polaroid-pattern design. /post/tag's italic label, which today sits outside the wrapper on the page bg, is not handled by the `below` slot — the caller wraps the primitive plus the label in its own fragment (consistent with D7's caller-wraps principle).

### D7 — Sizing + carousel variants
**Picked:** (a) primitive accepts no sizing props; caller wraps.
- /shelf/[slug] ShelfTile uses `width: 52vw, max-width: 210, scrollSnapAlign: start, marginLeft: isFirst ? 22 : 0` for horizontal-scroll carousel — caller's wrapper carries those styles.
- Other surfaces are full-width within their grid cell — no wrapper needed.
- Keeps the primitive's API tight; sizing is layout concern, not chrome concern.

---

## Final API (frozen)

```typescript
interface PolaroidTileProps {
  src: string;
  alt: string;

  // D1 — wrapper bottom padding
  bottomMat?: "inside" | "outside";  // default "inside"

  // D2 — photo inner background (default v1.postit)
  photoBg?: string;

  // D3 — tap interaction (Home only)
  tap?: boolean;                      // default false

  // D4 — last-viewed highlight state (Home only)
  highlighted?: boolean;              // default false

  // D5 — lens filter
  lens?: boolean;                     // default true

  // photo render
  aspectRatio?: string;               // default "4/5"
  objectFit?: "cover" | "contain";    // default "cover"

  // global state
  dim?: boolean;                      // default false (sold)

  // photo inner chrome
  innerBorder?: boolean;              // default false (Home only)
  innerInsetShadow?: boolean;         // default false (/post/tag only)

  // D6 — render slots
  topRight?: ReactNode;               // inside photo slot, abs top:8 right:8
  below?: ReactNode;                  // inside wrapper, sibling after photo

  // image error fallback (renders inside photo slot when image fails)
  fallback?: ReactNode;

  // image attributes
  loading?: "eager" | "lazy";
  onImageError?: () => void;
}
```

---

## Token usage

The primitive reads from `lib/tokens.ts` (Phase 2 Session A additions):
- `v1.paperWarm` (#faf2e0) — wrapper background
- `v1.shadow.polaroid` — wrapper box-shadow
- `v1.postit` — default photo inner bg
- `v1.imageRadius` — photo inner radius (6px)
- `v1.inkHairline` — photo inner border (when `innerBorder`)
- `v1.green` — highlighted state border + halo

Plus `TREEHOUSE_LENS_FILTER` from `lib/treehouseLens.ts` (when `lens` is true).

---

## What this primitive intentionally does NOT handle

1. **Sizing / carousel container** (D7) — caller wraps.
2. **Image preview cache** (sessionStorage `treehouse_find_preview:`) — stays at the callsite.
3. **`Link` / `onClick` wrapping** — caller composes; the primitive renders just the visual.
4. **framer-motion `layoutId`** for shared-element transitions — Track D is currently dormant; if it's revived in a future session, the primitive can grow a `layoutId` prop then.
5. **/post/tag's italic label** — outside the polaroid wrapper, on the page bg. Caller wraps the primitive + label.

---

## Adoption plan (smallest → largest)

1. /post/preview PolaroidPreview (smallest — single callsite, no overlay)
2. /post/tag Polaroid (twin Find + Tag — exercises warm-tan + lens=false + insetShadow + caller-wrapped label)
3. /shelf/[slug] WindowTile + ShelfTile (twin in BoothPage.tsx — outside-mat + caption below)
4. /flagged FindTile (adds topRight overlay)
5. Home MasonryTile (largest — tap + highlighted + innerBorder + image error fallback + everything)

Each migration ships as its own commit with build verification.

---

## Verification gate

- `npm run build` clean after each commit
- iPhone QA pass after migrations land — confirm visual parity across all 6 surfaces:
  - Home masonry tile reads identically (timestamp + heart + tap + highlighted)
  - /flagged FindTile reads identically (76px caption block + unsave heart)
  - /shelf/[slug] WindowTile + ShelfTile read identically (caption + carousel)
  - /post/preview PolaroidPreview reads identically (paperCream bg + contain fit + dim)
  - /post/tag Find + Tag photos read identically (warm-tan bg + inset shadow + label below)

---

## Risks

- Highest-visibility chrome element after the masthead. Any drift in shadow / mat / radius reads immediately.
- Mitigation: token foundation already shipped in Session A (`v1.shadow.polaroid` + `v1.paperWarm`). Primitive reads from tokens; adoption is verbatim.
- Treehouse Lens filter must stay applied per session-66 commitment — verify on dim/sold case + post/preview review case.

---

## Out-of-scope follow-ups (if adoption surfaces issues)

- If a future surface needs the photo slot's inner-shadow + border combined (currently mutually exclusive), the primitive can grow that variant.
- If Home tap behavior needs to be customizable per callsite (e.g. different scale amount), expose `tapScale?: number`.
- If sheet animation drift (session 76 carry) ever lands, polaroid tiles inside sheets may need a coordinated entrance.
