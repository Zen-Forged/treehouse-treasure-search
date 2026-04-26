# Find Detail cartographic refinement — Design record

> **Status:** 🟢 Ready (frozen session 70, 2026-04-26).
> **Mockup:** [`docs/mockups/find-detail-cartographic-refinement-v1.html`](mockups/find-detail-cartographic-refinement-v1.html).
> **Effort:** S (1 session — adds one card wrapper + one eyebrow text edit).
> **Purpose of this doc:** Freeze design decisions so the implementation session runs as a straight sprint. David approved on iPhone; this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Two refinement passes on `/find/[id]` bundled because they're the same page and ship together cleanly:

1. **Mall card parallel treatment.** Resolve session-69 visual asymmetry on the cartographic block: the booth block is wrapped in an inkWash card (shipped session 69) but the mall block above it is plain text. Lift the mall block to a parallel inkWash card matching the booth card's vocabulary. Cartographic spine (PinGlyph + hairline tick + XGlyph) preserved as connecting tissue between two parallel cards.
2. **Find-photo post-it eyebrow collapse.** The post-it overlay on the find photo currently shows a two-line `"Booth\nLocation"` eyebrow above the booth numeral. Collapse to single-line `"Booth"` — mirroring session-69 D10's treatment on `BoothHero` (`/shelf/[slug]`). Vendor + booth context is already established by page identity (find detail = "this find at this booth"); "Location" word is redundant chrome.

The shipped behavior:

