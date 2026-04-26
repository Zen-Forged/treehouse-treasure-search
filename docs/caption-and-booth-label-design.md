# Caption consistency + booth label unification — Design record

> **Status:** 🟢 Ready (frozen session 69, 2026-04-26).
> **Mockup:** [`docs/mockups/caption-and-booth-label-v1.html`](mockups/caption-and-booth-label-v1.html).
> **Effort:** S–M (1 session — straight sprint against this spec).
> **Purpose of this doc:** Freeze design decisions so the implementation session runs as a straight sprint. David has approved the approach on iPhone; this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Two refinement passes bundled together because they touch the same set of discovery surfaces and share most of the file diff:

1. **Caption consistency** — unify the typography of tile captions across the three discovery surfaces (Home feed, Find Map, Booths grid) plus the two booth-detail tile rails (Window/Shelf tiles inside `<BoothPage>`) and the Find Detail related-finds rail. Today these are inconsistent: Home is sans 10px timestamp-only, Booths is IM Fell 14px on `inkWash` card, Find Map is mixed IM Fell italic title + sans price, booth-detail tiles are sans 14px (session 46 calibration), Find Detail rail is sans 14px (matches session 46). David's preferred direction: anchor on the Booths VendorCard treatment (warm `inkWash` card, IM Fell 14px regular non-italic title, dark-brown ink) and bring the other surfaces into alignment.

2. **Booth label unification** — promote the fragmented "Booth + number + vendor name" identity into a single coherent label using **Option B** (small-caps eyebrow + name in shared frame). Affects the Booths grid tile and the Find Detail cartographic block. The BoothHero post-it on `/shelf/[slug]` gets a smaller, scoped revision instead — vendor name is already established by page context, so the post-it just collapses its eyebrow from two-line "Booth / Location" to single-line "Booth".

The shipped behavior:

