## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Run `/session-close` — replaces the old `thc` alias with the full close protocol (tombstoning, memory updates, commit + push, PR creation).

---

## DOCUMENT MAP

This file is the **live whiteboard** — only the current session's starting point. Everything else is elsewhere:

| Need | Read |
|---|---|
| Architecture, schema, routes, API table, lib + component catalog, auth pattern, DNS state, known gotchas, debugging commands | `CONTEXT.md` |
| Operating constitution: brand rules, tech rules, risk register, decision gate, agent roster | `docs/DECISION_GATE.md` |
| Session structure, HITL indicator standard, Docs agent + Design agent operating principles, blocker protocol | `MASTER_PROMPT.md` |
| Historical session close summaries (sessions 1–30, growing) | `docs/session-archive.md` |
| Canonical design system v1.1l + v1.2 build spec | `docs/design-system.md` + `docs/design-system-v1.2-build-spec.md` + `docs/mockups/` |
| Canonical vendor onboarding (3 flows) | `docs/onboarding-journey.md` |
| Supabase OTP email templates (HITL paste target) | `docs/supabase-otp-email-templates.md` |
| In-mall SQL triage recipes | `docs/admin-runbook.md` |
| Active bugs + deferred items + resolved history | `docs/known-issues.md` |
| Pre-beta QA walk runbook (T4d) | `docs/pre-beta-qa-walk.md` |
| Window share QA walk runbook (Q-007 session 41) | `docs/share-booth-qa-walk.md` |
| Queued sessions (scoped work sequenced behind something else) + operational backlog | `docs/queued-sessions.md` |
| Roadmap (Beta+) — epic-level captured items not yet scoped | `docs/roadmap-beta-plus.md` |
| Tech Rule candidates queue (firing counts + promotion status) | `docs/tech-rules-queue.md` |

---

## TERMINAL COMMAND FORMATTING CONVENTION
> When Claude surfaces multiple terminal commands to run in sequence, each goes in its own fenced block. This lets David copy one at a time and verify each before running the next.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

