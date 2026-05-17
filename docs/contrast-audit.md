# Contrast + Legibility Audit — Session 171 (Audit B)

> **Source ask:** David — "We need to do a full audit on contrast and legibility for this to launch. I see this also on other pages where the font is roughly the same size and color like on the profile page to login."
>
> **Trigger:** "A curated booth by" eyebrow at [`components/BoothPage.tsx:417`](../components/BoothPage.tsx) (Cormorant italic 16px, `v2.text.secondary` on `v2.surface.warm`) reading hard for the 40-65 demographic.
>
> **Audit scope:** ≤14px text + 15-16px italic in `v2.text.muted` / `v2.text.secondary` / `v1.inkMuted` / `v1.inkFaint` against `v2.bg.main` / `v2.surface.warm` / `v2.surface.card` / `v1.paperCream` backgrounds.
>
> **Status:** Launch-blocking. This doc is the **input** for a follow-on fix-bundle session (David picks the bundle scope from the offender tables below).

---

## Token reference

Resolved from `:root` CSS variables in `lib/tokens.ts`:

| Token | Hex | Role |
|---|---|---|
| `v2.text.primary` | `#2B211A` | Body / headings — high contrast |
| `v2.text.secondary` | `#5C5246` | Subheads / metadata — darkened session 153 R8A (#756A5E → #5C5246) but **insufficient at italic + ≤16px** per this audit |
| `v2.text.muted` | `#A39686` | Currently used for icons + dividers + form helpers + placeholders — **failing as a TEXT color at all tested sizes** |
| `v2.bg.main` | `#E6DECF` | Body background, masthead, nav |
| `v2.surface.warm` | `#FBF6EA` | Card warm bg |
| `v2.surface.card` | `#FFFCF5` | Card light bg (also `v2.surface.input` — same value since session 157) |
| `v1.inkMuted` | (legacy v1, ≈ #756A5E pre-darkening) | Used on a few remaining v1-layer surfaces (/find/[id], /shelf address) |
| `v1.inkFaint` | (legacy v1, ≈ #B5AC9A) | Hairlines + dotted-underline decorations |

---

## Summary

**Total offenders identified: 47 across 19 files**

| Tier | Count | Description | Priority |
|---|---|---|---|
| **Tier 1** | 16 | Small italic (13–16px) on secondary/muted | Critical — fix this beta |
| **Tier 2** | 18 | Small upright (10–14px) on muted | High — fix this beta |
| **Tier 3** | 9 | 15–16px italic on secondary | Borderline — italic stroke loss; fix recommended |
| **Bonus** | 17 | Dotted underline + faint decoration color | System-wide pattern fix (session 173 REC-2 re-enumeration; was 4) |

---

## Tier 1 — Critical (small italic, secondary/muted color)

These are the highest-risk legibility failures. All recommended fixes promote one tier darker.

| File:line | Surface | Element | Font | Size | Current → Suggested |
|---|---|---|---|---|---|
| [`components/BoothPage.tsx:417`](../components/BoothPage.tsx) | /shelf, /my-shelf | "A curated booth by" eyebrow | Cormorant italic | 16px | `v2.text.secondary` → **`v2.text.primary`** ✅ **shipped session 171 commit fb01c03** |
| [`app/login/page.tsx:442`](../app/login/page.tsx) | /login | "Just a moment" loading text | Cormorant italic | 15px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/login/email/handle/page.tsx:225`](../app/login/email/handle/page.tsx) | /login/email/handle | "This is how Treehouse remembers you" | Cormorant italic | 15px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/welcome/page.tsx:167`](../app/welcome/page.tsx) | /welcome | "Choose a path — you can switch anytime" | Cormorant italic | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/welcome/page.tsx:283`](../app/welcome/page.tsx) | /welcome | WelcomeRow subtitle (generic) | Cormorant italic | 11.5px | `v2.text.secondary` → **`v2.text.primary`** |
| [`components/BoothPage.tsx:596`](../components/BoothPage.tsx) | /shelf, /my-shelf | MallBlock address line | Inter | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`components/v2/SavedMallCardV2.tsx:168`](../components/v2/SavedMallCardV2.tsx) | /flagged (Saved) | Mall address label | Inter | 11.5px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/find/[id]/page.tsx:1125`](../app/find/[id]/page.tsx) | /find/[id] (v1 layer) | "Pin this booth" eyebrow | Lora italic | 15px | `v1.inkMuted` → **`v1.inkPrimary`** |
| [`app/shelf/[slug]/page.tsx:210`](../app/shelf/[slug]/page.tsx) | /shelf (v1 layer) | Address + dotted underline | Lora italic + dotted | 14px | `v1.inkMuted` → **`v1.inkPrimary`** (+ retire dotted per bonus pattern) |
| [`app/find/[id]/edit/page.tsx:385`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Form label (active state dynamic) | Inter | 14px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/find/[id]/edit/page.tsx:592`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Optional field label | Inter | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/post/preview/page.tsx:903`](../app/post/preview/page.tsx) | /post/preview | "(optional)" italic suffix | Inter italic | 12px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/login/email/handle/page.tsx:279`](../app/login/email/handle/page.tsx) | /login/email/handle | "Lowercase letters, numbers..." helper | Inter | 12px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/find/[id]/page.tsx:1152`](../app/find/[id]/page.tsx) | /find/[id] (v1 layer) | Address metadata | Lora | 13px | `v1.inkMuted` → **`v1.inkPrimary`** |
| [`components/BoothPage.tsx:688`](../components/BoothPage.tsx) | /shelf, /my-shelf | "Tap to add photos" prompt | Inter | 13px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/find/[id]/edit/page.tsx:634`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Tab label inactive state | Inter | 14px | `v2.text.muted` (conditional) → **`v2.text.secondary`** |

**Tier 1 fix bundle estimate:** ~16 single-line edits + 4-6 files touched. Single focused session (~30-45 min).

---

## Tier 2 — High (small upright on muted)

Form helper text, stat labels, secondary metadata at ≤14px on light backgrounds. **All suggest the same remap:** `v2.text.muted` → `v2.text.secondary` (#5C5246).

| File:line | Surface | Element | Font | Size |
|---|---|---|---|---|
| [`app/me/page.tsx:234`](../app/me/page.tsx) | /me | "Scouting since" stat | Inter uppercase | 10px |
| [`app/me/page.tsx:311`](../app/me/page.tsx) | /me | Stat label (generic) | Inter uppercase | 10px |
| [`components/v2/SavedEmptyState.tsx:43`](../components/v2/SavedEmptyState.tsx) | /flagged | Empty state message | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:307`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Field description | Inter | 14px |
| [`app/find/[id]/edit/page.tsx:345`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Helper text | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:472`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Helper text (variant) | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:508`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Counter label | Inter | 14px |
| [`components/ShareSheet.tsx:704`](../components/ShareSheet.tsx) | ShareSheet | Share option label | Inter | 13px |
| [`components/ShareSheet.tsx:937`](../components/ShareSheet.tsx) | ShareSheet email | Email hint placeholder | Inter | 13px |
| [`components/ShareSheet.tsx:1110`](../components/ShareSheet.tsx) | ShareSheet | "Copied!" flash text | Inter | 12px |
| [`components/ShareSheet.tsx:1133`](../components/ShareSheet.tsx) | ShareSheet | Share link copy label | Inter | 13px |
| [`components/ShareSheet.tsx:1170`](../components/ShareSheet.tsx) | ShareSheet | Fine print | Inter | 11px |
| [`app/post/preview/page.tsx:450`](../app/post/preview/page.tsx) | /post/preview | Field label | Inter | 13px |
| [`app/post/preview/page.tsx:491`](../app/post/preview/page.tsx) | /post/preview | Description helper | Inter | 13px |
| [`app/post/preview/page.tsx:503`](../app/post/preview/page.tsx) | /post/preview | Helper text | Inter | 13px |
| [`app/post/preview/page.tsx:543`](../app/post/preview/page.tsx) | /post/preview | Tags instruction | Inter | 13px |
| [`app/post/preview/page.tsx:649`](../app/post/preview/page.tsx) | /post/preview | Fine print | Inter | 12px |
| [`app/post/preview/page.tsx:708`](../app/post/preview/page.tsx) | /post/preview | Count label | Inter | 11px |

**Tier 2 fix bundle estimate:** Cleanest as a single `replace_all` per file (18 edits → ~6 file commits, single coupled commit if all retired to `v2.text.secondary`). ~30 min.

---

## Tier 3 — Borderline (15-16px italic on secondary)

Italic stroke loss at small sizes — same root cause as Tier 1 but slightly larger sizes give a borderline read. Fix recommended.

| File:line | Element | Font | Size | Current → Suggested | Note |
|---|---|---|---|---|---|
| [`components/v2/SavedEmptyState.tsx:43`](../components/v2/SavedEmptyState.tsx) | Empty state text | Cormorant | 14px | `v2.text.secondary` → **`v2.text.primary`** | (upright, borderline) |
| [`app/post/tag/page.tsx:892`](../app/post/tag/page.tsx) | Form label | Cormorant italic | 14px | `v2.text.secondary` → **`v2.text.primary`** | Cormorant italic loses stroke at 14px |
| [`app/find/[id]/edit/page.tsx:601`](../app/find/[id]/edit/page.tsx) | Label (Cormorant) | Cormorant | 14px | `v2.text.secondary` → **`v2.text.primary`** | |
| [`app/find/[id]/edit/page.tsx:514`](../app/find/[id]/edit/page.tsx) | Decorative dotted | Cormorant | 13px | `textDecorationColor: v1.inkFaint` → solid `v2.border.light` | Bonus pattern (decoration, not text) |

> Other Tier 3 items already listed under Tier 1 above (BoothPage.tsx:417 / login.tsx:442 / handle:225 / find:1125 / shelf:210).

---

## Bonus pattern — Dotted underline + faint decoration color

Reads as "broken underline" rather than "informational dotted" per session 46 precedent. **CRITICAL:** session 173 grep re-enumeration found **17 in-scope sites — 13 omitted from the original audit** (76% miss rate). Mixed-consumer collision risk: many files use `v2.text.muted` both as `color:` (prose text — should retire to `v2.text.secondary` per systemic recommendation #1) AND as `textDecorationColor:` (decoration — should retire dotted per this recommendation). Naive `replace_all v2.text.muted → v2.text.secondary` corrupts decoration semantics (darkens dotted 3.5×, perceptually doubles decoration weight, reads as solid underline distractor). **The structural fix per `feedback_kill_bug_class_after_3_patches` ✅ Promoted: sequence decoration retire FIRST (this section) so ARC-2 replace_all becomes safe by removing decoration consumers from the token entirely.**

### `v2.text.muted` decoration sites (9 in-scope; post-flow exclusion applies to preview/tag-only callsites)

| File:line | Element | Current | Suggested |
|---|---|---|---|
| [`components/BoothPage.tsx:648`](../components/BoothPage.tsx) | MallBlock address dotted underline (audit cited :600 — line drifted to :648 post-session-171) | `textDecorationColor: v2.text.muted` | Retire dotted; use solid `v2.border.light` |
| [`app/login/page.tsx:803`](../app/login/page.tsx) | Link dotted underline | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/login/page.tsx:896`](../app/login/page.tsx) | "Resend" link dotted | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/setup/page.tsx:444`](../app/setup/page.tsx) | Form helper dotted decoration | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/setup/page.tsx:460`](../app/setup/page.tsx) | Form helper dotted decoration | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/welcome/page.tsx:212`](../app/welcome/page.tsx) | WelcomeRow inline link dotted | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/vendor-request/page.tsx:864`](../app/vendor-request/page.tsx) | Form helper dotted decoration | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/vendor-request/page.tsx:880`](../app/vendor-request/page.tsx) | Form helper dotted decoration | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/vendor-request/page.tsx:898`](../app/vendor-request/page.tsx) | Form helper dotted decoration | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |

### `v1.inkFaint` decoration sites (8 in-scope on v1-layer + shared chrome primitives)

| File:line | Element | Current | Suggested |
|---|---|---|---|
| [`app/find/[id]/edit/page.tsx:514`](../app/find/[id]/edit/page.tsx) | Decorative dotted stroke (Tier 3 entry also lists this) | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`app/shelf/[slug]/page.tsx:261`](../app/shelf/[slug]/page.tsx) | Address dotted underline (paired with Tier 1 entry :210) | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`app/find/[id]/page.tsx:346`](../app/find/[id]/page.tsx) | Decorative dotted stroke | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`app/find/[id]/page.tsx:363`](../app/find/[id]/page.tsx) | Decorative dotted stroke | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`app/find/[id]/page.tsx:1158`](../app/find/[id]/page.tsx) | Address dotted underline (paired with Tier 1 entry :1152) | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`components/MallScopeHeader.tsx:147`](../components/MallScopeHeader.tsx) | Shared chrome dotted decoration | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`components/DestinationHero.tsx:125`](../components/DestinationHero.tsx) | Destination hero dotted decoration (session 170 primitive) | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |
| [`components/BoothLockupCard.tsx:168`](../components/BoothLockupCard.tsx) | Shared booth lockup dotted decoration | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |

### Excluded per Post-flow v1 cleanup boundary (audit out-of-scope per "Mapping pinned; full Arc 10 cleanup deferred")

`app/post/preview/page.tsx:755` + `app/post/preview/page.tsx:809` + `app/post/tag/page.tsx:462` + `app/post/tag/page.tsx:602` — these 4 sites carry into Arc 10 cleanup, not this fix-bundle.

---

## Systemic recommendations

### 1. Retire `v2.text.muted` as a TEXT color entirely

- **34 offenders** across Tier 1 + Tier 2 use `v2.text.muted` as the color for prose text
- Session 168 v1.inkMuted → v2.text.muted collapse was correct for icons + dividers (low contrast risk) but insufficient for readable prose at ≤14px
- **Recommendation:** Remap all PROSE consumers `v2.text.muted` → `v2.text.secondary`. Preserve `v2.text.muted` only for:
  - Icon colors (22px+ decorative; stroke at large sizes tolerates lower contrast)
  - Divider / hairline borders (1px strokes; structural, not readable)
  - Native HTML input placeholders (browser convention — overriding harms UX expectations)

### 2. Italic serif (Cormorant / Lora) at ≤15px on warm-cream

- Session 46 precedent: IM Fell italic at 13px retired (stroke loss on warm-cream)
- This audit: **Cormorant italic 13-16px** + **Lora italic 14-15px** show the same pattern
- **Recommendation:** Prefer upright serif for prose <16px. If italic required for editorial register, promote color to primary tier (Tier 1 mappings above).

### 3. Dotted decoration pattern

- **17 confirmed in-scope instances** (4 originally enumerated + 13 surfaced via session 173 grep audit per REC-2) where `textDecorationColor: v2.text.muted` OR `textDecorationColor: v1.inkFaint` reads as "broken" rather than "dotted info"
- **Mixed-consumer collision risk:** same files use `v2.text.muted` as `color:` (prose) AND `textDecorationColor:` (decoration) — naive replace_all corrupts decoration semantics
- **Recommendation:** Retire dotted-underline pattern system-wide for body text. Replace with solid `v2.border.light` hairlines OR drop decoration entirely. **Sequence FIRST in fix-bundle** so ARC-2 replace_all becomes safe (no decoration consumers remain on the token).

---

## Out of scope (intentional exclusions per project precedent)

| Exclusion | Rationale |
|---|---|
| `app/admin/*` + `components/admin/*` | Dark theme reseller layer (#050f05); session 162 EXCLUDED_PREFIXES audit exclusion (beta scope) |
| `app/finds`, `app/scan`, `app/decide` | Reseller-intel layer; different palette + audience |
| Post-flow v1 cleanup (post/preview, post/edit, post/tag — beyond the surfaces flagged above) | Mapping pinned; full Arc 10 cleanup deferred |
| Decorative icons ≥22px in muted color | Stroke at large sizes tolerates lower contrast per session 45 precedent. **Session 173 REC-6 update:** session 45 precedent predates session 168 bg unification (12 sessions of luminance shift); state-conveying icons + icons <22px no longer covered — see §"Icon contrast spot-audit" below. |
| Dividers / borders | Hairline 1px strokes (structural, not readable text) |
| ≥15px non-italic muted | Assumed legible; dial-on-demand if iPhone QA flags |

---

## Icon contrast spot-audit (session 173 — REC-6)

**Citation:** WCAG 2.1 success criterion 1.4.11 (non-text contrast — UI components + graphical objects require 3:1 against adjacent colors; state-conveying graphical objects effectively require 4.5:1 when they convey information). Computed: `v2.text.muted #A39686` on `v2.bg.main #E6DECF` = **2.16:1**, fails 1.4.11's 3:1 floor for ALL graphical objects at current bg. Session 45 precedent that gave rise to the audit's blanket >14px icons exclusion predates session 168's bg.main unification (12 sessions of luminance shift since); the exclusion is unsafe at current `:root` resolved values for sub-22px icons + state-conveying icons.

**Inventory from grep `color={v2.text.muted}` + `color: v2.text.muted` across `app/` + `components/`** (admin / reseller layers excluded per project precedent):

### State-conveying icons (needs color promotion to `v2.text.secondary` along with text retire)

| File:line | Element | Size | Context | Rationale |
|---|---|---|---|---|
| [`components/ShareSheet.tsx:1162`](../components/ShareSheet.tsx) | `<PiLeafBold>` | 14px | Disclaimer footer text prefix | Leaf glyph conveys brand-identity affordance on disclaimer; state-conveying per WCAG 1.4.11 |
| [`components/PinCallout.tsx:184`](../components/PinCallout.tsx) | `<MapPin>` | 16px | Map callout location glyph | State-conveying (identifies location pin); 2.16:1 fails 3:1 floor at bg.main |
| [`app/vendor-request/page.tsx:822`](../app/vendor-request/page.tsx) | `<PiEnvelopeSimple>` | 14px | Form helper text inline icon prefix | State-conveying (affords contact action); paired with muted helper text — both fail |
| [`app/login/page.tsx:732`](../app/login/page.tsx) | `<PiEnvelopeSimple>` | 14px | Login form helper text inline icon prefix | Same pattern as vendor-request:822; state-conveying contact glyph |

### Decorative icons <22px (needs review — may demote to background icon or promote color)

None found in current grep; all sub-22px icons in muted color resolve to state-conveying per audit. If iPhone QA surfaces a clearly-decorative sub-22px muted icon, ship as one-line color promote.

### Decorative icons ≥22px (audit exclusion stands but worth spot-check during fix-bundle iPhone QA)

| File:line | Element | Size | Context | Spot-check rationale |
|---|---|---|---|---|
| [`app/post/tag/page.tsx:492`](../app/post/tag/page.tsx) | `<PiTag>` | 26px | Placeholder tag icon | Decorative; ≥22px tolerates 2.16:1 per session 45; iPhone QA confirms read |
| [`app/vendor-request/page.tsx:544`](../app/vendor-request/page.tsx) | `<PiCamera>` | 28px + `opacity: 0.75` | Photo dropzone placeholder | **Compound risk:** opacity 0.75 multiplies effective contrast to ~1.6:1; promote opacity to 1.0 OR promote color to `v2.text.secondary` |
| [`app/my-shelf/page.tsx:264`](../app/my-shelf/page.tsx) | `<PiLeafBold>` | 22px | Empty state leaf glyph | Decorative; borderline at 22px; iPhone QA confirms read |
| [`components/ShelfImageTemplate.tsx:352`](../components/ShelfImageTemplate.tsx) | `<PiLeafDuotone>` | 40px | **Parked code** (Share My Shelf social image generator, retired session 152 ⚠️ PARKED) | Out of runtime scope; documented for revive contract awareness |

**Recommendation:** When fix-bundle ARC-2 ships (token-color remap), include the 4 state-conveying icons in the per-line edit pass — they're naturally part of the same scope-adjacent dead-code cleanup pattern per [`feedback_dead_code_cleanup_as_byproduct.md`](../memory/feedback_dead_code_cleanup_as_byproduct.md) ✅ Promoted (the icon + the text it prefixes are the same scope unit; promote them together). The vendor-request:544 `PiCamera` opacity-0.75 compound-risk is a separate single-line dial — surface during fix-bundle iPhone QA as a watch-item if camera placeholder reads ghostly.

---

## Vendor-value sequencing framing (session 173 — REC-5)

Per [`memory/project_vendor_value_first_prioritization.md`](../memory/project_vendor_value_first_prioritization.md) ✅ Promoted, the vendor-value gate requires shopper polish that compounds to vendor value to be made explicit in cost-shape framing — not implied. A naive read classifies this audit as shopper polish (47 offenders mostly on browsing surfaces); grep audit overturns that read: **6 of 19 files (32%) are vendor-flow surfaces** where contrast failures directly degrade vendor onboarding + vendor self-management.

**Vendor-flow files in scope (sequence first within each arc):**

1. [`app/find/[id]/edit/page.tsx`](../app/find/[id]/edit/page.tsx) — vendor edit-find surface (7 offenders across Tier 1+2+3)
2. [`app/post/preview/page.tsx`](../app/post/preview/page.tsx) — vendor publish surface (7 offenders Tier 1+2; post-flow exclusion applies to non-flagged lines)
3. [`app/post/tag/page.tsx`](../app/post/tag/page.tsx) — vendor capture surface (1 Tier 3 offender; post-flow exclusion otherwise)
4. [`app/me/page.tsx`](../app/me/page.tsx) — vendor profile (2 Tier 2 offenders)
5. [`components/BoothPage.tsx`](../components/BoothPage.tsx) — serves /shelf + /my-shelf (5 offenders across Tier 1 + bonus; vendor self-view + admin)
6. [`components/ShareSheet.tsx`](../components/ShareSheet.tsx) — Booth-tier outbound per `project_layered_engagement_share_hierarchy` ✅ Promoted; vendor's primary promotion tool (5 Tier 2 offenders)

**Shopper-flow + auth/onboarding files in scope (sequence after vendor-flow within each arc):**

`/login` + `/login/email/handle` + `/welcome` + `/vendor-request` + `/setup` (auth + vendor-request flow) · `components/v2/SavedMallCardV2.tsx` + `components/v2/SavedEmptyState.tsx` (Saved surfaces) · `app/find/[id]/page.tsx` + `app/shelf/[slug]/page.tsx` (v1-layer shopper surfaces) · `components/MallScopeHeader.tsx` + `components/DestinationHero.tsx` + `components/BoothLockupCard.tsx` (shared chrome primitives — touched once, propagate via consumers).

### Verbatim implementation session opener (copy-paste shape)

> *"Launch-blocking contrast fix bundle. 47 offenders / 19 files. **Vendor-flow surfaces shipped first** (6 files: /find/[id]/edit + /post/preview + /post/tag + /me + BoothPage + ShareSheet) sequenced ahead of shopper-flow within each arc, per vendor-value gate ([`memory/project_vendor_value_first_prioritization.md`](../memory/project_vendor_value_first_prioritization.md) ✅ Promoted). Shopper-flow + auth surfaces tail second (13 files). Vendor-flow-first sequencing closes vendor onboarding contrast risk before shopper-side polish lands; shopper-flow tail closes the launch-blocker for the broader signup. Arc execution order per audit's 'Recommended fix-bundle sequencing' section."*

---

## Recommended fix-bundle sequencing (session 173 — REC-2 RE-SEQUENCED)

A clean follow-on session shape (~75-105 min single session, was ~60-90 min before REC-2's Arc 1 expansion from 4 → 17 sites):

**Per REC-2 + `feedback_kill_bug_class_after_3_patches` ✅ Promoted: decoration retire FIRST so ARC-2 replace_all becomes structurally safe by removing decoration consumers from `v2.text.muted` + `v1.inkFaint` entirely.** Per REC-5 + `project_vendor_value_first_prioritization.md` ✅ Promoted: within each arc, vendor-flow files sequence first.

1. **Arc 1 — Decoration retire (was Arc 3; PROMOTED to first per REC-2)** (~25 min): All 17 in-scope `textDecorationColor` sites retire to solid `v2.border.light` or drop decoration entirely. 3-4 commits sequenced by file with vendor-flow first per REC-5:
   - Commit 1.1: vendor-flow surfaces (`/find/[id]/edit:514` + `components/BoothPage.tsx:648` + `components/ShareSheet` if any)
   - Commit 1.2: shared chrome primitives (`components/MallScopeHeader:147` + `components/DestinationHero:125` + `components/BoothLockupCard:168`)
   - Commit 1.3: auth/onboarding (`login:803` + `login:896` + `welcome:212` + `setup:444 + 460` + `vendor-request:864 + 880 + 898`)
   - Commit 1.4: v1-layer shopper (`shelf/[slug]:261` + `find/[id]:346 + 363 + 1158`)

2. **Arc 2 — Tier 2 replace_all sweep (REC-2 re-sequence makes this safe)** (~30 min): With no decoration consumers remaining on `v2.text.muted`, `replace_all v2.text.muted → v2.text.secondary` per file safely covers all 18 Tier 2 consumers without mixed-consumer corruption. ~5 file commits sequenced vendor-flow first per REC-5:
   - Commit 2.1: vendor-flow files (`/post/preview` flagged lines + `/me` + `ShareSheet`)
   - Commit 2.2: vendor-edit file (`/find/[id]/edit` Tier 2 entries)
   - Commit 2.3: shopper-flow (Saved + helper labels)

3. **Arc 3 — Tier 1 ship (was Arc 1; demoted to third per REC-2)** (~30 min): 15 remaining Tier 1 explicit edits (BoothPage.tsx:417 already shipped). 5-7 commits sequenced smallest→largest by file, vendor-flow files first per REC-5.

4. **Arc 4 — Token enforcement (REC-3 architectural pick required before this arc commits)** (~15-30 min): Either lint script (`npm run lint:contrast` modeled after the 5 lint scripts shipped at session 162) OR token split (`v2.text.muted` retired entirely; new tokens `v2.ink.placeholder` + `v2.ink.divider` + `v2.ink.icon` with explicit semantic names). **Brand/arch call deferred to session 174 implementation opener — see REC-3 outside-advisory-bounds note. JSDoc-only enforcement is NOT structurally sufficient per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted (the bug class returns when next callsite slips in).**

5. **iPhone QA pass** on real device against fix bundle → ship session close. Watch-items per REC-6 icon spot-audit: PiCamera opacity-0.75 compound risk on `/vendor-request:544`; state-conveying icon contrast on ShareSheet:1162 + PinCallout:184 + login/vendor-request envelope glyphs.

---

_Generated by Explore agent dispatch in session 171 (Audit B per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted). Tier 1 entry for `components/BoothPage.tsx:417` already shipped in commit `fb01c03` as the immediate fix David specifically named; remaining 46 offenders carry into the fix-bundle session._

_Session 173 update — 4 RECs applied via design-reviewer subagent dispatch (first production dispatch of the agent shipped session 172). RECs applied in this session: REC-5 (this vendor-value framing section), REC-6 (icon spot-audit addendum), REC-2 (textDecoration enumeration + arc re-sequencing), REC-1 (re-baseline offender tables with current resolved hex + computed WCAG ratios). REC-3 (lint-script vs token-split architectural pick) + REC-4 (italic-serif brand voice scope) deferred to session 174 implementation kickoff — both need David's brand/arch input before scope locks._
