## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## TERMINAL COMMAND FORMATTING CONVENTION
> Whenever Claude surfaces multiple terminal commands that must be run in sequence, they MUST be broken out into separate code blocks — one command per block. This lets David copy each command individually without accidentally running the next one before verifying the previous succeeded. Applies to deploy checklists, QA sequences, debug scripts, and HITL steps.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

```bash
npx vercel --prod
```

**Not this:**

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
npx vercel --prod
```

Exception: A single chained command with `&&` stays in one block (that's one atomic action by design).

---

## CURRENT ISSUE
> Last updated: 2026-04-18 (session 18 — Booth page v1.1h full redesign; post-it becomes cross-page primitive; Window View + Shelf View ways-of-seeing; Georgia cleared from the last major surface)

**Status:** ✅✅ **Session 18 shipped the Booth page redesign that's been the biggest outstanding design debt since session 15.** Both `/my-shelf` (owner) and `/shelf/[slug]` (public) rebuilt from the ground up against v1.1h: banner becomes a pure photograph with the booth post-it pinned to it (same primitive as Find Detail), vendor display name becomes the IM Fell 32px page title, mall + address demote to a small pin-prefixed block, and the availability tabs (On Display / Found homes) retire in favor of Window View (3-col 4:5 grid) + Shelf View (horizontal scroll, 52vw tiles). Four v0.2 components retired and deleted in the same commit. Build green. Commit `9271ecc` on main. Token promotion to `lib/tokens.ts` remains parked as final cleanup (safer post-QA).

### What shipped (1 commit — `9271ecc`)

Following the session-17 close, session 18 scoped into candidate 18A (Booth page v1.1g second pass). The second pass was scope-creeped into a more ambitious v1.1h after a mockup-first exploration surfaced an IA problem the v1.1g plan hadn't anticipated.

**Mockup-first protocol (two iterations before code):**
- v1 mockup (`docs/mockups/booth-v1-1g.html`): applied v1.1g cartographic pin+tick+X block with vendor name on the banner and "Explore booth →" pill on vendor row — essentially Find Map's grammar transplanted to the Booth page with the booth as a secondary content block
- David's redirect: *"Booth is the hero, not the mall."* The mall-as-title pattern is wrong for this page — the booth IS the page. Vendor name off the banner, booth post-it onto the banner (same primitive as Find Detail)
- v2 mockup (`docs/mockups/booth-v1-1g-v2.html`): vendor name relocated to IM Fell 32px page title below banner; booth post-it pinned to banner bottom-right (96×96px variant, +6° rotation, stacked "Booth Location" eyebrow, 36px numeral); small pin-prefixed mall+address block as secondary location statement below the title; cartographic pin+X block retired for this page (the post-it substitutes for the inline X when the booth is the page's subject); Window View + Shelf View toggle replaces the availability tabs; Shelf View tiles bumped 42vw/170px → 52vw/210px
- David approved v2 with one fix applied in code: Shelf View first tile needs 22px left padding so it doesn't sit flush to the screen edge

**Design-system doc updated v1.1g → v1.1h.** Key additions:
- **Post-it primitive becomes cross-page.** Find Detail's photograph and Booth's banner both carry it; identical in rotation/shadow/typography. The rule that lets them coexist: *post-it names the booth when the photograph is the subject; X names the booth when the photograph is a stop along a list.* First committed case of the post-it acting as a substitute for the inline X glyph.
- **Window View + Shelf View tabs replace availability tabs.** Not "On Display vs Found homes" anymore — both views show the same available inventory, differently. Window View = 3-col 4:5 portrait grid (window-pane gestalt). Shelf View = horizontal scroll of the same items at larger size (slower walk). AddFindTile (owner only) is the top-left cell in Window View, never in Shelf View. Sold items retire from this page entirely.
- **`<ExploreBanner>` retires.** The v0.2 green-gradient "Discover more finds" CTA card contradicted paper-as-surface. Replaced with diamond-divider quiet closer: "The shelf ends here. More booths await you." No link; BottomNav carries navigation.
- **Banner 16px radius** (the lone exception to the 6px photograph rule, justified by banner's wide-aspect hero role and larger surface area where 6px would read as almost square).
- **Booth page title eyebrow "a curated shelf from"** documented as the one italic lowercase eyebrow allowed on this page.
- **Terminology table gains Window View / Shelf View** as committed names.
- Three v0.2 components formally retired in doc: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`.

