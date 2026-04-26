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

## ✅ Session 67 (2026-04-26) — Booths page opened to all users + booth-bookmark feature shipped end-to-end

Pivot session — recommended move at standup was feed content seeding (9× bumped); David redirected to "enable the Booth tab for all users + add bookmark functionality + remove Add a Booth from the page." Three runtime/docs commits + one close commit, all 🟢 build-clean, all on prod by close, iPhone QA approved with two-edit polish that immediately followed. **Second firing of the session-56 "design-record commits in the same session as the decisions" rule — pattern is now durable.**

The session ran in four beats:

1. **Framing — six decisions surfaced before any drafting.** Per `feedback_ask_which_state_first.md`, the request touched a multi-state surface (admin / vendor / guest) so I batched D1–D6 with my recommendation + brief rationale per decision before writing prose:
   - **D1** Route + label: keep `/shelves` route, "Booths" nav label (renaming = redirect-shim cost for zero user-facing benefit)
   - **D2** Tab order: `Home · Booths · Find Map · [My Booth]` (browsing/discovery near Home; Find Map = personal saves near My Booth)
   - **D3** Glyph: new Lucide `Bookmark` corner-ribbon, NOT FlagGlyph (preserve session-61 find-save vocabulary; verbal split "flag a find / bookmark a booth")
   - **D4** Persistence: localStorage `treehouse_booth_bookmark_{vendorId}`, parallel to find-save flag pattern (no auth gate, no migration, promote to Supabase post-beta if cross-device sync becomes a real ask)
   - **D5** Surfaces: tile bubble + filter chip on `/shelves` + masthead glyph on `/shelf/[slug]`
   - **D6** `/shelf/[slug]` masthead glyph: yes (highest-value bookmark moment is shopper landing from Window-share email)

   David: "lock these." Single round of locking — no follow-up clarifications needed. The pattern from `feedback_ask_which_state_first.md` continues to be durably efficient.

