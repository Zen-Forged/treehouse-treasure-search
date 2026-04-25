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

## ✅ Session 61 (2026-04-25) — Six-commit UX polish pass: admin image delete, photo lightbox + pinch-zoom, feed relative timestamps, heart→flag save glyph, back-button standardization

Single-track session, six commits, all 🟢 QA-passed on iPhone. **Six discrete UX improvements landed end-to-end** — the original session intent (feed content seeding, recommended by session 60) was redirected by David at the standup to a polish backlog he'd accumulated. Mockup-first design rule fired twice (timestamp placement, save glyph), both times with same-session iteration.

1. **Admin hero image delete** (commit `9a26485`) — `/api/admin/featured-image` gained a `DELETE` handler that clears the `site_settings` row and best-effort removes the orphaned storage object from the `site-assets` bucket. `FeaturedBannerEditor` gained a red "Remove image" button visible only when an image is set, with `window.confirm` gate.

2. **Find Detail photo lightbox** (commit `e694adc`) — new [`components/PhotoLightbox.tsx`](components/PhotoLightbox.tsx) (~230 lines, no new deps). Tap photo → full-screen overlay with pinch-zoom 1×–4×, snap-back below 1.05×, double-tap toggles 1× ↔ 2.5×, single-finger pan when zoomed, X close + ESC + body-scroll-lock. Touch listeners attached non-passive via `addEventListener` on a ref'd div so `preventDefault()` blocks iOS Safari's native page-zoom from hijacking the gesture.

3. **Feed relative timestamps** (commit `b565221`) — mockup-first per Design Agent rule. Six variants compared in [`docs/mockups/feed-timestamp-v1.html`](docs/mockups/feed-timestamp-v1.html); David picked Variant D (below tile, terse, just text). New `formatTimeAgo()` in [`lib/utils.ts`](lib/utils.ts) uses calendar-day boundaries — an 11:59pm post viewed at 12:01am next day reads "Yesterday," not "Today." Output: Today / Yesterday / Nd ago / Nw ago / Nmo ago / Ny ago.

4. **Three feed adjustments** (commit `f73c6e3`) — after first on-device review: timestamp left-aligned (was right), save bubble bumped 30→36 / glyph 14→17 for tappability, heart → pushpin (Lucide `Pin`). The cartographic register (pin / X / post-it) extended to the save affordance.

5. **Pushpin → Flag glyph** (commit `4a99512`) — second on-device review surfaced the pushpin felt off; David asked for the rectangular-flag-on-pole option from the same mockup arc. Mockup [`docs/mockups/save-glyph-v1.html`](docs/mockups/save-glyph-v1.html) compared 5 candidates (triangular flag, rectangular flag, bookmark ribbon, drop pin, pushpin); David picked Variant B. New [`components/FlagGlyph.tsx`](components/FlagGlyph.tsx) is a Lucide-shaped drop-in (`size` + `strokeWidth` + `style` props). Two SVG elements (line for pole + closed path for flag) so saved-state fill renders cleanly. Swapped at all 4 save callsites: feed tile, Find Detail photo, Find Map saved badge, BottomNav Find Map tab. The `/shelf/[slug]` 404 NotFound icon stayed a heart — semantically unrelated to "save."

6. **Find Map flag size + back-button standardization** (commit `8211a31`) — Find Map (`/flagged`) save bubble bumped to match feed exactly (30→36, 14→17, 6→8). Ecosystem back buttons standardized at the polished 38px bubble + 18px arrow + strokeWidth 1.6 spec already in use on `/find/[id]`, `/flagged`, `/shelf/[slug]`. Touched: `/mall/[slug]`, `/vendor/[slug]` (34→38 bubble, 14→18 arrow), `/login`, `/vendor-request`, `/admin/login`, `/post/edit/[id]` (15→18 arrow). Reseller Intel sub-app pages (`/decide`, `/discover`, etc.) intentionally left at their existing scale.

**Commits this session (6 runtime + 1 close):**

