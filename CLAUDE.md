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
> Last updated: 2026-04-18 (session 17 — Find Detail v1.1e/v1.1f on-device polish + Find Map v1.1g full redesign; paper-cream bg globalized; glyph hierarchy locked)

**Status:** ✅✅ **Session 17 shipped two full pieces of work: (1) a two-pass polish refinement of Find Detail from v1.1d → v1.1e → v1.1f based on live iPhone QA, and (2) a complete mockup-first redesign of `/flagged` (the Find Map page) from v0.2 marketplace chrome → v1.1g journal vocabulary.** Plus a glyph hierarchy commitment that locks `pin = mall` / `X = booth` as a cross-cutting rule. All code built green. Doc evolved v1.1d → v1.1e → v1.1f → v1.1g in three targeted update passes across the session. Nav-shelf exploration remains held from session 16 (David's call — redirected session-17 scope into polish + Find Map instead).

### What shipped (3 commits)

**Commit 1 — Find Detail v1.1e polish pass (session 17 morning):**
- `app/layout.tsx` — body inline background `#f0ede6` → `#e8ddc7` (paperCream)
- `app/globals.css` — `@layer base body` background `#f0ede6` → `#e8ddc7`. The pre-v1.1c warm parchment was still the default everywhere Find Detail wasn't. Now paperCream is globally committed
- `app/find/[id]/page.tsx` — ten on-device polish items:
  - Masthead wordmark: italic on "Finds" retired, Title Case single style, 16 → 18px, letter-spacing tightened to `-0.005em`
  - Save + share relocated OFF the masthead ONTO the photograph's top-right corner as frosted paperCream translucent bubbles (`backdrop-filter: blur(8px)`, 0.5px inkHairline edge, 38px diameter)
  - Icon bubble default size 34 → 38, on-image icons 17px, back-arrow 18px
  - New `IconBubble` `variant` prop: `"paper"` (default chrome) or `"frosted"` (on-photograph overlay)
  - Vendor row label: `Explore` → `Explore booth →` (trailing arrow moves INTO the label)
  - Shelf-link pill slimmed to a pure numeric badge: no "Booth" word, no arrow, numeral bumped 13 → 16px IM Fell non-italic, horizontal padding tightened to `2px 9px`
  - X glyph `paddingTop: 5 → 3` for vendor-name ascender alignment
- `docs/design-system.md` — v1.1d → v1.1e Status paragraph, shelf-link pill rewritten as pure numeric badge role, paper-as-surface section updated to note the global body commitment, typography table updated (masthead + pill numeral + "Explore booth" label rows), icon treatment section rewritten for paper + frosted variants, Find Detail screen-spec refreshed, three new retirement-log entries
- Commit: `design: find detail v1.1e polish pass (masthead, on-image save+share, numeric pill, app bg alignment)`

**Commit 2 — Find Detail v1.1f same-session follow-up (session 17 mid-morning):**
- `app/find/[id]/page.tsx`:
  - Frosted icon-bubble bg now state-independent — the v1.1e green-tint active state blended into warm/dark photos; now the bubble stays `rgba(232,221,199,0.78)` paperCream and only the glyph color/fill flips to green when saved. Holding a stable creme bubble and letting the glyph carry the state is the clearer read
  - Post-it pulled inward from the viewport edge: `right: -12 → 4`. Was kissing the screen edge on narrow phones; now sits fully inside the 22px page margin
  - Post-it rotation bumped `+3deg → +6deg`. Committed rotation range documented in doc: `+3` to `+8 degrees`, `+6deg` as the default. Rationale: below `+3` rotation is invisible, above ~`+10` text becomes hard to parse and the note reads as fallen rather than placed
  - Post-it eyebrow stacks: "Booth" / "Location" on two lines, 14px IM Fell italic muted, `line-height: 1.1` so the two words read as one label. "Booth" alone was lightweight for what the pin points at; "Booth Location" names the gesture honestly (marks *where*, not *what*). `minHeight: 84 → 92` to accommodate without crowding the 36px numeral
- `docs/design-system.md` — v1.1e → v1.1f Status paragraph; booth post-it primitive spec updated with new rotation value, inset, dimensions, stacked eyebrow, two new rationale subsections; icon treatment frosted variant updated for state-independent bg; Find Detail screen-spec refreshed
- Commit: `design: find detail v1.1f (frosted state, post-it inset+tilt+stacked eyebrow)`

**Commit 3 — Find Map v1.1g full redesign (session 17 afternoon):**
- Product decision: `/flagged` route name kept (backwards compatibility), UI everywhere reads "Find Map." No URL migration. Glyph hierarchy committed as a doc-level rule: pin = mall (page-level anchor, appears once), X = booth (per-stop marker, appears once per stop). Locked.
- Mockup-first protocol: 3-approach exploration first (`docs/mockups/find-map-exploration.html`) with Journal Itinerary / Pinned Postcards / Map Journal at real mobile dimensions. Approach A (Journal Itinerary) selected. Then v1.1g refinement mockup (`docs/mockups/find-map-v2.html`) iterated 4 times with David before code:
  - v2 with X glyph spine, Booth pill row, mall pin anchor, Caveat opener + ordinal labels + end-of-path marker + bottom Maps action
  - v3 dropped ordinal labels + end-of-path marker + Caveat note per David; added intro voice at top + chapter-break closer with "Continue exploring" link
  - v4 final spec: dropped Continue link (BottomNav handles it), threshold horizontal-scroll for 3+ finds per stop, prices on each find, closer pulled from IM Fell 19px primary → 16px mid for quieter emotional weight
- `app/flagged/page.tsx` — full rewrite against v1.1g spec. Full layout: Mode A masthead → "Find Map" subheader (IM Fell 30px) → intro voice ("Your saved finds are mapped below. Each one is waiting in its place, ready when you are." IM Fell italic 15px) → pin glyph + mall name + dotted-underline address → diamond divider → per-stop itinerary (X glyph on spine, hairline tick between stops, `Booth [NNN pill]` row wrapping Link to `/shelf/[slug]`, vendor italic, saved-count, 2-up grid or horizontal-scroll for 3+) → each find as 4:5 photo with 6px radius + inkHairline border + frosted paperCream heart top-right (unsave) + italic title + system-ui priceInk price (or "Found a home" italic muted for sold) → diamond rule + closer line • Empty state re-dressed in v1.1g. Skeleton loader re-dressed. All v0.2 localStorage scanning, stale pruning, grouping/sorting, focus rehydration, unsave gesture wiring, `BottomNav flaggedCount` passthrough preserved intact
- `docs/design-system.md` — v1.1f → v1.1g Status paragraph covering the Find Map redesign and the three doc-level commitments (glyph hierarchy locked, Find Map spec, Find tile primitive); cartographic vocabulary section gains the explicit glyph hierarchy rule as a cross-cutting commitment; Find Map section went from `PENDING — scope against v1.0 before code` stub → full committed spec; Find tile primitive documented as reusable on any saved-finds surface; three v1.0 doc commitments we overrode logged with rationale (no Caveat margin-note on Find Map, no drive-times, no bottom Maps action)
- Commit: `design: find map v1.1g (full /flagged redesign against v1.1 language; glyph hierarchy locked)`

### Mockups archived
- `docs/mockups/find-map-exploration.html` — 3-approach exploration (Journal / Postcards / Map Journal). Historical record of the mockup-first decision. Can delete after v1.1g is QA'd and beta-blocker-free, or keep as reference when the Approach C "decorative map" question comes up again in a future pass
- `docs/mockups/find-map-v2.html` — final-spec mockup for Find Map v1.1g. Historical record; can delete after v1.1g is QA'd

### Glyph hierarchy — committed cross-cutting rule

**pin = mall. X = booth. Locked.** These two cartographic glyphs do not swap, substitute, or appear interchangeably across the product. On any page that shows both a mall and its booths, the pin appears *once* (mall anchor, page-level) and the X appears *once per booth stop* (inline, content-level). This glyph-concept binding is what lets the cartographic language actually mean something: readers who learn the pair on one page immediately parse it on every other. Find Detail uses this grammar already (pin + mall + tick + X + booth). Find Map establishes the paginated version (one pin at top, N X's down the spine). Booth page v1.1g pass should follow.

### Tool-environment notes from this session

No new gotchas. The session 16 lesson about `create_file` vs `filesystem:write_file` held; used `filesystem:write_file` and `filesystem:edit_file` exclusively throughout. `filesystem:edit_file` targeted edits handled both the large rewrites (Find Map page) and the narrow doc refinements cleanly.

### Session 18 candidates

**18A — Booth page v1.1g second pass (highest design debt).** Replaces `<LocationStatement>` + `<BoothLocationCTA>` with v1.1g cartographic pin+X block + masthead. Swaps Georgia → IM Fell English throughout. Applies `paperCream` global (already committed). Applies photograph 1px inkHairline border + 6px radius across the shelf grid. First opportunity to promote `v1` inline tokens from Find Detail + Find Map into `lib/tokens.ts`. Decides 3-column vs 2-column polaroid arrangement (parked since session 14). ~3–4 hours.

**18B — Feed header + `<MallSheet>` bottom sheet against v1.1g.** The feed is the front door and is still entirely v0.2. Mode B masthead pattern, pin-glyph in the mall selector, find tiles (now a committed primitive from v1.1g) reused in the feed grid. ~3 hours.

**18C — Nav Shelf decision + implementation (still held from sessions 16–17).** David reviews `docs/mockups/nav-shelf-exploration.html` on device, picks from A/B/C/D. Small implementation: BottomNav styling update + doc BottomNav subsection rewrite. ~45 min. Worth parking until Booth page ships so the full-chrome rework can bundle with the nav-shelf decision.

**18D — Sprint 4 tail batch (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk).** Non-design work; still needed pre-beta. ~5.5 hours focused.

**Recommended:** 18A first. Booth page is the biggest design debt remaining and has been flagged since session 15. Everything else stacks cleanly after.

### Files touched this session
- `app/layout.tsx` — body background to paperCream
- `app/globals.css` — `@layer base body` background to paperCream
- `app/find/[id]/page.tsx` — two polish passes (v1.1e, v1.1f)
- `app/flagged/page.tsx` — full rewrite to v1.1g
- `docs/design-system.md` — v1.1d → v1.1e → v1.1f → v1.1g (three targeted edit passes)
- `docs/mockups/find-map-exploration.html` — NEW, 3-approach exploration
- `docs/mockups/find-map-v2.html` — NEW, final-spec mockup, iterated 4 times
- `CLAUDE.md` (this file) — session 17 close

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

**Design canonical spec:** See `docs/design-system.md` v1.1g for the visual + interaction system. All multi-screen UI work scopes against it before code. v1.1g (session 17) locked the glyph hierarchy (pin = mall, X = booth), committed the Find Map spec, and committed the Find tile primitive as reusable on any saved-finds surface.

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
- Design agent activated, `docs/design-system.md` at **v1.1g** (sessions 15–17)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes
- Booth page redesign (v0.2 language) — shipped session 14, functional in production, marked deprecated in v1.1g spec pending second pass
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

### 🟡 Design v1.1g execution (sessions 18+)
- **Session 18 candidate A** — Booth page v1.1g second pass (replaces `<LocationStatement>` + `<BoothLocationCTA>`, swaps Georgia → IM Fell English, applies cartographic pin+X, masthead wordmark, post-it vocabulary where applicable, 1px hairline photo borders). First opportunity to promote `v1` inline tokens from Find Detail + Find Map to `lib/tokens.ts`.
- **Session 18 candidate B** — Feed header + `<MallSheet>` bottom sheet pattern against v1.1g. Find tile primitive reused from Find Map.
- **Session 18 candidate C** — Nav Shelf decision + implementation (still held from session 16). David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html` (A Suggestion / B Grain / C Full Shelf / D Line Alone). Ship chosen treatment.
- **Session 19 candidate** — Cleanup pass: inline Georgia → IM Fell English on chrome; inline `C` objects → `colors` import; magic-number spacing → spacing tokens; `lib/tokens.ts` consolidation for post-it/ink scale/paper palette / Find tile primitive.

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
- Design v0.2 components deprecated but still in code (`LocationStatement`, `BoothLocationCTA`) — replaced in Booth v1.1g sprint (session 18 candidate A)
- `v1` inline tokens on Find Detail + Find Map + BottomNav — promote to `lib/tokens.ts` during Booth v1.1g sprint (now includes the Find tile primitive tokens)
- `docs/mockups/find-map-exploration.html` and `docs/mockups/find-map-v2.html` — historical record; can delete once Find Map v1.1g is QA'd clean on device

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