**Not this** (chained separate commands in one block that invite blind paste):

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
```

Exception: a single chained command with `&&` stays in one block — that's one atomic action by design.

---

## ✅ Session 76 (2026-04-27) — 6-item redirect bundle: bug fix + green tokens + find-title centering + animation consistency (7 runtime/docs commits)

David approved /session-open's recommended move (feed content seeding) but redirected to a 6-item polish bundle: a back-nav bug, two color-swap items, find-title centering, animation consistency review, and FB-Marketplace-style shared-element transitions. Triaged into five tracks (A–E). Shipped Tracks A + B + C + E end-to-end across 7 commits; Track D (shared-element transitions) deferred to session 77 as its own session. Pattern: triage on first message → state-first questions on B/C/D/E → Track A bug investigation immediate → mockup-first on C → decisions doc on E → ship in sequence.

**Beat 1 — Triage of David's 6-item redirect.** Items grouped into five tracks: A = bug investigation (item 1, masthead disappears on back-nav from booth to find); B = surgical color swaps (item 3 Booth eyebrow → green; item 4 Treehouse Finds wordmark → green); C = find-detail layout (item 2, center title + price below, no hyphen); D = shared-element transitions (item 6, FB Marketplace style, large scope); E = animation consistency review (item 5, carry from session 71). Per `feedback_ask_which_state_first.md`, surfaced state-first questions on items 4 (scope of wordmark change), 2 (interaction with Variant B lockup), 5 (scope ceiling), 6 (surfaces in scope). David answered "4 (a) every primary tab; 2 (c) mockup; 5 Home/Booths/Find Map/My Booth; 6 (e) all four thumbnail surfaces."

**Beat 2 — Track A shipped (`b5470da`, +62/-28 in 1 file).** Investigation traced the root cause: [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) has 4 render branches (`loading`, `!post`, sold-shopper, normal) but only 2 (sold-shopper + normal) render `StickyMasthead`. With `force-dynamic` at line 63, every back-nav momentarily re-enters `loading: true` before `getPost(id)` resolves, dropping the masthead during that flash; if the fetch returns null, the page sticks in the masthead-less `!post` branch permanently. [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx) doesn't have this bug because it has no `if (loading)` early-return. Fix mirrors that pattern: masthead lifted to both error branches via shared `<StickyMasthead left={<IconBubble onClick={() => router.back()}>...ArrowLeft...</IconBubble>}/>` block. Both branches now layout as `display: flex; flexDirection: column` with a `flex: 1` content child, preserving the centered loading text + the centered "moved on" message.

**Beat 3 — Track B shipped (`d0c4ce3` + `fd1a874`, two commits, 5 files runtime).** First commit: masthead wordmark `v1.inkPrimary` → `v1.green` in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) (carries to every primary tab + detail page using the default wordmark — no per-page caller change needed); "Booth" eyebrow `v1.inkMuted` → `v1.green` across 5 surfaces ([`app/shelves/page.tsx`](app/shelves/page.tsx) Variant B lockup, [`app/flagged/page.tsx`](app/flagged/page.tsx) Variant B header, [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) post-it + cartographic card, [`components/BoothPage.tsx`](components/BoothPage.tsx) BoothHero post-it). Mid-track David surfaced a follow-up: "I want the booth NUMBER green too, not just the eyebrow." Second commit: 5 corresponding `FONT_NUMERAL` numerals on the same 5 surfaces flipped from `v1.inkPrimary` → `v1.green`. [`components/PhotographPreview.tsx`](components/PhotographPreview.tsx)'s "Booth Location" multi-line eyebrow + numeral intentionally left unchanged (different label scope, post-flow preview surface only). The "viewport-anchor green" treatment now reads as the system-level signal for booth identity across the ecosystem.

**Beat 4 — Track C mockup → design-to-Ready → feat (`a2cf548` + bundled in `fd1a874`).** Per Design agent + same-session design-record-commit rule, mockup-first then design record then implementation:
- Mockup [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) — 5-decision table (alignment, price placement, hyphen retirement, price typography, caption position) + 3 phone frames (Frame A current left-aligned with em-dash; Frame B centered title + price 32px twin in `priceInk`; Frame C centered title + price 22px italic subtitle). David approved 2.1–2.5 in one message: "2.1 approve, 2.2 approve, 2.3 approve, 2.4 Frame B (twin), 2.5 approve."
- Design record [`docs/find-detail-title-center-design.md`](docs/find-detail-title-center-design.md) — D1–D5 frozen, acceptance criteria, Frame C parked as CSS-only pivot if 32px twin reads heavy on real content during seeding.
- Feat: title block on [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) formerly single `<h1>` with title + inline em-dash + price-span now renders as outer `motion.div` with `textAlign: "center"`, `<h1>` carries title only, sibling `<div>` below with matched 32px IM Fell regular in `priceInk`, `marginTop: 2`. Em-dash retired. Price still gates on `(typeof price === "number" && price > 0)` — null/zero price renders title-only with no empty line below. Implementation accidentally bundled into `fd1a874` (booth-numerals commit) since both edits touched the same file; design-to-Ready commit `a2cf548` followed rather than preceded — same-session rule satisfied (record + impl both in this session) but ordering inverted. Single firing of imperfect ordering — not worth a new memory.

**Beat 5 — Track E mockup-skip → design-to-Ready → feat (`ecb8ef8` + `3832fc1`, 6 files runtime).** State-first answers from David: 5.1 (a) decisions doc only (no testbed); 5.2 (b) include /flagged; 5.3 (c) `whileTap: scale 0.97` on Booths VendorCard only. Mid-session correction: Explore-agent inventory misidentified Find Map as [`app/finds/page.tsx`](app/finds/page.tsx) when /finds is the dark reseller layer ("My Picks", #050f05); actual Find Map is [`app/flagged/page.tsx`](app/flagged/page.tsx). Design record corrected before implementation. **Second firing of "verify sub-agent claims that contradict known semantic rules"** (first firing session 71). Promotion-ready.
- Design record [`docs/animation-consistency-design.md`](docs/animation-consistency-design.md) — E1–E5 + E7 frozen; E6 (scroll-restore safety) deferred. Token table covers card entrance easing/duration/stagger + empty state pattern + tap feedback + token centralization.
- Feat: 5 motion tokens added to [`lib/tokens.ts`](lib/tokens.ts) — `MOTION_EASE_OUT = [0.25, 0.46, 0.45, 0.94]`, `MOTION_CARD_DURATION = 0.32`, `MOTION_STAGGER = 0.04`, `MOTION_STAGGER_MAX = 0.30`, `MOTION_EMPTY_DURATION = 0.34`. Home [`app/page.tsx`](app/page.tsx) local `EASE` const replaced by `MOTION_EASE_OUT` alias; EmptyFeed aligned to E4 (y:10→8, 0.45s→tokens); staggerDelay literals →tokens (cap 0.28→0.30 for parity); MasonryTile bespoke CSS unchanged (intentional polish on hero feed grid). Booths [`app/shelves/page.tsx`](app/shelves/page.tsx): VendorCard transition tokens + `whileTap: scale 0.97` (E5); empty state literal → tokens. Find Map [`app/flagged/page.tsx`](app/flagged/page.tsx): local `EASE` → token alias. My Booth [`app/my-shelf/page.tsx`](app/my-shelf/page.tsx): NoBooth empty state aligned to E4. [`app/finds/page.tsx`](app/finds/page.tsx) (dark reseller layer) explicitly out of scope.

**Final state in production (as of `3832fc1`):**

- `/find/[id]` masthead present in every render branch — back-nav from /shelf no longer flashes a chrome-less screen.
- `Treehouse Finds` wordmark renders green across every primary-tab masthead and every detail-page masthead.
- "Booth" eyebrow + booth NUMERAL both render green on 5 surfaces (Booths grid, /flagged, find-detail post-it, find-detail cartographic card, BoothHero post-it). System signal for booth identity now visually unified.
- `/find/[id]` title centered, price 32px IM Fell regular in `priceInk` on its own line below, no em-dash. Caption + cartographic block unchanged.
- Card entrance + empty-state + tap-feedback patterns share tokens across Home / Booths / Find Map (/flagged) / My Booth. Booths VendorCard now responds to tap (was silent). Home tile keeps bespoke CSS polish (intentional richness on hero feed grid).

**Commits this session (7 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `b5470da` | fix(find-detail): masthead present in loading + !post branches |
| `d0c4ce3` | feat(green-tokens): wordmark + Booth eyebrow → v1.green |
| `fd1a874` | feat(green-tokens): booth numerals → v1.green |
| `a2cf548` | docs(find-title): design-to-Ready |
| `ecb8ef8` | docs(animation-consistency): design-to-Ready |
| `3832fc1` | feat(animation-consistency): unified motion tokens across primary tabs |
| (session close) | docs: session 76 close — bug fix + green tokens + find-title centering + animation consistency |

**What's broken / carried (delta from session 75):**

- 🟢 **Item 1 — masthead disappears on back-nav** ✅ — resolved session 76 in `b5470da`. Find detail page now renders masthead in every branch.
- 🟢 **Items 3 + 4 — green token swaps** ✅ — resolved session 76 in `d0c4ce3` + `fd1a874`. Wordmark + Booth eyebrow + booth numeral all green on every applicable surface.
- 🟢 **Item 2 — find-title centered + price below** ✅ — resolved session 76 across `a2cf548` + `fd1a874`. Em-dash retired.
- 🟢 **Item 5 (E1–E5+E7) — animation consistency** ✅ — resolved session 76 across `ecb8ef8` + `3832fc1`. Card entrance + empty state + tap feedback unified across 4 primary tabs.
- 🟡 **Item 6 — FB Marketplace shared-element transitions** — carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces (feed/ → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id], BoothPage shelf rail tiles → /find/[id]). Per `feedback_testbed_first_for_ai_unknowns.md`, build a `/transition-test` page first before touching real surfaces. Likely its own session, size M-L.
- 🟡 **E6 — scroll-restore safety deferred** (session 76) — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize the sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min, size S-M, its own session.
- 🟡 **NEW: Frame C parked** (session 76) — find-title 22px italic subtitle alternative ([`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html)) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- 🟡 **NEW: Sheet/modal entrance patterns NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. all carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- 🟡 **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from new motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- 🟡 **NEW: Home MasonryTile has bespoke easing intentionally** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations. Token values centralize but the runtime is forked. Acceptable; revisit if real-content seeding makes it read as inconsistency rather than intentional polish.
- 🔴 **Migration 013 STILL pending** — David has not yet pasted [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql) into Supabase dashboard SQL editor. Until applied, /vendor-request POST will fail at the insert step. Carries from session 75.
- 🟡 All session 75 carry items not touched this session remain unchanged: Frame C compact-pill alternative parked on /vendor-request, project-wide numeral-font rule (now arguably reinforced via Track E adding motion tokens to lib/tokens.ts in same canonical export pattern), BoothHero lightbox z-index sandwich pattern, long-form helper copy on paper-wash → FONT_SYS rule, narrow-named-tokens rule, trust-the-build rule.
- 🟡 Sessions 70–74 carry items unchanged unless explicitly resolved above.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — fired four times in beat 1 (state-first questions on items 4/2/5/6) and three times in beat 5 (Track E sub-questions 5.1/5.2/5.3). 10th–13th firings (counting bundled multi-questions as one firing per turn). Pattern fully default.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 7 runtime/docs commits ✅.
- Same-session design-record-commit rule (session 56) — fired twice this session (`a2cf548` find-title + `ecb8ef8` animation-consistency). 11th + 12th firings total. Track C ordering inverted (impl bundled into prior commit, design-to-Ready followed) — same-session rule satisfied; ordering imperfect. Single firing of imperfect ordering — not worth a new memory.
- `feedback_testbed_first_for_ai_unknowns.md` — referenced for Track D deferral; not yet fired.