1. **Booths VendorCard is the anchor; Find Map + booth-detail rails + Find Detail rail align to it.** All four use IM Fell 14px regular non-italic title on `inkWash` card with sans 12px price below.
2. **Home feed timestamp stays sans 10px no-bg, but italicized.** Only metadata change; treatment matches the IM Fell italic vocabulary used elsewhere without forcing a full card frame onto a single timestamp.
3. **Booths grid tile retires the dark `Booth NN` pill.** Card body now leads with small-caps `BOOTH 42` eyebrow above the vendor name in the same `inkWash` card.
4. **Find Detail cartographic block retires the green pill.** Replaced by a stacked block: small-caps `BOOTH 42` eyebrow above IM Fell 18px vendor name, with "Visit the booth →" inline at the row's right edge.
5. **BoothHero post-it on `/shelf/[slug]` is preserved as-is visually.** Width unchanged (~88px). Italic IM Fell eyebrow unchanged in style. Numeral unchanged (sans 30px). Only the eyebrow text changes from two-line "Booth / Location" to single-line "Booth". Title block below the hero is untouched (eyebrow + vendor name retained).

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Should the caption-typography unification touch Home feed too? | **No card frame on Home feed.** Home shows a 10px relative timestamp only — wrapping that single piece of metadata in an `inkWash` card overweights it against the photo. Different *level* of detail per surface is allowed; same *style* family is the rule. | David, session 69. |
| D2 | Backwards-compat for session 46's sans 14px on booth-detail tiles. | **Reverse session 46 — apply the Booths IM Fell treatment to booth-detail tiles + Find Detail rail.** Session 46 went sans for small-tile legibility; David's iPhone review of the mockup judged IM Fell at 14px on a ~170px-wide tile reads fine. Unification wins. | David, session 69. |
| D3 | Find Detail rail (`<ShelfCard>` from `/find/[id]`) treatment. | **Same as booth-detail tiles — Booths IM Fell card treatment.** Three booth-detail / find-detail rails all share one component eventually; in this pass they each get the same caption shape applied at their callsites. | David, session 69. |
| D4 | Background color for the unified card. | **`v1.inkWash` (warm off-white).** Pure white flattens against the parchment ecosystem background; `inkWash` carries the warm-paper character. Booths VendorCard already uses it; reuse the token. | David, session 69. |
| D5 | Title typography. | **IM Fell English serif, regular weight, non-italic, 14px.** Italic stays reserved for eyebrows + secondary metadata per the v1.1l vendor-name rule. Color: existing `v1.inkPrimary` token (warm dark-brown). | David, session 69. |
| D6 | Price typography (where shown). | **Sans 12px, `v1.inkMid` color.** Numerals read better in sans; Booths anchor doesn't show a price so we're not breaking parity with the anchor. | David, session 69. |
| D7 | Card padding. | **`9px 10px 11px`** — matches Booths VendorCard exactly. | David, session 69. |
| D8 | Home feed timestamp. | **Stays sans 10px, no card frame, but italicized.** Subtle nod toward the IM Fell italic vocabulary. Sans-serif italic renders as oblique on system fonts; that is intentional. | David, session 69. |
| D9 | Booth-label scope — which surfaces. | **All three: Booths grid tile + BoothHero post-it on `/shelf/[slug]` + Find Detail cartographic block.** Each gets an appropriate-to-surface treatment (see D10). | David, session 69. |
| D10 | Booth-label treatment shape. | **Option B for the two card-style surfaces (Booths grid tile + Find Detail cartographic block):** retire the pill / numeral-only shape; lead with small-caps `BOOTH NN` eyebrow above vendor name in the same frame. **Minimal-revision for the BoothHero post-it:** keep the post-it visual style unchanged (88px width, IM Fell italic eyebrow at 11px, sans numeral at 30px, vendor name remains in the title block below the hero — NOT pulled into the post-it). Only the eyebrow text changes from "Booth / Location" two-line → "Booth" single-line. | David, session 69. |
| D11 | Word "Booth" — written or implied. | **Always written.** "Booth 42" reads more clearly than bare "42" or a stylized pill, especially for first-time visitors who don't yet have the mall-as-grid mental model. | David, session 69. |
| D12 | Eyebrow case + font for the unified booth-label surfaces. | **Small-caps sans, 9.5px, 700 weight, `0.10em` letter-spacing, `v1.inkMuted` color, `text-transform: uppercase`.** Matches the eyebrow vocabulary used on the Booths grid tile post-this-change and the Find Detail cartographic block. *Excludes* the BoothHero post-it, which keeps its IM Fell italic eyebrow vocabulary unchanged (D10). | David, session 69. |

**All twelve decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## File-level changes

### Section 1 — Caption consistency

#### [`app/page.tsx`](../app/page.tsx) — Home feed timestamp italic

Change the `MasonryTile` caption block (around line 373) — add `fontStyle: "italic"` to the timestamp `div`. No other changes (size 10px, color `v1.inkMuted`, no bg, sans family all unchanged).

#### [`app/flagged/page.tsx`](../app/flagged/page.tsx) — Find Map FindTile gets Booths card treatment

The `FindTile` component (around line 278–310). Today: `<div>` for tile root with photo at top + free-floating title + price below. Replace with the Booths VendorCard structure:

- Wrapping div gains `borderRadius: 12, overflow: "hidden", background: v1.inkWash, border: "1px solid var(--ink-hairline)", boxShadow: "0 1px 4px rgba(42,26,10,0.06)"`.
- Photo stays full-bleed at top (no border-radius needed; parent clips).
- Below photo: new `info` div with `padding: "9px 10px 11px"` containing:
  - Title `div`: `fontFamily: FONT_IM_FELL, fontSize: 14, color: v1.inkPrimary, lineHeight: 1.2`. **No italic.** Keep the existing 2-line clamp.
  - Price `div` (when present): `marginTop: 3, fontFamily: FONT_SYS, fontSize: 12, color: v1.inkMid`.

