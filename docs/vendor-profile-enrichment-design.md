# Vendor profile enrichment — Design record

**Status:** 🟢 Ready for implementation
**Session:** 185 (2026-05-18)
**Frame:** C (40px avatar inline with display_name lockup)
**Successor of:** session 184 Arc 0 ship (migration 022 + handle retirement)
**Implementation arcs:** 3 (sequenced smallest→largest)

---

## 1. Scope

David's session-184 verbatim ask:

> "Vendor-side profile enrichment — Facebook + Instagram URLs + bio + custom directions text + profile image update + retire @handle from setup."

Handle retirement shipped Arc 0 (session 184, commit `b1144a4`). This design record covers the remaining 5 fields:

| Field             | Status before    | Status after this design                     |
| ----------------- | ---------------- | -------------------------------------------- |
| `bio`             | DB column exists | Editable in EditBoothSheet + shown on /shelf |
| `avatar_url`      | DB column exists | Editable in EditBoothSheet + shown on /shelf |
| `facebook_url`    | DB column exists | Editable in EditBoothSheet + shown on /shelf |
| `instagram_url`   | NEW (session 184)| Editable in EditBoothSheet + shown on /shelf |
| `directions_text` | NEW (session 184)| Editable in EditBoothSheet + shown on /shelf |

**Cost-shape pick** (session 184): Shape B (light design pass + ship). This record concludes Shape B.

---

## 2. Reference scan

Skipped per `feedback_pre_mockup_prose_model_first` ✅ Promoted — David's verbatim ask was concrete enough that prose IS the design for 3 of 4 axes. The 4th axis (avatar placement) needed a V1 mockup because it's genuinely visual.

---

## 3. V1 mockup

[`docs/mockups/vendor-profile-enrichment-v1.html`](mockups/vendor-profile-enrichment-v1.html)

4 frames spanning the avatar placement axis with all 3 prose-locked axes held constant. David picked **Frame C — 40px avatar inline with display_name lockup**. Reasoning quoted:

> "This to me is the most logical spot as it becomes part of the lockup for the Booth name and identity."

**Why Frame C wins for this vendor**: avatar becomes a compound visual element with the existing booth identity (eyebrow "A curated booth by" + h1 display_name), not a separate beat. Vendor identity inlines with booth identity rather than competing for visual hierarchy. The BoothHero photo retains its role as the primary content beat.

**Implications of Frame C** that cascade through implementation:
- BoothTitleBlock becomes conditionally compound (with avatar vs without)
- Avatar absent = existing centered BoothTitleBlock layout (no change to existing booths)
- Avatar present = left-aligned compound lockup (40px avatar + text stack right of it)
- About-section (bio + social icons) sits BELOW BoothTitleBlock as separate section
- MallBlock extends with directions_text inline below address

---

## 4. Frozen decisions

### D1 — Edit surface
Extend EditBoothSheet vendor mode with 2 visual sections: **Booth identity** (display_name + hero_image_url — existing) and **Vendor identity** (avatar_url + bio + facebook_url + instagram_url + directions_text — new). Single pencil entry point on /my-shelf; single sheet handles all vendor self-edit. Vendor mode sheet grows from 2 fields → 7 fields total.

### D2 — Section break style
Single 1px `v2.border.light` horizontal rule with ~24px vertical padding above + below between the two sections. Quiet visual separation; matches existing form-section patterns in `/vendor-request` + `/setup`. NO section header text labels (relying on visual grouping + field labels for semantic clarity).

### D3 — Avatar placement on /shelf/[slug]
Frame C: 40px circular avatar, inline LEFT of text stack (eyebrow + display_name h1) inside BoothTitleBlock. Forms a compound lockup. Avatar uses 2px `v2.surface.warm` border + subtle `box-shadow` for lift off the page bg.

### D4 — Avatar fallback when `avatar_url` is null
Hide avatar entirely. BoothTitleBlock falls back to existing centered layout (eyebrow + h1 centered). Vendors who haven't uploaded an avatar see no change from the current page. Avoids the "vendor identity is just derived initials" weak-signal reading that auto-derived fallbacks would produce.

**Conditional layout contract**:
- `avatarUrl: null` → existing centered layout (text-align: center, no avatar slot)
- `avatarUrl: string` → compound left-aligned lockup (avatar 40px + text stack)

### D5 — Avatar upload UX (EditBoothSheet)
Same pattern as hero photo upload (session 91 Wave 1 Task 4):
- Replace + Remove buttons render side-by-side
- Click "Replace" → file picker → compress via `lib/imageUpload.ts` → upload via `/api/vendor-avatar` → atomic write (not batched with form Save)
- Click "Remove" → confirmation → write `avatar_url: null`
- Loader state during upload
- Error toast on failure