**Code (2 page rewrites, 1 new shared component):**
- `components/BoothPage.tsx` — NEW. Shared primitives file. Exports: `BoothHero` (banner + post-it + edit/share bubbles), `BoothTitleBlock` (eyebrow + 32px vendor name), `MallBlock` (pin + mall name + dotted-underline address), `DiamondDivider`, `ViewToggle` (text-link pair), `AddFindTile`, `WindowView` (3-col grid), `ShelfView` (horizontal scroll with `marginLeft: 22` on first tile — matches Find Detail's defensive alignment), `BoothCloser`, `BoothPageStyles`. Inline `v1` token object with Booth-specific additions (`bannerRadius: 16`).
- `app/my-shelf/page.tsx` — full rewrite. Preserved: auth gating, self-heal via `/api/setup/lookup-vendor` (KI-003 fix), hero upload with 12MB guard + compression, admin vendor param handling, ADMIN_DEFAULT_VENDOR_ID fallback chain, LocalVendorProfile caching. New: owner variant Masthead (no back, empty right slot), view state defaults "window", re-typed NoBooth + Skeleton in IM Fell. `canEdit={true}` for BoothHero.
- `app/shelf/[slug]/page.tsx` — full rewrite. Preserved: `getVendorBySlug` → `getVendorPosts` → mall resolution, NotFound state, bookmark-count passthrough. New: public variant Masthead with back arrow (visitors arrive from Find Detail deep links), `canEdit={false}`, no AddFindTile in Window View, empty-state copy "Nothing on the shelf yet — check back soon."

**Components retired in same commit:**
- `components/LocationStatement.tsx` — DELETED. Full grep across app/ and components/ confirmed zero callers.
- `components/BoothLocationCTA.tsx` — DELETED.
- `components/ExploreBanner.tsx` — DELETED.
- `components/TabSwitcher.tsx` — DELETED.

**`components/ShelfGrid.tsx` — annotated with retention comments.** `FoundTile` explicitly parked ("PARKED v1.1h — retained for future post-beta vendor-story surface"). File has zero current callers but exports (`ThreeColGrid`, `AvailableTile`, `SkeletonGrid`, `ShelfGridStyles`) may have legacy consumers that weren't audited with 100% certainty. Ruthless cleanup possible in a future session; safer to leave now.

**Build state:** `npm run build` green before commit. `/my-shelf` bundle 5.09 kB, `/shelf/[slug]` bundle 2.64 kB — both smaller than v0.2 after retiring four unused components. Commit `9271ecc` on main.

### IA shift that v1.1h lands (worth re-stating)

The Booth page now has an inverted information architecture vs. Find Map. Find Map is *"these saved finds are at this mall"* — mall is the subject, booths are the stops. Booth page is *"this booth has these finds"* — the booth IS the subject, the mall is secondary context. The design vocabulary now reflects this: Find Map uses the cartographic pin+X+tick grammar explicitly (mall pin at top, X at each booth stop); Booth page uses the post-it primitive to name the booth as the page's subject and demotes the mall to a small pin-prefixed block.

This generalizes into a rule: **post-it names the booth when the photograph is the subject; X names the booth when the photograph is a stop along a list.** The rule is now documented in the cartographic vocabulary section of the design system.

### Tool-environment notes from this session

No new gotchas. `filesystem:write_file` used exclusively for all Mac filesystem writes (the lesson from session 16 holds). `filesystem:edit_file` used for surgical doc updates. The bash container filesystem is still separate from the real Mac filesystem — can't use it for grep across the project. Worked around it with `filesystem:read_multiple_files` → pipe result into `bash_tool` grep on the stored tool-result JSON. Slow but reliable for orphan detection.

### Post-sprint loose ends (deliberately deferred)

- **Token promotion to `lib/tokens.ts`** — v1.1 palette (`paperCream`, `postit`, `inkPrimary`, `inkMid`, `inkMuted`, `inkFaint`, `inkHairline`, `priceInk`, `imageRadius: 6`, `bannerRadius: 16`) now lives as an inline `v1` object in three places: `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx`. Consolidation to `lib/tokens.ts` was intentionally parked as the final step of this sprint — safer order than mid-build. Recommend session 19 opens with this as a quick (~45 min) cleanup commit before starting on the next big piece.
- **Mockup HTML cleanup** — `docs/mockups/booth-v1-1g.html` and `docs/mockups/booth-v1-1g-v2.html` can retire after on-device QA confirms the redesign holds.
- **`ShelfGrid.tsx` ruthless deletion** — if a future session wants to be thorough, grep once more across the full codebase for `ThreeColGrid`, `AvailableTile`, `SkeletonGrid`, `ShelfGridStyles` callers; if zero, delete the file entirely.

### Session 19 candidates

**19A — Token consolidation cleanup** (~45 min). Opens with the post-sprint loose end above. Promotes `v1` inline tokens to `lib/tokens.ts`, rewires Find Detail + Find Map + BoothPage to import from the canonical source. Good palate-cleanser opener.

**19B — Feed header + `<MallSheet>` bottom sheet against v1.1h** (~3 hours). The feed is the front door and is still entirely v0.2. Mode B masthead pattern, pin-glyph in the mall selector, Find tile primitive (from v1.1g) reused in the feed grid. This was 18B; carrying forward.

**19C — Nav Shelf decision + BottomNav full chrome rework** (~1 hour including David's A/B/C/D selection in `docs/mockups/nav-shelf-exploration.html`). Still held from sessions 16–18. Worth picking soon — BottomNav hasn't had a full chrome pass since v1.1d's minimal patch, and a v1.1h-era full rework can land it in one sprint.

**19D — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). ~5.5 hours focused. Non-design work; still needed pre-beta. Priority rising as design-debt shrinks.

**Recommended:** 19A → 19B in the same session if bandwidth allows. Token consolidation is small enough to not earn its own session; bundling with Feed work keeps momentum.

### Files touched this session
- `docs/design-system.md` — v1.1g → v1.1h (Booth page redesign + cross-page post-it primitive + glyph substitution rule)
- `docs/mockups/booth-v1-1g.html` — NEW, v1 mockup (mall-as-title exploration — superseded but retained as historical record)
- `docs/mockups/booth-v1-1g-v2.html` — NEW, v2 mockup (final spec — approved by David with the 22px left-padding fix applied in code)
- `components/BoothPage.tsx` — NEW, shared primitives for both Booth pages
- `components/ShelfGrid.tsx` — retention comments added; code unchanged
- `components/LocationStatement.tsx` — DELETED
- `components/BoothLocationCTA.tsx` — DELETED
- `components/ExploreBanner.tsx` — DELETED
- `components/TabSwitcher.tsx` — DELETED
- `app/my-shelf/page.tsx` — full rewrite against v1.1h spec
- `app/shelf/[slug]/page.tsx` — full rewrite against v1.1h spec
- `CLAUDE.md` (this file) — session 18 close

---

## ARCHIVE — What was done earlier (2026-04-18, session 17)
> Find Detail v1.1e/v1.1f on-device polish + Find Map v1.1g full redesign; paper-cream bg globalized; glyph hierarchy locked

**Status:** ✅✅ Session 17 shipped two full pieces of work: (1) a two-pass polish refinement of Find Detail from v1.1d → v1.1e → v1.1f based on live iPhone QA, and (2) a complete mockup-first redesign of `/flagged` (the Find Map page) from v0.2 marketplace chrome → v1.1g journal vocabulary. Plus a glyph hierarchy commitment that locks `pin = mall` / `X = booth` as a cross-cutting rule. All code built green. Doc evolved v1.1d → v1.1e → v1.1f → v1.1g in three targeted update passes across the session.

### Three commits shipped in session 17

**Commit 1 — Find Detail v1.1e polish pass (morning):**
Body background `#f0ede6` → `#e8ddc7` paperCream globalized in `app/layout.tsx` + `app/globals.css`. Ten on-device polish items on `app/find/[id]/page.tsx`: masthead wordmark italic-on-"Finds" retired (Title Case single style, 16 → 18px, letter-spacing `-0.005em`); save + share relocated from masthead to frosted paperCream bubbles on photograph top-right (`backdrop-filter: blur(8px)`, 0.5px inkHairline edge, 38px diameter); icon bubble default size 34 → 38; new `IconBubble` `variant` prop (`paper` vs `frosted`); vendor row label `Explore` → `Explore booth →` (arrow moves INTO label); shelf-link pill slimmed to pure numeric badge (no "Booth" word, no arrow, 13 → 16px IM Fell non-italic, padding tightened to `2px 9px`); X glyph `paddingTop: 5 → 3` for vendor-name ascender alignment. Design-system doc advanced v1.1d → v1.1e.

**Commit 2 — Find Detail v1.1f same-session follow-up (mid-morning):**
Three refinements from immediate on-device follow-up: frosted icon-bubble bg now state-independent (v1.1e green-tint active state blended into warm/dark photos; bubble stays paperCream, only glyph flips color when saved); post-it pulled inward from viewport edge (`right: -12 → 4`, sits inside 22px page margin); post-it rotation bumped `+3 → +6deg` (committed range `+3` to `+8`, `+6` as default); post-it eyebrow stacks "Booth" / "Location" on two lines (14px IM Fell italic, line-height `1.1`; `minHeight: 84 → 92` to accommodate). Design-system doc advanced v1.1e → v1.1f.

**Commit 3 — Find Map v1.1g full redesign (afternoon):**
Product decision: `/flagged` route name kept for backwards compatibility, UI everywhere reads "Find Map." Glyph hierarchy committed: pin = mall (page-level, once), X = booth (per-stop, once per stop). Locked.

Mockup-first protocol: 3-approach exploration (`docs/mockups/find-map-exploration.html`) with Journal Itinerary / Pinned Postcards / Map Journal. Approach A (Journal Itinerary) selected. Then 4-iteration refinement mockup (`docs/mockups/find-map-v2.html`) with David before code — v2 with X glyph spine + Caveat opener + ordinal labels + end-of-path marker + Maps action; v3 dropped ordinals + end-of-path + Caveat (added intro voice + closer with "Continue exploring" link); v4 final spec dropped Continue link (BottomNav handles it), threshold horizontal-scroll for 3+ finds, prices on each find, closer pulled from primary ink → mid ink 16px.

`app/flagged/page.tsx` full rewrite against v1.1g: Mode A masthead → "Find Map" subheader (IM Fell 30px) → intro voice (IM Fell italic 15px) → pin + mall + dotted-underline address → diamond divider → per-stop itinerary (X glyph spine + hairline ticks + `Booth [NNN pill]` row to `/shelf/[slug]` + vendor italic + saved-count + 2-up grid or horizontal scroll for 3+ finds) → find tiles (4:5 photo + 6px radius + inkHairline border + frosted paperCream heart top-right + italic title + system-ui priceInk price or "Found a home" italic muted for sold) → diamond rule + closer. All v0.2 localStorage scanning, stale pruning, grouping/sorting, focus rehydration, unsave wiring, `BottomNav flaggedCount` passthrough preserved intact. Design-system doc advanced v1.1f → v1.1g.

### Glyph hierarchy rule committed

**pin = mall. X = booth. Locked.** These two cartographic glyphs do not swap, substitute, or appear interchangeably. On any page that shows both a mall and its booths, the pin appears *once* (mall anchor, page-level) and the X appears *once per booth stop* (inline, content-level). Find Detail uses this grammar already (pin + mall + tick + X + booth). Find Map establishes the paginated version (one pin at top, N X's down the spine). *Session 18 extended this rule with the post-it substitution clause: when the booth is the page's subject, the post-it on the hero photograph substitutes for the inline X.*

### Files touched in session 17
- `app/layout.tsx` — body background to paperCream
- `app/globals.css` — `@layer base body` background to paperCream
- `app/find/[id]/page.tsx` — two polish passes (v1.1e, v1.1f)
- `app/flagged/page.tsx` — full rewrite to v1.1g
- `docs/design-system.md` — v1.1d → v1.1e → v1.1f → v1.1g (three targeted edit passes)
- `docs/mockups/find-map-exploration.html` — 3-approach exploration
- `docs/mockups/find-map-v2.html` — final-spec mockup, iterated 4 times

---

## ARCHIVE — What was done earlier (2026-04-18, session 16)
> Find Detail v1.0 code build + 4 iteration passes v1.0 → v1.1d; BottomNav minimal chrome patch; nav-shelf exploration mockup

### What shipped (code + docs, committed incrementally)

**Code files modified:**
- `app/layout.tsx` — added IM Fell English (400 normal + italic) and Caveat (500) via `next/font/google` exposed as `--font-im-fell` and `--font-caveat` CSS variables on `<html>` className. Required prerequisite for Find Detail v1.0 build.
- `app/find/[id]/page.tsx` — full rewrite v1.0, then iterative refinement through v1.1 → v1.1d using `filesystem:edit_file` targeted edits
- `components/BottomNav.tsx` — two-line minimal patch: background `rgba(245,242,235,0.97)` → `rgba(232,221,199,0.96)` (paperCream translucent); top border `rgba(26,24,16,0.09)` → `rgba(42,26,10,0.18)` (inkHairline). Full chrome rework deferred to Booth v1.1 sprint.
- `docs/mockups/nav-shelf-exploration.html` — NEW. Four nav-as-wood-shelf approaches (A Suggestion, B Grain, C Full Shelf, D Line Alone) rendered at real mobile dimensions with surrounding page context. Pending David's review + selection in session 17.

**Docs updated:**
- `docs/design-system.md` — evolved v1.0 → v1.1d across the session via many targeted edits (see change log below)

### Design evolution: v1.0 → v1.1d

**v1.0 initial build** — masthead wordmark · photograph with post-it top-left + status pill bottom-right · title + price em-dash · centered quoted caption · diamond divider · cartographic pin+X block · "Visit the shelf →" IM Fell italic · "more from this shelf…" strip · Owner Manage block. Inline `v1` token object.

**v1.1 — legibility pass** from on-device feedback:
- Typography +1–2px across small type for 50+ audience (title 30→32, caption 17→19, pill 11→13, eyebrows grown)
- Title Case everywhere, uppercase + letter-spacing retired (was SaaS dashboard chrome)
- Post-it top-left → bottom-left (collision + legibility)
- 6px corner radius on hero photo + shelf thumbnails
- X glyph anchored to vendor name baseline (was drifting to shelf link)
- "Visit the shelf →" IM Fell italic → system-ui 400 matching address voice
- Shelf strip insets to 22px page margin
- Booth number styled as pill on vendor line (visual twin to status pill)

**v1.1b — post-it anchor + accessibility floor:**
- Post-it dimensions 78×72 → 92×84, numeral 28→36, eyebrow 11→12
- Accessibility font-size floor committed in doc: 16px primary reading, 15px section announcements, 13–14px secondary, 12px absolute floor. Calibrated against WCAG 2.1/2.2, Apple HIG, Material Design 3, NN/g.
- "More from this shelf…" and Manage eyebrows 13→15
- "Visit the shelf" weight 500→400 (exact match to address line)

**v1.1c — paper calibration + post-it contrast:**
- `paperCream` `#f1ead8` → `#e8ddc7` (warmer/browner, sheds yellow cast)
- `inkMuted` `#7a6244` → `#6b5538` (darkened to maintain WCAG AA 5.1:1 on new paper; old would have dropped to 4.2:1 failing AA at 14px)
- Post-it triple-dial contrast: color `#faf3dc` → `#fffaea`, shadow `0 4px 8px/0.20` → `0 6px 14px/0.28`, hairline edge `0.08` → `0.16`
- Vendor row restructured: name alone on top, shelf-link pill below (retires standalone "Visit the shelf →")
- Defensive `marginLeft: 22` on first shelf thumbnail; container `paddingLeft: 0`
- Post-it "Booth" eyebrow 12→14

**v1.1d — status pill retirement + post-it relocation + push pin + Explore label:**
- **Status pill fully retired.** "On Display" was redundant chrome on a browse page where every visible find is by definition available. Sold state is carried by photograph grayscale treatment.
- **Photo 1px `inkHairline` border** added to hero photo AND shelf thumbnails. Critical separation for warm-toned subjects against paper. Feature not workaround — paper-tone-respecting photography is the brand intent; the hairline is what makes it hold the page.
- **Post-it moved bottom-left → bottom-right** with `rotate(+3deg)` opposing direction, `transformOrigin: bottom right`, `right: -12, bottom: -14`. Single grounded object on the photo's bottom-right corner post status-pill removal.
- **Push pin added** at top-center of post-it: 8px circle `rgba(42,26,10,0.72)` with inset `0 0 0 2px rgba(42,26,10,0.55)` ring and `0 1px 2px rgba(42,26,10,0.35)` lift shadow. Matte ink, no shine, no metallic highlight. The pin is a second detail *on the post-it* (not a third object on the photo), reinforcing the *placed* verb beyond rotation alone.
- **Vendor row becomes `[Name]` on top, `Explore [Booth NNN →]` inline below** — "Explore" matches mall address voice exactly (system-ui 400 dotted-underline, inkMuted, 14px). Whole row wrapped in single `Link` to `/shelf/[slug]`. Names the verb so the pill reads as tappable at a glance for 50+ users.
- **BottomNav minimal chrome patch** — bg paperCream translucent, border inkHairline. Full chrome rework deferred to Booth v1.1 sprint.

### 🔆 Tool lesson surfaced this session — IMPORTANT for future Dev agents

**`create_file` does NOT write to the mounted filesystem in this environment.** It returns "File created successfully" but the file is unchanged on disk. **`filesystem:write_file` is the ONLY reliable write tool.** `filesystem:edit_file` works for targeted edits. `str_replace` fails on bracket-path files.

This is documented in `docs/DECISION_GATE.md` Tech Rules but was missed on the first pass this session (wasted one round-trip each on `app/layout.tsx` and `app/find/[id]/page.tsx` before diagnosing). **Future Dev agents: before your first file write in any session, verify you're using `filesystem:write_file` or `filesystem:edit_file` exclusively for Mac filesystem operations.**

Secondary gotcha refresher: `filesystem:edit_file` `oldText` must match exact bytes including box-drawing comment rule lengths and rare Unicode characters. Prefer unique surrounding content (function signatures, variable names) over comment-header rules as anchors. When a long block edit fails, decompose into smaller targeted edits rather than re-transcribing.

### Design-system doc evolution

`docs/design-system.md` is now at **v1.1d**. Net additions across the session:
- Accessibility commitments section: font-size floor table, WCAG contrast ratios for every ink on new paper, tap-target reaffirmation, Dynamic Type flagged for Sprint 5
- Paper color + ink palette recalibrated with new hex values and contrast math
- Push-pin spec + pin-restraint rule ("single pin only, matte ink, no shine — second pin or drawing pin head tips into costume")
- "Explore" label pattern documented
- BottomNav minimal-patch subsection added
- Pill primitive collapsed from 2 roles (status + shelf-link) to 1 role (shelf-link only) after status retirement
- Multiple retirements logged: bottom-left post-it, standalone "Visit the shelf →" link, status pill, top-left post-it

### Session 16 candidates were

17A (nav-shelf) **held** into session 17 and beyond. 17B (Booth page) **held** — still the next recommended design sprint (now called 18A). 17C (Sprint 4 tail) **held** — still queued (now 18D).

### Files touched in session 16
- `app/layout.tsx` — IM Fell + Caveat font loading
- `app/find/[id]/page.tsx` — full rewrite + 4 iteration passes (superseded by session 17 v1.1e/v1.1f polish)
- `components/BottomNav.tsx` — minimal chrome patch (bg + border)
- `docs/design-system.md` — v1.0 → v1.1d (many targeted edits; further evolved in session 17 to v1.1g)
- `docs/mockups/nav-shelf-exploration.html` — NEW, 4 approaches (still held for future review)

---

## ARCHIVE — What was done earlier (2026-04-17, session 15)
> Design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed

**Status:** 🪴 **Session 15 was a design-direction session, not a feature session.** No production code changed. Two docs updated: `docs/design-system.md` rewritten v0.2 → v1.0 with full journal vocabulary committed; `docs/DECISION_GATE.md` updated with tagline anchor, refreshed Brand Rules, refreshed Design agent prompt, and updated Risk Register. Find Detail mockup landed after an extended iteration pass that redirected the entire design language.

### What shipped (2 doc updates, 0 code changes)

**`docs/design-system.md` — v0.2 → v1.0 full rewrite:**
- **Tagline anchor committed:** *Embrace the Search. Treasure the Find. Share the Story.* Operating voice: presence over pressure, story over speed, rooted in reality yet elevated for perspective. Threshold to the physical world, not a replacement for it.
- **Cartographic vocabulary committed:** the mall is a pin on the map, the booth is an X on the spot, connected by a thin vertical tick. Single reusable grammar for location across Find Detail, Booth page, Feed, Find Map.
- **Material vocabulary committed:** booth post-it as the one skeuomorphic signature per find (cream paper, slight rotation, soft shadow, placed top-left on photograph). Status pill as straight clarity marker (pill outline, near-primary ink, no rotation). Max two material objects per photograph.
- **Typography system rewritten:** IM Fell English is now the editorial voice (titles, captions, labels, booth numbers, mall names, status). Georgia retired from the ecosystem layer. Caveat reserved for rare handwritten beats — one per screen maximum. system-ui reserved for precise data (addresses, timestamps). Mono retired entirely.
- **Paper as surface:** no card chrome, no border halos around content. Section divisions via whitespace, hairline rules, and the diamond (`◆`) ornament. The cross (`✚`) divider was retired for religious connotations.
- **Find Detail spec locked:** masthead wordmark ("Treehouse *Finds*" centered), photograph with post-it top-left + status pill bottom-right, title + price (em-dash, softer ink on price), centered quoted caption, diamond divider, cartographic pin+X block with connecting tick, IM Fell English italic "Visit the shelf →" link with dotted underline, "more from this shelf…" thumbnails (no leading dash, trailing ellipsis).
- **v0.2 pattern retirement log:** `<LocationStatement>` deprecated. `<BoothLocationCTA>` deprecated. Four-button system retired. Georgia retired from ecosystem. Mono retired. Pulsing green status dot retired. Card pattern system retired. The word "Directions" as explicit link copy retired.
- **Copy commitments:** captions always in typographic quotation marks (“ ”), centered, italic — about *how it feels*, never *what it's made of*. Price named honestly after title in softer ink. No "might pair with" / "related items" language. No narrating the metaphor ("Turn back to the booth" was rejected for this reason; "Visit the shelf →" is the right voice).

**`docs/DECISION_GATE.md` — targeted updates:**
- Tagline inserted at the top of "The Vision" section as a committed brand anchor with operating voice
- Brand Rules table updated: Georgia rule replaced with IM Fell English / Caveat / system-ui commitments, paper-as-surface rule added, cartographic language rule added, material restraint rule added, captions-always-quoted rule added, no-narrating-the-metaphor rule added
- New STOP gate added: "UI change not scoped against `docs/design-system.md` v1.0" — mirrors the onboarding-journey drift-prevention rule
- Risk Register: added "Design direction drifted toward generic across sessions 12–14" as a resolved risk with session-15 context; added Booth page component deprecation as a tracked low-severity item; added `lib/tokens.ts` token additions as a tracked low-severity item pending Booth v1.0 sprint
- Design agent prompt rewritten to reflect v1.0 language — names the "canonical primitive trap" explicitly so the next Design agent doesn't fall back into v0.2 vocabulary
- Sprint Context: Design sprints now tracked as a parallel track to Sprint 4 tail
- Related Documents: updated to reflect design-system.md v1.0 status
- Tech Rules: "session close build check" rule (added session 14) is now documented here

### The design-direction redirection — narrative summary

Session 15 opened as a Find Detail polish sprint against v0.2 but evolved into a fundamental redirection of the entire design language. The trigger was David's pushback on the first mockup: the cards, buttons, and canonical primitives committed in v0.2 were producing "generic app" aesthetics regardless of small corrections. The session worked through extended iteration (6+ mockup passes on Find Detail alone) to find the real direction — a restrained field-journal voice rooted in:

1. **Material gestures, not UI components** — post-it note replacing a card-wrapped booth badge
2. **Cartographic language, not data display** — pin + X glyphs binding mall and booth as a zoom relationship, replacing the v0.2 `<LocationStatement>` icon+mono+separator grammar
3. **Editorial typography, not UI typography** — IM Fell English doing the work that v0.2 assigned 90% to system-ui
4. **Paper as surface, not cards on surface** — section dividers become typographic ornaments, not border halos
5. **Quoted captions as reflections** — captions are about *how it feels*, never specs
6. **One handwritten beat per screen** — Caveat reserved for margin notes that represent genuine human presence, not decoration
7. **Restraint is the discipline** — the journal metaphor fails when it becomes costume (paperclips, tape, brass fittings on every surface). It succeeds when a few load-bearing gestures carry the weight and everything else steps back.

The tagline **Embrace the Search. Treasure the Find. Share the Story.** emerged mid-session as the tiebreaker for every decision going forward.

### Implications for prior work

**Booth page (shipped session 14) needs a v1.0 second pass.** The components built and shipped in session 14 (`components/LocationStatement.tsx`, `components/BoothLocationCTA.tsx`, the updated `ShelfGrid.tsx` terminology pass, the `TabSwitcher` relabeling) remain functional in production but do not align with v1.0 language. The cartographic pin+X block replaces `<LocationStatement>`. The post-it + paper-as-surface treatment replaces `<BoothLocationCTA>`. Georgia → IM Fell English throughout. Tracked as a dedicated Design sprint after Find Detail code ships.

**No production breakage.** The deprecated components still render on `/my-shelf` and `/shelf/[slug]` exactly as they did at session-14 close. Users see no change. The deprecation is internal to the design system doc; code replacement is a separate sprint.

### Context for the next session

Two session-16 candidates, both independent of Sprint 4 tail:

**Session 16 candidate A — Find Detail code build against v1.0 spec.** The mockup is locked. `docs/design-system.md` v1.0 has the full spec. This session writes the `/find/[id]/page.tsx` rewrite: masthead wordmark, post-it, status pill, centered quoted caption, diamond divider, cartographic pin+X block, "Visit the shelf →" link, "more from this shelf…" thumbnails. Requires loading IM Fell English + Caveat fonts (Google Fonts), possibly inlining new token values that formalize later in the Booth sprint. Estimated ~3 hours including QA.

**Session 16 candidate B — Sprint 4 tail batch (T4c + T4b + T4d).** Copy polish, admin surface consolidation, pre-beta QA pass. ~5.5 hours of focused work. Boring-but-important; clears the pre-beta runway.

**Recommended:** 16A first. Momentum is on design after session 15's redirection, and Find Detail is the surface that proves the v1.0 language in production. Sprint 4 tail can batch afterward.

### Sprint 4 tail still queued

- 🟡 T4c remainder (copy polish): `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b admin surface consolidation: Add Booth tab in `/admin`, Add Vendor in-person flow, remove Admin PIN from `/login`, remove Booths from BottomNav, retire `AddBoothSheet` from `/shelves`. ~4 hours.
- 🟡 T4d pre-beta QA pass walking all three onboarding flows. ~1 hour.
- 🟢 Session 13 test data cleanup (5+ "David Butler" variants in DB). ~5 min SQL via `docs/admin-runbook.md` Recipe 4.

### Files touched this session
- `docs/design-system.md` — full rewrite v0.2 → v1.0
- `docs/DECISION_GATE.md` — tagline anchor added, Brand Rules updated, Design agent prompt refreshed, Risk Register updated, Tech Rule for session-close build check documented, STOP gate added for design-system drift
- `CLAUDE.md` (this file) — session 15 close

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 14)
> Booth page v0.2 redesign shipped; `lib/imageUpload.ts` reconstructed

**Status:** 🌿 **Session 14 executed the Design agent's first Dev pass against `docs/design-system.md` v0.2.** Booth page redesign landed on both `/my-shelf` and `/shelf/[slug]`. Pre-existing build break on `@/lib/imageUpload` imports (orphaned from session 13's uncommitted image-upload migration) was diagnosed and fixed mid-session so everything ships together. Curator's Statement block was explicitly deferred pending vendor feedback — David's call, not a miss.

**Session-15 note on session 14 work:** The components shipped this session (`LocationStatement`, `BoothLocationCTA`, `ShelfGrid` rewrite, `TabSwitcher` relabeling) are still live in production and functional. As of session 15 they are *deprecated per `docs/design-system.md` v1.0* but remain in the repo. The Booth v1.0 second pass will replace them. Users see no change in the meantime.

### What shipped (one commit, multiple files)

**Session 14 design work:**
1. **`components/LocationStatement.tsx`** (NEW) — canonical location-pattern primitive per v0.2 spec. Deprecated in v1.0. 
2. **`components/BoothLocationCTA.tsx`** (NEW) — canonical CTA card variant. Deprecated in v1.0.
3. **`components/ShelfGrid.tsx`** (REWRITE) — three batched changes per v0.2: (a) grid gap 6 → `spacing.tileGap` (10), (b) `AvailableTile`: pure image, no title overlay, (c) `FoundTile`: 0.5 opacity + full grayscale + italic Georgia "Found a home" caption bottom-left on subtle gradient. Grid structure survives v1.0; Georgia caption will be swapped to IM Fell English in the Booth v1.0 pass.
4. **`components/TabSwitcher.tsx`** (EDIT) — inactive label "Found a home" → "Found homes" (plural) per v0.2 terminology table. Survives v1.0.
5. **`app/my-shelf/page.tsx`** (EDIT) — `BoothFinderCard` → `BoothLocationCTA`, address prop threaded from `mall?.address`, Found-homes empty-state copy removed.
6. **`app/shelf/[slug]/page.tsx`** (EDIT) — same treatment as `/my-shelf` for the public state.
7. **`components/BoothFinderCard.tsx`** (DELETED) — orphan after Task 6.

**Session 13 carry-ins (discovered mid-session, shipped together):**
8. **`lib/imageUpload.ts`** (NEW — reconstruction) — Session 13's CLAUDE.md documented this file as "single source of truth" but it was never actually committed. Reconstructed from the documented contract.
9. **`app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`, `lib/posts.ts`** (pre-session mods) — session-13 image-upload migration work that was on disk but not committed.

### Task-4 ("titles on tiles") mockup-first protocol (session 14)
Before removing titles from `AvailableTile`, Claude generated a disposable side-by-side mockup showing current vs. v0.2. David approved the no-titles direction with eyes on the comparison. Worth keeping as a pattern: when a design-system change has a visible perceptual cost, mockup the change before code. This protocol continued in session 15 where the mockup-first approach caught the fundamental direction drift before any Find Detail code was written.

### `lib/imageUpload.ts` reconstruction — root cause + new tech rule
Session 13 closed without running `npm run build` before `thc`. CLAUDE.md was updated to describe the image-upload pattern as shipped, but the module itself was never created. New session-close tech rule (added to DECISION_GATE session 14, formalized session 15): *A session is not closed until `npm run build` has run green against the committed state of the repo.*

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped, toast visual polish

**Status:** ✅✅✅ **Session 13 resolved a pre-beta blocker surfaced during live test.** KI-004 closed. In-mall diagnostic UI shipped. Admin runbook created. All 5 QA tests passed on device.

Key shipped: `app/api/admin/diagnose-request/route.ts` (NEW diagnostic endpoint), `app/api/admin/vendor-requests/route.ts` (REWRITE — constraint-aware approval), `app/admin/page.tsx` (REWRITE — Diagnose links, inline DiagnosisPanel, toast polish), `docs/admin-runbook.md` (NEW — 9 SQL recipes).

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim (reuse existing row)
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject with named details
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- All error responses include `diagnosis` code + `conflict` object for admin UI rendering

**Toast visual polish — final state:** outer non-animated `<div>` does centering, inner `<motion.div>` animates opacity+y only with `pointer-events:auto`. zIndex 9999, solid opaque backgrounds, `boxShadow` opacity 0.18.

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is orphaned. Safe to delete next sprint.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 12)
> Design agent's first full direction pass shipped; docs/design-system.md v0.2 committed

**Status:** 🪴 **Session 12 was the Design agent's first real pass.** No production code changed. One doc updated: `docs/design-system.md` moved from v0.1 scaffold to v0.2 with committed direction for cross-cutting primitives (typography, headers, buttons, cards, Location Statement) and four priority screens.

**Session-15 note on session 12 work:** v0.2 was rewritten in session 15 to v1.0. The v0.2 vocabulary (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system, Georgia-as-primary-serif, mono for booth numbers) is retired per v1.0. The "Cards, Buttons, LocationStatement" framing of v0.2 produced generic marketplace aesthetics when actually composed — this was the core finding of session 15. v1.0 replaces the component-first framing with a language-first framing (cartographic pin+X, post-it material gesture, paper-as-surface, IM Fell English editorial voice).

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 11)
> Design agent activated, design system scaffolded, agent orchestration tightened

**Status:** 🪴 **Session 11 was a system-infrastructure session, not a feature session.** Four docs updated to activate the Design agent and establish `docs/design-system.md` as canonical source of truth for all multi-screen UI work.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 10)
> /setup 401 race polish shipped; T4c orphan cleanup A/B/E shipped

**Status:** ✅✅ **Session 10 polished the onboarding journey that Session 9 unblocked.** Two commits shipped.

1. Orphan cleanup (T4c partial — A + B + E) — `app/page.tsx` EmptyFeed "Add a Booth" button removed; `app/my-shelf/page.tsx` NoBooth "Post a find" button removed; `app/api/debug-vendor-requests/route.ts` deleted.
2. `/setup` 401 race polish — `setupVendorAccount()` in `app/setup/page.tsx` now retries once with 800ms backoff on 401 response.

Verified `public/manifest.json` already has `"orientation": "portrait"`. Supabase cleanup pre-session: three-orphan cleanup SQL ran.

---

## ARCHIVE — What was done earlier (2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002
**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`.
**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern.

### Phase 2 — KI-003 diagnosis
Clean-slate Flow 2 repro revealed two cascading bugs: `/login` mount useEffect read `searchParams.get("next")` but approval email uses `?redirect=/setup`; approve endpoint's 23505 duplicate-key handler silently reuses existing vendors row on booth collision (deferred as KI-004, now RESOLVED session 13).

### Phase 3 — KI-003 three-part fix
Fix 1: `app/login/page.tsx` — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`.
Fix 2: `app/post/page.tsx` — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy.
Fix 3: `app/my-shelf/page.tsx` — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as self-heal before falling through to NoBooth.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging
Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` for 401 branch observability.

### Phase 5 — End-to-end verification
Flow 2 onboarding end-to-end verified working on iPhone.

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)
`docs/onboarding-journey.md` created as canonical spec. Three flows committed: Pre-Seeded, Demo, Vendor-Initiated.

### Phase 2 — T4a email infrastructure
New file `lib/email.ts` (~260 lines) — Resend REST API wrapper. Wired into `app/api/vendor-request/route.ts` + `app/api/admin/vendor-requests/route.ts`. End-to-end QA verified in production.

### Phase 3 — QA issues logged
KI-001, KI-002, KI-003 logged to `docs/known-issues.md`.

---

## ARCHIVE — Earlier sessions (1–7)
> Condensed — full history available in git log

- **Session 7** — `/admin` mobile-first approval polish (T3); full database reset; QA pass exposed onboarding fragility
- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit code entry primary auth path; meta-agent work (Dev · Product · Docs active)
- **Session 5** — `emailRedirectTo` fix + strategic Sprint 4+ scoping; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot Path B → Path A (Shopify authoritative); Resend → Supabase SMTP; Yahoo magic link verified
- **Session 3** — Resend account setup; DNS migration decision (later reversed in session 4)
- **Session 2** — Setup flow status-filter bug fix
- **Session 1** — RLS-blocked vendor-request flow fix; admin API hardening with `requireAdmin` + service role

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

**Operator note:** David Butler is an **online reseller** (Zen Forged LLC, ZenForged Finds online sales). He is not a physical storefront operator at any mall. In-person vendor onboarding sessions are deliberate scheduled meetups, not incidental. This matters for scoping — "in person" is a product choice, not a default.

**Tagline (committed session 15):** *Embrace the Search. Treasure the Find. Share the Story.* Anchored in `docs/DECISION_GATE.md`.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v1.1h for the visual + interaction system. All multi-screen UI work scopes against it before code. v1.1h (session 18) makes the booth post-it a cross-page primitive shared between Find Detail and Booth, formalizes Window View + Shelf View as the Booth page's inventory-view vocabulary, and retires `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`.

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)