**Live discoveries:**

- **`force-dynamic` × loading-state interaction strands users without chrome.** The `/find/[id]` bug is the second case where `force-dynamic` produced an unintended UX — first was session 73's `force-dynamic` not propagating `cache: "no-store"` to inner fetches (TR-q). Different issue here: every back-nav momentarily re-enters `loading: true`, which surfaces UI gaps the loading branch wasn't designed for. Pattern: detail-page render branches should ALL include base chrome (masthead with back button), regardless of which branch is hit. **Tech Rule candidate (first firing): "Detail-page render branches must render base chrome in every state."**
- **Sub-agent route identification is unreliable when route names are similar.** Explore agent identified `/finds` as Find Map; actual Find Map is `/flagged`. The names `/finds` and `/flagged` are semantically related ("finds you've saved are flagged" being one mental model) and the agent guessed wrong. **Second firing of "verify sub-agent claims that contradict known semantic rules"** (first firing session 71 was Explore-agent's letterboxing claim contradicting `objectFit: cover`). Promotion-ready as a Tech Rule.
- **Token centralization narrative continued: motion follows fonts.** Session 75 promoted `FONT_NUMERAL`. Session 76 promotes `MOTION_EASE_OUT` + 4 sibling motion tokens. The `lib/tokens.ts` central-token-table pattern is now established as the locus for cross-page primitives — color, font, motion. Future cross-cutting primitives (spacing? shadow? z-index?) likely belong here too.
- **Em-dash retirement on title-price patterns.** The find-detail H1 had been carrying inline `— $XXX` as a "title + tail" pattern. Frame B retired it in favor of stacked title + price. **Single firing — Tech Rule candidate on second firing: "Default to stacked over inline for title + secondary value patterns."**
- **The Track A bug came from /find/[id] — the surface most-touched in recent sessions.** Sessions 70 (cartographic card lift) + 71 (cartographic collapse) + 75 (FONT_NUMERAL on this surface) all touched the page; the masthead-in-every-branch invariant existed in /shelf/[slug] but not /find/[id], and no session noticed. Pattern: when a page has had 3+ recent layout sessions, audit invariants against sibling pages of the same shape. Single firing.

**Operational follow-ups:**
- Archive-drift accounting: rotated session 75 to tombstone. Session 70 falls off the bottom of last-5 visible tombstones. Archive-drift backfill to session-archive.md (sessions 54 + 55 + 57–75) still on the operational backlog.
- Operational backlog (no new entries this session — Track D deferral and E6 deferral tracked separately as carry-forwards).

**Tech Rule candidates (this session):**

- "Detail-page render branches must render base chrome in every state" — first firing (find/[id] bug). Single firing. Tech Rule on second firing.
- "Verify sub-agent claims that contradict known semantic rules" — **second firing** (session 71 letterboxing + session 76 Find-Map-route). Was single-firing; **now promotion-ready**.
- "Default to stacked over inline for title + secondary value patterns" — first firing (find-title em-dash retirement). Single firing.
- "Audit invariants against sibling pages of the same shape after 3+ recent sessions on a surface" — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here). Single firing.