**Differs from hero photo**:
- Smaller crop preview (96×96 circular instead of 4:3 banner)
- Server resizes to 256×256 max (vs 1200×800 for hero)
- Storage path: `vendor-avatars/{vendor_id}.jpg` (vs `vendor-heroes/{vendor_id}.jpg`)

### D6 — `/api/vendor-avatar` endpoint
New endpoint mirroring `/api/vendor-hero` pattern. Two methods:
- `POST { base64DataUrl, vendorId }` → uploads + returns `{ url }`
- `DELETE { vendorId }` → removes + returns `{ ok: true }`

Both require `requireAuth` + vendor ownership check (vendor.user_id === auth.user.id OR isAdmin).

### D7 — Bio field UX
- EditBoothSheet: `<textarea>` with FONT_LORA italic 15px placeholder "Tell shoppers about your booth — what you specialize in, what makes it worth visiting…"
- 280 character limit (server + client validation)
- Live counter shows `{used}/280` in muted text below textarea; turns red at 270+
- Display on /shelf: full bio text in Cormorant italic 15px, `v2.text.primary`, `lineHeight: 1.5`, max-width 320px centered in about-section
- When `bio: null` → about-section still renders if social URLs exist (just no bio paragraph); when ALL of (bio, facebook_url, instagram_url) are null, about-section doesn't render at all

### D8 — Facebook + Instagram URL fields (EditBoothSheet)
- 2 text inputs with FONT_INTER 14px placeholders ("https://facebook.com/yourbooth" / "https://instagram.com/yourbooth")
- Lenient client validation: accept any URL that starts with `http://` or `https://` (lets vendors paste shortlinks, fb.me URLs, etc.)
- Server validates URL format only (rejects non-URL strings)
- No host-allowlist (avoids future maintenance burden when FB/IG URL patterns change)

### D9 — Social icon bubbles on /shelf
- Phosphor `PiFacebookLogo` + `PiInstagramLogo` rendered as 36×36 circular bubbles
- Bubble bg `v2.surface.warm` + 1px `v2.border.light` border + `v2.accent.green` glyph color
- Inline row below bio in about-section, gap 10px, justify-content: center
- Hidden individually when URL is null (FB shown only if facebook_url set; IG shown only if instagram_url set)
- Tap behavior: `window.open(url, '_blank', 'noopener,noreferrer')` — opens in new tab/window, secure
- Analytics: `track("vendor_social_tapped", { vendor_slug, platform: "facebook" | "instagram" })` — NEW R3 event

### D10 — Directions text on /shelf
- Display in MallBlock, inline below the dotted-underline address
- Cormorant italic 13px, `v2.text.secondary`, `lineHeight: 1.4`, marginTop 6px
- Renders only when `directions_text` is set + non-empty string (NULL = address + mapsUrl alone)
- No character limit (TEXT column accepts any length); server enforces 500 char cap as safety
- Multiline supported (newlines preserved via `white-space: pre-wrap`)

### D11 — About-section conditional render
The new `<AboutBoothSection>` primitive renders BETWEEN BoothTitleBlock and MallBlock when any of (bio, facebook_url, instagram_url) is non-null. When ALL are null, the section is omitted entirely — no empty wrapper, no extra padding. Avoids "blank space where the vendor section would be" for vendors who haven't enriched yet.

### D12 — analytics events (NEW R3 events)
- `vendor_profile_enriched` — fires when vendor saves the EditBoothSheet form with any of the 5 new fields populated for the first time. Payload: `{ vendor_slug, fields_filled: string[] }` (e.g. `["bio", "instagram_url"]`).
- `vendor_avatar_uploaded` — fires on successful avatar upload. Payload: `{ vendor_slug }`.
- `vendor_avatar_removed` — fires on successful avatar removal. Payload: `{ vendor_slug }`.
- `vendor_social_tapped` — fires when shopper taps social icon on /shelf. Payload: `{ vendor_slug, platform: "facebook" | "instagram" }`.

All 4 events added to both `lib/events.ts` EventType (server) + `lib/clientEvents.ts` ClientEventType (client) + `app/api/events/route.ts` CLIENT_EVENT_TYPES (whitelist) — avoids the silent-400 drift caught in session 137.

### D13 — Component contracts