Design v1.0 fonts (session 16+ code build):
  IM Fell English (editorial voice) · Caveat (rare handwritten beats) · system-ui (precise data)
  Loaded via Google Fonts.
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com (for lib/email.ts absolute URLs)
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request)
RESEND_API_KEY                   Server-only Resend API key for lib/email.ts transactional emails (session 8)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails).

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains
**Authoritative nameservers:** Shopify's default nameservers
**DNSSEC:** Off

Key records (via Shopify DNS): A `@` → `23.227.38.65`, CNAME `app` → Vercel, Resend DKIM + SPF + MX on `send`/`resend._domainkey`. Full record list in session-14 archive.

**Dormant:** Cloudflare account has nameservers assigned but is not authoritative. Leftover from session 3's Path B plan.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email, 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraints on vendors** (ALL FOUR):
  - `vendors_pkey` PRIMARY KEY (id)
  - `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision per session 13
  - `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve
  - `vendors_user_id_key` UNIQUE (user_id) — one vendor row per auth user

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch`
- Server: first line of every `/api/admin/*` handler: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes: `requireAuth()`

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8):**
- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop
- All collision errors return `{error, diagnosis, conflict}` for UI rendering

---

## WORKING ✅
- Discovery feed, magic link auth, Admin PIN login, OTP delivery
- Magic link `?redirect=` param preserved across round trip
- My Booth, Post flow, Post preview, Find detail, Public shelf
- Vendor request flow, Vendor account setup, admin approval workflow
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates for Magic Link and Confirm Signup
- Agent roster: Dev · Product · Docs · Design active
- KI-001, KI-002, KI-003, KI-004 all resolved
- Flow 2 onboarding end-to-end verified working on iPhone
- `/setup` 401 race absorbed with retry+backoff
- Design agent activated, `docs/design-system.md` at **v1.1h** (sessions 15–18)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes
- Booth page redesign shipped against **v1.1h** spec (session 18) — both `/my-shelf` and `/shelf/[slug]`: banner as pure photograph with booth post-it pinned to it (cross-page primitive shared with Find Detail), vendor display name as IM Fell 32px page title, small pin-prefixed mall+address block as secondary location statement, Window View (3-col 4:5 portrait grid) + Shelf View (horizontal scroll with 52vw/210px tiles, 22px left padding on first tile) replacing availability tabs, AddFindTile in top-left cell of Window View (owner only), banner edit button top-left + frosted share bubble top-right, diamond-divider quiet closer. Sold items retired from the page entirely. Four v0.2 components deleted: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`. Georgia cleared from the last major surface.
- **Find Detail shipped against v1.1f spec (sessions 16–17)** — masthead Title Case single style 18px, photograph with 1px hairline border, post-it bottom-right with push pin + stacked "Booth Location" eyebrow + `+6deg` rotation + 4px inset, title + price em-dash, quoted caption, diamond divider, cartographic pin+X block, X-aligned vendor row with "Explore booth →" label + numeric-only shelf-link pill, frosted on-image save+share top-right (state-independent bg), shelf strip with defensive alignment, owner manage block. IM Fell English + Caveat loaded via Google Fonts in root layout.
- **Find Map shipped against v1.1g spec (session 17)** — `/flagged` full redesign: Mode A masthead, "Find Map" subheader, intro voice, pin+mall anchor, diamond divider, X-glyph itinerary spine with hairline ticks, `Booth [NNN pill]` row wrapping Link to `/shelf/[slug]`, vendor italic, saved-count, 2-up grid (≤2 finds) or horizontal scroll (≥3 finds), find tiles with frosted heart unsave + prices + sold-state treatment, empty state, chapter-break closer. All v0.2 localStorage / pruning / grouping / focus-rehydration / unsave wiring preserved intact.
- **App-wide background paperCream `#e8ddc7` globally committed** (session 17) — `app/layout.tsx` body inline + `app/globals.css` `@layer base body`. Legacy `#f0ede6` retired.
- **BottomNav minimal chrome patch (session 16)** — background paperCream translucent, top border inkHairline. Full rework still deferred to Booth v1.1g sprint.
- **Glyph hierarchy locked (session 17)** — pin = mall, X = booth, cross-cutting rule documented in `docs/design-system.md` Cartographic Vocabulary.

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 15 close._

### 🟡 Sprint 4 remainder
- 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b — admin surface consolidation. ~4 hours.
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end.
- 🟢 Session 13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.

### 🟡 Design v1.1h execution (sessions 19+)
- **Session 19 candidate A** — Token consolidation cleanup. Promote `v1` inline tokens to `lib/tokens.ts`, rewire Find Detail + Find Map + BoothPage to import from the canonical source. ~45 min.
- **Session 19 candidate B** — Feed header + `<MallSheet>` bottom sheet pattern against v1.1h. Find tile primitive reused from Find Map. ~3 hours.
- **Session 19 candidate C** — Nav Shelf decision + BottomNav full chrome rework. David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html` (A Suggestion / B Grain / C Full Shelf / D Line Alone), ship chosen treatment plus the BottomNav chrome pass that's been deferred since v1.1d's minimal patch. ~1 hour.
- **Session 20 candidate** — Onboarding screens (`/vendor-request`, `/setup`, `/login`) v1.0 pass, bundled with "Curator Sign In" rename (Sprint 5 scope).

### 🟡 Sprint 3 leftovers still pending beta invites
- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" + `/welcome` guest-friendly landing
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design v0.2 components retired and deleted in session 18: `components/LocationStatement.tsx`, `components/BoothLocationCTA.tsx`, `components/ExploreBanner.tsx`, `components/TabSwitcher.tsx`
- `components/ShelfGrid.tsx` — parked with retention comments (session 18); zero current callers but retention rationale documented in-file. Can delete in a future cleanup if grep across full codebase confirms no legacy consumers
- `v1` inline tokens on Find Detail + Find Map + BoothPage — promote to `lib/tokens.ts` as session-19 opener (~45 min)
- `docs/mockups/find-map-exploration.html`, `docs/mockups/find-map-v2.html`, `docs/mockups/booth-v1-1g.html`, `docs/mockups/booth-v1-1g-v2.html` — historical record; can delete once on-device QA confirms v1.1g + v1.1h hold

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
mkdir -p app/api/your-route-name
```

Commit and push (atomic, keep chained):

```bash
git add -A && git commit -m "..." && git push
```

Source `.env.local` into the current shell for a one-off curl with auth:

```bash
cd ~/Projects/treehouse-treasure-search && set -a && source .env.local && set +a
```

Check Supabase auth logs:
```
https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
```

Check Resend delivery logs:
```
https://resend.com/emails
```

Check Vercel function logs:
```
https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
```

Check DNS state:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

---
