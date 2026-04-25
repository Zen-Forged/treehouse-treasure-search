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

## 🟡 Session 59 (2026-04-25) — Doc architecture refactor + R3 finishing pass (partial); admin Events stale-state unresolved

Two-track session. **Track 1 (doc refactor) shipped clean:** David outlined three levers to collapse CLAUDE.md churn during session close; all three implemented plus two secondary wins. CLAUDE.md cut from 41,739 → 21,652 chars (-48% per auto-load, compounds across every turn via prompt cache). **Track 2 (R3 finishing pass) did not reach resolution:** multiple diag commits + three independent reproductions (direct REST, direct supabase-js, inline route logging) confirmed DB integrity and route behavior, but David at session close still reported admin Events page not reflecting Vercel log activity. Last admin/events GET from his session was 31s before his final share landed — a stale-client-state hypothesis not yet verified on-device.

**Commits this session (2 runtime + 1 close):**

| Commit | Message |
|---|---|
| `74905f7` | chore(r3): log /api/admin/events hits before requireAdmin |
| `6359a78` | chore(r3): emit deeper diag snapshot from /api/admin/events (keyPrefix/keyLen/urlPrefix/first+lastOccurred/sanity-count) |
| (session close) | docs: session 59 close — doc refactor shipped, R3 stale-state unresolved |

**Doc refactor shipped (Track 1):**

- New register [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md): 14 candidates in one table with firing counts + promotion status. Future firings = one-row edit, not CLAUDE.md paragraph rewrite.
- [`docs/queued-sessions.md`](docs/queued-sessions.md) gained §Operational backlog (12 items moved out of CLAUDE.md) + §Recurring next-session alternatives (3 always-Ready items kept inline in CLAUDE.md, rest live here).
- [`docs/session-archive.md`](docs/session-archive.md) absorbed sessions 44–52 tombstone block (and session 53 at this close).
- CLAUDE.md: session-58 block shrunk ~63% via tightened template; two tombstone sections consolidated to "last 5"; CURRENT ISSUE no longer duplicates the session block; Tech Rule paragraph (was ~1000 chars with 14 lettered sub-entries) collapsed to one-liner pointer; DOCUMENT MAP gained the queue doc.
- Template for future session-N blocks: outcome sentence → commits table → what's broken → memory → live discoveries → follow-ups → tech-rule candidates. Cuts 30–40% per block vs. prior verbose prose.

**What's broken (carry to session 60):**

- 🟡 **Admin Events page stale-state unverified.** At session close David reported Shares filter still showed 4 rows (latest 21:57:48 EDT) after the new 5th share recorded at 23:18:53 EDT. BUT: last `/api/admin/events` GET from David's session was 23:18:22 EDT — 31 seconds BEFORE the new share completed. The page doesn't auto-refresh; only re-fetches on tab-switch, filter-change, or explicit Refresh-button tap. **Session 60 first step: verify on-device that tapping the Refresh button actually fires a new GET.** If Refresh triggers a 200 response containing the 23:18:53 share, the "bug" was stale client state. If Refresh doesn't fire a GET, client handler is broken. If Refresh fires but response still lacks the new row, it's a real server/cache bug.
- 🟡 **Earlier "All filter rows=2 of 225" on prod APPEARS resolved by fresh deploys** (post-03:00 UTC GETs log `rows=50` correctly; three direct reproductions at local all returned 50 rows). Root cause never isolated — suspected stale Fluid Compute instance holding a scoped client connection, but not confirmed. May recur; if so, `scripts/test-route-query.ts` is positioned as the first-look diagnostic.
- 🟡 **`filter_applied` count = 0 in DB.** Not investigated this session. Separate ~5-min HITL.

**New instrumentation gap surfaced:** `/find/[id]` share icon on the image uses `navigator.share()` → iOS native share sheet (AirDrop/iMessage/Mail). It **never hits any server endpoint** and is **not captured as any event type.** During prod QA tonight this caused "dozens of shares I just did aren't showing up" → actually those went through iOS, not our pipeline. Fix options: (a) add `track("find_shared", {post_id})` at intent-capture time before the `navigator.share()` call, (b) accept the gap and document it in the R3 design record. Either way decide in session 60.

**Memory updates:** None new. The doc refactor itself is the institutional artifact this session. Existing `feedback_visibility_tools_first.md` fired again — worth noting as its 2nd empirical validation.

**Live discoveries:**

- `vercel env pull` redacts "Encrypted" secrets as empty strings in the pulled file (`SUPABASE_SERVICE_ROLE_KEY=""` appearing empty despite being set). Misleading. Confirm existence via `vercel env ls`; confirm actual value via log-emitted prefixes at runtime.
- Vercel MCP runtime-log tool's table view shows only the FIRST console.log per request. Multi-line diag output requires substring-match queries to confirm variable presence (e.g., search for `keyPrefix` to confirm the diag line fired) rather than direct content inspection.
- `/find/[id]` vs `/my-shelf`/`/shelf/[slug]` use two completely different share mechanisms (iOS native vs `/api/share-booth` email). Non-obvious from the UI; caused ~30 min of wrong-diagnosis during tonight's QA.
- Vercel deployment cold-start reuses instance state in ways that can persist scoped client behavior across deploys. Three fresh `vercel --prod` deploys tonight appeared to clear whatever state was causing the earlier "rows=2 of 225" partial-read mystery. Neither root cause nor reproduction steps captured.

**Operational follow-ups:** R3 finishing pass continues — on-device Refresh-button verification is the cheapest next step. Then `filter_applied` verification. Then decide on `find_shared` instrumentation. Then cleanup: strip the verbose diag logs in `/api/admin/events/route.ts` once stable. All tracked in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.