| Commit | Message |
|---|---|
| `9a26485` | feat(admin): add Remove image to Featured Banners |
| `e694adc` | feat(find): tap photo to open full-screen lightbox with pinch-zoom |
| `b565221` | feat(feed): add relative timestamp below each masonry tile |
| `f73c6e3` | feat(feed): timestamp left-align, larger save bubble, heart -> pushpin |
| `4a99512` | feat(save): swap pushpin -> flag-on-pole save glyph |
| `8211a31` | feat(ui): bigger Find Map flag + standardize ecosystem back buttons |
| (session close) | docs: session 61 close — six-commit UX polish pass |

**What's broken (carry to session 62):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged from session 60. Still well-characterized but root-cause-unknown. Cheapest probe (`/api/admin/events-raw` via bare `fetch()` bypassing `@supabase/supabase-js`) parked until symptom freshly reproduces. Verbose diag logs still in `/api/admin/events/route.ts`.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried from sessions 59, 60, 61. Untouched.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — the original session 60 → 61 hand-off recommendation. Got bumped by the polish pass; remains the V1 unblocker.

**Memory updates:** None new. Existing memories carried the session — `user_code_context` (David's automation preference) reflected in his terse multi-decision answers ("1. Below image 2. terse 3. just text"); the mockup-first Design Agent rule already documents the cheap-iteration pattern that let Variant E → Variant B revision happen with one extra commit.

**Live discoveries:**

- **`<Heart>` lives in 5 places** in the codebase, but the 5th instance — `/shelf/[slug]/page.tsx:227` 404 NotFound decoration — is semantically unrelated to "save." Documented in the swap commit message; flag for future visual-vocabulary cleanup if full consistency is desired.
- **Lucide-shaped icon API as a custom SVG component** — `FlagGlyph` (and any future custom glyph) can mirror Lucide's `size` + `strokeWidth` + `style` props via `stroke="currentColor"` on the outer `<svg>` so callsites' inline `style.color` resolves the stroke. Drop-in compatible with the existing icon-swap pattern. Pattern is reusable for any future custom glyph that wants to coexist with Lucide imports.
- **strokeWidth=0 saved-state trick breaks for multi-element glyphs.** The heart/pushpin pattern of `strokeWidth={isSaved ? 0 : 1.7}` worked because a single closed path's outline becomes invisible when stroke is 0, leaving only the fill. With multi-element glyphs (FlagGlyph's `<line>` + `<path>`), the line element vanishes entirely with strokeWidth=0 and you lose the pole. New rule: keep strokeWidth always >0 for multi-element glyphs and differentiate saved/unsaved via color + fill only. Tech Rule candidate added to queue (TR-n, fire count 1).
- **Pre-existing back-button size drift across 8+ ecosystem pages** — sizes ranged 14, 15, 17, 18 with strokeWidth values of none, 1.6, 2. The polished pages (`/find/[id]`, `/flagged`, `/shelf/[slug]`) already used the canonical 38/18/1.6 spec; this session brought 6 more pages into compliance. Reseller Intel pages stayed on their separate scale (intentional drift, separate visual system).
- **Calendar-day vs. 24-hour-rolling timestamps** — for "Today/Yesterday" labels, calendar-day comparison is the right model. An 11:59pm post viewed at 12:01am the next day should read "Yesterday." `formatTimeAgo()` uses local-midnight `Date()` math, not millisecond rolling.

**Operational follow-ups:** No new entries. All session-60 carryovers (R3 raw-PostgREST probe, `find_shared` instrumentation gap, verbose diag log strip-time) remain parked.

**Tech Rule candidates:** Existing TR-l + TR-m still 🟢 promotion-ready (unchanged from session 60). New TR-n candidate (multi-element glyph strokeWidth-0 trap) at fire count 1 — low priority, narrow lesson.

**Notable design artifacts shipped this session** (mockup library):
- [`docs/mockups/feed-timestamp-v1.html`](docs/mockups/feed-timestamp-v1.html) — six-variant timestamp placement comparison
- [`docs/mockups/save-glyph-v1.html`](docs/mockups/save-glyph-v1.html) — five-variant save glyph comparison
- [`components/PhotoLightbox.tsx`](components/PhotoLightbox.tsx) — first hand-rolled pinch-zoom in the codebase, reusable if future surfaces need full-screen image viewers
- [`components/FlagGlyph.tsx`](components/FlagGlyph.tsx) — first Lucide-shaped custom SVG glyph component; pattern reusable for any future cartographic-vocabulary additions

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–55 moved to archive during the session-59 doc refactor and this close.

