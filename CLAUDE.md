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
| Queued sessions (scoped work sequenced behind something else) | `docs/queued-sessions.md` |

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

## ✅ Session 48 (2026-04-23) — Featured banner RLS fix (Home + Find Map + /admin preview)

David reported: Home Featured Find banner not rendering; Find Map hero banner not rendering; `/admin` Banners tab preview blanks after a tab switch (uploads appeared successful in admin UI but didn't persist on remount).

**Root cause:** RLS got re-enabled on `public.site_settings` post-migration-004 (most likely a Supabase dashboard toggle — no later migration touches the table) with no anon-SELECT policy. [`004_site_settings.sql:39`](supabase/migrations/004_site_settings.sql:39) explicitly declared the table RLS-off, so this drift broke all three downstream consumers that use the anon `supabase` client via `getSiteSettingUrl()`:

- [`app/admin/page.tsx:1002`](app/admin/page.tsx:1002) — `loadCurrent()` in `FeaturedBannerEditor` returned null on remount → blank preview after tab switch
- [`app/page.tsx:638`](app/page.tsx:638) — Home Featured Find returned null → banner didn't load
- [`app/flagged/page.tsx:531`](app/flagged/page.tsx:531) — Find Map hero returned null → banner didn't load

Upload chain itself was healthy: files in `site-assets` bucket, rows in `site_settings` with valid public URLs, last write timestamps current. Failure was purely on the read side.

**Diagnostic:** new repo utility [`scripts/inspect-banners.ts`](scripts/inspect-banners.ts) — service-role vs. anon differential read on `site_settings`, plus bucket + per-key listing. Differential proof was definitive: svc returned 2 rows, anon returned `data: []`. Kept as a durable diagnostic alongside `scripts/qa-walk.ts`.

**Fix:** migration [`008_site_settings_rls_fix.sql`](supabase/migrations/008_site_settings_rls_fix.sql) — re-disables RLS to match 004's "intentionally OFF" intent AND adds a safety-net `anon, authenticated SELECT` policy so any future RLS re-toggle won't silently break the public banners again. Writes already go through service-role and bypass RLS, so unaffected.

🖐️ HITL: David pasted the migration SQL into the Supabase SQL editor. Re-run of `inspect-banners.ts` confirmed anon now returns both rows. On-device walk: Home + Find Map + `/admin` Banners tab all rendering cleanly with no tab-switch blanking.

Commit `17d2937` pushed to main. The actual prod fix was the dashboard SQL run — the commit records the migration file (so 008 runs automatically on any fresh Supabase rebuild) plus the diagnostic script.

**NEW Tech Rule candidate (one firing):** "When a migration declares `DISABLE ROW LEVEL SECURITY` on a table, also create a permissive `anon, authenticated SELECT` policy as a safety net. Supabase dashboard toggles can re-enable RLS without warning, and a no-op-while-disabled policy survives that toggle." Now the 8th candidate queued for promotion. Risk-surface check: `grep -rn "DISABLE ROW LEVEL SECURITY" supabase/migrations` shows `site_settings` is the only table declared RLS-off, so 008 closes this drift class entirely — no other tables need the same retrofit.

### Self-audit against Tech Rules

- `requireAdmin` first line — no new API routes added. ✓
- Service-role client used only in read-only diagnostic script. ✓
- No new ecosystem pages, no new framer-motion patterns, no schema changes (RLS toggle + policy only). ✓
- **Script-first over SQL-dump-first (session-46 candidate) — followed:** built `scripts/inspect-banners.ts` before pasting any SQL, used the differential proof to drive the diagnosis. **Second firing of this rule — promotion threshold reached.**

---


## CURRENT ISSUE
> Last updated: 2026-04-23 (session 48 close — featured banner RLS fix)

**Status:** `17d2937` on main. Featured banner rendering restored across Home, Find Map, and `/admin` Banners preview. Migration 008 captures the RLS fix as a durable migration. DB clean-slate persists; beta invites remain technically unblocked. Vercel CLI still not globally installed on David's machine — one-time fix is `sudo chown -R $(whoami) /usr/local/lib/node_modules && npm i -g vercel`; workaround is `npx vercel@latest --prod`.

### Recommended next session — feed content seeding (~30–60 min)

Unchanged from sessions 44–47. Session 48 was a fast surgical bug-fix that didn't dislodge it; it actually strengthened the prereqs because seeding wants the Home Featured Find banner rendering correctly when David reviews the populated feed.

Seeding scope:
- Create 2–3 real (non-test) vendors via `/shelves` Add-a-Booth (primary path, sessions 44–45). `/vendor-request` → `/admin` approve flow remains available for Flow 3 if desired — and now correctly populates the vendor's hero image from the proof photo (session-47 fix).
- Seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home."
- Photos should be real items, ideally spanning a few material categories (glass, ceramic, brass, wood) to make the feed feel varied on first scroll.
- Verify the feed, Find Map, and mall pages all render well with the new population.
- Light QA: ensure the session-27 `source: "claude" \| "mock"` field returns `"claude"` for all auto-caption calls. (Session 46 verified this via caption specificity — "Brass bald eagle figurine sculpture" and "Hand-carved wood figural sculpture" were both real Claude output. Seeded real finds should look similar.)

This session is likely to first trip session-43 Anthropic auto-reload (threshold $10 / reload $20). Expected and non-blocking. Session 46 made 2 caption API calls (Flow 2.4 + M.4 posts), each ~1¢ — basically noise against the balance.

**When a session seeds content during a shipment, add a one-liner to CLAUDE.md's CURRENT ISSUE so the next session doesn't trip on it** — session-46 audit rule candidate (the Ella Butler / booth 345 surprise). Not promoted as a Tech Rule yet, but the next seeding session should honor this.

### Alternative next sessions

- **Q-008** 🟢 (~90–120 min) — Open Window share to unauthenticated shoppers. Scope-expansion sibling to Q-009 (shipped session 45).
- **Q-011** 🟢 (~60–90 min) — Window email banner post-it missing/misplaced (email-rendering diagnostic).
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — now **eight** candidates queued (one ready for promotion):
  - sessions 33, 35, 36, 38 dependency-surface family
  - session-40 React 19 ref-forwarding (one firing)
  - session-45 Supabase nested-select explicit-columns (one firing)
  - session-46 script-first over SQL-dump-first in Claude Code — **second firing in session 48 (promotion-threshold reached)**, meta-workflow rule, may belong in `MASTER_PROMPT.md` rather than `DECISION_GATE.md`
  - **session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`** (one firing, NEW — pure tech rule, belongs in `DECISION_GATE.md`)
  - session-42 verify-remaining-count (still below two-firings-outside-same-context bar)
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 carry one-liner summaries but no archive detail. Session 45's block was folded into its tombstone at session-46 close; the block-as-paste-over option is no longer available for 45 specifically, so its archive entry needs to be written from the tombstone + git log. Session 46's detail is in this whiteboard block above and is paste-over-ready.
- **Design agent principle addition** (~10 min, docs only) — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. Would go in `MASTER_PROMPT.md`'s Design Agent section.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min) — session 46 observed that David's UI-driven delete of an `auth.users` row didn't stick. Not blocking, but worth investigating if it recurs.
- **Error monitoring** (Sentry or structured logs) — Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first.

### Session 49 opener (pre-filled for feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Working directory: /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding per CLAUDE.md recommendation. Scope: (1) create 2–3 real (non-test) vendors via /shelves Add-a-Booth (session 44+45 primary path) or /vendor-request → /admin approve flow (Flow 3 — now also populates hero_image_url from the proof photo, session 47 fix); (2) seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home"; (3) verify feed, Find Map, mall pages render well with new population — Home Featured Find + Find Map hero banner reads now work post-session-48 RLS fix; (4) light QA that session-27 `source: "claude"` field returns clean on all auto-caption calls (session-46 precedent: "Brass bald eagle figurine sculpture" quality bar). This session will likely first trip session-43 auto-reload (threshold $10 / reload $20); expected and non-blocking. ~30–60 min. Use `npx tsx scripts/qa-walk.ts baseline` at open if any pre-existing test debris suspected; `npx tsx scripts/inspect-banners.ts` if banner rendering is in question.
```

---

## Archived session summaries

> Sessions 34–45 kept as one-liner tombstones. Full detail in `docs/session-archive.md` (or in session-blocks that are queued for eventual archive-drift cleanup).

- **Session 34** (2026-04-20) — Multi-booth scoping. Option A chosen, mockup approved, Q-001 Path B backup captured. Superseded by session 35.
- **Session 35** (2026-04-20) — Multi-booth rework shipped end-to-end + KI-006 resolved. Six-step QA walk passed.
- **Session 36** (2026-04-20) — Q-003 BottomNav badge resolved across four surfaces + KI-007 edit-page redirect loop fixed.
- **Session 37** (2026-04-20) — Sprint 4 tail closed: T4c confirmed done, T4b `<AddBoothInline>` folded into `/admin`, T4b `/admin/login` locked as Keep Dedicated, T4d runbook written.
- **Session 38** (2026-04-21) — Window Sprint scoping, four-frame mockup + build spec, three queued implementation sessions.
- **Session 39** (2026-04-21) — Q-004 rename + Q-005 tagline + Q-007 Window Sprint backend shipped. TS downlevelIteration rule promoted.
- **Sessions 40–41** (2026-04-21) — Q-007 client shipped + Q-007 + T4d QA walks both PASSED. Beta invites technically unblocked.
- **Session 42** (2026-04-21) — DB test-data wipe. Admin identity confirmed never drifted.
- **Session 43** (2026-04-21) — Anthropic model audit + billing auto-reload at $10/$20. Session-27 rule fired cleanly for the first time since promotion.
- **Session 44** (2026-04-22) — `/shelves` Add-a-Booth restored via `<AddBoothInline>` primitive (partial T4b reversal). Hero-photo field added. Chrome mismatch flagged.
- **Session 45** (2026-04-22) — `/shelves` cross-mall fix + admin booth delete primitive + Q-009 admin Window share bypass + BoothHero URL-share airplane retired (two-airplane cleanup). Four shipments, three commits, all on-device walks passed. Session-45 Supabase nested-select explicit-columns Tech Rule candidate queued (one firing).
- **Session 46** (2026-04-22) — T4d pre-beta QA walk re-passed end-to-end (all five exit criteria clean) + `scripts/qa-walk.ts` QA utility shipped + `docs/pre-beta-qa-walk.md` hero-photo step drift patched + `/session-open` + `/session-close` slash commands added to standardize the Chat→Code workflow. First Claude Code session after 45 in Claude Chat.
- **Session 47** (2026-04-23) — Vendor onboarding hero image gap fixed: `proof_image_url` now transfers to `vendors.hero_image_url` on approval (3 edits + safe-claim path backfill in `app/api/admin/vendor-requests/route.ts`). My Shelf banner no longer blank after sign-in. Forward-only fix; no migration.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. No code-level regressions. Beta invites remain technically unblocked after session 48.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is clean-slate after session-46 post-walk cleanup. Natural pairing with beta invite prep. Session 44's `<AddBoothInline>` primitive + session 45's cross-mall fix + delete feature + claimed-vendor safety gate mean admin can now seed + iterate on booths directly from `/shelves` without touching Supabase. Session 46 re-confirmed the onboarding path end-to-end. Session 48 restored Home Featured Find + Find Map hero banner reads, so a populated feed will render with full chrome. *Recommended as session 49.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — eight candidates queued, one promotion-ready: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) session-45 Supabase nested-select explicit-columns (one firing), (g) **session-46 script-first over SQL-dump-first in Claude Code — second firing in session 48 (promotion-threshold reached)**, meta-workflow rule, may belong in `MASTER_PROMPT.md`, (h) **session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`** (one firing, NEW — pure tech rule, belongs in `DECISION_GATE.md`). Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–47 now also tombstone-only in this file. Session-48's block above is paste-over-ready until the session-49 close replaces it here. ~30 min batch to backfill archive detail for 28–38 + 44–47 from tombstones + git log.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed that David's UI-driven delete of Ella's auth user didn't stick (row persisted until force-deleted via admin API). Not blocking; worth investigating if it recurs. ~20–30 min spike.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** 🟢 — Open share to unauthenticated shoppers (scope expansion). ~90–120 min.
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** 🟢 — Window email banner post-it placement (email-rendering bug). ~60–90 min.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. **Session 45 note:** `/shelves` still has the session-44 chrome mismatch (v1.1k `<AddBoothInline>` primitive inside v0.2 Georgia + legacy `colors.*` surface). Same Sprint 5+ redesign that folds `/admin` should fold `/shelves`.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — reference for Q-011 if post-it bug needs mockup diff.
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — keep until Q-008/Q-011 ship (each references it). Q-009 shipped session 45 so its reference weight dropped.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass + retired the BoothHero URL share; session 46 shipped `scripts/qa-walk.ts` + re-passed T4d QA walk + standardized the Claude Code workflow; session 47 fixed the vendor onboarding hero image gap; session 48 fixed the featured-banner RLS drift across Home + Find Map + /admin Banners preview. Next natural investor-update trigger point is after feed content seeding (session 49)** — the update would then honestly report the full pre-beta polish arc (sessions 42–49) as complete rather than partial.