Drops: `marginTop: 6` outer spacing on title (now lives inside `info` padding); the `fontStyle: "italic"` and 13px size on the title; the existing `priceInk` color reference if it differs from `v1.inkMid` — verify locally.

#### [`components/BoothPage.tsx`](../components/BoothPage.tsx) — Window/Shelf tile captions get Booths card treatment

Two tiles affected:

- **`WindowTile`** (around line 711–727): caption block under photo → wrap photo + caption in an `inkWash` card; promote the title from sans 14px → IM Fell 14px regular non-italic; price stays sans 12px.
- **`ShelfTile`** (around line 856–872): same swap. Price sans 13px → sans 12px to match the unified spec.

Reverses the session 46 `FONT_SYS 14px` calibration. Both components live in the same file; one change in two places.

#### [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — Find Detail rail (`<ShelfCard>`) gets Booths card treatment

Around line 182–245 (the `<ShelfCard>` used in the related-finds rail at the bottom of `/find/[id]`). Same swap as above — wrap in `inkWash` card; title becomes IM Fell 14px regular non-italic; price sans 12px.

### Section 2 — Booth label unification

#### [`app/shelves/page.tsx`](../app/shelves/page.tsx) — Booths grid tile

Two changes in one component (`VendorCard`, around line 137–195):

1. **Retire the `Booth NN` pill** at bottom-left of the photo (around line 137–143). Delete the absolutely-positioned `<span>` block.
2. **Add a small-caps `BOOTH NN` eyebrow** as the first line in the `info` block, above the vendor name. Spec:
   ```
   fontFamily: FONT_SYS,
   fontSize: 9.5,
   fontWeight: 700,
   color: v1.inkMuted,
   letterSpacing: "0.10em",
   textTransform: "uppercase",
   marginBottom: 2,
   ```

Vendor name + bio below the eyebrow are unchanged.

#### [`components/BoothPage.tsx`](../components/BoothPage.tsx) — BoothHero post-it (minimal revision)

Around line 209–270. The only change is the eyebrow text. Today:

```jsx
<div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 14, ... }}>
  Booth<br />Location
</div>
```

Becomes:

```jsx
<div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 14, ... }}>
  Booth
</div>
```

(Drops the `<br />Location`.) Post-it width may collapse 1–2px since the eyebrow is now one line instead of two; verify on device.

`<BoothTitleBlock>` (around line 280–350) is **not changed** — eyebrow + vendor name stay where they are.

#### [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — Find Detail cartographic block

Find the cartographic block on the find-detail page (it has the green pill numeric + IM Fell vendor name + "Visit the booth →" link). Current shape:

```jsx
<div style={{ display: "flex", alignItems: "center", gap: ... }}>
  <Pill>{boothNumber}</Pill>
  <span>{vendorName}</span>
  <a>Visit the booth →</a>
</div>
```

Replace with:

```jsx
<div style={{ background: v1.inkWash, border: "1px solid var(--ink-hairline)",
              borderRadius: 10, padding: "12px 14px" }}>
  <div style={{ fontFamily: FONT_SYS, fontSize: 9.5, fontWeight: 700,
                color: v1.inkMuted, letterSpacing: "0.10em",
                textTransform: "uppercase", marginBottom: 2 }}>
    Booth {boothNumber}
  </div>
  <div style={{ display: "flex", alignItems: "baseline",
                justifyContent: "space-between", gap: 10 }}>
    <span style={{ fontFamily: FONT_IM_FELL, fontSize: 18,
                   color: v1.inkPrimary, lineHeight: 1.2 }}>
      {vendorName}
    </span>
    <a style={{ fontFamily: FONT_SYS, fontSize: 11, fontWeight: 500,
                color: v1.green }}>
      Visit the booth →
    </a>
  </div>
</div>
```

Pill component import can be removed if it's no longer used elsewhere on the page.

---

## Surface × treatment matrix

