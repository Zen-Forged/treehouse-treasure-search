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

## ✅ Session 68 (2026-04-26) — Mall filter persistence across Home / Booths / Find Map shipped end-to-end

Pivot session — recommended move at standup was feed content seeding (10× bumped); David redirected to "now that we have Home/Booths/Find Map available, we need a way to persist the mall location filter across tabs." Four commits (1 design-to-Ready + 1 implementation + 1 QA polish + close), all 🟢 build-clean, all on prod by close. iPhone QA verdict: **"Such a huge improvement on the experience."** **Third firing of the session-56 same-session design-record commit rule — pattern is now fully durable institutional practice (origin session 56 → second session 67 → third session 68).** New durable institutional output: `feedback_state_controls_above_hero_chrome.md`.

The session ran in four beats:

1. **Framing — ten decisions surfaced before any drafting.** Per `feedback_ask_which_state_first.md` (firing for the fifth time across recent sessions — fully durable practice), the request touched a multi-state surface (three primary tabs × auth state × per-tab existing chrome) so I batched D1–D10 with my recommendation + rationale per decision before writing prose. Prior to that I spawned an Explore agent (per `feedback_visibility_tools_first.md`) to map the existing mall-filter chrome on each tab — finding that **only Home had a real picker today** (FeedHero → MallSheet → `treehouse_saved_mall_id` localStorage); Booths showed all vendors grouped by mall with no picker; Find Map derived its mall from saved finds with no user choice. So "persist across tabs" actually required *adding the picker* on Booths + Find Map, not just sharing storage. Decisions framed accordingly:
   - **D1** Per-tab picker UI on all three; shared localStorage key (not one global picker)
   - **D2** Picking on any tab persists; other tabs default to that mall
   - **D3** Booths picker = header pattern (eyebrow + tappable name + chevron), NOT a chip — keeps Bookmarked chip row reserved for orthogonal personal-state axis
   - **D4** When mall picked on Booths, drop per-mall section headers — flat grid
   - **D5** Find Map gets the same header picker
   - **D6** Find Map filter narrows visible saves; helpful empty state ("No saved finds at [Mall]. *Show all malls* to see them.")
   - **D7** Single clear-filter affordance via existing MallSheet "All malls" row
   - **D8** Reuse storage key `treehouse_saved_mall_id` (zero migration; existing Home users keep their selection)
   - **D9** Mount-time read only — bottom-nav unmount/remount in App Router IS the cross-tab sync; no `storage`-event subscription
   - **D10** Vendor's own booth hidden from filtered Booths grid (emergent from regular filter, not special suppression); My Booth nav tab unaffected

   David: "lock these." Single round of locking — no follow-up clarifications. The pattern continues to be durably efficient.

2. **Mockup → design record commit (`991ac5f`).** Wrote [`docs/mockups/mall-filter-persistence-v1.html`](docs/mockups/mall-filter-persistence-v1.html) (3 phone frames showing all three tabs in the same Treehouse-Antique-Mall-picked state, plus a `<MallSheet>` detail panel + the Find Map empty-state callout). Wrote [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md) — frozen D1–D10 decision log, file-level changes, state matrix (all/one × Home/Booths/Find Map), out-of-scope list, 8 acceptance criteria. **Committed mockup + design record together as `991ac5f` per the session-56 same-session design-record rule** — third firing (session 56 = origin, session 67 = second, session 68 = third). The rule is now **fully durable institutional practice**, not a tendency.

