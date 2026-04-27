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

## ✅ Session 73 (2026-04-27) — R3 closed end-to-end: write-side instrumentation gaps + read-side stale-data mystery, both root-fixed (eight commits)

Single-track session. David's opener: *"let's work through R3 events data. This is probably one of the most important aspects of the beta launch as it helps with telling the story of usage so we need to make sure the data is flowing and is reliable."* The session ran in five beats and closed both halves of R3 — the long-deferred instrumentation gaps AND the parked-since-session-58 stale-data mystery — in one stretch.

**Beat 1 — Inspector run (Step 1a) confirms write side healthy.** Ran `scripts/inspect-events.ts` against prod: 1,706 events captured across all 9 v1 event types, 882 in last 24h, most recent 11:40 UTC the day. The exact `.or()`-pattern admin-route query returned 50 fresh rows when run locally — re-confirming the session-60 finding that the read mystery is environment-specific, not query-shape. Also surfaced 4 known instrumentation gaps that had been deferred while waiting for the read mystery to close (booth bookmarks session 67, find_shared session 59, tag-extraction session 62, mall-filter on Booths+Find Map session 68). Since the write path was clearly alive independent of the read mystery, all four could safely land.

**Beat 2 — R3 v1.1 instrumentation shipped (commits `6c82b2d` + `d4469c7`).** Per `feedback_ask_which_state_first.md`, surfaced D1–D4 payload-shape decisions before writing code:

- **D1 (tag flow):** Two events (`tag_extracted` with `{has_price, has_title}` flags + `tag_skipped` with `{}`) over the original three or single-event-with-outcome alternatives. Splits along the user action; outcome detail belongs in payload.
- **D2 (find_shared):** Capture `share_method: "native" | "clipboard"` so mobile-share-sheet vs desktop-clipboard adoption is queryable.
- **D3 (booth bookmark):** `{vendor_slug}` only — `total_bookmarks` recoverable from session_id over time.
- **D4 (mall-filter `page` field):** Add `page` field to all three primary-tab callsites (incl. backfill on Home). Per-tab adoption becomes a `GROUP BY` query.

David approved all four. Migration 012 (`ALTER TYPE event_type ADD VALUE IF NOT EXISTS` × 5, idempotent + transactional-safe) + `lib/events.ts` + `lib/clientEvents.ts` + `app/api/events/route.ts` `CLIENT_EVENT_TYPES` extended + `app/api/admin/events/route.ts` `ALLOWED_FILTERS` extended + 6 callsite wirings (`handleToggleBookmark` × 2, `handleShare`, `handleTagFile` success path, `handleSkip`, `handleMallSelect` × 3 with backfill on Home). Verified post-deploy via inspector — all 5 new types fired correctly with right payloads + 3× `filter_applied` with correct `page` values. R3 design record gained §Amendment v1.1 capturing decisions D1–D4 + verification path.

**Beat 3 — David's "still looks like stale data" → mystery freshly reproduces → side-by-side probe → root-cause confirmed (commits `e172872` + `a985800` + `fd3696d`).** After v1.1 deploy, David refreshed the admin Events tab on iPhone and reported the data still looked stale. Initial diagnosis was filter-chip omission (the new v1.1 types had no chips, so they only appeared in "All" view). But David's "All" view screenshot revealed something deeper: most recent event displayed was 07:40:42 local (= 11:40 UTC), while the inspector seconds earlier saw events through 12:38 UTC. **~58 minutes of staleness, freshly reproducing.**

Per session 60's parking guidance ("only run on fresh repro"), built [`/api/admin/events-raw`](app/api/admin/events-raw/route.ts) — bare `fetch()` against PostgREST with `cache: "no-store"` set explicitly, bypassing `@supabase/supabase-js` entirely. Then wired an inline diag strip into the admin Events tab so both routes fire in parallel on every fetch and render the diff live (lib first / raw first / delta with color-coded border: green in-sync, amber <60s, red >60s).

David's first diag-strip screenshot was the smoking gun:

```
lib /events: 11:40:42Z · 50 rows
raw probe:   12:58:21Z · 50 rows · 78ms
delta: raw ahead 4659s   (~78 min)
```

Same Supabase URL, same service-role key, same Vercel runtime, same ORDER BY/LIMIT semantics. The only difference: raw probe explicitly set `cache: "no-store"` while supabase-js used unmodified fetch.

