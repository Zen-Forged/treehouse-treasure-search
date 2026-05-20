# EditBoothSheet UI revisit — design record (session 191)

> **Status:** 🟢 Ready (design pass complete at session 191; implementation arcs C2–C5 ship same session per Shape A cost-shape pick).
>
> **Predecessor:** [`docs/vendor-profile-enrichment-design.md`](vendor-profile-enrichment-design.md) (sessions 184–187 Arc 1+2 ship). Sheet grew organically from 2 fields → 7 fields across vendor profile enrichment arc. This record is the holistic restructure called out as Q-016 at session 186 close.
>
> **Sister docs:** [`design-system.md`](design-system.md) (v2 tokens + Phosphor icon canonical) · [`session-191/iphone-qa-mockup-screenshots.md`](#) (David's 2 mockup screenshots — pain-illustration not pixel-spec).

---

## 1. Pain points (David's verbatim ask)

1. **Buttons take too much space** — *"don't need to say remove photo just the trash icon does the job"*
2. **Font size especially sub-text is way too small**
3. **Font color on the bio example is hard to read**
4. **Could use icons for Facebook and Instagram**
5. **Should help explain what each section does** — 4 numbered sections with descriptive sub-headers + "Booth number and location are managed by Treehouse Finds. Need to update? Contact us here" escape-hatch

David: *"It doesn't have to be exactly like the mockup but should give you a general direction. This will need a design session."*

---

## 2. Cost shape

**Shape A — Prose-model-first + dial bundle** (David's pick at session 191).

Per `feedback_pre_mockup_prose_model_first` ✅ Promoted — David's prose covers the structural axes (4 sections + their titles + their sub-headers + escape-hatch pattern + button retire + iconography direction). Remaining fill axes are prose-resolvable; no V1 mockup needed per `feedback_v2_options_before_drafting` ✅ Promoted-via-memory at session 135.

Decisions locked via 2 batched `AskUserQuestion` calls covering 8 axes total.

---

## 3. Frozen decisions D1–D17

### D1 — Section structure (4 numbered sections)

Sheet body restructures from flat label-input pairs into 4 numbered sections:

| # | Title | Sub-header | Fields |
|---|---|---|---|
| 1 | Your Booth Identity | _(none — labels disambiguate)_ | Booth photo · Profile photo · Booth name |
| 2 | About Your Booth | Tell shoppers about your booth and what makes it worth visiting. | Bio (no label — section header carries meaning) |
| 3 | Connect With Shoppers | Share your journey on social media. | Facebook URL · Instagram URL (no labels — icons + placeholder carry meaning) |
| 4 | Find Me in the Mall | Help shoppers find you easily. | In-mall directions (no label — section header carries meaning) |

Section 1 omits sub-header because the 3 distinct field labels (Booth photo / Profile photo / Booth name) already explain what the section covers. Sections 2-4 each have one field; the sub-header carries the descriptive voice the dropped field-label would have.

### D2 — Section header geometry

- **Number + title inline:** `1. Your Booth Identity` rendered as a single line, Cormorant 18px upright (NOT italic), `v2.text.primary`, lineHeight 1.3.
- **Sub-header (where applicable):** Cormorant italic 14px, `v2.text.secondary`, lineHeight 1.4, marginTop 4.
- **Number weight:** Same Cormorant 18px upright; the period (`1.`) carries enough visual structure without a different weight treatment.

### D3 — Section delimiter

**Gap-only at 32px between sections.** Retires session 186 D2 hairline divider (`<div style={{ height: 1, background: v2.border.light, margin: "10px 0 18px" }} />`) entirely. Section headers carry the visual chunking; no line needed.

### D4 — Photo affordance vocabulary

Both Booth photo (84×84 rounded-8) and Profile photo (96×96 circular avatar) follow the same overlay-on-photo pattern:

- **Camera-bubble (bottom-right corner):** 28×28 circle with `v2.surface.card` bg + 1px `v2.border.light` border + `Camera` glyph from Lucide at 14px `v2.text.secondary` strokeWidth 1.7. Positioned `bottom: -4, right: -4` (overlaps photo edge for clear affordance). Tap → opens file picker.
- **Trash-corner (top-right corner):** 24×24 circle with `v2.surface.card` bg + 1px `v2.border.light` border + `Trash2` glyph from Lucide at 13px `v2.accent.red` strokeWidth 1.7. Positioned `top: -4, right: -4`. Renders only when photo present. Tap → handleRemove.
- **Sibling text-buttons retire entirely.** No more `[ImagePlus + "Replace photo"]` + `[Trash2 + "Remove photo"]` buttons in column to the right of the photo. Photo gets full row width (or stays centered with breath).

Both overlays use `position: absolute` against the photo container's `position: relative`. `pointerEvents: auto` overrides any blur loader state.

### D5 — Field labels

- **Section 1:** Keeps all 3 labels — `Booth photo`, `Profile photo`, `Booth name`. Section has 3 distinct fields; labels disambiguate.
- **Section 2:** **Drops** `Bio` label. Section header "About Your Booth" + sub-header "Tell shoppers..." carries the meaning.
- **Section 3:** **Drops** both `Facebook URL` + `Instagram URL` labels. Phosphor icon prefix (per D6) + placeholder ("facebook.com/yourbooth" / "@yourbooth or instagram.com/yourbooth") carries the meaning.
- **Section 4:** **Drops** `In-mall directions` label. Section header "Find Me in the Mall" + sub-header carries the meaning.

Labels that remain stay at FONT_INTER 14px (bumped from 13 per D8), `v2.text.secondary`, lineHeight 1.25, marginBottom 6.

### D6 — FB/IG icon prefix

`PiFacebookLogo` and `PiInstagramLogo` from `react-icons/pi` at `v2.accent.green`, size 18. Matches `components/AboutBoothSection.tsx` display-surface canonical from session 187 — consumer/edit visual symmetry.

**Geometry:** Icon positioned 10px from left edge of input, vertically centered. Input text padding-left bumps from 12 → 36px to clear icon footprint (10 + 18 + 8). Icon rendered via absolute-positioned wrapper sibling to `<input>` inside the field's relative container.

### D7 — "Need to update?" escape-hatch affordance

In Section 1, after the booth-name input, helper text reads:

> Booth number and location are managed by Treehouse Finds. [Need to update?](/contact)

- Helper text: Cormorant italic 15px (bumped from 14 per D8), `v2.text.secondary`, lineHeight 1.4, marginTop 6.
- "Need to update?" rendered as `<Link href="/contact">` with dotted underline (`textDecoration: underline; textDecorationStyle: dotted`), color `v2.text.muted`, project-canonical helper-link voice (matches session 153 /login footer "New here? Request a digital booth →" pattern).
- Sheet does NOT auto-close on Link tap; Next.js routes natively. If user comes back via browser back, the EditBoothSheet open state is lost (sheet doesn't persist its own URL-state) — acceptable tradeoff since /contact form is short. Carry as Tier B if vendor feedback surfaces.

### D8 — Sub-text size baseline

Bumps across the sheet (current → new):

| Element | Current | New | Rationale |
|---|---|---|---|
| Field labels (`Booth photo`, `Profile photo`, `Booth name`) | FONT_INTER 13 | FONT_INTER 14 | Per David — labels too small |
| Helper text (`Booth number and location...`) | FONT_CORMORANT italic 14 | FONT_CORMORANT italic 15 | Matches /login session 175 sub-text dial |
| Char counter (bio `X/280`) | FONT_INTER 11 | FONT_INTER 12 | Stays muted but legible at arm-length |
| Section header title (NEW) | — | FONT_CORMORANT 18 upright | New addition per D2 |
| Section sub-header (NEW) | — | FONT_CORMORANT italic 14 | New addition per D2 |
| Sheet header title (`Edit booth name`) | FONT_CORMORANT 20 | FONT_CORMORANT 20 | **Unchanged** (calibrated session 175) |
| Sheet header eyebrow (`<vendor> · <mall>`) | FONT_CORMORANT italic 13 | FONT_CORMORANT italic 13 | **Unchanged** (calibrated session 175) |

### D9 — Bio readability fix

**Failure mode:** Default browser placeholder color is light gray; on `v2.surface.card` (#FFFCF5) cream bg, italic Lora at the default placeholder color reads pale and hard to parse.

**Fix:** Add explicit `::placeholder { color: v2.text.muted; opacity: 1 }` via a style block (CSS-in-JS via `<style>` tag inside the textarea's parent OR via inline-class fallback). Entered text stays FONT_LORA italic 15px (session 186 D7 stays intact at the actual entry level — only placeholder gets explicit color treatment).

**NOT a session 186 D7 reversal** — D7 specified the bio entry voice (Lora italic 15px); placeholder color was an unspecified default that drifted to browser-default light gray. Per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141 — placeholder treatment is an un-enumerated dimension D7 didn't cover, not a reversal of the entry voice.

### D10 — Directions character counter

- **Add UI counter at 280-char cap** matching bio counter pattern: `<X>/280` at bottom-right, FONT_INTER 12, `v2.text.muted` (turns to `v2.accent.red` at warning threshold 270).
- **Server cap moves 500 → 280** in `/api/vendor/profile` validation (`DIRECTIONS_TEXT_MAX_LEN` constant). Error message updates to match.

**Reverses session 186 D10** — "directions are short by nature; cap is defensive not user-facing" → "match bio counter pattern; visible cap is the right vendor-facing affordance."

Surfaced explicitly per `feedback_surface_locked_design_reversals` ✅ Promoted. David's mockup shows `74/280` counter directly; matches Twitter's 280 mental model.

### D11 — Trash icon vocabulary

The current sibling text-button `[Trash2 13px strokeWidth 1.7 + "Remove photo"]` retires entirely. Replacement is the trash-corner overlay per D4 — 24×24 circular button with `Trash2` glyph at 13px `v2.accent.red`. Hover/active state unchanged from current button (browser defaults are sufficient; tap affordance is the v2.surface.card bg + border).

### D12 — Section 1 layout

```
1. Your Booth Identity              [Cormorant 18 upright + 32px gap before next section]

Booth photo                          [FONT_INTER 14 v2.text.secondary]
[ 84×84 rounded-8 photo container ]
  └ camera-bubble at bottom-right (D4)
  └ trash-corner at top-right (D4, renders when photo present)

Profile photo                        [FONT_INTER 14 v2.text.secondary]
[ 96×96 circular avatar container ]
  └ camera-bubble at bottom-right (D4)
  └ trash-corner at top-right (D4, renders when avatar present)

Booth name                           [FONT_INTER 14 v2.text.secondary]
[ Input — v2.accent.greenSoft dirty state ]
"Booth number and location are managed by Treehouse Finds. [Need to update?](/contact)"
  [Cormorant italic 15 v2.text.secondary — Link inline with dotted-underline]
```

### D13 — Section 2 layout

```
2. About Your Booth                                       [Cormorant 18 upright]
Tell shoppers about your booth and what makes it worth visiting.
  [Cormorant italic 14 v2.text.secondary]

[ Bio textarea — no label, full-width ]
  ↳ placeholder: "Tell shoppers about your booth — what you specialize in,
    what makes it worth visiting…"
  ↳ explicit placeholder color v2.text.muted (D9)
  ↳ entered text: Lora italic 15px (unchanged)
  ↳ dirty: v2.accent.greenSoft bg

                                                       74/280  [right-aligned]
                                                       [FONT_INTER 12 v2.text.muted]
```

### D14 — Section 3 layout

```
3. Connect With Shoppers                                  [Cormorant 18 upright]
Share your journey on social media.
  [Cormorant italic 14 v2.text.secondary]

[ 📘 PiFacebookLogo prefix | facebook.com/yourbooth         ]   [Input with FB icon left-prefix]
"We'll format this as a link."
  [Cormorant italic 14 v2.text.muted, marginTop 4]

[ 📸 PiInstagramLogo prefix | @yourbooth or instagram.com/yourbooth ]   [Input with IG icon left-prefix]
"We'll format this as a link."
  [Cormorant italic 14 v2.text.muted, marginTop 4]
```

Helper sub-text "We'll format this as a link." renders under EACH social input per the mockup (not once at section-level). Reinforces the URL-normalization behavior shipped session 186 (vendors can paste any shape).

### D15 — Section 4 layout

```
4. Find Me in the Mall                                    [Cormorant 18 upright]
Help shoppers find you easily.
  [Cormorant italic 14 v2.text.secondary]

[ Directions textarea — no label, full-width ]
  ↳ placeholder: "Walk back along the right wall, past the green sign —
    booth is on the left after the staircase."
  ↳ entered text: FONT_INTER 14 (unchanged)
  ↳ dirty: v2.accent.greenSoft bg

                                                       74/280  [right-aligned]
                                                       [FONT_INTER 12 v2.text.muted]
```

### D16 — Save CTA + Cancel

**Unchanged from current implementation.** "Save changes" FormButton + Cancel italic-text-button below. Geometry stable. The `canSave` predicate stays as session 186 wired it (hasChange + urlsValid + bioValid).

Note: With directions cap moving 500 → 280, the `canSave` predicate gains a `dirsValid` check: `trimmedDirs.length <= 280`. Mirrors bio's bioValid pattern.

### D17 — Sheet max-height + scroll

- `maxHeight: 85vh` + `overflowY: auto` unchanged.
- Sheet body will be ~30% taller than current implementation (4 section headers + sub-headers + larger photo bubbles + bumped sub-text + bio counter + directions counter). Most iPhones will require some scrolling to reach Save CTA.
- iPhone QA validates: cold-start sheet open on iPhone SE (smallest viewport) doesn't show Save CTA initially — vendor scrolls down to reach it. Acceptable per current 85vh max-height. If iPhone QA flags as friction, B5 sticky-Save CTA promotes from Tier B headroom.

---

## 4. Tier B headroom (deferred — explicit doors-left-open)

| # | Item | Promotion trigger |
|---|---|---|
| B1 | **"Suggest a bio" AI-call feature** — Claude/GPT drafts bio from booth name + mall + existing posts as context | Separate session N+1 design pass; cost-shape triage on AI cost + caching strategy + accept/reject UX |
| B2 | **Map-pin glyph prefix on Section 4 textarea** — sub-pattern of FB/IG icon-prefix extended to multi-line textarea contexts | Vendor feedback that Section 4 needs spatial-affordance signaling beyond the section title |
| B3 | **Sub-header for Section 1** — currently omitted because 3 field labels disambiguate | Vendor feedback that Section 1 feels incomplete without descriptive voice |
| B4 | **Section 5: Booth Hours** — future vendor profile field for shopper-facing hours visibility | New feature ask + DB schema migration |
| B5 | **Sticky Save CTA at sheet bottom** when sheet content exceeds 85vh | iPhone QA shows scroll-to-Save friction; pin Save to fixed-bottom of sheet body |
| B6 | **Live URL preview chip below Facebook/Instagram inputs** — "facebook.com/kentuckytreehouse →" preview after normalization | Vendor feedback that input feels detached from canonical URL output |

---

## 5. Reversals surfaced explicitly (per `feedback_surface_locked_design_reversals` ✅ Promoted)

| # | Decision | Original locked at | Reversal direction |
|---|---|---|---|
| R1 | Section 186 D2 hairline divider between booth-name + identity sections | Session 186 (Arc 1 ship) | Retired entirely; gap-only delimiter pattern per D3 |
| R2 | Session 186 D5 sibling Replace/Remove text-buttons | Session 186 (Arc 1 ship) | Retired; replaced by camera-bubble + trash-corner overlay per D4 |
| R3 | Session 186 D10 directions "no UI counter; defensive 500-char server cap" | Session 186 (Arc 1 ship) | UI counter restored at 280; server cap moves 500 → 280 per D10 |
| R4 | Session 186 D11 field-label-per-input pattern (every input gets a label above) | Session 186 (Arc 1 ship) | Labels dropped where section header carries meaning per D5 (Section 2 / Section 3 FB+IG / Section 4) |

All reversals quoted with prior reasoning before drafting commits. No reversals carry hidden assumptions from D1–D17 — each is bounded to its own axis.

---

## 6. Risk register

| # | Risk | Mitigation |
|---|---|---|
| Risk-1 | Section structure adds significant vertical height; iPhone SE viewport requires more scrolling to reach Save CTA | 85vh max-height + native scroll covers it; B5 sticky-Save is the escalation path if iPhone QA flags |
| Risk-2 | Camera-bubble + trash-corner overlays on photos add new tappable affordances; risk of accidental tap when vendor wants to view photo fullscreen | Photos in EditBoothSheet are NOT lightboxable today (session 75 lightbox is /shelf/[slug] BoothHero only); no conflict |
| Risk-3 | "Need to update?" → /contact navigates away from sheet, losing edit state | Acceptable tradeoff for V1; Tier B7 captures URL-state persistence if vendor feedback surfaces |
| Risk-4 | FB/IG icon prefix at 18px inside input field adds ~26px of left-side padding consumption; on narrow iPhone viewports the input visible area shrinks | Inputs are full-width within sheet padding; ~26px loss out of ~390px is ~7% — visible area stays >340px which fits any realistic URL |
| Risk-5 | 280-char cap reversal on directions may surface "I was using 300+ chars" vendor complaint | Real-content seeding hasn't produced any 280+ char directions yet (existing 6 vendors all under 200); cap reversal lands before risk materializes |
| Risk-6 | Placeholder color explicit fix via inline `<style>` requires CSS-in-JS pattern that doesn't already exist in EditBoothSheet | Use simple class-based ::placeholder rule scoped to a specific data-attribute on the textarea; ~5 lines |
| Risk-7 | Dropping field labels on Section 2/3/4 reduces accessibility for screen-readers (placeholder disappears on focus) | Use aria-label attribute on inputs to carry the field name for assistive tech without rendering visible label |

---

## 7. Implementation arcs (sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing`)

### Arc 1 — Design record (this commit)
Docs-only; ships the spec.

### Arc 2 — Server cap migration (1 commit)
`/api/vendor/profile/route.ts`:
- `DIRECTIONS_TEXT_MAX_LEN` constant 500 → 280
- Error message string updates to match
- Comment block at constant updates with R3 reversal rationale

Net: ~3-line change in 1 file. Build clean.

### Arc 3 — Photo affordance overlay primitive (1 commit, single coupled)
`components/EditBoothSheet.tsx` Booth photo section + Profile photo section in single coupled commit per `feedback_single_coupled_commit_when_must_move_together`:
- Camera-bubble overlay component inlined at both photo containers (28×28 bottom-right -4/-4)
- Trash-corner overlay component inlined at both photo containers (24×24 top-right -4/-4, renders when photo present)
- Sibling text-button column retires (Replace photo + Remove photo)
- Photo container `position: relative` for overlay anchoring
- Imports update: `Camera` from lucide-react replaces `ImagePlus`

Net: ~80-line replace in EditBoothSheet.tsx covering both photo sections. Build clean.

### Arc 4 — Section wrapper structure (1 commit)
`components/EditBoothSheet.tsx` adds 4 numbered section wrappers:
- Section 1 wrapper around 3 fields (Booth photo + Profile photo + Booth name + helper)
- Section 2 wrapper around bio
- Section 3 wrapper around FB + IG
- Section 4 wrapper around directions
- Gap-only 32px between sections; session 186 D2 hairline divider retires
- Section header geometry per D2 (number + title inline, sub-header below where applicable)

Net: ~50-line additions + 1-line deletion (D2 divider). Existing fields stay in place; just wrap them in `<section>` elements with headers above.

### Arc 5 — Form field updates (1 commit, largest)
`components/EditBoothSheet.tsx` applies field-level updates per D5–D11:
- Drop "Bio" label (Section 2)
- Drop "Facebook URL" + "Instagram URL" labels (Section 3)
- Drop "In-mall directions" label (Section 4)
- Add PiFacebookLogo + PiInstagramLogo prefix wrappers per D6 (~30 lines for 2 inputs)
- "Need to update?" `<Link href="/contact">` after booth-name helper per D7
- Sub-text size bumps per D8 across labels + helper + char counter
- Bio placeholder color fix per D9 via inline `<style>` block scoped to textarea data-attribute
- Directions char counter restored + dirsValid check in canSave per D10
- aria-label attributes on unlabeled inputs (Risk-7)

Net: ~120-line changes across the 7-field body. Build clean.

---

## 8. Acceptance criteria

iPhone QA on Vercel preview:
1. Sheet opens cleanly on iPhone SE / iPhone 12 / iPhone 15 viewports
2. 4 numbered sections render with correct titles + sub-headers + gap-only delimiters
3. Both Booth photo + Profile photo show camera-bubble at bottom-right + trash-corner at top-right when photo present
4. Tap camera-bubble → opens file picker (same as current Replace flow)
5. Tap trash-corner → fires existing handleRemove flow (no behavioral change)
6. FB + IG inputs show Phosphor icon prefix at v2.accent.green; input text starts 36px from left
7. "Need to update?" link routes to /contact + sheet closes (Link does NOT prevent default close behavior — sheet's own backdrop-tap close logic still works)
8. Bio placeholder renders in v2.text.muted (visible against cream bg)
9. Directions char counter renders at bottom-right `0/280` and increments on type
10. Save CTA `canSave` correctly gates on dirsValid in addition to existing predicates
11. No build warnings or TS errors at any commit boundary
12. Net runtime change: +~210 / -~80 LOC (codebase grows by ~130 LOC for the section structure + overlay primitives + iconography)

---

## 9. Carry-forwards from this session

- **iPhone QA on production v0.191.0** after merge — combinable with the 4 prior production-tagged carries (v0.187 + v0.188 + v0.189 + v0.190).
- **B1 "Suggest a bio"** — design pass candidate for session N+1 if vendor real-content seeding shows vendors struggling with bio drafts.
- **R19 candidate promotion call** (vendor profile enrichment ✅ Shipped at row level) — design record §9 deferred to post-Arc-2 production usage with 2-3 weeks of analytics signals. This session's Arc 5 ship adds to the vendor-facing surface area; R19 promotion call should consider whether the EditBoothSheet UX revisit is part of "enrichment ✅" or a separate epic.

---

## 10. Design Agent notes

- **Audit-first dispatch** (session 191) read current EditBoothSheet.tsx (1101 lines) + grepped consumers + verified `/contact` route exists + verified PiFacebookLogo + PiInstagramLogo project canonical at AboutBoothSection (session 187) before locking decisions. Per `feedback_visibility_tools_first` ✅ Promoted.
- **No V1 mockup committed** per Shape A cost-shape pick. David's prose + 2 reference screenshots (pain-illustration) + 8 batched AskUserQuestion answers cover all structural + fill axes. Per `feedback_pre_mockup_prose_model_first` ✅ Promoted at session 167 + `feedback_v2_options_before_drafting` ✅ Promoted-via-memory at session 135.
- **Reference screenshots** (David's 2 attached at session 191 open) are NOT committed to repo — pain-illustration not pixel-spec per `feedback_visual_reference_enumerate_candidates`.
