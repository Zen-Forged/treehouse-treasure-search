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

## ✅ Session 49 (2026-04-23) — Booths v1.2 redesign + QR code share + copy polish

Eight commits across UI redesign, a new feature, and copy updates. No HITL steps (no Supabase SQL runs, no device-required steps beyond QR scanning verification).

**Booths page (`/shelves`) — full v1.2 migration** (`d84b897`, `86e703f`, `182bf7e`):
- Removed "Featured Find" eyebrow text and "Find Map" overlay text from both banners — `FeaturedBanner.title` made optional
- Replaced v0.2 Georgia + `colors.*` layout with v1.2 tokens: `StickyMasthead`, `FONT_IM_FELL`, `v1.*`, 2-column grid cards (Option B from mockup)
- Added `groupByMall()` helper — section headers (IM Fell name + hairline rule + booth count) between mall groups
- Masthead updated to match Home page: 3-column grid, centered "Treehouse Finds" wordmark, Admin pill right, no logo
- `/shelves` chrome mismatch (session-44 flag) is **resolved**

**QR code in share sheet** (`4887df8`, `7a1194a`, `1597417`, `a8f3a36`):
- Added `react-qr-code` dependency; QR renders inline in `ComposeBody` between header divider and preview strip
- Encodes `window.location.origin + /shelf/${vendor.slug}` — works in dev and production
- Option B (Treehouse logo overlay): logo centered on postit-wash cutout with 4px halo
- Scanning fixes: contrast → pure `#000000`/`#ffffff`; error correction `L` → `H` (30% recovery); size 148 → 160px. QR confirmed scanning on device after `a8f3a36`.

**Copy + UI polish** (`7a1194a`, `fc2e9a1`):
- Share sheet header: "Share the booth" → "Invite someone in to" / "Send a Window into {name}" → booth name only / body copy removed / CTA → "Send the invite"
- Sheet `maxHeight` 82vh → 92vh (CTA now visible without scrolling)
- Home feed: "Request booth access →" dotted link → green pill CTA "Request Digital Booth" matching share sheet style
- Login page: "Curator Sign in" → "Vendor Sign in"

Commits `d84b897`–`fc2e9a1` pushed to main. All builds clean.

---


## CURRENT ISSUE
> Last updated: 2026-04-23 (session 49 close — booths v1.2 redesign + QR share + copy polish)

**Status:** `fc2e9a1` on main. Eight clean commits shipped. `/shelves` is now fully v1.2 (grid, StickyMasthead, mall grouping). Share sheet has a working QR code (confirmed scanning on device). DB clean-slate persists; beta invites remain technically unblocked. Vercel CLI still not globally installed on David's machine — one-time fix is `sudo chown -R $(whoami) /usr/local/lib/node_modules && npm i -g vercel`; workaround is `npx vercel@latest --prod`.

### Recommended next session — feed content seeding (~30–60 min)

Carried forward from sessions 44–49. The redesigned `/shelves` page + working QR share sheet + "Request Digital Booth" CTA on the home feed make this the right moment to seed real content and see the app as a first-time shopper would.

Seeding scope:
- Create 2–3 real (non-test) vendors via `/shelves` Add-a-Booth (primary path). `/vendor-request` → `/admin` approve flow (Flow 3) also available — populates hero_image_url from proof photo (session-47 fix).
- Seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home."
- Photos should be real items spanning a few material categories (glass, ceramic, brass, wood) to make the feed feel varied on first scroll.
- Verify feed, Find Map, mall pages, and the new `/shelves` mall-grouped grid all render well.
- Light QA: `source: "claude"` returns on all auto-caption calls (session-46 bar: "Brass bald eagle figurine sculpture" quality).
- Test the QR code share flow end-to-end on a real booth.

**When a session seeds content, add a one-liner to CLAUDE.md's CURRENT ISSUE so the next session doesn't trip on it** (session-46 rule candidate, still un-promoted).

### Alternative next sessions

- **Q-008** 🟢 (~90–120 min) — Open Window share to unauthenticated shoppers.
- **Q-011** 🟢 (~60–90 min) — Window email banner post-it placement (email-rendering bug).
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — eight candidates queued, one promotion-ready (session-46 script-first rule hit threshold in session 48).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–48 one-liner only; session-49 block is paste-over-ready.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope." `MASTER_PROMPT.md` Design Agent section.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).

### Session 50 opener (pre-filled for feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Working directory: /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding per CLAUDE.md recommendation. Scope: (1) create 2–3 real vendors via /shelves Add-a-Booth or /vendor-request → /admin Flow 3; (2) seed 10–15 finds, mostly available with 1–2 "found a home"; (3) verify feed, Find Map, mall pages, and the new /shelves mall-grouped grid all render well; (4) test QR code share flow end-to-end on a real booth (confirmed scanning in session 49); (5) light QA that source: "claude" returns on all auto-caption calls. ~30–60 min. Use `npx tsx scripts/qa-walk.ts baseline` at open if test debris suspected.
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
- **Session 48** (2026-04-23) — Featured banner RLS drift fixed across Home + Find Map + `/admin` Banners preview. Migration 008 + `scripts/inspect-banners.ts` diagnostic. HITL: David pasted SQL into Supabase editor; anon reads confirmed restored.
- **Session 49** (2026-04-23) — Booths page full v1.2 redesign (2-column grid, StickyMasthead, mall grouping). QR code added to share sheet with logo overlay; confirmed scanning on device. Copy polish: "Invite someone in to" header, "Send the invite" CTA, "Request Digital Booth" green pill on home, "Vendor Sign in" on login.

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

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. (**Session 49 note:** `/shelves` chrome mismatch is now resolved — v1.2 migration shipped. `/admin` remains on v0.2.)
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49 change); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
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

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass; session 46 re-passed T4d QA walk + qa-walk.ts script; session 47 fixed vendor onboarding hero image gap; session 48 fixed featured-banner RLS drift; session 49 shipped /shelves v1.2 redesign + QR code share + copy polish. Next natural investor-update trigger point is after feed content seeding (session 50)** — the update would then honestly report the full pre-beta polish arc (sessions 42–50) as complete rather than partial.