**`<BoothTitleBlock>`** — extension of existing primitive
```tsx
interface BoothTitleBlockProps {
  displayName: string;
  avatarUrl?: string | null;  // NEW — controls compound vs centered layout
  onPickerOpen?: () => void;  // existing
  onEditName?: () => void;    // existing
}
```

**`<AboutBoothSection>`** — NEW primitive at `components/AboutBoothSection.tsx`
```tsx
interface AboutBoothSectionProps {
  bio: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  vendorSlug: string;  // for analytics on social taps
}
// Returns null when all 3 props are null
```

**`<MallBlock>`** — extension of existing primitive
```tsx
interface MallBlockProps {
  mallName: string;
  mallCity?: string;
  address?: string | null;
  directionsText?: string | null;  // NEW — renders below address when set
}
```

### D14 — EditBoothSheet vendor mode field order
1. **Booth identity section**:
   - Hero photo (existing — Replace + Remove)
   - Booth name (existing — display_name text input)
2. **— Hairline divider —**
3. **Vendor identity section**:
   - Profile photo (NEW — avatar upload, same pattern as hero)
   - Bio (NEW — textarea + counter)
   - Facebook URL (NEW — text input)
   - Instagram URL (NEW — text input)
   - In-mall directions (NEW — textarea, multiline)
4. **Save button** (existing — gated on `hasChange`)

Reading order: identity (who curates) flows from booth → vendor → social → spatial location. Matches the /shelf/[slug] page order so vendors edit in the same conceptual sequence they appear on the public page.

### D15 — vendor self-edit vs admin-on-behalf
Both modes get all 5 new fields. Admin mode (from `/shelves` Pencil) edits the same fields on behalf of any vendor — useful for onboarding support + content moderation. Server PATCH endpoint already validates ownership via `vendor.user_id === auth.user.id OR isAdmin(user)` (session 148 admin-vendor parity ship per `feedback_synthesize_existing_row_to_reuse_flow_infra`).

---

## 5. Bounded reversals surfaced

None at this design pass — this is a pure additive feature. The Arc 0 handle retirement (session 184) was the load-bearing reversal; this design only extends substrate that the Arc 0 commit established.

---

## 6. Risk register

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | Avatar upload + crop UX feels off at 96×96 preview | Medium | Use same `compressImage` pipeline as hero; circular crop preview matches /shelf render |
| 2 | Vendors paste invalid URLs (e.g. plain text "facebook.com/me") | Medium | Lenient client validation (any URL); server only validates URL format; UI displays as `<a>` regardless |
| 3 | Bio Cormorant italic 15px on `v2.surface.warm` fails legibility test for some vendors | Low | Matches existing BoothTitleBlock eyebrow pattern (16px Cormorant italic on same bg) which passed session 171 contrast audit |
| 4 | About-section conditional render creates layout jump when vendor toggles bio off | Low | Acceptable — vendor controls when section renders; no flicker for shoppers |
| 5 | Avatar conditional layout in BoothTitleBlock breaks at narrow widths (320px) | Low | 40px avatar + 12px gap + text stack fits comfortably on iPhone SE (375px); test in Arc 2 |
| 6 | Storage bloat from per-vendor avatar uploads | Low | 256×256 max + ~30KB per avatar after compression; <1MB for 30 vendors |

---

## 7. Tier B headroom

Explicitly captured open doors for future sessions (not in scope):

| # | Item | Rationale |
|---|------|-----------|
| B1 | Avatar shown on `/find/[id]` cartographic block | Today /find/[id] eyebrow shows mall + booth, not vendor avatar. Could extend with small avatar prefix if vendor-recognition signal proves valuable in analytics |
| B2 | Vendor "Stories" — short bio-equivalent that surfaces per-find | Bio is global to vendor; per-find context might want a custom blurb |
| B3 | Avatar visible on Home feed tile vendor attribution | Today Home tile shows mall name only; vendor avatar prefix could increase vendor brand recognition |
| B4 | Custom social platforms beyond FB + IG (TikTok, Pinterest, website) | Schema is open-ended (TEXT columns); UI could add 3rd-party URL configurability per vendor request volume |
| B5 | Bio rich text (links + bold) via simple markdown | Today bio is plain text; vendor-value research could justify markdown support |
| B6 | Avatar crop preview / position adjustment | Today server resizes to 256×256 centered; vendor cannot adjust crop position |
| B7 | Auto-link booth address with native Calendar (event invite) | Adjacent to directions_text but distinct UX |
| B8 | Translation support for bio (English / Spanish) | Future internationalization candidate |

---

## 8. Implementation sequencing — Arc 1 → Arc 2 → Arc 3

Per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88.