2. **Mockup → David adjustments → design record commit.** Wrote [`docs/mockups/booths-bookmarks-v1.html`](docs/mockups/booths-bookmarks-v1.html) (3 phone frames: `/shelves` guest with chips + bookmark bubbles, `/shelf/[slug]` masthead, `/my-shelf` with bookmarked-booths strip). Plus a glyph callout comparing Lucide `Bookmark` (booths) vs `FlagGlyph` (finds) at production scale — visualizing the verbal split. David approved the mockup with two adjustments locked as **D11** + **D12**:
   - **D11**: keep production My Booth nav icon (Lucide `Store`), don't draw something else. The mockup had accidentally drawn it as a Bookmark-shape, which would have visually collided with the new bookmark glyph
   - **D12**: drop the `/my-shelf` "Bookmarked Booths" strip entirely. Vendors use the Booths tab + Bookmarked chip like everyone else. David's exact framing: "I want to keep it so everything has its place without too much overlap. If this ends up being a feature that vendors want instead of navigating to the booths page then we can reconsider later down the road."

   Updated the mockup: stamped Frame 3 with a REJECTED overlay (preserving design history per the existing pattern — session 51-53's share-booth-email-v1 through v4 all kept as references), fixed the My Booth nav icon to Lucide `Store`, swapped the open-questions block for a "all twelve decisions locked" green confirmation. Wrote [`docs/booths-public-design.md`](docs/booths-public-design.md) — frozen decision log D1–D12, file-level scope, state matrix (who sees what across guest/vendor/admin × tile/masthead/strip), visual specs (bubble dims, glyph stroke widths, fill colors), implementation order, out-of-scope items. **Committed mockup + design record together as `dccc34c` per the session-56 same-session design-record rule** — second firing of this rule (session 56 = origin, session 67 = second instance). The rule is now durable: design-to-Ready commits land BEFORE implementation, with shape `docs(scope): design-to-Ready`.

3. **Implementation across 5 files in one commit (`fe6c33f`).**
   - **[`lib/utils.ts`](lib/utils.ts)** — added `BOOTH_BOOKMARK_PREFIX` + `boothBookmarkKey(vendorId)` + `loadBookmarkedBoothIds()` + `loadBookmarkedBoothCount()`. Parallel to find-save `flagKey` / `loadFollowedIds` / `loadBookmarkCount`. Disjoint prefix (`treehouse_booth_bookmark_` doesn't begin with `treehouse_bookmark_`) so iteration over localStorage stays clean across both classes. Same `"1"` value shape, same try/catch tolerance for Safari ITP.
   - **[`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx)** — new primitive. Lucide `Bookmark` in a frosted/wash bubble. Two variants via `size` prop: `"tile"` (28px frosted bubble, 14px glyph — for `/shelves` cards) and `"masthead"` (38px wash bubble, 18px glyph — matches existing share-airplane bubble dimensions on `/shelf/[slug]` so the right slot pairs visually). Pure-render: parent owns the saved boolean, passes `onClick` callback. Single source of truth for booth-save vocabulary.
   - **[`components/BottomNav.tsx`](components/BottomNav.tsx)** — gate flip. Booths tab now visible to every user. Admin and vendor share the same 4-tab layout (admin entry is the masthead pill on `/shelves`, not a special nav tab). Guest gets 3 tabs. Removed unused `isAdmin` import + `adminUser` derivation. Updated file-header tab-layout block to reflect the new shape.
   - **[`app/shelves/page.tsx`](app/shelves/page.tsx)** — three changes: (1) Removed `<AddBoothInline>` block + import + `addBoothOpen` state. The component file stays in tree because `/admin` still uses it (verified via grep). (2) Added filter chip row above the first mall section: `All booths · Bookmarked (n)`. Hidden entirely when `bookmarkedIds.size === 0` per D9; `effectiveFilter` collapses back to `"all"` when count drops to zero so the user can never end up looking at an empty grid behind a hidden chip. (3) Wired `<BookmarkBoothBubble size="tile">` onto each non-admin tile at `top: 6, right: 6`. **Spec deviation flagged in commit message + this tombstone: bookmark hidden on admin tiles only.** Production admin tiles already carry Pencil + Trash bubbles in the top-right; adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else — same "everything in its place" spirit as D12.
   - **[`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx)** — masthead grid switched from `"38px 1fr 38px"` to `"1fr auto 1fr"` so the wordmark stays true-centered when the right slot grows from one bubble (airplane only) to two bubbles (bookmark + airplane). Same pattern `/shelves` already uses for the same reason. Bookmark glyph hidden when viewer is the booth's owner (`isOwner` check via `vendor.user_id === user?.id`) — D10 self-bookmark gate. Guests (user==null) and other vendors / shoppers / admins all see it.

   Build green. Bundle stats: `/shelves` = 6.29 kB, `/shelf/[slug]` = 3.67 kB.

4. **iPhone QA → two-edit polish (`47fb1b4`).** David walked the page on device. Two findings surfaced:
   - **(a) Booth-number badge font was `monospace`** — not part of the project's three-font system (IM Fell English / FONT_SYS system sans / FONT_POSTIT_NUMERAL Times New Roman). Was a legacy carry-in not caught during implementation. Swapped to `FONT_SYS` to match the chip filter, the admin "Manage" label, and the pill numerics on Find Detail. Verified via grep that other monospace usages in the codebase are legitimate (admin internal IDs, currency symbols on `/post/edit/[id]`, reseller layer chrome) — the booth-number badge was the only ecosystem-chrome offender.
   - **(b) Tile subtitle showed mall name as fallback when no bio** — redundant given tiles are already grouped under a mall section header. Dropped the fallback; bio (when set) still renders, otherwise the subtitle line collapses entirely. `/shelves` shrank slightly (6.29 → 6.25 kB) from the simpler conditional.

   David's iPhone walk verdict: "Looks good."

**Final state in production (as of `47fb1b4`):**
- `/shelves` visible to all users (route stays `/shelves`; nav label "Booths")
- Bottom nav: `Home · Booths · Find Map · [My Booth]` for vendor + admin; `Home · Booths · Find Map` for guest
- Each non-admin booth tile carries a bookmark bubble (top-right, 28px frosted) — green-fill saved / cream-outline unsaved
- Filter chips above first mall section: `All booths · Bookmarked (n)`. Chip row hidden when count = 0; effectiveFilter collapses to "all" if count drops to zero while filter was active
- `/shelf/[slug]` masthead carries the bookmark bubble (38px wash) when viewing other vendors' booths; hidden when viewing your own (D10 self-gate)
- Booth number badge: `FONT_SYS` (was `monospace`) — matches the project's font system
- Tile subtitle: bio only (mall name fallback dropped — tiles already grouped under mall headers)
- `<AddBoothInline>` still in tree, still rendered on `/admin` Posts/Banners area; removed from `/shelves`
- New Lucide `Bookmark` glyph + new `<BookmarkBoothBubble>` primitive — single source of truth for booth-save vocabulary; preserves the verbal split "flag a find / bookmark a booth" with no FlagGlyph dilution
- No DB / RLS / API / migration changes — all persistence is localStorage

**Commits this session (3 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `dccc34c` | docs(booths): design-to-Ready — open /shelves to all + booth bookmarks |
| `fe6c33f` | feat(booths): open /shelves to all + booth bookmarks |
| `47fb1b4` | polish(booths): tile font + drop redundant mall name |
| (session close) | docs: session 67 close — booths public + booth bookmarks shipped |

**What's broken / carried (unchanged from session 66 unless noted):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60-66, **67**. Now **10× bumped**. The Booths-view verification gate moves a step closer to satisfied this session: shoppers can now navigate vendor booths cross-mall AND bookmark booths to return to. Real content remains the actual unblocker. **Top recommended next session.**
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — unchanged.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **NEW: Booth-bookmark analytics events not wired** — `booth_bookmarked` / `booth_unbookmarked` deliberately deferred (same defer-until-R3-resolves rationale as the tag-extraction events). Worth adding when R3 resolves so we can measure adoption of the new feature in production.
- 🟡 **NEW: Spec deviation — admin /shelves tiles don't carry the bookmark bubble.** Documented in `fe6c33f` commit message. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses `/shelf/[slug]` masthead like everyone else for personal bookmarks).
- 🟢 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged from session 65.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged backlog.
- 🟡 **`/mall/[slug]` lensless on v0.2 dark theme** — unchanged from session 66.
- 🟡 **Treehouse Lens constant is provisional** — unchanged from session 66.

**Memory updates:** None this session. Two patterns close to memory-worthy but not crossing the threshold:

- **"In ecosystem chrome, verify font-family matches the v1.x token system before shipping."** The booth-number badge had `fontFamily: "monospace"` as a legacy carry — David caught it on iPhone QA. Too narrow + too codebase-specific to be useful as memory; the broader "match the design system, don't introduce ad-hoc styles" rule is already implicit in `mockup-first-as-default-not-exception`. Captured as a live discovery; could become a Tech Rule candidate if the pattern fires again.
- **"Drop redundant subtitle when grouped under a section header."** Single instance, narrow content rule, not a generalized behavior. Skip.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the framing phase to surface D1–D6 in a single batch with my recommendation + rationale before drafting prose. Single message lock-in. Pattern continues to be durably efficient — fourth firing across recent sessions.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 4 commits ✅. Four sessions running at perfect compliance.
- `feedback_visibility_tools_first.md` (session 60) — applied at the framing phase: spawned an Explore agent up front to map the implementation footprint (Booths page structure, FlagGlyph callsites, BoothPage primitives, BottomNav gate, AddBoothInline consumers). Findings prevented several wrong assumptions and revealed the My Booth = Store nav icon collision risk before mockup.

**Live discoveries:**

- **Same-session design-record commit rule (session 56) firing for the second time — durable pattern.** The flow worked exactly as documented: mockup → David approves with adjustments → adjustments fold into the mockup as REJECTED stamps + design record (D1–D12 frozen) → design record commits BEFORE implementation, separate commit shape `docs(scope): design-to-Ready`. Second firing confirms this is a real rule, not a one-off. Implementation session can proceed against a tight spec without re-scoping.
- **Lucide `Bookmark` vs `FlagGlyph` — semantic split via shape, same green-fill behavior.** Both use the same saved-state color vocabulary, but corner-ribbon (booths) reads visually distinct from flag-on-pole (finds). Verbal mapping established session 67: "flag a find, bookmark a booth." Useful precedent if future "save" affordances ever need to coexist with the existing two (e.g. favoriting a mall).
- **"Everything in its place without too much overlap" — David's recurring scope-cut rationale.** Used twice in one session: D12 (no `/my-shelf` bookmarked strip; vendors use Booths tab) and the spec deviation (no bookmark bubble on admin `/shelves` tiles; admin uses `/shelf/[slug]` masthead). Both were reductions from a broader spec. The principle: when two surfaces could answer the same question, pick one. Conserves attention and keeps the visual vocabulary single-sourced. Worth surfacing as a candidate principle if it fires a third time.
- **Mockups mirror production, including production's mistakes.** The mockup used `font-family: ui-monospace, "SF Mono", Menlo, monospace;` for the booth-number badge — accurate to production but the production value itself was wrong (legacy carry). iPhone QA caught it; mockup didn't because the mockup faithfully mirrored production. Worth knowing: the mockup serves directional approval, not as a typography audit. Run a font-system pass separately when touching ecosystem chrome.
- **`useState<Set<string>>` + functional setter is the right shape for Set-of-IDs state.** The bookmark toggle uses `setBookmarkedIds(prev => { const next = new Set(prev); ...; return next; })` — preserves React's reference-change semantics for re-render, no `forceUpdate` hacks needed. Same shape would generalize to other "I'm tracking N flags" client-state patterns.

**Operational follow-ups:** Archive-drift accounting now includes session 66 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** No new candidates promoted. The "verify font-family matches the project's font system in ecosystem chrome" pattern is captured as a live discovery — would need a second firing before formalizing. The "everything in its place without too much overlap" scope-cut principle from David is captured here for the same reason — a third firing makes it a rule, not a tendency.

**Notable artifacts shipped this session:**
- [`docs/booths-public-design.md`](docs/booths-public-design.md) — design record with 12 frozen decisions, file-level scope, state matrix, visual specs, implementation order. Future "rebuild the booths page" requests pull from this without re-scoping.
- [`docs/mockups/booths-bookmarks-v1.html`](docs/mockups/booths-bookmarks-v1.html) — 3 phone frames including a REJECTED stamp on Frame 3 (design history preserved — same pattern as the share-booth-email-v1 through v4 retention).
- [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) — new primitive. Single source of truth for the booth-save save state. Reusable shape (`size="tile" | "masthead"`) if other surfaces ever need the same affordance.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–66 still missing — operational backlog growing).

- **Session 66** (2026-04-26) — Two-track session, both shipped end-to-end on prod. Track 1: first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (`0a4d763`) + polished Word doc export to Desktop via the docx skill. Track 2: Treehouse Lens ported from reseller-layer canvas op to ecosystem CSS render-time filter at [`lib/treehouseLens.ts`](lib/treehouseLens.ts) (`2367676`) — 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox, Find Map, Booth tiles, /post/preview). Mall page intentionally skipped (v0.2 dark theme conflicts with brightening lens). Sold treatments compose on top via `${LENS} grayscale(...)`. iPhone walk approved with caveat lens may need tuning against real content.
- **Session 65** (2026-04-26) — R12 Sentry exception capture shipped end-to-end on prod. Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb). Client-side + server-side error capture live, source maps + PII scrubbing on, email alerts firing. Vercel-Sentry Marketplace integration auto-syncs 8 env vars. New `feedback_verify_third_party_software_exists.md` memory.
- **Session 64** (2026-04-25) — Pivot session, net code-state zero. TreehouseOpener RN→web port shipped (`c9043c8`) + reverted same session (`1946ddd`) after iPhone QA didn't aesthetically land; parked as Q-012 in `docs/queued-sessions.md` for full Design redesign (wood-frame metaphor explicitly off the table). New `feedback_still_frame_before_animation_port.md` memory (animation-specific cousin of testbed-first rule).
- **Session 63** (2026-04-25) — Home page polish: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the discovery-feed footer (commit `4d96f44`); also auto-fronts the empty-state when a mall has no posts (single placement, dual context). Masthead profile-icon micro-pivot took two passes (`5c0dded` → reversed by `1c66531`) — final state: 22px CircleUser at 1.4 stroke for guests → /login, sans-serif "Sign out" text for signed-in users. Two new feedback memories captured: no Co-Authored-By footer + ask-which-state-first.
- **Session 62** (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on iPhone QA. Six commits across four phases: chat-architecture (D1–D8 frozen) → mockup + design record (`32f8ef4`) → testbed-first prompt validation (`e77e77b`, handwritten tags 100% pass first try) → 3-phase integration (`1b9a157` foundation + `eb9dfa6` consumer + `f129aa2` producer). Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review prefills with green "from tag" pills; skip is one-tap fallback. 4/4 acceptance criteria passed. TR-p added (testbed-first for AI/LLM unknowns, fire count 1).

---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 67 close — Booths page opened to all + booth-bookmark feature shipped end-to-end on prod; feed content seeding still pending — now 10× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session:** the Booths page (`/shelves`) is now visible to every user (was admin-only); each non-admin booth tile carries a bookmark bubble persisted via localStorage; filter chips above the first mall section let any visitor see only their bookmarked booths; the public booth detail page (`/shelf/[slug]`) gains a masthead bookmark glyph hidden when viewing your own booth. New `<BookmarkBoothBubble>` primitive establishes the "bookmark a booth" save vocabulary, distinct from the session-61 `<FlagGlyph>` find-save vocabulary — verbal split: "flag a find / bookmark a booth." Plus same-session design-record commit rule (session 56) firing for the second time confirms it's a durable pattern, not a one-off. **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). The Booths-view verification gate moves a step closer to satisfied this session — shoppers can now navigate vendor booths cross-mall and bookmark them. R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, 64, 65, 66, **67**. **Top priority** — the actual V1 unblocker, now 10× bumped. Session 67 closed another acceptance gap (browse + bookmark booths) on top of session 66's lens calibration imperative on top of session 65's observability. Every prior argument holds: surface polish (lightbox, flag glyph, timestamps, editorial CTA, sans masthead) + observability (Sentry catching errors silently) + tag-capture speed (~2× faster Add Find) + brand treatment (lens) + booth navigation (Booths public + bookmarks). Ten sessions of polish + observability + brand treatment + navigation; zero new reasons not to seed content.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps + lens, find-detail with lightbox + lens, my-shelf, public shelf, editorial vendor CTA at feed bottom, **Booths page with bookmark bubble + filter chips**, **booth detail page with masthead bookmark**). Watch Sentry dashboard during the walk — if any new issues appear, that's a real V1 bug we want to know about before beta. **Lens calibration check:** judge the lens constant against the real photos. If too strong/too subtle, adjust [`lib/treehouseLens.ts`](lib/treehouseLens.ts) once and redeploy.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support. Sentry traces + Seer Autofix panel are now first-look diagnostics before manual log-grepping.
2. **`/mall/[slug]` v1.x ecosystem migration + lens-apply** — session 66 deviation. The mall-profile grid is still on v0.2 dark theme (`background: "#050f05"`) with a darkening photo filter that fights the brightening lens. Worth doing as part of a coordinated visual migration of the page to v1.x ecosystem styling — would unblock applying the lens cleanly and make the mall page a brand-aligned shopper surface. Size M (~1 session); needs design scoping first per `mockup-first` rule.
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured session 64 in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012. Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 68 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 65 shipped R12 (Sentry exception capture live at zen-forged.sentry.io/issues/?project=4511286908878848). Session 66 shipped the Treehouse Lens — every vendor-posted photo across the ecosystem renders through a CSS filter (contrast +8%, saturation +5%, warm sepia tint) defined at lib/treehouseLens.ts. Session 67 opened the Booths page (/shelves) to all users + added booth-bookmarking via a new BookmarkBoothBubble primitive (Lucide Bookmark, localStorage-backed, parallel to the find-save FlagGlyph pattern). Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom, AND the new public Booths page with filter chips + bookmark bubbles, AND /shelf/[slug] with masthead bookmark glyph) — keep the Sentry dashboard open during the walk and treat any new issue as a V1 bug worth investigating. If the lens constant looks too strong/too subtle against real content, adjust lib/treehouseLens.ts once and redeploy. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked (now investigable via Sentry traces if it fires). Tag-extraction + booth-bookmark analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. R3 is investigable via Sentry breadcrumbs + distributed traces (session 65) — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–67. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–67. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 + 65 + 66 + 67 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead), every error during the seeding walk surfaces in Sentry instead of disappearing, every photo renders through the Treehouse Lens for unified brand treatment, AND shoppers can now navigate booths cross-mall + bookmark them for return. Session 64 was a pivot pass with no net change. Session 66 added a calibration imperative — the lens constant needs real-world photos to judge confidently. Session 67 closed the cross-mall navigation + save gap. Seeded content will showcase a genuinely better experience end-to-end with observability + brand treatment + booth-navigation behind it.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n. Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 64 captured `feedback_still_frame_before_animation_port.md` (animation-specific cousin of TR-p; could become TR-q on second firing). Session 65 captured `feedback_verify_third_party_software_exists.md` (could become TR-r on second firing) and a "platform-managed env > manual paste" pattern as a live discovery (TR candidate after another firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
- **Booth-bookmark analytics events** (NEW session 67) — `booth_bookmarked` / `booth_unbookmarked` deliberately deferred. Same defer-until-R3-resolves rationale as the tag-extraction events. Worth adding when R3 resolves so we can measure adoption of the new feature in production. Hot path: `handleToggleBookmark` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + `handleToggleBoothBookmark` in [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx).
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (NEW session 67) — production admin tiles already render Pencil + Trash bubbles in the top-right, and adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else. Documented in commit `fe6c33f` summary + the design record. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses public booth detail like everyone else for personal bookmarks).
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–64 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54-55 + future), R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK installed via wizard + tightened, Vercel-Sentry Marketplace integration active, source-map upload from Vercel build, PII scrubbing on, email alerts firing, smoke-tested both client + server capture on prod (frontend + wrapped API route). Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848. Carries an unwrapped-`/api/*`-routes follow-up gap (above) and Q-013 candidate.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`); v4 on-device QA walk **PASSED 4/4 clients session 53** (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Loop fully closed. Final state (v4): shell masthead retired, opener line flowing into IM Fell 34px vendor name, banner + 2-cell info bar as one unified rounded frame, full-width "Explore the booth" green button directly under info bar, naked tile grid, footer. Subject + preheader + opener share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57 (`Masthead` center reverted to brand lockup; `<BoothTitleBlock>` gained optional `onPickerOpen` that wraps the 32px booth name in a tap target with inline `▾` when `showPicker`; mockup Frames 2 + 3 revised in same commit).

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. (**Session 49 note:** `/shelves` chrome mismatch is now resolved — v1.2 migration shipped. `/admin` remains on v0.2.)
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49 change); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan added in same session. Items absorbed from this list: "Claim this booth" → R1; "ToS/privacy" → R6; "native app eval" → R9; "vendor directory" → R10; `/welcome` guest landing → R8; "feed pagination + search" → partial overlap with R5a; **"Universal Links (gating Q-006)" → R15**. Also absorbed from pre-beta polish list: Error monitoring → R12; Beta feedback mechanism → R7.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — design-history reference for Q-011 arc.
- `docs/mockups/share-booth-email-v2.html` — design-history reference (session 51 Variant B; superseded twice in session 52).
- `docs/mockups/share-booth-email-v3.html` — design-history reference (session 52 info bar pivot; superseded by v4).
- `docs/mockups/share-booth-email-v4.html` — design-history reference (session 52 v4 simplification; QA PASSED 4/4 clients session 53). Q-011 arc closed.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002). Keep as design-history reference for multi-booth.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — now carries v2 + v3 + v4 addendums stacked. Post-QA (passed session 53), candidate for consolidation (the three addendums are easier to read merged than stacked). ~15 min docs-only pass.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot `pg_dump` pipeline artifact, gitignored, safe to delete anytime; contains prod + staging DB URIs with passwords).
- Orphaned `dbutler80020@gmail.com` staging auth user (created by the first seed-staging run before David chose `david@zenforged.com` as staging admin; non-admin, non-blocking; leave or clean up manually via Supabase dashboard).

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts); masthead right slot inverts — guests now see a 22px CircleUser icon → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. Session 64 was a pivot pass that net-zeroed: the home-page TreehouseOpener animation (originally arrived as broken React Native code in the working tree) was rebuilt as a framer-motion + CSS web component (commit `c9043c8`), wired into `/` with first-visit-only mobile-only gating + tap-to-skip — but on iPhone QA "the first pass looked pretty terrible," so reverted (`1946ddd`) and parked as Q-012 for a full Design redesign session. New `feedback_still_frame_before_animation_port.md` — animation-specific cousin of the testbed-first rule from session 62. **Session 65 shipped R12 (Error monitoring / Sentry) end-to-end on prod — the FIRST Horizon-1 cluster-G item since R3 in session 58, and the first beta-grade observability infrastructure on the codebase.** Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb), all live on prod. Sentry now captures both client-side errors (browser handlers + App Router top-level error boundary) and server-side errors (manual wrap pattern for Next.js 14.x routes). Source maps upload from Vercel build, PII scrubbing on, tunnel route bypasses ad-blockers, email alerts firing on every new issue. Vercel-Sentry Marketplace integration auto-syncs + auto-rotates 8 env vars. Dashboard at https://zen-forged.sentry.io/issues/?project=4511286908878848. New durable institutional output: `feedback_verify_third_party_software_exists.md`. **Session 66 ran two parallel tracks, both shipped end-to-end on prod by close.** Track 1 created the first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (commit `0a4d763`) + a polished Word doc export at `~/Desktop/treehouse-finds-functionality-overview.docx` for sharing with investors/partners/internal review without re-scoping. Track 2 ported the Treehouse Lens — a non-destructive CSS render-time photo filter mirroring the long-isolated reseller-layer canvas op (red +6%, blue −8%, contrast +8%) — to every vendor-photo render surface in the ecosystem (commit `2367676`). New [`lib/treehouseLens.ts`](lib/treehouseLens.ts) is single source of truth (`contrast(1.08) saturate(1.05) sepia(0.05)`); 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox with pinch-zoom, Find Map, Booth tiles via BoothPage, /post/preview via PhotographPreview + loading state); sold treatments compose on top via `${LENS} grayscale(...) brightness(...)` so existing sold-state UX still works. Mall page deliberately skipped pending its own v1.x migration (intentional v0.2 dark-theme darkening filter conflicts with brightening lens). **Session 67 pivoted from feed content seeding to opening the Booths page (`/shelves`) to all users + adding booth-bookmarking** — three commits all on prod by close (`dccc34c` design-to-Ready / `fe6c33f` runtime / `47fb1b4` font + subtitle polish from iPhone QA). Twelve frozen decisions (D1–D12) at [`docs/booths-public-design.md`](docs/booths-public-design.md); design-record committed BEFORE implementation per the session-56 same-session rule (second firing — pattern is now durable). New [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) primitive (Lucide `Bookmark` in frosted/wash bubble, 28px tile / 38px masthead variants). New booth-bookmark helpers in [`lib/utils.ts`](lib/utils.ts) parallel to find-save flag pattern, disjoint localStorage prefix (`treehouse_booth_bookmark_`). BottomNav gate flipped — Booths visible to all; admin and vendor share the same 4-tab layout (`Home · Booths · Find Map · My Booth`). Filter chips (`All booths · Bookmarked (n)`) hidden when count = 0 with effectiveFilter collapse-to-all. Self-bookmark gate on `/shelf/[slug]` masthead (D10) hides glyph when `vendor.user_id === user.id`. Spec deviation flagged + documented: admin `/shelves` tiles don't show bookmark bubble (top-right already crowded with Pencil + Trash; admin bookmarks via masthead like everyone else — same "everything in its place without too much overlap" rationale David used for D12). Verbal split established: "flag a find / bookmark a booth." Feed content seeding still pending, now **10× bumped** — case strengthens further: every surface a beta vendor or guest lands on this week is now polished + observable + brand-treated + cross-mall navigable + bookmark-able. Next natural investor-update trigger point remains after feed content seeding lands — the update would now report R4c + R3 + tag-capture + R12 + the lens port + Booths public + bookmarks as the six shipped capability items, plus the durable institutional outputs (testbed-first / still-frame-before-port / verify-third-party-software-exists / ask-which-state-first patterns + the exec-facing doc artifact + the BookmarkBoothBubble primitive).
