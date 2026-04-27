# Booth-numeral font system — design record

**Status:** Ready (decisions frozen 2026-04-27, session 75).
**Mockup:** [`docs/mockups/booth-numeral-font-v1.html`](mockups/booth-numeral-font-v1.html) — the mockup is the authority. If this doc and the mockup disagree, the mockup wins.

---

## Why this exists

Session 74 Gemba walk surfaced item 7 — the IM Fell `1` reads as a serifed `I` at small numeral sizes, especially with mixed alphanumeric booth IDs like `D19` (the literal Gemba photo example) or `A1`. IM Fell is the right voice for editorial headers but the wrong shape for digit-disambiguation.

Times New Roman has been in the codebase since v1.1l as `FONT_POSTIT_NUMERAL`, applied narrowly to the 36px booth post-it numeral. The session-11l rationale was identical to today's: 1-vs-I disambiguation. The token's name ("postit") is what kept the fix scoped to one surface — every other numeral surface stayed on IM Fell because the token didn't apply.

This record extends that fix across all booth numerals + counts and renames the token so the rule is self-evident.

---

## Decisions (frozen)

| # | Decision | Choice |
|---|---|---|
| **D1** | The rule: IM Fell for headers + editorial voice; `FONT_NUMERAL` for booth numerals + counts; sans for body | ✅ Approved |
| **D2** | Font choice for `FONT_NUMERAL` | ✅ **Times New Roman** — already in codebase, no webfont load, disambiguated `1`, battle-tested at 36px on the post-it |
| **D3** | Scope of the swap | ✅ **Booth numerals AND count chips** (clean single rule, not split) |
| **D4** | Rename `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` | ✅ Approved |
| **D5** | Italic posture for counts | Counts stay **non-italic** (italic Times New Roman at 22px reads old-fashioned). Eyebrow text around the count stays IM Fell italic; the numeric prefix is the only piece that changes font + posture. |

---

## What this rule covers (and does NOT)

### `FONT_NUMERAL` applies to:
- BoothPage post-it 36px booth numeral — *already on Times New Roman, no change after rename*
- Booths grid Variant B booth numeral (20px, on `/shelves` and any future Booths surface)
- Find-detail Variant B post-it numeral (currently 26px, `/find/[id]` mall card right slot)
- `/flagged` Variant B booth numeral on inkWash card headers
- MallScopeHeader count chip — the 22px numeric prefix only, NOT the surrounding eyebrow text

### IM Fell stays for:
- Page titles (28–32px) — vendor names, mall names, "Vendor Sign in," etc.
- Mastheads (the wordmark)
- Eyebrows ("a curated shelf from," "Booth," small-caps section headers)
- ViewToggle, BoothCloser
- Tile captions on find tiles (per session 70 D2)
- Any other editorial / decorative voice surface

### Sans (FONT_SYS) stays for:
- Body copy, captions under price, address lines, geo lines
- Form inputs + buttons + nav chrome
- "Booth" small-caps eyebrows above the booth numeral (these are letters, not numbers — still need readability at small uppercase)

The rule reads cleanly: **letters → IM Fell or sans; numbers → Times New Roman.**

---

## Implementation (after design-to-Ready commit)

1. **`lib/tokens.ts`:** rename `fonts.postitNumeral` → `fonts.numeral`. Update value comment to capture the broader scope. Rename `FONT_POSTIT_NUMERAL` named export → `FONT_NUMERAL`. Keep the value (`'"Times New Roman", Times, serif'`) unchanged.
2. **`components/BoothPage.tsx`:** update import + re-export. The line-259 post-it numeral usage stays as-is structurally.
3. **`components/VendorCard.tsx`:** swap booth numeral `FONT_IM_FELL` → `FONT_NUMERAL`.
4. **`app/find/[id]/page.tsx`:** swap find-detail Variant B numeral `FONT_IM_FELL` → `FONT_NUMERAL`.
5. **`app/flagged/page.tsx`:** swap inkWash card header booth numeral `FONT_IM_FELL` → `FONT_NUMERAL`.
6. **`components/MallScopeHeader.tsx`:** line 64 inner `<span>` (the count prefix). Add `fontFamily: FONT_NUMERAL` + `fontWeight: 500` to it. Eyebrow text outside the span stays `FONT_IM_FELL` italic.
7. **Documentation update:** add the rule to `docs/design-system.md` Status block when next consolidation happens. Update [`docs/booth-lockup-revision-design.md`](booth-lockup-revision-design.md) L3 to reference `FONT_NUMERAL` (not "IM Fell 20px") as the baseline.

### Grep targets for the implementation pass
- `FONT_POSTIT_NUMERAL` (one rename target — only used in `lib/tokens.ts` and `components/BoothPage.tsx`)
- `FONT_IM_FELL` near booth-numeral or count-numeral renderings — cross-check against the surface list above; do NOT swap headers, eyebrows, or page titles.

---

## Acceptance criteria (for the iPhone QA pass after implementation)

- [ ] Booth `D19` on `/shelves` Booths grid reads `D19`, not `DI9`.
- [ ] Booth `A1` on Booths grid reads `A1`, not `AI`.
- [ ] Booth `11` on the 36px post-it reads `11` clearly, not `II`.
- [ ] MallScopeHeader count chip on Home / Booths / Find Map reads as a Times New Roman 22px numeral with IM Fell italic eyebrow text around it.
- [ ] Page titles (e.g. "America's Antique Mall," "The Velvet Cabinet") still render IM Fell — not accidentally swapped.
- [ ] No webfont network request added (Times New Roman ships with iOS/macOS/Windows).
- [ ] BoothPage 36px post-it visually unchanged from production today (acts as a control — already TNR pre-rename).

---

## Carry-forwards into future sessions

- **L10 (new lockup decision):** the booth-numeral font is `FONT_NUMERAL` (Times New Roman). This supersedes the L3 "IM Fell 20px" baseline in [`docs/booth-lockup-revision-design.md`](booth-lockup-revision-design.md) — do not reintroduce IM Fell for booth numerals when refreshing the Variant B lockup.
- **The "letters → IM Fell, numbers → Times New Roman" rule is project-wide.** When introducing a new surface that has a numeric component (a count, an ID, a price, a year), default to `FONT_NUMERAL`. Prices already use `FONT_SYS` (`v1.priceInk` 12px) — that's a separate concern (sans for body / commerce, not editorial); only swap to `FONT_NUMERAL` when the number is a *display* numeral, not body data.
- **`FONT_NUMERAL` is a NUMERAL token, not a serif token.** If a future session wants a "modern serif body" (e.g. for a vendor bio), do NOT reach for `FONT_NUMERAL` — that's a different design problem. Pick a serif body font deliberately, not by reuse.
- **MallScopeHeader pattern.** The split treatment ("IM Fell italic eyebrow + Times New Roman numeric prefix in a span") is a reusable pattern. If a future surface wants to highlight a number inside an italic editorial line (e.g. "shipped 47 finds last week"), this is the established way.

---

## What this record explicitly does NOT cover

- Adding new fonts to the system. Times New Roman is already in production.
- Changing IM Fell anywhere outside booth-numeral / count surfaces. Headers, page titles, eyebrows, BoothCloser stay.
- Sans font for prices. Prices keep `FONT_SYS` `v1.priceInk` 12px (this is body/commerce voice, not display-numeral voice).
- The "Booth" small-caps eyebrow above each numeral. That stays `FONT_SYS` 9px 700 letter-spaced — letters in tight sans tracking is the right voice there.