1. **Mall block becomes an inkWash card** with small-caps `MALL` eyebrow + IM Fell 18px mall name + sans 14px muted address (dotted-underline link if `mapLink` available). Whole card tappable → `/mall/[slug]` when slug exists.
2. **Booth block unchanged from session 69.** Already an inkWash card with `BOOTH NN` eyebrow + IM Fell 18px vendor name + inline "Visit the booth →" link.
3. **Cartographic spine preserved.** PinGlyph (18px) at top anchors the mall card; XGlyph (15px) at bottom anchors the booth card; hairline tick connects them. Tick `minHeight` grows to span both cards (estimated 56–78px depending on address line wrap).
4. **Find-photo post-it eyebrow** collapses from `"Booth\nLocation"` (two lines) → `"Booth"` (single line). Visual style otherwise unchanged: post-it size, +6deg rotation, IM Fell italic eyebrow vocabulary, sans booth-numeral.

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D8 | Mall block treatment. | **Parallel inkWash card matching session-69 booth card.** Card content: small-caps `MALL` eyebrow + IM Fell 18px mall name + sans 14px muted address (dotted-underline link if `mapLink` available). Whole card tappable → `/mall/[slug]` when slug exists. | Claude recommendation, David approval. David approved booth-block card in session 69 in isolation (mockup didn't show mall context); carrying treatment up is the simpler path than un-carding the booth block. |
| D9 | PinGlyph + XGlyph in spine column. | **Both kept.** Pin = mall, X = booth — the cartographic identity that earned its place on this page. With both blocks now carded, the spine reads as connecting tissue between two stops. | Claude recommendation, David approval. |
| D10 | Hairline tick between glyphs. | **Kept; `minHeight` grows to span both cards.** Likely 56–78px depending on address line wrap. Pixel decision at implementation time, not a concept change. | Claude recommendation, David approval. |
| D11 | BoothHero post-it `minHeight: 96` on `/shelf/[slug]`. | **Out of scope.** Different page, different concern (post-it sizing on the booth-detail page); separate session-69 carry note. | Claude recommendation, David approval. |
| D12 | `/find/[id]` post-it eyebrow text. | **Collapse two-line `"Booth\nLocation"` → single-line `"Booth"`.** Mirrors session-69 D10 treatment on `BoothHero` post-it (`/shelf/[slug]`). Vendor + booth context already established by page identity; "Location" is redundant chrome. Visual style otherwise unchanged. | David, session 70 (added during iPhone review). |

**All five decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## File-level changes

### [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — cartographic block + post-it

The cartographic block lives around line 1027–1200 (per session-69 inventory). The post-it lives in the find-photo button block around line 872–932.

#### Change 1: Mall block carding (D8 + D9 + D10)

Today the mall block renders as plain content in the cart-content stack:

```jsx
{mallName ? (
  <div /* mall-block-plain */>
    <div style={{ fontFamily: FONT_IM_FELL, fontSize: 18, color: v1.inkPrimary, ...}}>
      {mallName}
    </div>
    {mallAddress ? (
      <div style={{ fontFamily: FONT_SYS, fontSize: 14, color: v1.inkMuted, ...}}>
        {mapLink ? <a href={mapLink} ...>{mallAddress}</a> : mallAddress}
      </div>
    ) : null}
  </div>
) : null}
```

Replace with the parallel-card treatment:

```jsx
{mallName ? (() => {
  const inner = (
    <>
      <div style={{
        fontFamily: FONT_SYS,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: v1.inkMuted,
        marginBottom: 3,
      }}>
        Mall
      </div>
      <div style={{
        fontFamily: FONT_IM_FELL,
        fontSize: 18,
        color: v1.inkPrimary,
        lineHeight: 1.25,
        letterSpacing: "-0.005em",
        marginBottom: mallAddress ? 4 : 0,
      }}>
        {mallName}
      </div>
      {mallAddress ? (
        <div style={{ fontFamily: FONT_SYS, fontSize: 14, color: v1.inkMuted }}>
          {mapLink ? (
            <a
              href={mapLink}
              onClick={(e) => e.stopPropagation()}
              style={{
                color: "inherit",
                textDecoration: "none",
                borderBottom: "1px dotted var(--ink-faint)",
              }}
            >
              {mallAddress}
            </a>
          ) : mallAddress}
        </div>
      ) : null}
    </>
  );

  const cardStyle = {
    background: v1.inkWash,
    border: "1px solid var(--ink-hairline)",
    borderRadius: 10,
    padding: "12px 14px",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  } as const;

  return mallSlug ? (
    <Link href={`/mall/${mallSlug}`} style={cardStyle}>{inner}</Link>
  ) : (
    <div style={cardStyle}>{inner}</div>
  );
})() : null}
```

Notes:
- The address-line `mapLink` keeps its existing `<a>`-tap behavior; `e.stopPropagation()` prevents the wrapping card link from also firing on address tap. Address opens map app; rest of card opens mall page.
- `mallSlug` field — confirm it exists on the post/find data shape. If not currently fetched, add to the SELECT or fall back to non-tappable card (still visually identical).

#### Change 2: Hairline tick height (D10)

The tick element in the spine column (around line 1085–1095, depending on exact session-69 line layout) currently has `minHeight: 48`. Increase to `minHeight: 56` (or measure on device — the tick should span the gap between PinGlyph (top of mall card) and XGlyph (top of booth card) without compressing). Consider switching from `minHeight` to `flex: 1` if the parent has the right flex constraints — the spine column's `display: flex; flex-direction: column` layout already supports this; the tick can `flex: 1` and the height will track whatever the cards expand to.

#### Change 3: Post-it eyebrow collapse (D12)

In the find-photo post-it block (around line 880–910 per session-69 inventory):

Today:

```jsx
<div style={{
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 14,
  lineHeight: 1.05,
  color: v1.inkMuted,
  textAlign: "center",
  marginBottom: 6,
}}>
  Booth<br />Location
</div>
```

Becomes:

```jsx
<div style={{
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 14,
  lineHeight: 1.05,
  color: v1.inkMuted,
  textAlign: "center",
  marginBottom: 6,
}}>
  Booth
</div>
```

(Drops the `<br />Location`.)

The post-it `minHeight: 92` may now feel slightly tall against the collapsed eyebrow — verify on device. If it reads tall, drop `minHeight` to `~76` (or remove it and let content size). Implementation pixel decision; not a design D.

#### Change 4: Spine column glyph alignment (verify)

With the mall block now in a card with consistent padding, the PinGlyph's vertical alignment may shift relative to the eyebrow. The session-69 booth-card setup already documents the XGlyph aligns to the vendor-name baseline (line 1066 comment). Verify the PinGlyph aligns to the mall-name baseline post-this-change; if it drifts, adjust `paddingTop` on the glyph wrapper (currently `3` per session-69 inventory).

---

## Surface × treatment matrix

| Element | Before (session-69 ship state) | After (this record) |
|---|---|---|
| Mall block container | Plain content stack | inkWash card (10px radius, 12/14 padding) |
| Mall eyebrow | Absent | Small-caps `MALL` (sans 9.5px / 700 / 0.10em / inkMuted) |
| Mall name | IM Fell 18px / inkPrimary | IM Fell 18px / inkPrimary (unchanged) |
| Mall address | Sans 14px inkMuted, dotted-underline `mapLink` | Sans 14px inkMuted, dotted-underline `mapLink` (unchanged, with `e.stopPropagation()` on tap) |
| Mall card tap target | N/A (not a card) | Whole card → `/mall/[slug]` when slug exists |
| Booth block | inkWash card with `BOOTH NN` eyebrow + IM Fell 18px name + inline visit-link | Unchanged from session 69 |
| Spine PinGlyph | 18px at top of spine column | Unchanged |
| Spine XGlyph | 15px at bottom of spine column, baseline-aligned to vendor name | Unchanged |
| Spine hairline tick | 1px wide, `minHeight: 48` | Same width, `minHeight: 56` or `flex: 1` to span both cards |
| Find-photo post-it eyebrow | Two-line `"Booth\nLocation"` IM Fell italic 14px | Single-line `"Booth"` IM Fell italic 14px |
| Post-it `minHeight: 92` | Sized for two-line eyebrow | Verify on device; reduce to `~76` if tall |
| Post-it visual style (size, rotation, pin, numeral) | Unchanged from session 69 | Unchanged |

---

## Out of scope

- **BoothHero post-it on `/shelf/[slug]`** — separate session-69 carry note (D11). Different page, different concern.
- **Sold-state visual** — orthogonal axis. Sold treatment stays as-is.
- **Cartographic spine retirement** — `/find/[id]` keeps its cartographic identity per Q1 = Hybrid call. Retirement only happens on `/flagged` per Record 1.
- **Find rail (`<ShelfCard>`)** — session 69 already unified the rail caption; not touched here.
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` token cleanup** — orphan check is captured in Record 1 / Session 69 carry notes; not blocking this record.

---

## Acceptance criteria (5)

1. The cartographic block on `/find/[id]` shows two parallel inkWash cards: mall card on top with `MALL` eyebrow + mall name + (optional) address; booth card below with `BOOTH NN` eyebrow + vendor name + inline visit-link.
2. The PinGlyph + hairline tick + XGlyph spine column is preserved; tick `minHeight` (or `flex: 1`) spans both cards without compressing.
3. The mall card is tappable as a whole when `mallSlug` exists, navigating to `/mall/[slug]`. Address-line `mapLink` tap still opens the map app independently (event propagation stopped).
4. The find-photo post-it shows a single-line `"Booth"` eyebrow above the booth numeral; visual style otherwise unchanged from session 69 (size, rotation, font family, color, pin).
5. Post-it `minHeight` either stays at 92 with the collapsed eyebrow looking acceptable, OR is reduced to ~76 if the post-it reads tall against the single-line eyebrow on device.