**Tech Rule candidates:** TR-m (front-load visibility tooling) fired a 2nd time this session — promoted 🟡 → 🟢 **promotion-ready** in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md). TR-l (Vercel-runtime-vs-local) not reinforced this time (same key + URL confirmed via runtime log prefixes; the local-vs-Vercel gap this session was real but intermittent, not a reproducible `.eq()`-format quirk).

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 moved to archive during the session-59 doc refactor.

- **Session 58** (2026-04-25) — R3 (Analytics event capture) design-to-Ready + implementation in one session. Events table on prod via migration 010, anon SELECT revoked via migration 011, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters. Visibility tooling (debug toast + diagnostic script + verbose logs) shipped as institutional QA infrastructure. Commits `ba888b3` → `f1e1fd5` (7 commits + close). Two display-layer bugs deferred to session 59.
- **Session 57** (2026-04-24) — R4c shipped end-to-end on prod (commit `ff87047`, on-device QA PASSED 4/4), first-ever Tech Rule promotion batch (3 rules into MASTER_PROMPT.md, commit `6f77065`), Q-002 picker revision (commit `080689a`), `.eslintrc.json` to green the long-red Lint job (commit `d73323f`). CI green across all 3 jobs for the first time. R4c graduated 🟢 → ✅ — first roadmap item shipped end-to-end.
- **Session 56** (2026-04-24) — R4c design-to-Ready, one commit `daca2a5`. Zero runtime code. Shipped [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) (all 6 decisions D1–D6 frozen), mockup [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html), roadmap entry rewritten; R4c graduated 🟡 → 🟢, first roadmap item to do so.
- **Session 55** (2026-04-24) — Roadmap capture + prioritization, three commits `2b9712f` + `40206f9` + `8dca4cc`. Zero runtime code. Shipped [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) (15 items R1–R15, 8 clusters A–H, 3 shipping horizons). Absorbed 12 parked items from CLAUDE.md into roadmap cross-ref table.
- **Session 54** (2026-04-22) — Ladder B second half + staging environment end-to-end. Commits `d8a10f9` + `b7ed869`. Staging Supabase project provisioned + staging schema migration + seed script + env template. First session to ship infra (not just code).

---


## CURRENT ISSUE
> Last updated: 2026-04-25 (session 59 close — doc refactor shipped, R3 stale-state unresolved)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — R3 finishing pass continuation (~30–60 min HITL-heavy)

Session 59 ran extensive diag instrumentation but did not close out R3 because the immediate question — does tapping the Refresh button on the admin Events tab fire a fresh GET — was never confirmed on-device. That's the cheap-first step now.

**Shape:**
- 🖐️ HITL (≤2 min) — On iPhone admin Events tab, tap Refresh button at top-right of stream. Watch a Vercel log line appear in real-time (Claude can pull it via MCP runtime logs).
- 🟢 AUTO — Branch on outcome:
  - **Refresh fires GET + response includes the latest events** → bug was stale client state. Document and close R3. Strip verbose diag logs.
  - **Refresh doesn't fire any GET** → client handler broken. Investigate `app/admin/page.tsx` Refresh wiring at line 877 (`onRefresh={() => fetchEvents()}`).
  - **Refresh fires GET but response is incomplete** → real server-side bug. Diag logs in `/api/admin/events` will show keyPrefix/urlPrefix/firstOccurred — if these point to wrong project or wrong client state, that's the answer.
- 🟢 AUTO — Decide on `/find/[id]` `navigator.share()` instrumentation gap (session 59 surfaced): add `track("find_shared", {post_id})` at intent OR document the gap in the R3 design record.
- 🟢 AUTO — `filter_applied` count = 0 verification (single-test HITL, ~5 min).

### Alternative next moves (top 3)

1. **Feed content seeding** (~30–60 min) — 10–15 real posts across 2–3 vendors. Has been "next" since session 55. Once content lands, V1 beta invites unblocked.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Pairs naturally with R3.
3. **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 60 opener (pre-filled — R3 finishing pass continuation)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: R3 finishing pass continuation. Session 59 added deep diag logging to /api/admin/events (commits 74905f7 + 6359a78) but did not isolate the "admin Events page doesn't reflect new events" symptom. First step is the on-device Refresh-button verification: open admin Events tab on iPhone, tap Refresh, Claude pulls Vercel logs in real-time via MCP runtime-logs tool to see whether a new GET fires and what rows count it returns. The page only re-fetches on tab-switch, filter-change, or explicit Refresh — there's no auto-refresh. If Refresh works correctly, the session-59 perceived bug was stale client state and R3 closes. If Refresh is broken or returns incomplete data, dig into either app/admin/page.tsx fetchEvents or the route's runtime state. Also: surfaced session 59 — /find/[id] share icon uses navigator.share() (iOS native), never hits our server, never recorded as share_sent. Decide instrumentation strategy. Plus: filter_applied count still = 0 (single-test verification). Once R3 closes, strip the verbose console.logs from /api/admin/events/route.ts that were added in commits 74905f7 + 6359a78.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 finishing pass continuation** — admin Events page stale-state unresolved at session-59 close. On-device Refresh-button verification is the cheap first step. See "Recommended next session" above.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface. Decide whether to fire a `find_shared` event at intent-capture time or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–58. 10–15 real posts across 2–3 vendors.
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — 14 candidates queued; TR-m (visibility-tools-on-round-3) at 2nd firing post-session-59 → **promotion-ready**. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; **session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom — on-device Refresh-button verification deferred to session 60.** Next natural investor-update trigger point is after R3 stabilizes + feed content seeding lands — the update would then report two roadmap items fully shipped (R4c + R3) plus the doc-architecture overhead reduction.