**Notable artifacts shipped this session:**
- [`docs/find-detail-title-center-design.md`](docs/find-detail-title-center-design.md) + [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) — D1–D5 frozen, Frame C parked.
- [`docs/animation-consistency-design.md`](docs/animation-consistency-design.md) — E1–E5+E7 frozen, E6 deferred.
- 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts) — `MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`. First cross-page motion primitive set.
- Loading + !post branch hardening on [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — masthead + back button always present.
- Booths VendorCard tap feedback — first tap signal on the surface. Parity-of-signal across Booths + Find Map (Home keeps richer treatment).
- `whileTap: scale 0.97` pattern adopted on a third surface (Find Map FindCard already had it; Find Map FAB has it; now Booths VendorCard joins).

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–75 still missing — operational backlog growing).

- **Session 75** (2026-04-27) — David approved feed seeding then redirected to a 7-item polish + system-rule bundle: admin login redirect, BoothHero lightbox, /vendor-request rewrite, booth-numeral font system swap. Six runtime/docs commits + close shipping all 7 end-to-end. **Track A (`60a7a11` admin redirect + `eef1746` BoothHero lightbox):** `pickDest(user)` helper in /login centralizes admin → `/`; transparent overlay at z-5 sandwiches between photo + pencil + post-it. **Track C (`d747b71` design-to-Ready + `01a6b44` feat):** `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` (Times New Roman) across 7 surfaces; project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL" frozen; build-error caught the 7th surface (PhotographPreview). **Track B (`a427ee7` design-to-Ready + `fbbba21` feat):** /vendor-request one-screen redesign with owner-ack checkbox gate, hard-required Mall+Booth#, FONT_SYS photo copy, intro paragraph dropped + migration 013 (HITL paste pending). ZERO new memories. ZERO new Tech Rule promotions; four single-firing candidates.
- **Session 74** (2026-04-27) — Gemba walk follow-up at America's Antique Mall surfaced 7 items; six beats, four runtime/docs commits + close shipping all 7 end-to-end. **Polish quartet (`30b9922`):** AddBoothInline alphanumeric `booth_number`, /post/preview FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped. **Item 4 (`d52b149`):** /post/preview's three router.push call sites preserve `?vendor=<id>` through publish flow. **Booth management (`6d32c9c` design-to-Ready + `c5437df` feat):** D1–D7 frozen for Edit + Add sheets (Pencil bubble repurpose, slug auto-update, no `user_id` safety gate, mall-change conflict path, no hero in Edit, Add tile tail position, hero retained for mall-walk capture). 4 new components (BoothFormFields, EditBoothSheet, AddBoothSheet, AddBoothTile) + PATCH `/api/admin/vendors` with BOOTH_CONFLICT 409. Third oscillation of AddBoothInline-on-/shelves (sessions 37 + 67 retired; 74 restored intentionally per demo-authenticity reasoning). Optimistic `setVendors` on success — no full reload. Same-session design-record-commit rule 8th firing. ZERO new memories. ZERO new Tech Rule firings; one single-firing candidate ("audit existing affordances for semantic drift").
- **Session 73** (2026-04-27) — R3 closed end-to-end in a single-track session. Eight runtime/docs commits + close resolving both halves of the analytics arc. **Write side:** 5 new event types via migration 012 (`booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped`) + `filter_applied` `page` field on Home/Booths/Find Map for per-tab attribution. Closes 4 deferred carries (sessions 59 + 62 + 67 + 68). Decisions D1–D4 frozen in design record §Amendment v1.1. **Read side:** parked-since-session-58 admin Events stale-data mystery resolved at root — Next.js HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls; `force-dynamic` only disables route-response caching, doesn't propagate `cache: "no-store"` to inner fetches; two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) via `global.fetch` wrapper benefits every admin route + every `recordEvent` call. Diagnosed in one session via side-by-side probe pattern (built `/api/admin/events-raw` parked since session 60 + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading, 78-min stale snapshot vs fresh raw). **Strategic conversation:** David flagged in-app admin tab is wrong shape for analytics long-term → Q-014 queued (Metabase + read-only Postgres role + 3 starter dashboards + retire admin tab post-Metabase). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until Q-014 lands. Polish: chip wiring for v1.1 types (Bookmarks primary; Find shares + Tag flow overflow). ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches; compounds with TR-l).
- **Session 72** (2026-04-26) — Small surgical session. One runtime commit (`27a0439`) rationalizing admin entry: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned). Two redundant affordances retired in same commit: `/shelves` masthead `ADMIN` pill + green `Manage` eyebrow under each booth tile (Pencil + Trash bubbles already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. Live discovery: "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single-firing in admin context, single-firing in shopper context, watching for third instance.
- **Session 71** (2026-04-26) — Three independent decision arcs in three runtime commits + close (`54fa370` `/find/[id]` cartographic collapse / `30c2c0c` 3-item polish bundle / `704ff7a` caption min-height). Parallel two-card pattern on `/find/[id]` collapsed into ONE inkWash card with italic IM Fell "Find this item at" eyebrow above + vendor name + mall · city/state Apple Maps subtitle + Variant B booth numeral; cartographic spine (PinGlyph + tick + XGlyph) FULLY RETIRED across the v1.x ecosystem; link to `/mall/[slug]` retired from this surface. MallScopeHeader API extended with `count` prop rendering count alone at IM Fell italic 22px on Booths + Find Map (Home unchanged). FindTile/WindowTile/ShelfTile gain caption `minHeight: 76` + ShelfCard rail tile `minHeight: 56` — find tiles bottom-out at uniform heights regardless of caption-length variance. **Diagnosis-pivot mid-session:** Item 5 was scoped to E+B+A bundle pre-screenshot; David's screenshot of `/flagged` revealed actual cause was caption-variance not photo-cropping; shipped E only with B+A parked in mockup ready for second pass. Same-session design-record-commit rule 6th + 7th firings. `feedback_ask_which_state_first.md` 8th firing. ZERO new memories. Two new Tech Rule candidates: "verify sub-agent claims that contradict known semantic rules" (Explore agent's letterboxing claim contradicting `objectFit: cover`) + "ask for a screenshot before scoping multi-change visual fixes." Three carry items into session 72: animation consistency review (item 3, deferred), shareable filtered-mall link (item 6, deferred), B+A second pass parked.
---