3. **Implementation across 6 files in one commit (`0af526b`, +475/−311).**
   - **[`lib/useSavedMallId.ts`](lib/useSavedMallId.ts)** (new) — wraps `safeStorage` read/write of `treehouse_saved_mall_id`. Returns `[savedMallId, setSavedMallId]`. Mount-time read only (D9).
   - **[`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx)** (new) — three-callsite primitive. Italic eyebrow + tappable bold name + chevron-down + optional geo line (`address` kind with map link, or `italic` kind for context text). Content-agnostic — consumer supplies eyebrow strings ("Finds from", "Booths at", "Saves at").
   - **[`components/MallSheet.tsx`](components/MallSheet.tsx)** — added optional `countUnit?: { singular, plural }` prop (defaults to "find" / "finds"). Booths passes `{ singular: "booth", plural: "booths" }`; Find Map passes `{ singular: "saved find", plural: "saved finds" }`. Without this, the picker would have read "4 finds" under each mall on the Booths page — a tiny lie.
   - **[`app/page.tsx`](app/page.tsx)** — `FeedHero` refactored to a thin wrapper around `<MallScopeHeader>`. Behavior unchanged; just extract-to-primitive. `mallId` state moved to `useSavedMallId()` hook. Local `SAVED_MALL_KEY` constant retired (now in the hook).
   - **[`app/shelves/page.tsx`](app/shelves/page.tsx)** — added picker, `<MallSheet>` instance, mall-scope filter applied BEFORE bookmark filter so the chip count reflects bookmarks-in-scope (D9 still hides chip row when zero). When mall picked: per-mall section headers drop, flat grid renders (D4). MallSheet fed only active malls; non-active mall content still loads for admin section-header status pills.
   - **[`app/flagged/page.tsx`](app/flagged/page.tsx)** — added picker + `<MallSheet>`, dropped the prior pin-glyph mall anchor + local `PinGlyph` + `mapsUrl` import (no longer needed). Filters saves by `mall_id`. New empty-state callout when active filter excludes all current saves: "No saved finds at [Mall]. *Show all malls* to see them." (D6).

   Build green: `/shelves` 6.36 kB, `/flagged` 6.34 kB. Only existing img-warning lint warnings remain (unchanged from prior sessions).

4. **iPhone QA → three placement nits, one commit (`7357b9f`).** David walked the three tabs end-to-end on device and surfaced three small layout findings:
   - **(a) Home — `<MallScopeHeader>` should sit ABOVE the `<FeaturedBanner>`**, not below. The persisted mall filter is the first thing the eye should land on after the masthead.
   - **(b) Find Map — same move:** scope header above the overlay-variant `<FeaturedBanner>`.
   - **(c) Find Map — retire the fallback "Find Map" 30px heading + the "Your saved finds are mapped below..." intro voice paragraph entirely.** Page identity now comes from `<MallScopeHeader>` when there are saves; from `<EmptyState>`'s own copy ("Nothing saved yet" + "Tap the heart on any find to save it here.") when there aren't. The middle title was redundant chrome.

   Pure layout reorder + chrome cut, no behavior change. Build green. David's verdict on the QA-polished prod deploy: **"Such a huge improvement on the experience."**

   This QA pass yielded a new durable principle, captured as memory: **"State controls (filters, pickers) sit above page-title chrome."** When a state control and a decorative page-identity surface compete for the top-of-page slot, put the state control first. If the scope header identifies the page in plain language ("Saves at X"), challenge whether a separate page-title heading is needed at all — usually it isn't.

**Final state in production (as of `7357b9f`):**
- All three primary tabs (Home / Booths / Find Map) share the same persisted mall filter via `treehouse_saved_mall_id` localStorage key
- Each tab has the same `<MallScopeHeader>` idiom directly under the masthead (above any hero banner): eyebrow + tappable bold name + chevron, opens existing `<MallSheet>` bottom sheet
- Eyebrow text per tab: Home "Finds from across" / "Finds from"; Booths "Booths across" / "Booths at"; Find Map "Saves across" / "Saves at"
- Booths flat-grid when one mall picked (no per-mall section headers); grouped layout preserved when "All malls"
- Booths Bookmarked-chip filter composes via intersection with mall filter; chip row hides when bookmarks-in-scope = 0
- Find Map filters saves by `mall_id` when mall picked; new empty-state callout with inline "Show all malls" link when filter excludes all saves
- Vendor's own booth naturally omitted from filtered Booths grid when their `mall_id ≠ savedMallId` (D10 emergent); My Booth nav tab unaffected
- Find Map: prior pin-glyph mall anchor + fallback "Find Map" 30px heading + "Your saved finds are mapped below…" intro paragraph all retired — page identity now comes from `<MallScopeHeader>` or `<EmptyState>`
- New `<MallScopeHeader>` primitive + `useSavedMallId()` hook + `<MallSheet>` `countUnit` prop — three small surface additions
- No DB / RLS / API / migration changes — same key, same MallSheet, zero migration of existing Home users' `saved_mall_id`

**Commits this session (3 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `991ac5f` | docs(mall-filter): design-to-Ready — persist mall filter across Home / Booths / Find Map |
| `0af526b` | feat(mall-filter): persist mall filter across Home / Booths / Find Map |
| `7357b9f` | polish(mall-filter): scope header above hero on Home + Find Map; drop Find Map page-title chrome |
| (session close) | docs: session 68 close — mall filter persistence shipped |

**What's broken / carried (unchanged from session 67 unless noted):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–67, **68**. Now **11× bumped**. Mall-filter persistence closes another acceptance gap (cross-tab navigation that respects user intent). Real content remains the actual unblocker. **Top recommended next session.**
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — unchanged.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips. Worth checking when feed content seeding lands — the Home picker now shares its handler shape with Booths + Find Map, so any analytics gap surfaces consistently across all three.
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **Booth-bookmark analytics events** — unchanged from session 67.
- 🟡 **Spec deviation — admin /shelves tiles don't carry the bookmark bubble** — unchanged from session 67.
- 🟡 **NEW: Mall-filter analytics events not wired on Booths + Find Map.** Home fires `filter_applied` on mall pick; Booths + Find Map don't. Worth adding when R3 resolves so we can compare per-tab pick rates. Hot path: `handleMallSelect` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx).
- 🟢 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged from session 65.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged backlog.
- 🟡 **`/mall/[slug]` lensless on v0.2 dark theme** — unchanged from session 66.
- 🟡 **Treehouse Lens constant is provisional** — unchanged from session 66.

**Memory updates:** ONE new memory.

- **NEW: `feedback_state_controls_above_hero_chrome.md`** — When a state control (mall picker, filter chips) and a hero/banner/page-title compete for the top-of-page slot, put the state control first. If the scope header identifies the page in plain language ("Saves at X"), challenge whether a separate page-title heading is needed at all — usually it isn't. Captured directly from David's QA findings (a) + (b) + (c) which all expressed the same underlying principle.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the framing phase to surface D1–D10 in a single batch with recommendations + rationale before drafting prose. Single message lock-in. **Fifth firing across recent sessions.** Pattern is fully durable.
- `feedback_visibility_tools_first.md` (session 60) — applied at the framing phase: spawned an Explore agent up front to map existing mall-filter chrome on each tab. Findings revealed only Home had a real picker (Booths showed all vendors grouped, Find Map derived mall from saves) — which materially reframed the work from "share storage" to "add picker on two new surfaces."
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 4 commits ✅. Five sessions running at perfect compliance.

**Live discoveries:**

- **Same-session design-record commit rule (session 56) firing for the THIRD time — fully durable.** Origin session 56 (single instance), session 67 (second firing — pattern is real, not a one-off), session 68 (third firing — pattern is durable institutional practice). Future sessions should treat `docs(scope): design-to-Ready` as the default close shape for any mockup-then-implement work, not as a special-case option.
- **"State controls > page-title chrome" — the principle behind David's three QA findings.** All three findings ((a) Home reorder, (b) Find Map reorder, (c) drop Find Map title + intro) expressed the same idea via three different surface decisions. Captured as the new memory `feedback_state_controls_above_hero_chrome.md`. Shape: when a scope control and a decorative identity surface both want the top-of-page slot, the state control wins because the user is at the top of the page to *act*, not to be told what page they're on. If the scope control names the page in plain language, the separate title becomes redundant.
- **Extract-to-primitive when the third callsite arrives.** Home had `FeedHero` as the first callsite of the eyebrow + tappable name + chevron pattern (session 20, MallSheet shipped). When Booths + Find Map became the second + third callsites this session, the extraction to `<MallScopeHeader>` paid for itself: Home refactored to a thin wrapper, Booths + Find Map became near-trivial consumers. Classic rule-of-three; worth surfacing when the next "should I extract this to a primitive?" question arises.
- **Mount-time read IS the cross-tab sync in App Router.** Bottom-nav switches between three primary tabs unmount/remount the page in App Router, so `useEffect`-on-mount → `safeStorage.getItem` IS the cross-tab persistence mechanism. No `storage`-event subscription, no Context provider, no event bus. Worth knowing for any future "persist X across tabs" feature where the tabs are bottom-nav routes.
- **"Filter as intent" empty states require an inline clear-filter link.** Find Map's empty-state copy isn't just "no saves at this mall" — it's "saves at other malls are hidden by the active filter, *Show all malls* to see them." Generally true any time we hide content behind a persisted user filter. Could promote to a Tech Rule candidate if the pattern fires again on a third tab.
- **Mockup convention — show the same picked-state across all frames.** All three phone frames in the mockup showed `Treehouse Antique Mall` as the active filter. This made the cross-tab consistency the visual story rather than three independent states. Pattern: when the work IS the consistency across surfaces, mock the consistency.

**Operational follow-ups:** Archive-drift accounting now includes session 67 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** No new candidates promoted. Two patterns close to the threshold:
- **"State controls > page-title chrome"** — captured as memory; could become a Tech Rule on second firing (the memory IS the durable form for now).
- **"Filter as intent → empty-state needs inline clear-filter link"** — single firing; needs a second occurrence to formalize.

**Notable artifacts shipped this session:**
- [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md) — design record with 10 frozen decisions, file-level scope, state matrix, 8 acceptance criteria. Future "extend mall filter to a fourth tab" requests pull from this without re-scoping.
- [`docs/mockups/mall-filter-persistence-v1.html`](docs/mockups/mall-filter-persistence-v1.html) — 3 phone frames in same picked-state + MallSheet detail panel + empty-state callout panel.
- [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) — new three-callsite primitive. Eyebrow + tappable name + chevron + optional geo line. Content-agnostic — eyebrow strings come from consumer.
- [`lib/useSavedMallId.ts`](lib/useSavedMallId.ts) — new cross-tab mall-filter hook. Single source of truth for the persisted active mall filter; consumed by Home, Booths, Find Map.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–67 still missing — operational backlog growing).

- **Session 67** (2026-04-26) — Booths page (`/shelves`) opened to all users + booth-bookmark feature shipped end-to-end. Three runtime/docs commits + close (`dccc34c` design-to-Ready / `fe6c33f` runtime / `47fb1b4` font + subtitle polish). Twelve frozen decisions at [`docs/booths-public-design.md`](docs/booths-public-design.md). New [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) primitive (Lucide `Bookmark`, 28px tile / 38px masthead variants), new booth-bookmark helpers in [`lib/utils.ts`](lib/utils.ts) parallel to find-save flag pattern with disjoint localStorage prefix. Verbal split established: "flag a find / bookmark a booth." Same-session design-record commit rule firing for the SECOND time confirmed it as a real pattern, not a one-off (third firing this session = fully durable).
- **Session 66** (2026-04-26) — Two-track session, both shipped end-to-end on prod. Track 1: first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (`0a4d763`) + polished Word doc export to Desktop via the docx skill. Track 2: Treehouse Lens ported from reseller-layer canvas op to ecosystem CSS render-time filter at [`lib/treehouseLens.ts`](lib/treehouseLens.ts) (`2367676`) — 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox, Find Map, Booth tiles, /post/preview). Mall page intentionally skipped (v0.2 dark theme conflicts with brightening lens). Sold treatments compose on top via `${LENS} grayscale(...)`. iPhone walk approved with caveat lens may need tuning against real content.
- **Session 65** (2026-04-26) — R12 Sentry exception capture shipped end-to-end on prod. Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb). Client-side + server-side error capture live, source maps + PII scrubbing on, email alerts firing. Vercel-Sentry Marketplace integration auto-syncs 8 env vars. New `feedback_verify_third_party_software_exists.md` memory.
- **Session 64** (2026-04-25) — Pivot session, net code-state zero. TreehouseOpener RN→web port shipped (`c9043c8`) + reverted same session (`1946ddd`) after iPhone QA didn't aesthetically land; parked as Q-012 in `docs/queued-sessions.md` for full Design redesign (wood-frame metaphor explicitly off the table). New `feedback_still_frame_before_animation_port.md` memory (animation-specific cousin of testbed-first rule).
- **Session 63** (2026-04-25) — Home page polish: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the discovery-feed footer (commit `4d96f44`); also auto-fronts the empty-state when a mall has no posts (single placement, dual context). Masthead profile-icon micro-pivot took two passes (`5c0dded` → reversed by `1c66531`) — final state: 22px CircleUser at 1.4 stroke for guests → /login, sans-serif "Sign out" text for signed-in users. Two new feedback memories captured: no Co-Authored-By footer + ask-which-state-first.

---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 68 close — mall filter persistence shipped end-to-end on prod across Home / Booths / Find Map; iPhone QA verdict "such a huge improvement on the experience"; feed content seeding still pending — now 11× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session:** picking a mall on any of the three primary tabs (Home / Booths / Find Map) now persists to a single localStorage key (`treehouse_saved_mall_id`, reused from Home), and the other two tabs honor that selection on next mount. New `<MallScopeHeader>` primitive (eyebrow + tappable bold name + chevron) lives directly under the masthead on each of the three tabs — ABOVE any hero banner per session-68 iPhone QA ("state controls > page-title chrome"). New `useSavedMallId()` hook wraps the persistence; mount-time read only (App Router unmount/remount IS the cross-tab sync). Booths drops per-mall section headers when a mall is picked (flat grid); Bookmarked-chip filter composes via intersection with the mall filter. Find Map gains an empty-state callout with inline "Show all malls" link when the active filter excludes all current saves; the prior pin-glyph mall anchor + fallback "Find Map" 30px heading + "Your saved finds are mapped below…" intro paragraph all retired (page identity comes from MallScopeHeader or EmptyState now). New durable institutional output: `feedback_state_controls_above_hero_chrome.md`. **Same-session design-record commit rule firing for the THIRD time = fully durable institutional practice (origin 56 → 67 → 68).** **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). The cross-tab navigation gate moves another step closer to satisfied — shoppers can now anchor on a mall once and have all three primary tabs respect that intent. R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, 64, 65, 66, 67, **68**. **Top priority** — the actual V1 unblocker, now **11× bumped**. Session 68 closed the cross-tab mall-anchoring gap on top of session 67's cross-mall booth navigation + bookmark gap on top of session 66's lens calibration imperative on top of session 65's observability. Every prior argument holds: surface polish + observability (Sentry catching errors silently) + tag-capture speed (~2× faster Add Find) + brand treatment (lens) + booth navigation + cross-tab mall persistence. Eleven sessions of polish + observability + brand + navigation + persistence; zero new reasons not to seed content. The very first thing a beta vendor or guest does on their second visit will now be "pick a mall once, the rest of the app remembers."

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps + lens, find-detail with lightbox + lens, my-shelf, public shelf, editorial vendor CTA at feed bottom, Booths page with bookmark bubble + filter chips, booth detail with masthead bookmark, **AND the new cross-tab mall picker — pick a mall on Home, walk to Booths, walk to Find Map, confirm the mall stays anchored across all three**). Watch Sentry dashboard during the walk — if any new issues appear, that's a real V1 bug we want to know about before beta. **Lens calibration check:** judge the lens constant against the real photos. If too strong/too subtle, adjust [`lib/treehouseLens.ts`](lib/treehouseLens.ts) once and redeploy.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support. Sentry traces + Seer Autofix panel are now first-look diagnostics before manual log-grepping.
2. **`/mall/[slug]` v1.x ecosystem migration + lens-apply + MallScopeHeader carry-through** — session 66 deviation, now compounded by session 68. The mall-profile grid is still on v0.2 dark theme with a darkening photo filter that fights the brightening lens. With session 68 establishing `<MallScopeHeader>` as the default cross-tab mall-scope chrome, the mall-profile page (which IS a mall) is the natural fourth surface to bring into the same family — even if the picker doesn't apply (it's already showing one specific mall). Size M (~1 session); needs design scoping first per `mockup-first` rule.
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured session 64 in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012. Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 69 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 65 shipped R12 (Sentry exception capture live at zen-forged.sentry.io/issues/?project=4511286908878848). Session 66 shipped the Treehouse Lens — every vendor-posted photo across the ecosystem renders through a CSS filter (contrast +8%, saturation +5%, warm sepia tint) defined at lib/treehouseLens.ts. Session 67 opened the Booths page (/shelves) to all users + added booth-bookmarking. Session 68 shipped cross-tab mall filter persistence — pick a mall once on Home / Booths / Find Map and the other two honor it on next visit; new <MallScopeHeader> primitive sits ABOVE any hero banner on its host page (state controls > page-title chrome). Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom, Booths page with filter chips + bookmark bubbles, /shelf/[slug] with masthead bookmark glyph, AND the new cross-tab mall picker — pick a mall on Home, walk to Booths, walk to Find Map, confirm anchored across all three) — keep the Sentry dashboard open during the walk and treat any new issue as a V1 bug worth investigating. If the lens constant looks too strong/too subtle against real content, adjust lib/treehouseLens.ts once and redeploy. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked (now investigable via Sentry traces if it fires). Tag-extraction + booth-bookmark + mall-filter analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration (now compounded by being the natural fourth MallScopeHeader carry-through). Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. R3 is investigable via Sentry breadcrumbs + distributed traces (session 65) — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–68. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–68. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 + 65 + 66 + 67 + 68 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead), every error during the seeding walk surfaces in Sentry instead of disappearing, every photo renders through the Treehouse Lens for unified brand treatment, shoppers can navigate booths cross-mall + bookmark them for return, AND the mall picked on any one tab now follows the user across all three primary tabs. Session 64 was a pivot pass with no net change. Session 66 added a calibration imperative — the lens constant needs real-world photos to judge confidently. Sessions 67 + 68 closed the cross-mall navigation + cross-tab anchoring gaps. Seeded content will showcase a genuinely better experience end-to-end with observability + brand treatment + booth-navigation + cross-tab persistence behind it.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n. Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 64 captured `feedback_still_frame_before_animation_port.md` (animation-specific cousin of TR-p; could become TR-q on second firing). Session 65 captured `feedback_verify_third_party_software_exists.md` (could become TR-r on second firing) and a "platform-managed env > manual paste" pattern as a live discovery (TR candidate after another firing). **Session 68 captured `feedback_state_controls_above_hero_chrome.md`** (state controls > page-title chrome; could become TR-s on second firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
- **Booth-bookmark analytics events** (session 67) — `booth_bookmarked` / `booth_unbookmarked` deliberately deferred. Same defer-until-R3-resolves rationale as the tag-extraction events. Worth adding when R3 resolves so we can measure adoption of the new feature in production. Hot path: `handleToggleBookmark` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + `handleToggleBoothBookmark` in [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx).
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — production admin tiles already render Pencil + Trash bubbles in the top-right, and adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else. Documented in commit `fe6c33f` summary + the design record. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses public booth detail like everyone else for personal bookmarks).
- **Mall-filter analytics events on Booths + Find Map** (NEW session 68) — Home fires `filter_applied` on mall pick (existing); Booths + Find Map don't yet. Worth adding when R3 resolves so we can compare per-tab pick rates (does the filter get used more on Home or on Booths? does Find Map's "filter narrows saves" pattern see real adoption?). Hot path: `handleMallSelect` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx). Also rolls up the prior `filter_applied` count = 0 carry note — when this lands, verify the count is actually being captured across all three callsites.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts); masthead right slot inverts — guests now see a 22px CircleUser icon → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. Session 64 was a pivot pass that net-zeroed: the home-page TreehouseOpener animation (originally arrived as broken React Native code in the working tree) was rebuilt as a framer-motion + CSS web component (commit `c9043c8`), wired into `/` with first-visit-only mobile-only gating + tap-to-skip — but on iPhone QA "the first pass looked pretty terrible," so reverted (`1946ddd`) and parked as Q-012 for a full Design redesign session. New `feedback_still_frame_before_animation_port.md` — animation-specific cousin of the testbed-first rule from session 62. **Session 65 shipped R12 (Error monitoring / Sentry) end-to-end on prod — the FIRST Horizon-1 cluster-G item since R3 in session 58, and the first beta-grade observability infrastructure on the codebase.** Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb), all live on prod. Sentry now captures both client-side errors (browser handlers + App Router top-level error boundary) and server-side errors (manual wrap pattern for Next.js 14.x routes). Source maps upload from Vercel build, PII scrubbing on, tunnel route bypasses ad-blockers, email alerts firing on every new issue. Vercel-Sentry Marketplace integration auto-syncs + auto-rotates 8 env vars. Dashboard at https://zen-forged.sentry.io/issues/?project=4511286908878848. New durable institutional output: `feedback_verify_third_party_software_exists.md`. **Session 66 ran two parallel tracks, both shipped end-to-end on prod by close.** Track 1 created the first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (commit `0a4d763`) + a polished Word doc export at `~/Desktop/treehouse-finds-functionality-overview.docx` for sharing with investors/partners/internal review without re-scoping. Track 2 ported the Treehouse Lens — a non-destructive CSS render-time photo filter mirroring the long-isolated reseller-layer canvas op (red +6%, blue −8%, contrast +8%) — to every vendor-photo render surface in the ecosystem (commit `2367676`). New [`lib/treehouseLens.ts`](lib/treehouseLens.ts) is single source of truth (`contrast(1.08) saturate(1.05) sepia(0.05)`); 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox with pinch-zoom, Find Map, Booth tiles via BoothPage, /post/preview via PhotographPreview + loading state); sold treatments compose on top via `${LENS} grayscale(...) brightness(...)` so existing sold-state UX still works. Mall page deliberately skipped pending its own v1.x migration (intentional v0.2 dark-theme darkening filter conflicts with brightening lens). **Session 67 pivoted from feed content seeding to opening the Booths page (`/shelves`) to all users + adding booth-bookmarking** — three commits all on prod by close (`dccc34c` design-to-Ready / `fe6c33f` runtime / `47fb1b4` font + subtitle polish from iPhone QA). Twelve frozen decisions (D1–D12) at [`docs/booths-public-design.md`](docs/booths-public-design.md); design-record committed BEFORE implementation per the session-56 same-session rule (second firing — pattern is now durable). New [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) primitive (Lucide `Bookmark` in frosted/wash bubble, 28px tile / 38px masthead variants). New booth-bookmark helpers in [`lib/utils.ts`](lib/utils.ts) parallel to find-save flag pattern, disjoint localStorage prefix (`treehouse_booth_bookmark_`). BottomNav gate flipped — Booths visible to all; admin and vendor share the same 4-tab layout (`Home · Booths · Find Map · My Booth`). Filter chips (`All booths · Bookmarked (n)`) hidden when count = 0 with effectiveFilter collapse-to-all. Self-bookmark gate on `/shelf/[slug]` masthead (D10) hides glyph when `vendor.user_id === user.id`. Verbal split established: "flag a find / bookmark a booth." **Session 68 shipped cross-tab mall filter persistence end-to-end on prod across all three primary tabs (Home / Booths / Find Map)** — three commits all on prod by close (`991ac5f` design-to-Ready / `0af526b` implementation / `7357b9f` iPhone-QA polish). Ten frozen decisions (D1–D10) at [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md); design-record committed BEFORE implementation per the session-56 rule — **third firing = fully durable institutional practice (origin 56 → 67 → 68).** New [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) primitive (eyebrow + tappable bold name + chevron + optional geo line; three callsites with consumer-supplied eyebrow strings). New [`lib/useSavedMallId.ts`](lib/useSavedMallId.ts) hook wraps `safeStorage` of the shared key — mount-time read only, App Router unmount/remount IS the cross-tab sync. `<MallSheet>` gained optional `countUnit` prop so per-mall counts read "4 booths" on Booths and "2 saved finds" on Find Map. Booths drops per-mall section headers when filtered; Bookmarked-chip composes via intersection. Find Map filters saves by `mall_id` with empty-state callout + inline "Show all malls" link. Pin-glyph mall anchor + fallback "Find Map" heading + intro paragraph all retired (page identity comes from MallScopeHeader or EmptyState). iPhone QA verdict: **"Such a huge improvement on the experience."** New `feedback_state_controls_above_hero_chrome.md` memory captured the underlying principle (state controls > page-title chrome). Feed content seeding still pending, now **11× bumped** — every surface a beta vendor or guest lands on this week is now polished + observable + brand-treated + cross-mall navigable + bookmark-able + cross-tab anchored. Next natural investor-update trigger point remains after feed content seeding lands — the update would now report R4c + R3 + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter as the seven shipped capability items, plus the durable institutional outputs (testbed-first / still-frame-before-port / verify-third-party-software-exists / ask-which-state-first / state-controls-above-hero-chrome patterns + the exec-facing doc artifact + the BookmarkBoothBubble primitive + the MallScopeHeader primitive).
