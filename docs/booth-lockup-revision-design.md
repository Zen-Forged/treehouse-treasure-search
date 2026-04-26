# Booth + vendor lockup revision — Design record

> **Status:** 🟢 Ready (frozen session 70 round 2, 2026-04-26).
> **Mockup:** [`docs/mockups/booth-lockup-revision-v1.html`](mockups/booth-lockup-revision-v1.html).
> **Effort:** S (1 commit — three surfaces share the same swap).
> **Purpose of this doc:** Freeze design decisions for the post-iPhone-QA revision of the session-69 Option B booth-label treatment. David approved on iPhone; this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Replace session 69's Option B treatment (small-caps `BOOTH NN` eyebrow stacked above vendor name in a single inkWash card) with **Variant B**: vendor name on the left, "BOOTH" small-caps label + IM Fell numeral stacked on the right of the same card. Three surfaces affected — Booths grid VendorCard, Find Map sectioned-list booth header, Find Detail cartographic booth card.

The session-69 stacked-eyebrow pattern didn't land on iPhone — David's verbatim feedback: *"the booth and name lockup still isn't landing for me."* The right-side stacked treatment surfaces the booth number as a visual focal point on the right, parallel to how the cartographic post-it on `/find/[id]` already presents booth numerals. The vendor name keeps its left-anchored 18px IM Fell weight as the primary identity.

The shipped behavior:

1. **Lockup layout** — two-column grid `1fr auto` inside the existing inkWash card. Left column: IM Fell 18px vendor name + (Find Detail only) sans 11px green "Visit the booth →" inline under the vendor name. Right column: stacked "BOOTH" label + numeral, right-aligned.
2. **Right-column typography (Variant B)** — `BOOTH` label as small-caps sans (9px / 700 weight / 0.12em letter-spacing / uppercase / inkMuted), 4px above the numeral. Numeral as IM Fell 26px / inkPrimary / line-height 1 / -0.01em letter-spacing.
3. **Vertical alignment** — `align-items: center` on the lockup grid. Long vendor names truncate with single-line ellipsis.
4. **Visit-link (Find Detail only, Treatment C)** — sans 11px / 500 weight / green / 3px gap below the vendor name. Whole card remains tappable as a Link to `/shelf/[vendorSlug]`; the inline visit-link is for first-time discoverability of the affordance.
5. **Find Map all-malls mall subtitle** — preserved unchanged from session-70 Record 1: sans 11.5px / inkMuted, 6px below the lockup, only visible when scope = "All malls."

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| L1 | Layout direction. | **Vendor name LEFT, booth identifier RIGHT.** Reverses session 69's stacked-eyebrow (booth above vendor); the right-column treatment makes the booth numeral a visual focal point parallel to the post-it numeral on `/find/[id]`. | David, session 70 round 2. |
| L2 | "Booth" label typography. | **Small-caps sans, 9px, 700 weight, 0.12em letter-spacing, uppercase, inkMuted.** Carries session-69 eyebrow vocabulary into the right block. | David picked Variant B. |
| L3 | Numeral typography. | **IM Fell / inkPrimary / line-height 1 / -0.01em letter-spacing.** Size scales per surface to maintain a numeral-larger-than-vendor ratio (~1.4x). Find Map booth section header + Find Detail cartographic card: 26px (vendor name 18px). Booths grid VendorCard: 20px (vendor name stays at 14px to preserve tile-tile parity with bio + photo above). Lockup structure is identical across all three. | David picked Variant B. |
| L4 | Numeral right-alignment. | **`align-items: flex-end` on the booth-block.** Right-anchors both label + numeral; reads as a unit. | Claude recommendation, David approval (implicit via Variant B). |
| L5 | Visit-link treatment on Find Detail (`/find/[id]`). | **Treatment C — inline below vendor name on the left column.** Sans 11px / 500 weight / green / 3px gap below the vendor name. Whole card stays tappable as the primary affordance; inline link is for discoverability. | David picked Treatment C. |
| L6 | Visit-link on Booths grid + Find Map. | **Not applicable (no change).** Neither surface had a visit-link before; whole-card tap remains the affordance on both. | Existing design preserved. |
| L7 | Long vendor name handling. | **Single-line ellipsis (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`).** Stress test in mockup confirmed the right block holds at 4-digit booths even with long names that truncate. | Stress-tested in mockup. |
| L8 | Card surface, padding, border. | **Unchanged from session 69 (and session 70 Record 1 carry-through):** `v1.inkWash` background + 1px hairline + 8px border radius + 12/14 padding. | Existing token reuse. |
| L9 | Mall subtitle (Find Map all-malls scope). | **Unchanged from session 70 Record 1:** sans 11.5px / inkMuted, 6px below the lockup, only visible when scope = "All malls." | Existing design preserved. |

**All nine decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## File-level changes

### [`app/shelves/page.tsx`](../app/shelves/page.tsx) — Booths grid VendorCard

The current `VendorCard` (search for `Booth ${booth_number}` eyebrow) renders the small-caps eyebrow above the IM Fell vendor name in the card body. Restructure as:

```jsx
<div style={{
  display: "grid",
  gridTemplateColumns: "1fr auto",
  columnGap: 12,
  alignItems: "center",
}}>
  <div style={{
    fontFamily: FONT_IM_FELL,
    fontSize: 18,
    color: v1.inkPrimary,
    lineHeight: 1.25,
    letterSpacing: "-0.005em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  }}>
    {vendor.display_name}
  </div>
  {boothNumber && (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1 }}>
      <div style={{
        fontFamily: FONT_SYS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: v1.inkMuted,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        Booth
      </div>
      <div style={{
        fontFamily: FONT_IM_FELL,
        fontSize: 26,
        color: v1.inkPrimary,
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}>
        {boothNumber}
      </div>
    </div>
  )}
</div>
```

The card body's bio (if surfaced) and any other content stays below this lockup unchanged.

### [`app/flagged/page.tsx`](../app/flagged/page.tsx) — Find Map booth section header

The `BoothSection` header card (shipped session 70 Record 1) currently has the small-caps `BOOTH NN` eyebrow above vendor name. Restructure to the same lockup pattern, preserving the optional mall subtitle for the all-malls scope.

```jsx
<div style={{
  display: "grid",
  gridTemplateColumns: "1fr auto",
  columnGap: 12,
  alignItems: "center",
}}>
  <div style={{ /* vendor IM Fell 18px, ellipsis */ }}>
    {group.vendorName}
  </div>
  {group.boothNumber && (
    <div style={{ /* booth-block, flex-end */ }}>
      <div style={{ /* small-caps BOOTH label */ }}>Booth</div>
      <div style={{ /* IM Fell 26px numeral */ }}>{group.boothNumber}</div>
    </div>
  )}
</div>
{scopeIsAllMalls && group.mallName && (
  <div style={{
    fontFamily: FONT_SYS,
    fontSize: 11.5,
    color: v1.inkMuted,
    marginTop: 6,
    lineHeight: 1.4,
  }}>
    {group.mallName}{group.mallCity ? ` · ${group.mallCity}${group.mallState ? `, ${group.mallState}` : ""}` : ""}
  </div>
)}
```

When `boothNumber` is absent (the "No booth listed" rare case), the right column drops entirely and the vendor name expands across the full width. No "No booth listed" eyebrow string in the new lockup — if there's no booth, just show the vendor name alone.

### [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — Find Detail cartographic booth card

The booth card inside the cartographic block (around `<Link href={`/shelf/${vendorSlug}`}>`) currently has the eyebrow above + space-between row of vendor name + visit-link. Restructure to the lockup grid + Treatment C visit-link inline under vendor name:

```jsx
<div style={{
  display: "grid",
  gridTemplateColumns: "1fr auto",
  columnGap: 12,
  alignItems: "center",
}}>
  <div style={{ minWidth: 0 }}>
    {vendorName && (
      <div style={{
        fontFamily: FONT_IM_FELL,
        fontSize: 18,
        color: v1.inkPrimary,
        lineHeight: 1.25,
        letterSpacing: "-0.005em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {vendorName}
      </div>
    )}
    {vendorSlug && (
      <div style={{
        fontFamily: FONT_SYS,
        fontSize: 11,
        fontWeight: 500,
        color: v1.green,
        marginTop: 3,
        lineHeight: 1,
      }}>
        Visit the booth →
      </div>
    )}
  </div>
  {boothNumber && (
    <div style={{ /* booth-block, flex-end */ }}>
      <div style={{ /* small-caps BOOTH label */ }}>Booth</div>
      <div style={{ /* IM Fell 26px numeral */ }}>{boothNumber}</div>
    </div>
  )}
</div>
```

The wrapping `<Link>` continues to make the whole card tappable when `vendorSlug` exists; the inline visit-link is a discoverability hint, not a separate target.

---

## Surface × treatment matrix

| Surface | Lockup | Visit-link |
|---|---|---|
| Booths grid (`/shelves`) VendorCard | Variant B lockup | N/A (whole card → `/shelf/[vendorSlug]`) |
| Find Map (`/flagged`) booth section header | Variant B lockup + (all-malls only) mall subtitle | N/A (whole card → `/shelf/[vendorSlug]`) |
| Find Detail (`/find/[id]`) cartographic booth card | Variant B lockup | Treatment C — inline sans 11px green link under vendor name |

---

## Out of scope

- **BoothHero post-it on `/shelf/[slug]`** — separate session-69 carry note (post-it `minHeight: 96`); not touched here.
- **Find Detail mall card eyebrow** — `MALL` eyebrow vocabulary preserved (session 70 Record 2). Mall card stays in its session-70 stacked treatment.
- **Tile captions on FindTile / VendorCard photo blocks** — session-69 unified card treatment preserved.
- **Booth-related analytics events** — no event-name changes.

---

## Acceptance criteria (5)

1. The Booths grid VendorCard renders vendor name on the left + stacked "Booth" label (small-caps) + IM Fell numeral on the right, both inside the same inkWash card. No standalone eyebrow above vendor name.
2. The Find Map sectioned-list booth section header renders the same lockup. Mall subtitle still appears below when scope = "All malls"; hidden when filtered to one mall.
3. The Find Detail cartographic booth card renders the lockup + an inline sans 11px green "Visit the booth →" link 3px below the vendor name on the left column.
4. Long vendor names (e.g. 30+ characters) single-line truncate with ellipsis without crowding the right-side numeral.
5. 4-digit booth numbers (e.g. 2418) render in the right block at IM Fell 26px without clipping or breaking the lockup.