## CURRENT ISSUE
> Last updated: 2026-04-27 (session 76 close — David's 6-item redirect bundle: masthead-disappears bug, green wordmark + Booth eyebrow + booth numeral, find-title centered with price below, animation consistency review across 4 primary tabs. Tracks A + B + C + E shipped end-to-end across 7 commits; Track D (FB Marketplace shared-element transitions) carried to session 77.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (seven runtime/docs commits, 6-item redirect):** David approved /session-open's recommended move (feed content seeding) but redirected to a 6-item bundle. Triaged into five tracks (A–E). **Track A — Bug fix (`b5470da`):** /find/[id] masthead disappears on back-nav from /shelf because `force-dynamic` re-enters `loading: true` momentarily and the `loading` branch had no masthead. Both `loading` + `!post` branches now render `StickyMasthead` with back button (mirrors /shelf/[slug] pattern). **Track B — Green tokens (`d0c4ce3` + `fd1a874`):** Treehouse Finds wordmark, "Booth" eyebrow, AND booth numeral all flipped to `v1.green` across every applicable surface (5 eyebrows + 5 numerals + masthead). **Track C — Find-title centering (`a2cf548` design-to-Ready + impl bundled into `fd1a874`):** D1–D5 frozen via mockup, David picked Frame B (32px twin price below). Em-dash retired; stacked title + price replaces inline pattern. **Track E — Animation consistency (`ecb8ef8` design-to-Ready + `3832fc1`):** 5 motion tokens added to lib/tokens.ts; Booths VendorCard gains `whileTap: scale 0.97` (was silent); empty-state + card-entrance patterns unified across Home / Booths / Find Map (/flagged) / My Booth. E6 (scroll-restore safety) deferred. **Track D — FB Marketplace shared-element transitions** carried into session 77 as its own session (size M-L). ZERO new memories. **Sub-agent verification rule** fired second time (Explore-agent identified `/finds` as Find Map when actual Find Map is `/flagged`) — now promotion-ready as a Tech Rule. `feedback_ask_which_state_first.md` 10th–13th firings. **Same-session design-record-commit rule** 11th + 12th firings (Track C ordering imperfect — impl bundled into prior commit, record followed; rule satisfied but inverted). **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md).

### 🔴 HITL — STILL pending from session 75: paste migration 013 before /vendor-request testing

Paste [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql) into the Supabase dashboard SQL editor:

```sql
ALTER TABLE vendor_requests
  ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
```

