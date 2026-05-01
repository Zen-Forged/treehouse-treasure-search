# `<FormField>` + `<FormButton>` Primitives — Design Record

> **Status:** DRAFT — decisions D1–D5 awaiting David's mockup review.
> **Phase:** 2 Session D (per [`docs/design-system-phase2-plan.md`](design-system-phase2-plan.md)).
> **Mockup:** [`docs/mockups/form-chrome-primitive-v1.html`](mockups/form-chrome-primitive-v1.html).
> **Build spec:** TBD — written only after David approves the mockup.

This is a **decision doc**, not a build doc.

---

## Why these primitives

Phase 1 audit + Session-D pre-flight grep across 10 form surfaces found drift on every visual axis. Every form is its own snowflake.

### Inputs (10 surfaces)

| Drift axis | Pattern A | Pattern B | Pattern C |
|---|---|---|---|
| Background | `v1.postit` (#fbf3df) — 4 | `v1.inkWash` (rgba 0.70) — 6 | — |
| Padding | `14×14` — 3 (page) | `11×12` — 6 (sheet) | `18×14` — 1 (admin/login PIN) |
| Radius | `14` — page | `10` — sheet | — |
| Border | `1px solid v1.inkHairline` — universal ✓ | — | — |

### Labels

| Drift axis | Pattern A | Pattern B |
|---|---|---|
| Size | `15` — vendor-request (1) | `13` — everywhere else (8) |
| Style | italic — login/email (1) | upright — everywhere else (8) |
| Color | `inkMid` — most | `inkMuted` — login/email |

### Primary CTA

| Drift axis | Pattern A | Pattern B | Pattern C |
|---|---|---|---|
| Padding | `15` — page (4) | `12` — sheet (3) | `14×22` — setup outlier |
| Radius | `14` — page | `10` — sheet | — |
| Enabled shadow | `0 2px 14px rgba(...,0.22)` — page (3) | `0 2px 12px rgba(...,0.25)` — post/preview | `0 2px 10px rgba(...,0.18)` — sheet (3) |
| Disabled bg | `rgba(30,77,43,0.40)` (6) | `rgba(30,77,43,0.30)` (2 sheets) | — |
| Disabled shadow | none — universal ✓ | — | — |

### `Buttons.tsx`

**Zero callers confirmed.** Exports `PrimaryButton` + `SecondaryButton` + `DangerButton` — all unused. Safe to retire.

---

## Two-tier scale, one primitive

The drift maps cleanly to **page** vs **sheet** scale. That's not drift — that's a real scale tier. The primitives accept a `size?: "page" | "compact"` prop. Default `"page"`. Sheets pass `size="compact"`.

| Token | `size="page"` | `size="compact"` |
|---|---|---|
| Label size | 15 | 13 |
| Input padding | 14 × 14 | 11 × 12 |
| Input radius | 14 | 10 |
| CTA padding | 15 | 12 |
| CTA radius | 14 | 10 |
| CTA shadow (enabled) | `v1.shadow.ctaGreen` = `0 2px 12px rgba(30,77,43,0.22)` | new token `v1.shadow.ctaGreenCompact` = `0 2px 10px rgba(30,77,43,0.18)` |

**Convergent picks (settled):**
- Input bg: `v1.postit` for both tiers.
- Input border: `1px solid v1.inkHairline`.
- Label family + style: `FONT_LORA` upright, `v1.inkMid`, weight 400.
- CTA bg: `v1.green` enabled · `v1.greenDisabled` (rgba 0.40) disabled.
- CTA color: `v1.onGreen` (#fff).
- Disabled CTA shadow: none.

---

## Decisions to freeze (D1–D5)

| D# | Question | My read |
|---|---|---|
| **D1** | Input background — `v1.postit` (warm paper-honest, used 4×) or `v1.inkWash` (translucent panel, used 6×)? | **postit.** Most recent commitment was session 94 (/post/preview canonized postit). Postit reads as paper-honest; inkWash reads as cut-out panel. Postit is more on-brand. Adopt for both tiers. |
| **D2** | Label register — drop italic + drop inkMuted, converge to upright `15` (page) and `13` (sheet) FONT_LORA `inkMid`. | **Adopt session 82's two-tier register.** Retires login/email's italic 13 inkMuted (single outlier); aligns the rest. |
| **D3** | CTA padding — `15` page · `12` sheet · setup's `14×22` is an outlier. | **15 / 12.** Setup adopts page-tier `15`. Two clean tiers, no special cases. |
| **D4** | `Buttons.tsx` (zero callers) — retire or rebuild? | **Retire.** Confirmed zero callers via grep. New `<FormButton>` lives at `components/FormButton.tsx` as inline-style; no Tailwind. |
| **D5** | Page-tier CTA shadow — converge `0 2px 14px rgba(...,0.22)` (3 surfaces) + `0 2px 12px rgba(...,0.25)` (post/preview) to session-95's `v1.shadow.ctaGreen` = `0 2px 12px rgba(...,0.22)`? | **Yes — adopt the token.** 14px-blur → 12px-blur is barely perceptible; 0.25 → 0.22 is barely perceptible. The token already exists; this is its first adoption. |

### Settled (no decision needed)

- **Disabled shadow:** none — already universal.
- **Disabled bg:** `v1.greenDisabled` (rgba 0.40) — retires the 0.30 outliers on EditBoothSheet + AddBoothSheet.
- **Sheet CTA shadow:** new token `v1.shadow.ctaGreenCompact` = `0 2px 10px rgba(...,0.18)` — formalizes the current sheet-tier 3 surfaces.
- **Input bg both tiers:** `v1.postit`.

### Out of scope (V1)

- **`<FormField>` API shape** — children-passes-input pattern. Caller renders `<input>` / `<textarea>` (preserves auto-grow, autoComplete, ref forwarding). Primitive owns label + chrome wrapper. Build-spec-level decision; not for mockup review.
- **Helper text + error states.** Add when first surface needs them.
- **Icon-bubble buttons (44px back / close).** Already a separate primitive scope (StickyMasthead owns back; sheets own close).
- **Italic dotted-link helper** — surface as `<FormButton variant="link">`. Render = italic Lora, dotted underline, inkMid, no fill, no shadow. Used for "Resend" / "Sign in instead" / "Sign out". Single-line decision in mockup, no separate D-row.
- **Setup wide CTA padding.** Migrates to page-tier `15` (D3); setup-specific 14×22 not preserved.

---

## Migration map

### Page-tier surfaces (5 with forms; +contact text-only)

| Surface | File | Inputs | Labels | CTA |
|---|---|---|---|---|
| /vendor-request | `app/vendor-request/page.tsx` | inkWash → postit | 15 ✓ | 15 ✓ · token shadow |
| /login/email | `app/login/email/page.tsx` | postit ✓ | 13 italic → 15 upright | 15 ✓ · token shadow |
| /post/preview | `app/post/preview/page.tsx` | postit ✓ | 13 → 15 | 15 ✓ · 0.25 → 0.22 token shadow |
| /admin/login | `app/admin/login/page.tsx` | inkWash → postit · 18×14 PIN → 14×14 | 13 → 15 | 15 ✓ · token shadow |
| /setup | `app/setup/page.tsx` | N/A | N/A | 14×22 → 15 |

### Sheet-tier surfaces (4)

| Surface | File | Inputs | Labels | CTA |
|---|---|---|---|---|
| BoothFormFields | `components/BoothFormFields.tsx` | inkWash → postit | 13 ✓ | 12 ✓ · ctaGreenCompact |
| AddBoothInline | `components/AddBoothInline.tsx` | inkWash → postit | 13 ✓ | 12 ✓ · ctaGreenCompact |
| EditBoothSheet | `components/EditBoothSheet.tsx` | inkWash → postit | 13 ✓ | 12 ✓ · 0.30 → 0.40 disabled · ctaGreenCompact |
| AddBoothSheet | `components/AddBoothSheet.tsx` | inkWash → postit | 13 ✓ | 12 ✓ · 0.30 → 0.40 disabled · ctaGreenCompact |

---

## Risk

**Medium-high.** This touches every form surface in the activation funnel.

Mitigation:
- Smallest→largest sequencing — `<FormButton>` ships first (lower risk; one bug class), then `<FormField>` (touches more surfaces), then per-page migration commits.
- /login/email migrates first as the single-surface verify (per session-95 PolaroidTile playbook).
- Booth-sheet migrations bundled last (most-isolated chrome).
- iOS Safari postit + autofill yellow chrome interaction — verify on device. (Known: iOS overrides input bg with autofill yellow on remembered fields.)