| Surface | Caption treatment | Booth-label treatment |
|---|---|---|
| Home feed (`/`) | Sans 10px italic timestamp, no bg | N/A — no booth identity surfaced on Home tiles |
| Booths grid (`/shelves`) | **Anchor** — IM Fell 14px name + 10px italic bio, `inkWash` card | **Option B** — pill retired, small-caps `BOOTH NN` eyebrow above vendor name in same card |
| Find Map (`/flagged`) | IM Fell 14px title + sans 12px price, `inkWash` card | N/A — no booth identity on tiles |
| BoothPage Window/Shelf tiles (`/shelf/[slug]` + similar) | IM Fell 14px title + sans 12px price, `inkWash` card | N/A — surface IS the booth detail |
| BoothHero post-it (`/shelf/[slug]`) | N/A — not a tile | **Minimal revision** — eyebrow text "Booth / Location" → "Booth"; visual style unchanged |
| Find Detail rail (`<ShelfCard>` on `/find/[id]`) | IM Fell 14px title + sans 12px price, `inkWash` card | N/A — find tiles, not booth identity |
| Find Detail cartographic block (`/find/[id]`) | N/A — not a tile | **Option B** — green pill retired, stacked small-caps `BOOTH NN` eyebrow + IM Fell 18px name, "Visit the booth →" inline |

---

## Out of scope

- **`/admin/shelves` admin tiles** — these carry Pencil + Trash bubbles with their own visual logic; not in this pass. Leave as-is.
- **Mall page (`/mall/[slug]`)** — still on v0.2 dark theme with intentional darkening filter. Already deferred (CLAUDE.md). Will get its own v1.x ecosystem migration; this pass stays away.
- **Reseller Intel layer (`/scan`, `/decide`, `/refine`, `/finds`, etc.)** — different theme entirely. Out of scope.
- **DB / RLS / API / migration** — pure presentational changes. Zero data model changes.
- **Storage keys, event names, hook names containing "save"** — Item 1 of session 69 already handled visible UI strings; internal naming intentionally unchanged.
- **Photo aspect ratio, lens, sold-state composition** — orthogonal axes, no change.

---

## Acceptance criteria (8)

1. Home feed timestamp renders sans 10px italic; no card frame, no other layout change.
2. Booths VendorCard is unchanged visually post-this-pass *except* for the booth-label restructure (D10).
3. Find Map tile renders title + price inside an `inkWash` card with IM Fell 14px regular non-italic title and sans 12px price.
4. Booth detail Window/Shelf tiles render the same way (reverses session 46 — explicit acceptance).
5. Find Detail rail tiles render the same way.
6. Booths grid tile shows no `Booth NN` photo-overlay pill; vendor name in card is preceded by a small-caps `BOOTH 42` eyebrow.
7. BoothHero post-it shows single-line "Booth" eyebrow above the numeral; vendor name remains in `<BoothTitleBlock>` below the hero.
8. Find Detail cartographic block shows stacked `BOOTH 42` eyebrow + IM Fell 18px vendor name + inline "Visit the booth →" link, all on an `inkWash` card; the green pill is retired.

---

## Notes

- **Session 46 reversal is explicit, not accidental.** That session went sans 14px for small-tile legibility. David's iPhone review of the mockup judged the IM Fell 14px treatment readable at the same tile width. If real-world legibility issues surface during the seeding walk, the per-surface fallback is to revert the affected callsite to sans 14px without disturbing the anchor.
- **Post-it width may settle 1–2px narrower** after the eyebrow drops the second line. Verify on device — if it looks awkwardly stretched at the existing 88px width, consider tightening to ~78px. Width parameter is in [`components/BoothPage.tsx:209–270`](../components/BoothPage.tsx).
- **Eyebrow letter-spacing + size are tight** — `0.10em / 9.5px / 700`. Smaller / less tracking would lose the small-caps cue; larger / more tracking would compete with the vendor name. Locked at this spec.
- **`v1.inkPrimary` is currently warm dark-brown** in the v1.x palette. If a future palette change moves it toward black, the "warm dark-brown" intent of D5 should be preserved by re-anchoring to whatever token reads warmest at that point.