### Arc 1 — Edit surface (session 186, ~5 commits)
- **1.1** `/api/vendor-avatar` endpoint (POST + DELETE) mirroring `/api/vendor-hero` pattern (smallest, isolated; 1 new file)
- **1.2** `/api/vendor/profile` PATCH extends to accept bio, facebook_url, instagram_url, directions_text (server-only change, no UI yet; lenient validation per D8)
- **1.3** EditBoothSheet vendor-mode section break (hairline divider — D2, no new fields yet; visual scaffolding)
- **1.4** EditBoothSheet vendor-mode 5 new field renderers (avatar upload + bio textarea + 2 URL inputs + directions textarea; wires to /api/vendor-avatar + /api/vendor/profile)
- **1.5** ClientEventType + EventType + CLIENT_EVENT_TYPES whitelist extensions (4 new events per D12)

**Arc 1 ships independently** — vendors can fill out fields immediately; nothing renders on /shelf yet but the data persists.

### Arc 2 — Display surface on /shelf/[slug] (session 187, ~4 commits)
- **2.1** `<BoothTitleBlock>` extension: conditional compound lockup per D3+D4 (left-aligned avatar + text stack when avatarUrl present; centered fallback when null)
- **2.2** `<AboutBoothSection>` NEW primitive: bio + social icons per D9+D11+D13
- **2.3** `<MallBlock>` extension: directions_text inline per D10
- **2.4** /shelf/[slug] page composition: thread new props through, render AboutBoothSection between BoothTitleBlock and MallBlock

**Arc 2 ships independently** — vendors who filled out Arc 1 fields now see them on /shelf; vendors who didn't see no change.

### Arc 3 — iPhone QA dials + polish (session 187 continuation)
- **3.x** Mid-session iPhone QA dials surfaced from real-content seeding (typography, spacing, color contrast adjustments)
- **3.y** R-row promotion call: R19 (`Vendor profile enrichment`) candidate promoted to ✅ Shipped if design pass surfaces full storefront-identity thesis; left as pure UI extension if not

### Why this sequencing
- Each Arc ships independently with no broken intermediate state
- Arc 1 ship has zero shopper-visible change (data layer + edit UX only)
- Arc 2 ship is purely additive (vendors without filled fields see no change)
- Arc 3 surfaces real-content refinements that V1 mockup with placeholder data couldn't catch

---

## 9. R-row promotion call (deferred)

R19 candidate: **Vendor profile enrichment** (vendor-value lattice cell — "vendor identity" alongside R10 booth location + R17 distance).

Promotion decision deferred to post-Arc-2 ship when the storefront-identity thesis is visible on production. If the avatar + bio + social icons surface produces measurable vendor-side engagement (vendors uploading + iterating their profile) and shopper-side engagement (social taps + return visits to enriched booths), promote R19 ✅ Shipped. Otherwise keep as pure UI extension within R7 (vendor accounts).

---

## 10. Memory firings this design pass

- `feedback_visibility_tools_first` ✅ Promoted — parallel reads of `/shelf/[slug]` page + `EditBoothSheet` + `Vendor` type before drafting prose Qs
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — cost shape resolved at session 184; this design pass continues Shape B
- `feedback_v2_options_before_drafting` ✅ Promoted — 4-axis batched `AskUserQuestion` before mockup; 4 fill-refinement axes batched after Frame pick
- `feedback_mockup_options_span_structural_axes` ✅ Promoted — V1 frames span avatar PLACEMENT axis (different page-level positions), not style variants within one placement
- `feedback_pre_mockup_prose_model_first` ✅ Promoted — prose IS the design for 3 of 4 axes (Axis 1+3+4); V1 mockup only for Axis 2 (genuinely visual)
- `feedback_user_clarification_restate_interpretation` ✅ Promoted — restated Frame C implications + restated Axis 2 deviation from recommended before drafting record
- `feedback_commit_design_records_in_same_session` (Design Agent rule from session 56) — design record + V1 mockup committed together

---

## 11. Open for `/design-review` (optional)

This design record is bounded enough that the design-reviewer subagent dispatch (session 172 substrate) is optional, not mandatory. If David wants a citation-backed structural review before Arc 1 implementation begins:

```
/design-review docs/vendor-profile-enrichment-design.md
```

Agent will surface RECs against brand rules (`docs/design-system.md` v1.2), lattice canonical (`docs/DECISION_GATE.md` Tech Rules), tokens (`lib/tokens.ts`), WCAG (40px touch target / contrast ratios), and the vendor-value gate (`project_vendor_value_first_prioritization`).
