# &lt;PolaroidTile&gt; Primitive — Build Spec

> **Type:** build doc (NOT a decision doc — see [`polaroid-tile-design.md`](polaroid-tile-design.md) for frozen D1-D7)
> Audience: Future Claude sessions implementing or modifying the primitive
> David does not read this file — it's a dev-handoff artifact

---

## Component

**Path:** `components/PolaroidTile.tsx`
**Default export:** `PolaroidTile` (function component)
**Phase:** 2 Session B (session 95 ship)

---

## Visual contract

Wrapper:
- background: `v1.paperWarm` (#faf2e0)
- padding: `7px 7px 8px` when `bottomMat === "inside"`, `7px 7px 0` when `bottomMat === "outside"`
- borderRadius: 4
- boxShadow: `v1.shadow.polaroid`
- opacity: 0.55 when `dim`, else 1
- overflow: `hidden` when `bottomMat === "outside"` (matches /flagged + /shelf inline rendering — caption block is contained inside the wrapper)

Photo slot (positioned within wrapper):
- aspectRatio: `aspectRatio` prop (default `"4/5"`)
- borderRadius: `v1.imageRadius` (6)
- background: `photoBg` prop (default `v1.postit`)
- overflow: hidden
- border: `1.5px solid v1.green` when `highlighted`; else `1px solid v1.inkHairline` when `innerBorder`; else none
- boxShadow:
  - when `highlighted`: `0 0 0 3px rgba(30,77,43,0.13), 0 4px 14px rgba(42,26,10,0.11)`
  - when `innerBorder` (and not highlighted): `0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)`
  - when `innerInsetShadow`: `inset 0 0 30px rgba(42,26,10,0.12)` (overrides prior boxShadow)
  - else: undefined
- transition (only when highlighted is touchable): `box-shadow 0.30s ease, border-color 0.60s ease`

Photo slot tap-flash overlay (only rendered when `tap` is true):
- absolute inset 0
- background: `rgba(30,77,43,0.08)`
- opacity: 1 when tapped, 0 otherwise
- transition: `opacity 0.08s ease` on enter, `opacity 0.28s ease` on leave
- pointerEvents: none

Photo (img element):
- width/height: 100%
- objectFit: `objectFit` prop (default `"cover"`)
- display: block
- filter: `TREEHOUSE_LENS_FILTER` from `lib/treehouseLens.ts` when `lens` (default true)

Top-right slot (rendered inside the photo slot if `topRight` is non-null):
- absolute positioning: `top: 8 right: 8`
- width: 36, height: 36
- z-index: 3
- caller renders the bubble button inside

Below slot (rendered inside the wrapper, sibling of the photo slot, only if `below` is non-null):
- no extra container — caller's `below` element controls its own padding/height

Image-error fallback:
- when `src` is falsy OR image errored, render `fallback` (if provided) inside the photo slot
- if no `fallback`, photo slot stays empty (the photo bg + placeholder color shows through)

---

## Tap behavior implementation

When `tap === true`:
- onPointerDown: `setTapped(true); setTimeout(() => setTapped(false), 320)`
- The wrapper carries a `transform: scale(1.028)` on the photo slot (NOT the whole wrapper) when tapped
- transition uses two different bezier curves:
  - tap-down (entering tapped state): `transform 0.14s cubic-bezier(0.34,1.56,0.64,1)` — bouncy
  - tap-release (leaving tapped state): `transform 0.32s cubic-bezier(0.22,1,0.36,1)` — settles smoothly

**Important:** the scale transform applies to the photo-slot (the `relative position` div inside the wrapper), NOT the wrapper itself. Matches existing Home masonry behavior — only the image scales, not the polaroid frame.

---

## State management

Internal state (managed by the primitive):
- `imgErr: boolean` — set when img onError fires; gates `hasImg` for the photo slot
- `tapped: boolean` — only used when `tap === true`

External state (managed by caller):
- `highlighted` — caller times out and unsets after 1600ms (Home pattern)
- `dim` — caller derives from sold state
- `topRight` content — caller renders bubble + handles save/unsave click
- `below` content — caller renders timestamp / caption block / etc.

---

## Token reads

```typescript
import { v1 } from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";

// Used:
v1.paperWarm        // wrapper bg
v1.shadow.polaroid  // wrapper box-shadow
v1.postit           // default photoBg
v1.imageRadius      // photo radius (6)
v1.inkHairline      // innerBorder color
v1.green            // highlighted state border
TREEHOUSE_LENS_FILTER  // image filter (when lens=true)
```

---

## Migration order (per design record)

| # | Surface | File | Variant config |
|---|---|---|---|
| 1 | /post/preview | `app/post/preview/page.tsx` PolaroidPreview | `bottomMat="inside"`, `photoBg={v1.paperCream}`, `objectFit="contain"`, `dim` pass-through |
| 2 | /post/tag | `app/post/tag/page.tsx` Polaroid | `bottomMat="inside"`, `photoBg="#cdb88e"`, `lens={false}`, `innerInsetShadow`. Caller wraps in `<>` + adds `<PolLabel>` as sibling |
| 3 | /shelf/[slug] WindowTile | `components/BoothPage.tsx` | `bottomMat="outside"`, `below={<CaptionBlock />}` |
| 4 | /shelf/[slug] ShelfTile | `components/BoothPage.tsx` | same as WindowTile; caller wraps for carousel sizing |
| 5 | /flagged FindTile | `app/flagged/page.tsx` | `bottomMat="outside"`, `topRight={<UnsaveBubble />}`, `below={<CaptionBlock />}` |
| 6 | Home MasonryTile | `app/page.tsx` | `bottomMat="inside"`, `tap`, `highlighted={isLastViewed}`, `innerBorder`, `topRight={<HeartBubble />}`, `below={<Timestamp />}`, `fallback={<ItalicTitle />}` |

After all 6 land, no inline polaroid wrapper code should remain in the codebase EXCEPT one known carry-forward (see below). `grep -rn "background: \"#faf2e0\"" app/ components/` should return one hit at `app/find/[id]/page.tsx`.

### Known Phase 2.x carry-forward — /find/[id] ShelfCard

The "More from this booth" carousel on `/find/[id]` (`app/find/[id]/page.tsx:135`) uses the polaroid pattern but was missed in the Phase 1 audit's surface roster. It has unique sold-state handling that doesn't fit the current `<PolaroidTile>` API cleanly:

- **Photo-only opacity dim** when `isSold` (whole-tile `dim` prop dims wrapper + photo + caption together; this surface dims only the photo wrapper to 0.62)
- **Per-image filter override** when `isSold` (extends the lens with `grayscale(0.5) brightness(0.88)`)
- 56px caption block (vs 76px on /flagged + /shelf)
- No price, no overlay

Migrating this surface requires either two new props (`photoOpacity?: number`, `imageFilter?: string`) or a `dim: "tile" | "photo"` variant + an extension of the lens prop. Decide as a Phase 2.x follow-up — out of scope for the original Session B 6-callsite plan.

---

## Phase 3+ extension hooks (not in scope here)

- `layoutId?: string` for framer-motion shared-element transitions (Track D revival)
- `tapScale?: number` if Home wants to customize the scale amount
- `aspectRatio` already a prop — no work needed for non-4:5 surfaces

---

## Verification

After each migration commit:
```bash
npm run build 2>&1 | tail -15
```

After all 6 migrations:
```bash
grep -rn "background: \"#faf2e0\"" app/ components/    # should return only lib/tokens.ts comment + this build spec
grep -rn "0 6px 14px rgba(42,26,10,0.20)" app/ components/   # should be empty (or just tokens.ts)
```

iPhone QA pass: walk Home / /flagged / /shelf/[slug] / /my-shelf / /post/tag / /post/preview. Compare against pre-Session-B baseline (commit 6182219). Confirm zero visual delta on every polaroid surface.