- **Session 60** (2026-04-25) — R3 stuck-Fluid-Compute-instance theory disproved (fresh deploy `d3f2d6b` immediately served the same 25-min-stale snapshot). Confirmed Vercel + local share identical Supabase URL + service-role key + length, but admin Events route still returns stale rows where local script via the same key sees fresh ones. Cheap diagnostics exhausted; mystery parked. TR-l promoted 🟡 → 🟢 promotion-ready.
- **Session 59** (2026-04-25) — Two-track. (1) Doc architecture refactor — CLAUDE.md cut 41,739 → 21,652 chars (-48% per auto-load), new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template. (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom. On-device Refresh-button verification deferred to session 60.
- **Session 58** (2026-04-25) — R3 (Analytics event capture) design-to-Ready + implementation in one session. Events table on prod via migration 010, anon SELECT revoked via migration 011, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters. Visibility tooling (debug toast + diagnostic script + verbose logs) shipped as institutional QA infrastructure. Commits `ba888b3` → `f1e1fd5` (7 commits + close). Two display-layer bugs deferred to session 59.
- **Session 57** (2026-04-24) — R4c shipped end-to-end on prod (commit `ff87047`, on-device QA PASSED 4/4), first-ever Tech Rule promotion batch (3 rules into MASTER_PROMPT.md, commit `6f77065`), Q-002 picker revision (commit `080689a`), `.eslintrc.json` to green the long-red Lint job (commit `d73323f`). CI green across all 3 jobs for the first time. R4c graduated 🟢 → ✅ — first roadmap item shipped end-to-end.
- **Session 56** (2026-04-24) — R4c design-to-Ready, one commit `daca2a5`. Zero runtime code. Shipped [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) (all 6 decisions D1–D6 frozen), mockup [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html), roadmap entry rewritten; R4c graduated 🟡 → 🟢, first roadmap item to do so.

---


## CURRENT ISSUE
> Last updated: 2026-04-25 (session 61 close — six-commit UX polish pass shipped end-to-end on QA; feed content seeding still pending)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from session 61 (David redirected at the standup to a polish backlog he'd accumulated). Now bumped from sessions 55, 60, 61. **Top priority** — the actual V1 unblocker. With session 61's UX work landed, the feed itself now reads cleanly (timestamps, save flag, image lightbox), so seeded content will showcase well.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + titles + reasonable prices. Could be from David's existing booth content or test SKUs.
- 🟢 AUTO — Walk the Add Find sheet for each, confirm appearance in feed + on the right shelf.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render, find-detail with the new lightbox, my-shelf, public shelf).
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster (Sentry breadcrumbs vs. cobbled-together log substring searches).
3. **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 62 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Walk the Add Find sheet on iPhone, source photos + titles + prices, verify each lands on the right shelf and renders cleanly in the feed. The session-61 UX polish (timestamps below tile, larger flag-on-pole save glyph, photo lightbox with pinch-zoom on Find Detail, standardized back buttons) means the seeded content will showcase the now-polished surface area. Run a partial T4d walk on the seeded surfaces. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery from session 60 still parked — root cause unknown after exhausting cheap diagnostics. Pick R3 back up only if symptom freshly reproduces; cheapest next probe is `/api/admin/events-raw` via bare fetch() to bypass supabase-js (~10 min including deploy). Verbose diag logs in `/api/admin/events/route.ts` stay in place until R3 closes.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60 + 61. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–61. 10–15 real posts across 2–3 vendors. **Now top-of-stack** as recommended next session. Session 61 UX polish (timestamps, flag glyph, photo lightbox, back-button consistency) means seeded content will showcase the freshly-polished feed + find-detail surfaces.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 14 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). New TR-n candidate added session 61 (multi-element-glyph strokeWidth=0 trap; fire count 1, low priority). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring** — absorbed into [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) as R12 (Horizon 1).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; **session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization. Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within the session. Working tree green, all six changes 🟢 QA-passed on iPhone.** Next natural investor-update trigger point remains after feed content seeding + R3 stabilizes — the update would then report two roadmap items fully shipped (R4c + R3) plus the session-61 polish pass that made the feed + find-detail surfaces ready to show seeded content.