Until applied, the new `/vendor-request` POST will fail at the insert step with `column owner_acknowledged does not exist`. Pre-existing rows backfill to FALSE — no admin disruption.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60–75, **76**. **Top priority** — the actual V1 unblocker, now **19× bumped**. Session 76 closed five of David's six redirect items end-to-end. Real content remains the actual unblocker. **NEW judgment moments** for session 76 deltas (in addition to all sessions 70–75 carry-forwards): (a) back-nav from /shelf to /find/[id] on iPhone — masthead must never disappear in any state; (b) green Treehouse Finds wordmark on every primary tab masthead + detail page; (c) green "Booth" eyebrow + green booth numeral on Booths grid + /flagged + find-detail post-it + cartographic card + BoothHero post-it; (d) /find/[id] title centered + price below in priceInk + no em-dash; (e) tap a Booths VendorCard — should respond with scale-down spring (was silent before); (f) empty states across Home / Booths / Find Map / My Booth — should feel matched in entrance treatment.

**Shape:** unchanged from session 75 — same migration-013 → real-posts → walk → T4d-partial sequence. Migration 013 still pending HITL paste.

### Alternative next moves (top 3)

1. **Track D — FB Marketplace shared-element transitions** (carried from session 76) — Item 6 of David's session-76 redirect. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id], BoothPage shelf rail tiles → /find/[id]). Per `feedback_testbed_first_for_ai_unknowns.md`, build a `/transition-test` testbed page first to validate cross-route shared-element transitions in Next.js App Router (known gotchas) before touching real surfaces. Likely its own session, size M-L.
2. **E6 — extract `useScrollReveal` hook** (carried from session 76) — Booths / Find Map / /flagged need skip-entrance-on-restore parity with Home. Generalize the sessionStorage-key + ref machinery from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`. ~30–60 min, size S-M.
3. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. More valuable AFTER feed seeding lands. If investor touchpoint is imminent, run Q-014 first. Size M.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 77 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 76 closed five of six redirect items: /find/[id] masthead bug fix (loading + !post branches now render chrome), green tokens (wordmark + Booth eyebrow + booth numeral all v1.green across every surface), find-title centered with price 32px twin below (em-dash retired), animation consistency across 4 primary tabs (5 motion tokens in lib/tokens.ts; Booths VendorCard gains whileTap; empty states unified). PRE-FLIGHT: confirm migration 013_owner_acknowledged.sql has been pasted into Supabase (otherwise /vendor-request submit will fail with "column does not exist"). Then walk the Add Find flow on iPhone for ~10–15 real posts. JUDGMENT MOMENTS for session 76 deltas: (a) back-nav from /shelf to /find/[id] — masthead never disappears; (b) green wordmark on every primary tab masthead; (c) green Booth eyebrow + numeral on 5 surfaces; (d) /find/[id] title centered + price below in priceInk + no em-dash; (e) Booths VendorCard tap-feedback spring (was silent); (f) empty state entrance parity across Home / Booths / Find Map / My Booth. PLUS all session 75 deltas (admin login redirect, BoothHero lightbox, FONT_NUMERAL across booth numerals, /vendor-request one-screen redesign with owner-ack) and sessions 70–74 carry-forwards. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. ALTERNATIVE NEXT SESSIONS (in priority): (1) Track D — FB Marketplace shared-element transitions (mockup + framer-motion layoutId testbed + rollout across 4 thumbnail surfaces, size M-L, its own session); (2) E6 — extract useScrollReveal hook so Booths / Find Map / /flagged adopt skip-entrance-on-restore (size S-M); (3) Q-014 — Metabase analytics surface (more valuable AFTER seeding; before if investor touchpoint imminent). Note: /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked. R3 diag strip + raw probe stay as durable visibility tooling until admin tab retires post-Q-014. /finds (dark reseller layer "My Picks") deviates from new motion tokens by design (out of scope).
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until admin tab retires post-Q-014. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method` payload, intent-capture semantic.
- **Items 1 + 5 + 6 + 7 (Gemba polish quartet)** ✅ — **resolved session 74** in `30b9922`. Alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped.
- **Item 4 (post-publish vendor-param preservation)** ✅ — **resolved session 74** in `d52b149`. Three router.push call sites in /post/preview preserve `?vendor=<id>` so admin lands on booth-of-origin.
- **Items 2 + 3 (booth name + mall edit)** ✅ — **resolved session 74** in `c5437df`. EditBoothSheet + PATCH `/api/admin/vendors` + Pencil bubble rewire on `/shelves`.
- **"Add a booth" affordance restored on /shelves** ✅ — **resolved session 74** in `c5437df`. AddBoothTile + AddBoothSheet (third oscillation, intentional this pass per [`docs/booth-management-design.md`](docs/booth-management-design.md)).
- **Item 1 (session 75) — admin login redirect** ✅ — **resolved session 75** in `60a7a11`. `pickDest(user)` helper routes admins to `/` by default; explicit `?redirect=/foo` still wins.
- **Item 6 (session 75) — BoothHero lightbox on tap** ✅ — **resolved session 75** in `eef1746`. Transparent overlay button at z-5 sandwiched between photo container and pencil/post-it. Mounts only when heroImageUrl present.
- **Item 7 (session 75) — booth-numeral font system** ✅ — **resolved session 75** across `d747b71` + `01a6b44`. `FONT_NUMERAL` (Times New Roman) replaces `FONT_IM_FELL` on Variant B booth lockup numerals + MallScopeHeader count chips. Project-wide rule frozen.
- **Items 2 + 3 + 4 + 5 (session 75) — /vendor-request redesign** ✅ — **resolved session 75** across `a427ee7` + `fbbba21`. One-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped.
- **Item 1 (session 76) — masthead disappears on back-nav** ✅ — **resolved session 76** in `b5470da`. Loading + !post branches now render `StickyMasthead` with back button.
- **Items 3 + 4 (session 76) — green tokens** ✅ — **resolved session 76** in `d0c4ce3` + `fd1a874`. Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` across every applicable surface.
- **Item 2 (session 76) — find-title centered + price below** ✅ — **resolved session 76** across `a2cf548` (record) + `fd1a874` (impl bundle). Frame B picked. Em-dash retired.
- **Item 5 (session 76, E1–E5+E7) — animation consistency** ✅ — **resolved session 76** across `ecb8ef8` + `3832fc1`. 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts); Booths VendorCard gains tap feedback; empty states unified across 4 primary tabs.
- **🔴 STILL pending HITL: paste migration 013_owner_acknowledged.sql into Supabase dashboard** — required before /vendor-request testing. Carries from session 75. Single line: `ALTER TABLE vendor_requests ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;`. File: [`supabase/migrations/013_owner_acknowledged.sql`](supabase/migrations/013_owner_acknowledged.sql).
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **NEW: Item 6 (session 76) — FB Marketplace shared-element transitions** carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces. Per `feedback_testbed_first_for_ai_unknowns.md`, build `/transition-test` testbed page first to validate cross-route shared-element transitions before touching real surfaces. Size M-L; likely its own session.
- **NEW: E6 (session 76) — scroll-restore safety deferred** — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min in its own session.
- **NEW: Frame C parked on find-title centering** (session 76) — [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) Frame C (22px italic subtitle) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- **NEW: Sheet/modal entrance animation consistency NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- **NEW: Home MasonryTile bespoke easing intentionally diverges** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations preserved as intentional polish on hero feed grid. Token values centralize but the runtime is forked.
- **NEW: Detail-page render branches must render base chrome in every state** (session 76) — first firing (find/[id] bug). Single firing; Tech Rule on second firing.
- **NEW: Default to stacked over inline for title + secondary value patterns** (session 76) — first firing (find-title em-dash retirement). Single firing.
- **NEW: Audit invariants against sibling pages of the same shape after 3+ recent sessions** (session 76) — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here despite 3 recent layout sessions). Single firing.
- **Feed content seeding** — rolled forward from sessions 55–75, **76**. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session, now **19× bumped**. Sessions 61–76 each strengthened the case; session 76 closed 5 redirect items but real content remains the actual unblocker.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 22+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, plus **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready** as of session 76 (second firing). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — arguably second-firing in session 71). Session 70 surfaced two single-firings ("smallest→largest commit sequencing" + "italic-ascender 1px lift"). Session 71 surfaced two ("verify sub-agent claims that contradict known semantic rules" — **now second-fired session 76** + "ask for a screenshot before scoping multi-change visual fixes"). Session 73 surfaced **TR-q** ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches" — first firing; compounds with TR-l). Session 74 surfaced "audit existing affordances for semantic drift when adding new ones" (Pencil discovery, single firing). Session 75 surfaced four single-firings: "audit existing affordances" (2nd firing — BoothHero z-index stacking), "long-form helper copy on paper-wash → sans", "narrow-named tokens audited for generalization", "trust the build, not your grep". Session 76 surfaced three single-firings + 1 second-firing: "Detail-page render branches must render base chrome in every state" (1st), "Default to stacked over inline for title + secondary value patterns" (1st), "Audit invariants against sibling pages of the same shape after 3+ recent sessions" (1st), "verify sub-agent claims that contradict known semantic rules" (**2nd — promotion-ready**). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon if a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title`) + `tag_skipped` shipped.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests see a 22px CircleUser glyph in the masthead right slot. Worth checking during beta-feedback.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012.
- **Existing `/api/*` routes are unwrapped re Sentry** (session 65) — ~25 routes silently swallow errors at the framework level. Acceptable for now; auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (session 65, parked) — would auto-fix the Sentry wrap-route requirement and unlock Cache Components.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — one-time fix: add a `.mcp.json` block.
- **`/mall/[slug]` lensless on v0.2 dark theme** (session 66) — known deviation; lens applies cleanly when mall page does its v1.x ecosystem migration.
- **Treehouse Lens constant is provisional** (session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)`; real vendor content this week may reveal it needs tuning.
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — Pencil + Trash already in top-right; admin can bookmark via `/shelf/[slug]` masthead. Reconsider only if admins want it.
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` fires on all three primary tabs with `page` field for per-tab attribution.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70 + 71** via cartographic collapse.
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via collapse.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight`.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — eyebrow now single-line "Booth"; post-it may look slightly tall. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos; real vendor content during the seeding walk is the actual judgment moment.
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid`; implementation kept `v1.priceInk` (established semantic token).
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70**.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (session 70) — captured in Record 1 design record as known-limitation. Likely fix: mall-grouped section breaks with small all-caps mall eyebrow.
- **Booth-page scroll flatten (D17) regression watch** (session 70) — highest-risk decision in Record 3. Watch on iPhone QA.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (session 70) — page may lose the "reviewing" feel against vendors stepping through Add Find. (Note: session 74 touched /post/preview for item 4 but didn't change title placement.)
- **Booths grid lockup numeral size deviates from spec** (session 70) — design record specified 26px; Booths grid implements at 20px to preserve tile proportions. Design-record L3 amended.
- **Item 3 — animation consistency review across pages** ✅ — **resolved session 76** in `ecb8ef8` + `3832fc1`. 5 motion tokens centralized in lib/tokens.ts; Booths VendorCard tap parity shipped; empty states unified. E6 (scroll-restore safety) deferred separately.
- **Item 5 follow-up: B + A parked** (session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready as second pass.
- **Item 6 — shareable filtered-mall link** (session 71) — needs product + URL-param scoping + share UX + mockup pass.
- **Sub-agent claim verification gap** (session 71) — single firing; Tech Rule candidate on second firing.
- **Screenshot-before-scoping discipline for visual fixes** (session 71) — single firing; Tech Rule candidate on second firing.
- **Multi-affordance retirement → single-surface promotion** (session 72) — single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (session 72) — empty-on-purpose is a valid state.
- **Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014.
- **Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — retire automatically when Q-014 lands and admin tab retires.
- **Other supabase-js call sites might have the same latent bug** (session 73) — audit candidates: any inline `createClient` outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent.
- **NEW: Hero photo asymmetry between Add and Edit sheets** (session 74) — Add sheet has hero photo upload; Edit sheet doesn't (per D5, /my-shelf?vendor=<id> is canonical hero-edit surface). Easy expand if asked.
- **NEW: AddBoothInline retained on /admin Vendors tab** (session 74) — duplicate Add UI exists (AddBoothSheet on /shelves + AddBoothInline on /admin). Field shapes match; future cleanup may unify if drift surfaces.
- **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** (session 74) — intentional per D1. Reachable from `/shelf/[slug]` and direct nav. Add a "View profile" eyebrow on EditBoothSheet if surfaced.
- **NEW: Slug-collision shares the BOOTH_CONFLICT path** (session 74) — generic error message says "booth number" but actual cause might be slug uniqueness. Add slug-specific path if surfaced.
- **NEW: Third oscillation of AddBoothInline-on-/shelves** (session 74) — captured in [`docs/booth-management-design.md`](docs/booth-management-design.md) Carry-forward so future sessions don't reflexively retire.
- **NEW: `showPlaceholders` prop infrastructure dormant in BoothPage** (session 74) — unreachable after item 6 dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup pass to reap; deferred.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–73 missing from `docs/session-archive.md`. Pure docs-housekeeping. Worth a single ~15min ops pass at some point.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, **NEW: reap dormant showPlaceholders prop infrastructure in BoothPage.tsx**. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK + Vercel-Sentry integration + source-map upload + PII scrubbing + email alerts. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations; v4 on-device QA walk **PASSED 4/4 clients session 53**. Loop fully closed.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). **Note: session 74 partially addressed this for admin** via the new EditBoothSheet, which any admin can use to edit any booth's name. Vendor-self-edit is still parked (vendors can't edit their own booth name yet; only admins can).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Sprint 5 polish.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need; session 74 closes the booth-name + mall-edit gap; the 80% case is now covered by /shelves), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` through `v4.html` — design-history reference for Q-011 arc.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002).
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — Q-011 addendums stacked. Post-QA, candidate for consolidation.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot artifact, gitignored, safe to delete anytime).
- Orphaned `dbutler80020@gmail.com` staging auth user (non-admin, non-blocking).
- **NEW: showPlaceholders prop infrastructure in BoothPage.tsx** (session 74) — unreachable after `/my-shelf` dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 was a small surgical session rationalizing admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap with booth Add/Edit sheets + PATCH endpoint; session 75 closed a 7-item David-redirect bundle end-to-end. **Session 76 closed five of six David-redirect items end-to-end across seven runtime/docs commits**: /find/[id] masthead bug fix (loading + !post branches now render chrome), green tokens (Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` system-wide), find-title centered with price 32px twin below in priceInk (em-dash retired), animation consistency across 4 primary tabs (5 motion tokens in lib/tokens.ts; Booths VendorCard gains tap feedback; empty-state pattern unified). Track D (FB Marketplace shared-element transitions) carried into session 77 as its own session. Feed content seeding still pending, now **19× bumped** — nineteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management + vendor-request-redesign + numeral-font-system + green-token-unification + animation-token-centralization. **Next natural investor-update trigger point** is now after feed content seeding lands — the update would report nineteen+ shipped capability items, plus session 76 establishing motion as the third primitive in the central-token table after color and font (lib/tokens.ts as the cross-page primitive locus). Q-014 (Metabase) remains the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."