**Root cause: Next.js's HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls.** Cache key is URL + method + headers; supabase-js sends identical requests every call → every hit returned the response from the very first call → cache never invalidated. The route's `export const dynamic = "force-dynamic"` directive disables caching of the *route response* but does NOT propagate `cache: "no-store"` to fetches happening *inside* the route. That's the gap session 60's investigation missed — the data-cache layer is decoupled from function instance lifetime, so fresh deploys created new instances but the cached response persisted in a separate layer (which is why session 60's stuck-instance theory was disproved by deploy-test).

**Fix: two lines in [`lib/adminAuth.ts`](lib/adminAuth.ts).** Pass a `global.fetch` wrapper to `createClient` that always sets `cache: "no-store"`:

```ts
return createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  },
});
```

One change benefits every admin route + every server-side `recordEvent` call that goes through `getServiceClient()`. Verified post-deploy: David's diag strip flipped from red `delta: raw ahead 4659s` to green `delta: in sync · 13:05:03Z = 13:05:03Z`. **Five sessions of investigation (58/59/60 + the v1.1 verification half of 73) closed at the root.**

**Beat 4 — Diag-strip filter parity polish (commit `ccc051c`).** David's verification screenshots showed the cache fix landing correctly on the All + Views chips (both at 13:05:03Z) but every other filter chip rendered red. Diagnosed as a diag-strip bug, not a data bug: probe always queried unfiltered while lib reflected the active filter, so `Mall activated` for example showed a 58h "delta" that was purely the gap between "most recent mall_activated event" and "most recent event of any type." Extended events-raw to accept the same `event_type` param (incl. UI bucket aliases) and pass the active filter from `fetchEvents`. Comparisons now apples-to-apples regardless of selected chip.

**Beat 5 — Strategic pivot conversation + chip extension (commits `68da382` + `43afdf8`).** While waiting for a deploy, David surfaced the bigger question: *"Maybe the admin tab in the app isn't the right place to view all of these metrics. If we feel confident that the data is flowing and is being stored, maybe another dashboard view for this level of data is better served."*

Strong agreement — the in-app admin tab was always the wrong shape for analytics. It's a stream-of-rows view inside the consumer app with no aggregations, no charts, no shareable URLs, and every new event type needs filter-chip wiring (we hit that twice in session 73 alone). The strategic answer: **point [Metabase](https://www.metabase.com) at Supabase Postgres directly** via a read-only role. Open-source, free tier or self-hostable, reads Postgres natively (no SDK, no migration, no schema duplication, data ownership stays in our warehouse). Captured as Q-014 in [`docs/queued-sessions.md`](docs/queued-sessions.md) with three starter dashboards (vendor adoption / find engagement / tag-flow funnel) + retirement-of-admin-tab as follow-up session post-Metabase.

David's decision on the diag strip + raw probe: **keep them as a durable visibility layer + sanity check** until Q-014 lands and the admin tab retires. Also flagged a missing chip — booth bookmarks weren't reachable via filter (UI gap from v1.1 implementation). Shipped chip extension: `Bookmarks` as primary chip (high-frequency shopper engagement, on par with Saves/Views/Shares), `Find shares` + `Tag flow` as overflow chips, EVENT_DOT_COLOR map extended with v1.1 types.

Three docs follow-ups landed in commit `68da382`: R3 design record §Amendment v1.2 (full root-cause writeup + fix + why session 60's elimination missed it), TR-q in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md) ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches on Next.js + Vercel" — first firing, compounds with TR-l), Q-014 in queued-sessions.md.

**Final state in production (as of `43afdf8`):**

- All 9 v1 event types + 5 new v1.1 types flow correctly to Supabase. `filter_applied` carries `page` field on Home/Booths/Find Map.
- Admin Events tab reads live data via supabase-js with `cache: "no-store"` on every request — no more 25–78 min stale snapshots.
- `/api/admin/events-raw` + inline diag strip stay as durable visibility tooling. Diag strip reads green `in sync` on every chip where data has flowed recently; reads in-sync at older timestamps for genuinely-quiet event types.
- Filter chips: All · Saves · Views · Shares · Bookmarks (primary, wraps); Filters · Find shares · Tag flow · Requests submitted · Requests approved · Mall activated · Mall deactivated (overflow when `+ more`).
- `lib/adminAuth.ts` `getServiceClient()` now passes `global.fetch` wrapper — every admin route + every `recordEvent` call benefits, not just `/api/admin/events`.
- No DB / RLS / API surface changes beyond migration 012 (5 enum values added). No schema migration for v1.2 fix (pure plumbing).

**Commits this session (8 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `6c82b2d` | feat(r3): v1.1 instrumentation gaps + admin filter extension |
| `d4469c7` | chore(r3): inspect-events.ts surfaces v1.1 event types |
| `e172872` | chore(r3): add /api/admin/events-raw probe for stale-data mystery |
| `a985800` | chore(r3): inline diag strip at top of admin Events tab |
| `fd3696d` | fix(r3): supabase-js bypasses Next.js fetch cache via global.fetch hook |
| `ccc051c` | chore(r3): events-raw probe accepts event_type filter for diag parity |
| `68da382` | docs(r3): v1.2 amendment — stale-data mystery resolved + Q-014 queued |
| `43afdf8` | feat(r3): chip wiring for v1.1 event types in admin Events tab |
| (session close) | docs: session 73 close — R3 closed end-to-end |

**What's broken / carried (delta from session 72):**

- 🟢 **R3 stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting supabase-js fetches. Fix: `global.fetch` wrapper with `cache: "no-store"` in [`lib/adminAuth.ts`](lib/adminAuth.ts). Closes the parked-since-session-58 mystery without a Supabase support ticket.
- 🟢 **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method: "native" | "clipboard"` payload, intent-capture semantic.
- 🟢 **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title` flags) + `tag_skipped` shipped.
- 🟢 **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` shipped on both `app/shelves/page.tsx` + `app/shelf/[slug]/page.tsx`.
- 🟢 **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` now fires on all three primary tabs with `page` field for per-tab attribution.
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–72, **73**. Now **16× bumped**. Session 73 closed R3 end-to-end (write side + read side both root-fixed). The actual V1 unblocker remains real content. **Top recommended next session.** New judgment moments to fold in: (a) does the Bookmarks filter chip read correctly with real adoption volume, (b) do the diag strip values stay green/in-sync under real seeding traffic, (c) does the admin Events stream read intelligibly when 50+ events from a session land in one cluster.
- 🟡 **NEW: Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic answer to "where does this data live long-term." 60–90 min initial session: read-only Postgres role + Metabase Cloud or self-hosted + 3 starter dashboards. Retirement of admin tab code is a follow-up session, not Q-014 itself. Diag strip + raw probe become irrelevant when admin tab retires.
- 🟡 **Strip verbose console.logs from `/api/admin/events`** — was kept "until R3 truly closes" since they were the only visibility into the symptom. Now that the bug is fixed AND the diag strip + raw probe took over the visibility role, the verbose logs in `/api/admin/events/route.ts` are duplicative. Worth a 5-min cleanup pass any session that touches the admin events path, OR auto-deletes when admin tab retires post-Q-014.
- 🟡 **Other supabase-js call sites might have the same latent bug** — anywhere that creates a Supabase client without the `global.fetch` wrapper is potentially reading stale data via Next.js's data cache. Audit candidates: `lib/auth.ts` (browser client — different cache layer, unaffected), any inline `createClient` calls outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent — `getServiceClient()` is the dominant pattern across admin routes.
- 🟡 **Item 3 — animation consistency review** — unchanged carry from session 71.
- 🟡 **Item 5 follow-up B + A parked** — unchanged carry from session 71.
- 🟡 **Item 6 — shareable filtered-mall link** — unchanged carry from session 71.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — unchanged carry from session 71.
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged carry from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged carry from session 70.
- 🟡 **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** — unchanged carry from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged carry from session 70.
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged carry from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged carry from session 69.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.
- 🟡 **Multi-affordance retirement → single-surface promotion** — unchanged carry from session 72 (single-firing pattern in admin context, watching for third instance).

**Memory updates:** ONE new memory.

- **NEW: [`feedback_side_by_side_probe_for_divergence.md`](memory/feedback_side_by_side_probe_for_divergence.md)** — when two layers/runtimes return divergent results from identical inputs, build a parallel route that bypasses one layer + render the diff inline; localizes the bug in one debug cycle. Pattern from session 73's R3 stale-data resolution: 5 sessions of investigation closed in one session because the side-by-side probe + inline diag strip turned "guess at the layer" into "see the layer fail in real time." Reusable for any "identical-config divergent-results" mystery.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied to D1–D4 payload-shape surfacing for the v1.1 events. As noted in session 71's tombstone, firing-count tracking has stopped; this is just how decisions land now.
- `feedback_visibility_tools_first.md` (session 60) — applied throughout the read-mystery investigation. Build the diag strip + raw probe BEFORE guessing further at the cache layer. The new sibling memory above is a refinement of this pattern for the specific shape of "divergent-result" debugging.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 8 runtime/docs commits + this close ✅.
- Same-session design-record-commit rule (session 56) — fired this session via R3 design record §Amendment v1.1 + implementation in commit `6c82b2d`. The §Amendment v1.2 docs landed in `68da382` (post-fix retro-writeup, separate commit) but same session, which is the rule's spirit. Beyond beyond default at this point.

**Live discoveries:**

- **The "smoking-gun side-by-side diff" pattern is exceptionally efficient for divergence mysteries.** Session 60 spent a session enumerating eliminated causes (env vars, project, code, instance lifetime). Session 73 built a parallel route + inline diff and the smoking gun appeared in the first reading. The deciding factor: instead of "what could be different?" we asked "what IS different, visibly, side by side?" Whenever a bug presents as "identical-looking config but divergent results," this should be the first move.
- **`force-dynamic` is a leakier abstraction than the docs imply.** It disables caching of the *route response* but does NOT propagate cache: "no-store" to fetches happening inside the route. Anyone using a client library that wraps `fetch()` (supabase-js, anything else that internally calls `fetch`) needs to know the library doesn't inherit the route directive. Captured as TR-q.
- **Strategic pivots while waiting for deploys are high-value.** David's "maybe the admin tab isn't the right place" question landed during a deploy-wait. It produced Q-014, which reframes the entire R3 maintenance narrative: instead of "how do we make the admin tab better forever," it's "how do we replace the admin tab with off-the-shelf BI." Future deploy-waits should be treated as natural windows for strategic conversation, not just technical context-switching.
- **R3 v1.1 amendment + v1.2 amendment in same session is a useful design-record shape.** v1.1 captured the additive instrumentation work with frozen decisions D1–D4 (forward-looking design). v1.2 captured the root-cause + fix retroactively (backward-looking diagnosis). Both are valuable to future sessions reading the design record cold; the separation by amendment is cleaner than rewriting the original spec.

**Operational follow-ups:** Archive-drift accounting now includes session 72 (rotated off the visible tombstone list with this close). Session 67 falls off the bottom of the last-5 list. Archive-drift backfill (sessions 54 + 55 + 57–72) still on the operational backlog.

**Tech Rule candidates:** ONE new candidate this session.

- **TR-q** — "`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches on Next.js + Vercel" — first firing this session. Compounds with TR-l (Vercel-runtime PostgREST quirks). Both are about subtle local-vs-Vercel deviations identical-looking code reveals only under specific conditions.

Carry-forward candidates unchanged from session 72: TR-l + TR-m promotion-ready, plus the various single-firing candidates from sessions 64/65/68/69/70/71/72.

**Notable artifacts shipped this session:**

- [`supabase/migrations/012_events_v11_enum_extension.sql`](supabase/migrations/012_events_v11_enum_extension.sql) — additive enum extension, idempotent via `IF NOT EXISTS`.
- [`app/api/admin/events-raw/route.ts`](app/api/admin/events-raw/route.ts) — durable diagnostic route. Bare `fetch()` against PostgREST with `cache: "no-store"`, mirrors `/api/admin/events` query semantics + UI bucket aliases. Stays as visibility tooling until admin tab retires post-Q-014.
- Inline diag strip in [`app/admin/page.tsx`](app/admin/page.tsx) `EventsTab` — auto-fires both routes in parallel on every fetch, color-coded delta. Strip implementation lines ~1300+; pass-through `rawProbe` state + parallel fetch in `fetchEvents`.
- R3 design record §Amendment v1.1 (instrumentation closure) + §Amendment v1.2 (mystery resolution) at [`docs/r3-analytics-design.md`](docs/r3-analytics-design.md). Document is now the canonical reference for the entire R3 lifecycle: original spec (session 58) → write-side gaps closed (session 73 v1.1) → read-side mystery resolved (session 73 v1.2).
- Q-014 capture at [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014 — strategic next move with full session opener pre-filled.

---

## ✅ Session 72 (2026-04-26) — admin BottomNav tab + masthead pill / Manage eyebrow retirement (one runtime commit)

Standup recommended feed content seeding (now 14× bumped). David redirected: move admin entry from `/shelves` masthead pill into a dedicated BottomNav tab (replacing My Booth, since admins have no booth assigned). Retire the green "Manage" eyebrow under booth tiles too — Pencil + Trash bubbles already signal edit/delete intent. The whole arc was a small surgical change, no mockup needed (no new visual primitives — same flex slot, same icon spec, same label typography).

Per `feedback_ask_which_state_first.md` (9th firing — fully default opening, not a notable practice), surfaced D1–D4 before writing code:
- **D1 (icon):** Lucide `Shield` (21px stroke 1.7 to match Home / Store / LayoutGrid) over Settings/cog (could read as generic settings menu) or ShieldCheck (chrome noise).
- **D2 (label):** "Admin" — single-word convention parity with Home / Booths / My Booth; matches the masthead pill copy we're retiring.
- **D3 (active highlight):** add `"admin"` to NavTab union for completeness, but no surface uses it as `active` — `/admin/page.tsx` doesn't render BottomNav at all (it's a destination page with its own chrome). The union extension is forward-compat only.
- **D4 (`/my-shelf` for admins):** leave as-is. Admin nav no longer points there; existing "No booth linked" empty state is correct + harmless for direct-URL traffic. Redirect logic + tailored empty-state copy both rejected as over-design for an edge case admins shouldn't normally hit.

David approved all four. Shipped as one commit `27a0439` (+26/-27 across 2 files):
- [`components/BottomNav.tsx`](components/BottomNav.tsx) — `Shield` import + `isAdmin` import + `adminTab` def + conditional 4th-slot swap (`user && isAdmin(user) ? adminTab : myBoothTab`); `NavTab` union extended with `"admin"`; header comment updated to reflect the three-way layout (Guest 3 tabs / Vendor 4 / Admin 4 with Admin in the 4th slot).
- [`app/shelves/page.tsx`](app/shelves/page.tsx) — masthead `right={...}` AdminOnly pill removed; "Manage" eyebrow AdminOnly block under each booth tile removed. `Link` + `AdminOnly` imports retained (still used by the Pencil/Trash bubbles + the section-header mall-status pill).

Build green; pushed to prod. iPhone QA pending.

**Final state in production (as of `27a0439`):**

- Admin BottomNav: Home · Booths · Find Map · **Admin** (Shield 21px → `/admin`).
- Vendor BottomNav: Home · Booths · Find Map · My Booth (unchanged).
- Guest BottomNav: Home · Booths · Find Map (unchanged).
- `/shelves` masthead right slot is now empty for everyone — AdminOnly pill retired across all states.
- `/shelves` booth tiles for admins: Pencil + Trash bubbles top-right unchanged; "Manage" green eyebrow under the card body removed (no visual replacement — the bubbles carry the affordance).
- `/my-shelf` for direct-URL admin traffic: unchanged ("No booth linked" empty state preserved).
- No DB / RLS / API / migration changes — pure presentational + nav.

**Commits this session (1 runtime + 1 close):**

| Commit | Message |
|---|---|
| `27a0439` | feat(nav): admin gets dedicated bottom-nav tab; retire masthead pill + Manage eyebrow |
| (session close) | docs: session 72 close — admin BottomNav tab + masthead pill / Manage eyebrow retirement |

**What's broken / carried (delta from session 71):**

- 🟢 **Admin entry on `/shelves` is no longer cluttered with redundant chrome** — both the masthead pill AND the per-tile Manage eyebrow are retired. Admin lands on `/admin` via a single durable surface (BottomNav tab) reachable from every primary tab.
- 🟢 **`/my-shelf` no longer surfaces a dead-end "No booth linked" state for admins via nav** — admin nav now points at `/admin` directly. The empty state still exists for direct-URL traffic but isn't reachable through normal navigation.
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–71, **72**. Now **15× bumped**. Session 72 closed an admin-chrome gap orthogonal to seeding but the recommendation is unchanged. **Top recommended next session.** New judgment moments to fold in: (a) does the Admin BottomNav tab read distinguishably from the My Booth tab vendors see (Shield vs Store icon), (b) does the now-empty masthead right slot on `/shelves` look intentional (vs accidentally bare), (c) do admin-managed booth tiles read as manageable without the Manage eyebrow now that only the corner bubbles signal it.
- 🟡 **Item 3 — animation consistency review** — unchanged carry from session 71.
- 🟡 **Item 5 follow-up B + A parked** — unchanged carry from session 71.
- 🟡 **Item 6 — shareable filtered-mall link** — unchanged carry from session 71.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — unchanged carry from session 71.
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged carry from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged carry from session 70.
- 🟡 **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** — unchanged carry from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged carry from session 70.
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged carry from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged carry from session 69.
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **Tag-extraction / booth-bookmark / mall-filter analytics events** — unchanged.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied to D1–D4 surfacing. **9th firing.** As noted in session 71's tombstone, this pattern has fully transcended "rule" status; future sessions should not flag firing counts. (Stopping the count here.)
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to runtime + close commits ✅.
- Same-session design-record-commit rule (session 56) — **did not fire this session**. The change was small surgical work without a frozen-design-record artifact (no mockup, no `-design.md`). The rule fires on sessions that *produce* design records; sessions that ship without them don't trigger it. Worth a quiet note for future-Claude: 7 prior firings make it look ubiquitous, but it is conditional on a design-record artifact existing in the first place.

**Live discoveries:**

- **D3's union-extension was for forward-compat only.** I proposed adding `"admin"` to `NavTab` and wiring `/admin/page.tsx` to pass `active="admin"` — but `/admin` doesn't render BottomNav. The union extension still landed (cheap, harmless, future-proof if `/admin` ever gains BottomNav), but the `active="admin"` wiring was moot. Worth flagging for any future admin-page redesign that adds BottomNav: the type union is already there.
- **Multi-affordance retirement → single-surface promotion is a clean pattern.** Three admin-entry affordances (`/shelves` masthead pill + per-tile Manage eyebrow + the implicit "no, there's no admin tab" of My Booth as the 4th slot) collapsed into ONE durable surface (BottomNav Admin tab). This is the same shape as session 71's cartographic collapse on `/find/[id]` (parallel two cards → single inkWash card). Both reduced UI surface area while strengthening the primary affordance. **Not yet a Tech Rule candidate** — single firing in admin context, single firing in shopper context — but worth watching for a third instance.

**Operational follow-ups:** Archive-drift accounting now includes session 71 (rotated off the visible tombstone list). Session 66 falls off the bottom of the last-5 list with this close; archive-drift backfill (sessions 54 + 55 + 57–71) still on the operational backlog.

**Tech Rule candidates:** No new firings this session.

Carry-forward unchanged from session 71. The "multi-affordance → single-surface promotion" observation above is a single-firing pattern in the admin context (session 72) but echoes session 71's cartographic collapse in the shopper context — could compound into a Tech Rule on a third firing.

**Notable artifacts shipped this session:** none beyond the runtime change. `components/BottomNav.tsx` header comment block now explicitly documents the three-way layout (Guest / Vendor / Admin) so future sessions don't have to grep auth.ts to understand what shows where.

---

## ✅ Session 71 (2026-04-26) — `/find/[id]` cartographic collapse + 3-item polish bundle + image-height standardization (E only) shipped end-to-end (three runtime commits)

Sequenced as three independent decision arcs, each with its own design record + iPhone-QA pause. Standup opened on feed content seeding (now 13× bumped). David redirected: "scope item 1" — `/mall/[slug]` v1.x ecosystem migration. Investigation revealed session 70's parallel mall card on `/find/[id]` had unintentionally turned `/mall/[slug]` (still v0.2 dark theme) into a hero-level destination. David: *"I didn't realize it actually linked anything"* — pivot from "fix `/mall/[slug]`" to "retire the link from `/find/[id]`" via cartographic collapse. After that shipped, David surfaced a 6-item list (1: remove XGlyph from `/find/[id]`; 2: "Find this item at" eyebrow; 3: animation consistency review; 4: bump count number font; 5: portrait/square image standardization; 6: shareable filtered-mall link). Triaged 1+2+4 as a polish bundle this session, scoped 5 next, deferred 3 + 6 to own sessions. **Three runtime commits + 1 mockup + 2 design records + 0 new memories.** Same-session design-record-commit rule fired TWICE more this session (6th + 7th total firings: cartographic-collapse-design.md committed with `54fa370`; image-standardization-design.md + mockup committed with `704ff7a`). `feedback_ask_which_state_first.md` fired again at the cartographic-collapse decision batch (D1–D3). Two new Tech Rule candidates surfaced.

The session ran in five beats:

1. **Standup → David redirect.** Recommended feed content seeding (13× bumped). David: *"Lets look at 1. as I'm not sure what we're trying to solve for on this or if its a non issue now."* Read `/mall/[slug]` directly: page is on v0.2 dark theme + Georgia serif + custom sticky header + dark photo gradient + no MallScopeHeader + no Variant B lockup + monospace count + lens-fighting darkening filter. Reachable from `/find/[id]` (session-70 parallel mall card) + `/vendor/[slug]`. Recommended **defer** until feed seeding shows whether shoppers actually traverse the warm-→-dark cliff. David accepted the defer but added a redirect: *"we should change the way those cards show up on that page"* — referencing the Variant C all-malls-scope frame from session-70 mockup. Wanted to collapse the two-card pattern on `/find/[id]` into ONE card with mall · city/state subtitle, drop the visit-the-booth text, retire the `/mall/[slug]` link from this surface.

2. **Cartographic collapse decision batch + ship (`54fa370`, +161/−138 across 2 files).** Per `feedback_ask_which_state_first.md` (8th firing now), surfaced D1–D3 with rationale before writing code: D1 mall street address fate (recommend (c) — keep mall · city/state line as tappable Apple Maps link, drop the visible address); D2 card link target (recommend `/shelf/[vendorSlug]`; retire `/mall/[slug]` link); D3 numeral typography (recommend keep IM Fell Variant B for parity with `/flagged` + Booths). David confirmed all three. Skipped a fresh mockup since session-70's "Variant C · all-malls scope" frame + the screenshot David sent already covered the structural pattern; existing mockup serves as the design source. Wrote [`docs/find-detail-cartographic-collapse-design.md`](docs/find-detail-cartographic-collapse-design.md) (D1–D6 + spine simplification: D5 retire PinGlyph + tick, keep XGlyph anchored to single card). Implemented: dropped `mallSlug` + `mallAddr` + `PinGlyph` as orphans; collapsed parallel mall card into the booth card; subtitle "Antique World · Lexington, KY" wraps in `<a href={mapLink}>` with dotted-underline + `e.stopPropagation()`. Build green; committed design record + implementation in one commit per the same-session rule (6th firing). David approved push: *"commit and push."*

3. **Six-item David list → triage → 1+2+4 polish bundle ship (`30c2c0c`, +33/−39 across 4 files).** David walked the deploy on iPhone, surfaced six items: (1) remove the XGlyph spine on `/find/[id]` since cartographic identity no longer earns its place there (no other page carries it after session 70 retired it on `/flagged`); (2) add "Find this item at" eyebrow above the card; (3) animation consistency review across pages (Find Map animates location up, Booths doesn't); (4) bump the count number font in MallScopeHeader eyebrow (felt small); (5) portrait images cropped + smaller than square images on Find Map carousel + my-shelf window/shelf views; (6) direct shareable filtered-mall link for malls to share. Triaged into table with size estimates: 1+2+4 small + decoupled = ship this session; 3 + 5 + 6 each warrant scoping pass. For 2 + 4 surfaced typography decisions: Item 2 picked (b) IM Fell italic 14px / `inkMid` over the card (vs small-caps eyebrow or plain sans); Item 4 picked (b) lift the count alone to IM Fell italic larger size while eyebrow prose stays sans-italic 11px. Implemented:
   - **Item 1** — XGlyph spine column dropped; grid wrapper `28px 1fr` simplified to flat container; `XGlyph` component deleted as orphan.
   - **Item 2** — italic IM Fell 14px "Find this item at" eyebrow added above the cartographic card with 8px margin-bottom + 2px paddingLeft.
   - **Item 4** — `MallScopeHeader` API extended with optional `count` prop. When provided, renders inline at IM Fell italic 22px before the 15px eyebrow text. `/shelves` (Booths) + `/flagged` (Find Map) call sites updated to pass `count={boothCount}` / `count={findCount}` and drop the count from the eyebrow string. Home unchanged (no count in eyebrow).
   - Build green; pushed to prod.

4. **Item 5 scoping → Explore agent inventory → diagnosis pivot → ship E only (`704ff7a`, 5 files +572/−4 with mockup + design record).** Per `feedback_visibility_tools_first.md`, spawned Explore agent up front to inventory every post-image render surface + the upload pipeline. **Explore agent's report had a critical error** — claimed square photos get "letterboxed" with `objectFit: cover`, which contradicts how cover works (cover always fills slot, cropping excess; never letterboxes). Pushed back, did own grep-driven inventory, confirmed all four called-out surfaces (FindTile, WindowTile, ShelfTile, ShelfCard rail) use `aspect-ratio: 4/5` + `objectFit: cover` uniformly. Surfaced 5 fix options (A: flip slot 4/5 → 1/1; B: `object-position: center top`; C: capture image dims at upload; D: enforce upload-time crop; E: caption `min-height` to fix card-height variance). Recommended **E + B + A bundle**. David approved bundle, asked for **mockup-first** per design system rule. Wrote [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) — 12 phone frames in BEFORE/AFTER bands across the four surfaces with deliberately-aspected SVG data-URI photos so cropping math renders truthfully in browser + 3:4 portrait + 1:1 square + 4:3 horizontal source variants + caption length variance + decisions block + comparison band + final judgment ask. **David sent a screenshot of `/flagged`** showing 2 visible tiles (Dog statue / Feuerhand kerosene lantern) + clarified: *"The photos taken that are longer are actually the square formatted images. and the shorter dog photo was a portrait image."*

   **The screenshot revealed the diagnosis was wrong.** Photos within tiles ARE uniform-height (the `aspect-ratio: 4/5` slot enforces it correctly). What differs is **total card height**, driven by caption-length variance (1-line title vs 2-line title; price present vs not). David's "longer / shorter" labels mapped to TOTAL CARDS, not photo slots. The actual visible problem is caption-height variance, not photo cropping. **E alone addresses the root cause.** Revised recommendation: ship E first, defer B + A pending iPhone QA. David: *"ship E only first."*

   Implemented: caption div on FindTile / WindowTile / ShelfTile gains `minHeight: 76` (math: 14px IM Fell × 1.2 line-height × 2 lines = 33.6px + 12px sans × 1.4 = 16.8px + 3px margin + 20px vertical padding = 73.4px natural max → 76 with cushion). ShelfCard rail tile (title-only, no price) gets `minHeight: 56` (53.4px max → 56 cushion). Wrote [`docs/image-standardization-design.md`](docs/image-standardization-design.md) capturing E-only scope + the parked B+A as ready-to-ship-on-second-pass. Build green; committed design record + mockup + implementation in one commit per the same-session rule (7th firing). David: *"issue resolved."*

5. **Items 3, 5(B+A), 6 deferred to next sessions.** Item 3 (animation consistency review) needs multi-surface survey + design pass. Item 5 follow-up (B + A — `object-position: top` + slot-ratio flip 4/5 → 1/1) parked since E alone resolved the visible issue; existing mockup carries D1+D2 ready to ship if real-content seeding reveals a residual photo-cropping issue. Item 6 (shareable filtered-mall link) needs product + URL-param + share UX + mockup pass.

**Final state in production (as of `704ff7a`):**

- `/find/[id]` cartographic block is now ONE inkWash card with italic "Find this item at" eyebrow above. Card carries: vendor name (IM Fell 18px) → mall · city/state subtitle (sans 11.5px, dotted-underline Apple Maps link) → "BOOTH" + IM Fell 26px numeral on right (Variant B unchanged). Whole card tappable to `/shelf/[vendorSlug]`.
- The cartographic spine is fully retired on this page. PinGlyph + hairline tick + XGlyph all deleted. The "X marks the spot" cartographic identity that was load-bearing in session 70's hybrid-call no longer survives anywhere in the v1.x ecosystem (retired on `/flagged` session 70; retired on `/find/[id]` session 71).
- Link to `/mall/[slug]` from `/find/[id]` is retired. `/vendor/[slug]` retains its `/mall/` link until that page's own redesign.
- MallScopeHeader on Booths + Find Map: count number renders inline at IM Fell italic 22px before the 15px sans eyebrow phrase. Home unchanged.
- Find tile surfaces (FindTile / WindowTile / ShelfTile) cards now bottom-out at the same row regardless of caption length. ShelfCard rail tile (title-only) similarly stabilized.
- `mallSlug` + `mallAddr` extracts removed from `/find/[id]`. `PinGlyph` + `XGlyph` components removed as orphans.
- No DB / RLS / API / migration changes — pure presentational.

**Commits this session (3 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `54fa370` | feat(find-detail): cartographic collapse — single card with mall subtitle |
| `30c2c0c` | fix(find-detail+scope-header): XGlyph retired, eyebrow above card, count bumped |
| `704ff7a` | fix(tiles): caption min-height stabilizes card heights across find tiles |
| (session close) | docs: session 71 close — cartographic collapse + 3-item polish bundle + image-height standardization (E only) |

**What's broken / carried (delta from session 70 close):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–70, **71**. Now **14× bumped**. Session 71 closed the `/find/[id]` cartographic asymmetry that compounded into a real visual cliff (parallel mall card → `/mall/[slug]` v0.2 dark theme), retired the spine entirely, fixed card-height variance on find tiles, and bumped the eyebrow count typography. **Real content remains the actual unblocker. Top recommended next session.** New judgment moments to fold into the seeding walk: (a) does the collapsed `/find/[id]` cartographic card read as grounded with real mall + booth data + the new "Find this item at" italic eyebrow, (b) does the count-in-eyebrow at IM Fell italic 22px hold against real counts (1, 47, 200), (c) do find tiles bottom-out cleanly when real titles span 1, 2, or wraps with prices in mixed presence, (d) any portrait-vs-square photo cropping perception issues still surface on Find Map carousel after E landed (if yes, ship parked B + A from `image-standardization-design.md`).
- 🟡 **NEW: Item 3 — animation consistency review across pages** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey needed before scoping. Probably its own session. Hot path: framer-motion `motion.div` initial/animate/transition props across primary tabs + scope headers + tile entry animations + sheet open/close.
- 🟡 **NEW: Item 5 follow-up B + A parked** — `object-position: center top` + slot-ratio flip 4/5 → 1/1 stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready to ship as a second pass.
- 🟡 **NEW: Item 6 — shareable filtered-mall link** (David flagged session 71) — for malls to share a direct URL to their mall view. Needs product + URL-param scheme + share UX + mockup pass. Two possible directions: (a) deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68); (b) send to `/mall/[slug]` (which is still v0.2 dark and deferred). Direction (a) is the cleaner answer given session-68's persistence infra.
- 🟢 **`/find/[id]` cartographic visual asymmetry** ✅ — already RESOLVED session 70. Session 71 went further by collapsing both cards into one.
- 🟢 **`/mall/[slug]` link from `/find/[id]`** ✅ — RESOLVED session 71 (retired). The cliff to v0.2 dark theme on this surface is closed. `/mall/[slug]` is now reachable only from `/vendor/[slug]` until that page's own redesign.
- 🟡 **`/mall/[slug]` v1.x migration STILL deferred** — page itself still on v0.2 dark theme. Reachable from `/vendor/[slug]`. Migration is now lower-traffic (one fewer entry point) but still on the Sprint 5 follow-on list whenever real shoppers find it via vendor profiles.
- 🟡 **NEW: Sub-agent claim verification** — Explore agent's image-rendering inventory contained a fabricated "letterboxing" claim that contradicts how `objectFit: cover` works. Caught by my own verification grep. Single firing this session — could become Tech Rule on second firing: "Verify sub-agent claims that contradict known semantic rules of the underlying system."
- 🟡 **NEW: Screenshot-before-scoping for visual fixes** — Item 5 was scoped to E+B+A bundle pre-screenshot. David's screenshot revealed E alone solved the actual problem; B+A would have shipped aesthetic changes that weren't necessary. Single firing this session — could become Tech Rule on second firing: "When proposing a multi-change visual fix, ask for a screenshot first; the user's mental model of the cause may differ from the actual mechanism."
- 🟡 **All-malls scope mall-subtitle weak separator on `/flagged`** — unchanged from session 70.
- 🟡 **Booth-page scroll flatten (D17) regression watch** — unchanged from session 70.
- 🟡 **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** — unchanged from session 70.
- 🟡 **Booths grid lockup numeral size deviates from spec** — unchanged from session 70.
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged from session 69.
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged. (Note: session-71 `minHeight: 76` on caption may make this less acute since variable-caption-pinch on the photo is now decoupled from the card-height stabilization; still worth real-photo judgment.)
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **Booth-bookmark analytics events** — unchanged.
- 🟡 **Mall-filter analytics events not wired on Booths + Find Map** — unchanged.
- 🟡 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **Treehouse Lens constant is provisional** — unchanged.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the cartographic-collapse decision batch (D1–D3). **Eighth firing across recent sessions.** Pattern is so default that future sessions should drop the firing-count tracking — it's just how Claude opens visual decisions now.
- `feedback_visibility_tools_first.md` (session 60) — applied to item 5 scoping: spawned Explore agent up front to inventory image-render surfaces. Agent's report contained a fabricated letterboxing claim, but the inventory-first instinct + the verification step that caught it together saved the session from shipping a wrong-cause fix.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 3 commits + this close ✅.
- Same-session design-record-commit rule (session 56) — fired TWICE this session: (1) `54fa370` carries `find-detail-cartographic-collapse-design.md` + implementation; (2) `704ff7a` carries `image-standardization-design.md` + mockup + implementation. **Sixth + seventh firings; 7 total firings since session 56.** Beyond beyond default.

**Live discoveries:**

- **Sub-agent claim that contradicts CSS semantics needs verification before trust.** The Explore agent's image-rendering inventory included: *"Square photos cropped (cover), causing visible letterboxing with black padding at bottom."* That's structurally impossible — `objectFit: cover` always fills the slot. Cover crops, never letterboxes. Caught by reading the actual `aspect-ratio` + `objectFit` code in 4 source files myself. Worth a Tech Rule candidate: "Verify sub-agent claims that contradict known semantic rules of the underlying system." First firing this session.
- **Asking for a screenshot before scoping a visual fix saves shipping unnecessary aesthetic changes.** Item 5 was scoped to E+B+A bundle pre-screenshot. The screenshot revealed E alone addressed the actual cause (caption-variance) — B+A would have flipped slot ratio to 1/1 (real aesthetic change) and added top-crop position (subjective improvement) without solving anything that wasn't already solved by E. First firing this session — Tech Rule candidate: "When proposing a multi-change visual fix, ask for a screenshot first; the user's mental model of the cause may differ from the actual mechanism."
- **Same-session design-record-commit rule firing for the SIXTH + SEVENTH times. SEVEN total firings since session 56. The rule has fully transcended "rule" status — it's just how decisions land in this codebase now.** Future sessions should not flag the firing count individually; just do it.
- **`feedback_ask_which_state_first.md` firing for the EIGHTH time** — pattern is the default opening, not a notable practice. Stop tracking firing counts.
- **Diagnosis-before-prescription on visual bugs.** When David surfaced "portrait images are smaller than square ones," my initial framing was photo-cropping math (objectFit subject scale, slot ratio mismatch). The screenshot revealed the actual cause was caption-variance in adjacent grid cells. Recovering from a wrong initial frame required: (a) swallowing the framing pivot rather than defending the bundle, (b) re-reading the screenshot as primary evidence over my mental model, (c) shipping the smaller scope (E only) rather than executing the pre-approved bundle. Worth tracking — could compound with the screenshot-first rule into a single Tech Rule about visual-fix scoping.

**Operational follow-ups:** Archive-drift accounting now includes session 70 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** Two NEW candidates surfaced this session:
- **"Verify sub-agent claims that contradict known semantic rules of the underlying system"** — single firing. Tech Rule on second firing.
- **"When proposing a multi-change visual fix, ask for a screenshot first"** — single firing. Tech Rule on second firing.

Carry-forward candidates: session-69 "parallel-structure card consistency" (load-bearing again this session as the cartographic collapse extended the principle to a vendor+mall-subtitle composition; arguably second-firing). Session-70 "smallest→largest commit sequencing" + "italic-ascender 1px lift" both still single firings. Session-68 "filter as intent → empty-state needs inline clear-filter link" unchanged.

**Notable artifacts shipped this session:**
- [`docs/find-detail-cartographic-collapse-design.md`](docs/find-detail-cartographic-collapse-design.md) — design record (D1–D6) capturing the collapse decision + spine-simplification rationale + the rejected "fully retire spine" alternative + carry-forward notes.
- [`docs/image-standardization-design.md`](docs/image-standardization-design.md) — design record for the E-only ship + parked B+A second-pass + math justification for `minHeight` values + acceptance criteria.
- [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) — 12-frame mockup with deliberately-aspected SVG data-URI photos so cropping math renders truthfully in the browser. **Reusable** for any future "show me what happens to X-aspect photo in Y-aspect slot" review — the SVG-data-URI-photo primitive is a low-cost way to demonstrate `objectFit: cover` behavior accurately without depending on the network or pulling stock images.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–72 still missing — operational backlog growing).

- **Session 72** (2026-04-26) — Small surgical session. One runtime commit (`27a0439`) rationalizing admin entry: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned). Two redundant affordances retired in same commit: `/shelves` masthead `ADMIN` pill + green `Manage` eyebrow under each booth tile (Pencil + Trash bubbles already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. Live discovery: "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single-firing in admin context, single-firing in shopper context, watching for third instance.
- **Session 71** (2026-04-26) — Three independent decision arcs in three runtime commits + close (`54fa370` `/find/[id]` cartographic collapse / `30c2c0c` 3-item polish bundle / `704ff7a` caption min-height). Parallel two-card pattern on `/find/[id]` collapsed into ONE inkWash card with italic IM Fell "Find this item at" eyebrow above + vendor name + mall · city/state Apple Maps subtitle + Variant B booth numeral; cartographic spine (PinGlyph + tick + XGlyph) FULLY RETIRED across the v1.x ecosystem; link to `/mall/[slug]` retired from this surface. MallScopeHeader API extended with `count` prop rendering count alone at IM Fell italic 22px on Booths + Find Map (Home unchanged). FindTile/WindowTile/ShelfTile gain caption `minHeight: 76` + ShelfCard rail tile `minHeight: 56` — find tiles bottom-out at uniform heights regardless of caption-length variance. **Diagnosis-pivot mid-session:** Item 5 was scoped to E+B+A bundle pre-screenshot; David's screenshot of `/flagged` revealed actual cause was caption-variance not photo-cropping; shipped E only with B+A parked in mockup ready for second pass. Same-session design-record-commit rule 6th + 7th firings. `feedback_ask_which_state_first.md` 8th firing. ZERO new memories. Two new Tech Rule candidates: "verify sub-agent claims that contradict known semantic rules" (Explore agent's letterboxing claim contradicting `objectFit: cover`) + "ask for a screenshot before scoping multi-change visual fixes." Three carry items into session 72: animation consistency review (item 3, deferred), shareable filtered-mall link (item 6, deferred), B+A second pass parked.
- **Session 70** (2026-04-26) — Largest layout-redesign sweep in recent memory. Six runtime/docs commits + close (`3432338` 3 records design-to-Ready / `d6b5a75` find-detail mall card + post-it / `198560f` finds-map cartographic retirement / `cc322e9` masthead lock + scroll flatten / `48aa93a` round-2 polish / `ce5eb0c` Variant B booth lockup). Three primary records frozen + one mid-session lockup-revision (D1–D18 across [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md) + [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md) + [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md) + L1–L9 in [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md)). `/flagged` cartographic spine fully retired in favor of flat sectioned-list with inkWash card headers; `/find/[id]` mall block lifted to parallel inkWash card; `StickyMasthead` rewritten with locked-grid slot API + booth-page scroll flatten + `/post/preview` unification; round-2 iPhone-QA polish (Home logo retired, wordmark `translateY(-1px)` for ascender bias, address geoLine on Booths + Find Map, count merged into eyebrow); Variant B booth lockup shipped across three surfaces (vendor LEFT + "Booth" small-caps eyebrow + IM Fell numeral RIGHT). Same-session design-record-commit rule 5th firing. ZERO new memories.
- **Session 69** (2026-04-26) — Caption consistency + booth label unification + flag terminology sweep shipped end-to-end. Three runtime/docs commits + close (`935c065` terminology / `ab0a641` design-to-Ready / `3f1b4e5` implementation). 12 frozen decisions (D1–D12) at [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md). Five tile-caption surfaces unified to Booths VendorCard treatment (warm `inkWash` card + IM Fell 14px regular non-italic title + sans 12px price + 9/10/11 padding). Booth label Option B (small-caps `BOOTH NN` eyebrow above vendor name) shipped on Booths grid + Find Detail; BoothHero post-it eyebrow collapsed two-line "Booth / Location" → single-line "Booth". User-visible "Save"/"Saved" UI strings flipped to "Flag"/"Flagged" terminology (5 hits across 4 files); internal naming intentionally unchanged. Pill component deleted from `/find/[id]`. Home feed timestamp italicized. Same-session design-record commit rule 4th firing.
- **Session 68** (2026-04-26) — Cross-tab mall filter persistence shipped end-to-end on prod across Home / Booths / Find Map. Three runtime/docs commits + close (`991ac5f` design-to-Ready / `0af526b` implementation / `7357b9f` iPhone-QA polish). 10 frozen decisions (D1–D10) at [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md). New [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) primitive (eyebrow + tappable bold name + chevron + optional geo line) + [`lib/useSavedMallId.ts`](lib/useSavedMallId.ts) hook (mount-time read; App Router unmount/remount IS the cross-tab sync) + `<MallSheet>` `countUnit` prop. Shared localStorage key `treehouse_saved_mall_id` (zero migration). iPhone QA verdict: "Such a huge improvement on the experience." Same-session design-record commit rule firing for the THIRD time = fully durable institutional practice (origin 56 → 67 → 68). New `feedback_state_controls_above_hero_chrome.md` memory.
---

## CURRENT ISSUE
> Last updated: 2026-04-27 (session 73 close — R3 closed end-to-end: write-side instrumentation gaps + read-side stale-data mystery, both root-fixed; Q-014 Metabase queued; eight commits on prod; feed content seeding still pending — now 16× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (eight commits, single-track R3 closure):** Both halves of R3 closed in one stretch. **Write side (R3 v1.1)**: 5 new event types shipped via migration 012 (`booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped`) + `filter_applied` gains `page` field on Home/Booths/Find Map for per-tab attribution. Closes 4 deferred carries (sessions 59 + 62 + 67 + 68). Decisions D1–D4 frozen in design record §Amendment v1.1. **Read side (R3 v1.2)**: parked-since-session-58 stale-data mystery resolved at root. Session-60 stuck-instance theory was wrong — real cause was Next.js's HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. `force-dynamic` only disables route-response caching; doesn't propagate `cache: "no-store"` to fetches inside the route. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper) benefits every admin route + every `recordEvent` call. Diagnosed in one session via side-by-side probe pattern: built [`/api/admin/events-raw`](app/api/admin/events-raw/route.ts) (bare fetch + cache:no-store, parked since session 60) + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading. **Strategic conversation surfaced**: David flagged the in-app admin tab is wrong shape for analytics long-term → Q-014 queued (Metabase + read-only Postgres role + 3 starter dashboards + retire admin tab post-Metabase). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until Q-014 lands. Polish: chip wiring for v1.1 types (Bookmarks primary; Find shares + Tag flow overflow). ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches). **`feedback_ask_which_state_first.md` applied as default opening for D1–D4 payload-shape decisions.** Same-session design-record-commit rule fired again (v1.1 in `6c82b2d`; v1.2 retro-writeup in `68da382`). **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is now fully unblocked as an analytics surface — but per Q-014, the durable home for analytics is Metabase, not the admin tab.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60–72, **73**. **Top priority** — the actual V1 unblocker, now **16× bumped**. Session 73 closed R3 end-to-end (write side + read side both root-fixed) — orthogonal to seeding but increases the value of seeding because every event captured during the walk now lands cleanly + visibly on the admin Events tab in real time. **Sixteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-standardization + admin-chrome rationalization + R3-closure**; zero new reasons not to seed content. **NEW judgment moments to fold into the seeding walk:** (a) does the admin Events tab stream read intelligibly when 50+ events from a seeding session land in one cluster, (b) do the diag strip values stay green/in-sync under real seeding traffic (read-mystery regression check), (c) does the Bookmarks filter chip surface real adoption signal, (d) does the tag-extraction event payload (`{has_price, has_title}`) accurately reflect handwritten-tag legibility on real vendor content, (e) carry-forward judgment moments from session 72 (Admin BottomNav tab readability vs My Booth, empty masthead right slot intentionality, manage-without-eyebrow legibility), and the unchanged carries from sessions 70/71 (cartographic card with real mall data, count-in-eyebrow at real counts, find-tile bottom-out, photo cropping, Variant B lockup, sectioned-list `/flagged`, masthead wordmark, scroll-flatten regression, IM Fell tile titles, mall-subtitle weak separator).

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with italic timestamps + lens, find-detail with lightbox + lens + new collapsed cartographic card + italic "Find this item at" eyebrow, my-shelf with new caption min-height + flattened-scroll, public shelf, editorial vendor CTA at feed bottom, **Booths page with new Variant B lockup + count-in-eyebrow + caption min-height**, booth detail with single-line "Booth" post-it + caption min-height + masthead bookmark, **AND the new sectioned-list /flagged with Variant B card headers + count-in-eyebrow + caption min-height**, **AND the cross-tab mall picker**, **AND the admin Events tab — verify diag strip stays green during seeding + new chips (Bookmarks/Find shares/Tag flow) populate as you bookmark/share/scan**). Watch Sentry dashboard during the walk. **Image-height check:** do find tiles bottom-out cleanly with real photos + real caption variance? If portrait-vs-square cropping perception still feels off, ship B + A from the parked mockup. **Photo cropping check:** subject scale on portrait phone photos vs square sourced photos — judge against real content.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. 60–90 min initial session: provision read-only Postgres role + Metabase Cloud or self-hosted on Fly hobby + build 3 starter dashboards (vendor adoption, find engagement, tag-flow funnel). Becomes more valuable AFTER feed seeding lands (real data to chart) — but if investor touchpoint is imminent, Q-014 first then seeding produces visible-charts-immediately. Retirement of admin Events tab is a follow-up session post-Metabase, not Q-014 itself. Size M (~1 session).
2. **Item 6 — shareable filtered-mall link** (David flagged session 71) — for malls to share a direct URL to their mall view. Likely path: deep-link to a primary tab (Home / Booths / Find Map) with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Size M (~1 session); needs design + URL-param scoping + mockup pass per `mockup-first` rule.
3. **Item 3 — animation consistency review** (David flagged session 71) — Find Map animates the location up; Booths doesn't animate at all. Multi-surface survey across primary tabs + scope headers + tile entry animations + sheet open/close. Size M (~1 session); needs survey pass first via Explore agent.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 74 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 73 closed R3 end-to-end: write side (5 new event types + filter_applied page field) + read side (Next.js data-cache fix in lib/adminAuth.ts via global.fetch wrapper). Admin Events tab now reads live data + has diag strip showing in-sync delta on every fetch. Q-014 (Metabase analytics surface + retire admin tab) queued as strategic follow-up. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Keep the admin Events tab open during the walk to watch v1.1 events populate in real time (Bookmarks chip → booth_bookmarked/unbookmarked, Find shares → find_shared, Tag flow → tag_extracted/tag_skipped, Saves → post_saved, plus filter_applied with page=/ on Home or page=/shelves on Booths). Watch the diag strip — green in-sync delta on every chip is the read-mystery regression check. Run a partial T4d walk on the seeded surfaces. JUDGMENT MOMENTS: (a) does the admin Events tab stream read intelligibly when 50+ events from one session land in a cluster; (b) does the diag strip stay green under seeding traffic; (c) does the Bookmarks filter chip surface real adoption signal; (d) tag-extraction event payload (has_price, has_title) accurate against handwritten tags; (e) carry-forward from session 72 (Admin BottomNav vs My Booth, empty masthead right slot, manage-without-eyebrow); (f) carry-forward from session 71 (cartographic card with real mall data, count-in-eyebrow real counts, find-tile bottom-out, portrait/square cropping); (g) carry-forward from session 70 (Variant B lockup, sectioned-list /flagged, masthead wordmark, scroll-flatten, /post/preview title); (h) IM Fell 14px tile-title against real photos (session-69 D4b reversal); (i) all-malls scope mall-subtitle weak-separator. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Q-014 (Metabase) becomes more valuable AFTER seeding (real data to chart); if an investor touchpoint is imminent, consider running Q-014 BEFORE seeding so dashboards populate live during the walk. Note: /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Item 3 (animation consistency review) + Item 6 (shareable filtered-mall link) parked for own sessions. Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked. R3 diag strip + raw probe stay as durable visibility tooling until admin tab retires post-Q-014.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. `force-dynamic` on the route disables route-response caching but doesn't propagate `cache: "no-store"` to inner fetches. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper) closes the parked-since-session-58 mystery without a Supabase support ticket. Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred to whenever admin tab retires post-Q-014 OR a touch-pass that hits that file naturally.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event fires on intent-capture (taps the share affordance, not on share-sheet completion) with `{post_id, share_method: "native" | "clipboard"}` payload. Native share() Promise rejects on dismiss with no reliable way to distinguish dismiss from error, so intent-capture is the most truthful signal.
- **Feed content seeding** — rolled forward from sessions 55–71, **72, 73**. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session, now **16× bumped**. Sessions 61–72 each strengthened the case; session 73 closed R3 end-to-end (write side + read side both root-fixed). Real content remains the actual unblocker — every closed gap has been infrastructure, observability, or polish; none has been "we lack content." Sessions 67 + 68 + 69 closed cross-mall navigation + cross-tab anchoring + terminology + caption-typography gaps. Sessions 70 + 71 closed cartographic-redesign + masthead-lock + booth-lockup + caption-stabilization. Session 72 closed admin-chrome rationalization. Session 73 closed R3 analytics. Seeded content will showcase a genuinely better experience end-to-end with reliable analytics capture from the first real shopper interaction.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 19+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**. Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md` — could become TR on second firing), session 65 (`feedback_verify_third_party_software_exists.md` — could become TR on second firing + "platform-managed env > manual paste" candidate), session 68 (`feedback_state_controls_above_hero_chrome.md` — could become TR on second firing), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — arguably second-firing in session 71). Session 70 surfaced two single-firings ("smallest→largest commit sequencing" + "italic-ascender 1px lift"). Session 71 surfaced two ("verify sub-agent claims that contradict known semantic rules" + "ask for a screenshot before scoping multi-change visual fixes"). **Session 73 surfaced one NEW candidate:** **TR-q** — "`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches on Next.js + Vercel" — first firing (the R3 stale-data mystery's actual root cause). Compounds with TR-l (Vercel-runtime PostgREST quirks); both rules are about subtle local-vs-Vercel deviations identical-looking code reveals only under specific conditions. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. Two events shipped (`tag_extracted` with `{has_price, has_title}` flags + `tag_skipped` with `{}`) over the originally-listed three sub-types. Splits along user action (tried-to-scan vs skipped); outcome detail belongs in the payload.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` shipped on both `app/shelves/page.tsx` `handleToggleBookmark` and `app/shelf/[slug]/page.tsx` `handleToggleBoothBookmark` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — production admin tiles already render Pencil + Trash bubbles in the top-right, and adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else. Documented in commit `fe6c33f` summary + the design record. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses public booth detail like everyone else for personal bookmarks).
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` now fires on all three primary tabs (`/`, `/shelves`, `/flagged`) with `page` field added to the payload for per-tab attribution via `payload->>'page'`. Home callsite backfilled in same commit (`6c82b2d`).
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70** via Record 2 (`d6b5a75`). Mall block now in parallel inkWash card matching the booth card. **Session 71 went further** — collapsed both cards into ONE single inkWash card with italic "Find this item at" eyebrow above; cartographic spine fully retired (`30c2c0c`).
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via cartographic collapse (`54fa370`). Link from `/find/[id]` retired; `/mall/[slug]` now reachable only from `/vendor/[slug]`.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight: 76` on FindTile/WindowTile/ShelfTile + `minHeight: 56` on ShelfCard rail (`704ff7a`). David: "issue resolved." B+A (slot ratio flip + object-position: top) parked in mockup if real-content seeding reveals residual photo-cropping issues.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — was sized for two-line "Booth / Location" eyebrow; now eyebrow is single-line "Booth" per session-69 D10. Post-it may look slightly tall against the collapsed eyebrow. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos in the mockup; real vendor content during the seeding walk is the actual judgment moment. Per-callsite revert if cramped without disturbing the Booths anchor. Hot path: `WindowTile` + `ShelfTile` in [`components/BoothPage.tsx`](components/BoothPage.tsx) + `ShelfCard` in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx).
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid` (#4a3520) for prices in unified card treatment; implementation kept `v1.priceInk` (#6a4a30) since that's the established semantic token across the existing surfaces. Skip unless flagged.
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70** via Record 1 (`198560f`). Tokens removed from `lib/tokens.ts` after the last call site (BoothPill on `/flagged`) was retired.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (NEW session 70) — David's iPhone QA: booths from different malls read as one sequence without close attention to the filter eyebrow. Captured in Record 1 design record as known-limitation + future-iteration carry-forward. Likely fix when revisited: mall-grouped section breaks with small all-caps mall eyebrow before the booth list resumes.
- **Booth-page scroll flatten (D17) regression watch** (NEW session 70) — highest-risk decision in Record 3. Watch on iPhone QA: BoothHero parallax behaviors, mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`, any "scroll to top" behaviors that previously observed the inner scroll container directly. Cheap fix if anything regresses: revert the flatten on a per-page basis with a `scrollContainerRef` reintroduction.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (NEW session 70) — title + subhead moved from inside sticky chrome to content block below per D18. Page may lose the "reviewing" feel against vendors stepping through Add Find. If David flags it: (a) restore stacked title inside masthead (custom sticky again), (b) bring title into a sticky band BELOW masthead, (c) keep as-is.
- **Booths grid lockup numeral size deviates from spec** (NEW session 70) — design record specified 26px IM Fell numeral; Booths grid implements at 20px to preserve existing 14px vendor name + bio + photo proportions on a ~170px-wide tile. Design-record L3 amended to capture this. If real photos surface a problem, can either bump Booths grid to 18/26 (changes tile heights) OR scale other surfaces down (weakens the right-side numeral anchor).
- **Item 3 — animation consistency review across pages** (NEW session 71) — David flagged: Find Map animates location up; Booths doesn't animate at all. Multi-surface survey needed across primary tabs + scope headers + tile entry animations + sheet open/close. Probably its own session; needs Explore-agent inventory pass first.
- **Item 5 follow-up: B + A parked** (NEW session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) carries D1+D2 ready to ship as second pass.
- **Item 6 — shareable filtered-mall link** (NEW session 71) — David flagged: malls need a way to share a direct URL to their mall view. Likely path: deep-link to a primary tab with mall pre-selected via URL param, persistent via existing `treehouse_saved_mall_id` (session 68 infra). Avoids `/mall/[slug]` since that page is still v0.2 dark and deferred. Needs product + URL-param scoping + share UX + mockup pass; size M (~1 session).
- **Sub-agent claim verification gap** (NEW session 71) — Explore agent's image-rendering inventory contained a fabricated "letterboxing" claim contradicting how `objectFit: cover` works. Caught by my own verification grep. Single firing — Tech Rule candidate on second firing. Reminder: when a sub-agent's claim contradicts a known semantic rule of the underlying system (CSS, JS, framework), verify directly before trusting the claim.
- **Screenshot-before-scoping discipline for visual fixes** (NEW session 71) — Item 5 was scoped to E+B+A bundle pre-screenshot. The screenshot revealed E alone resolved the visible problem. Single firing — Tech Rule candidate on second firing. Reminder: ask for a screenshot before scoping a multi-change visual fix; the user's mental model of the cause may differ from the actual mechanism.
- **Multi-affordance retirement → single-surface promotion** (NEW session 72) — three admin-entry affordances (`/shelves` masthead pill + per-tile Manage eyebrow + the implicit "no admin tab" of My Booth as the 4th slot) collapsed into ONE durable surface (BottomNav Admin tab). Echoes session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (NEW session 72) — session 67 placed the Admin pill there as the entry; session 72 retired it in favor of the BottomNav tab. The right slot is now empty for everyone, including admins. If iPhone QA flags this as accidentally bare, consider populating it with something (per-tab utility action, account glyph, etc.) — but resist the temptation to "fill it because it's empty"; empty-on-purpose is also a valid state.
- **NEW: Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. 60–90 min initial session: provision read-only Postgres role + Metabase Cloud (free tier first attempt) or self-hosted on Fly hobby + build 3 starter dashboards (vendor adoption, find engagement, tag-flow funnel). Becomes more valuable AFTER feed seeding lands. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014 with full session opener pre-filled. Retirement of admin tab code + diag strip + raw probe is a follow-up session post-Metabase, not Q-014 itself.
- **NEW: Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — David: *"keep them in for now as a visibility layer and sanity check."* Both retire automatically when Q-014 lands and admin tab retires. No separate cleanup task.
- **NEW: Other supabase-js call sites might have the same latent bug** (session 73) — anywhere in the codebase that calls `createClient` without the `global.fetch` wrapper from session 73's fix is potentially reading stale data via Next.js's data cache. Audit candidates: `lib/auth.ts` (browser client — different cache layer, unaffected), any inline `createClient` calls outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent — `getServiceClient()` is the dominant pattern across server-side admin routes + `recordEvent`, and those all benefit from the fix.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–72 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54-55 + future), strip verbose diag logs from `/api/admin/events/route.ts` (resolved-but-duplicative now that diag strip + raw probe took over the visibility role), audit other `createClient` callsites for the same Next.js fetch-cache pattern. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs in three runtime commits; session 72 was a small surgical session rationalizing admin entry. **Session 73 closed R3 end-to-end in a single-track session — eight commits resolving both halves of the analytics arc**: write-side (5 new event types via migration 012 closing 4 deferred carries — `booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped` + `filter_applied` `page` field on Home/Booths/Find Map for per-tab attribution) AND read-side (parked-since-session-58 admin Events stale-data mystery resolved at root: Next.js HTTP-level data cache was intercepting `@supabase/supabase-js` fetches; `force-dynamic` only disables route-response caching, doesn't propagate `cache: "no-store"` to inner fetches; two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) via `global.fetch` wrapper benefits every admin route + every `recordEvent` call). Diagnosed in one session via side-by-side probe pattern (built `/api/admin/events-raw` parked since session 60 + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading, 78-min stale snapshot vs fresh raw). Strategic conversation surfaced **Q-014 — Metabase analytics surface + retire admin Events tab** as the durable home for analytics; diag strip + raw probe stay as visibility tooling until Q-014 lands. ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches). Feed content seeding still pending, now **16× bumped** — sixteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure. **Next natural investor-update trigger point** is now after feed content seeding lands — the update would report R4c + **R3 (write side fully wired + read side root-fixed)** + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter + terminology consistency + caption unification + cartographic redesign + masthead lock + Variant B booth lockup + cartographic collapse + count-in-eyebrow typography + caption stabilization + admin nav rationalization + R3 v1.1+v1.2 closure as sixteen shipped capability items, with Q-014 (Metabase) as the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."
