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

Tell Claude: "close out the session" then run `thc`.

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

## ✅ Session 34 (2026-04-20) — multi-booth scoping: mockup approved, Path A committed

Scoping session. Option A (drop `vendors_user_id_key`) chosen over Option B (`vendor_memberships` join table). Mockup approved at `docs/mockups/my-shelf-multi-booth-v1.html`. Build spec written at `docs/multi-booth-build-spec.md` as explicit dev-handoff doc. Q-001 (KI-006 Path B surgical hotfix) captured in `docs/queued-sessions.md` as the backup plan. No code; session-32 v1.2 code remained uncommitted on disk, to be bundled with session 35.

Full session notes archived. Superseded by session 35 ship.

---

## ✅ Session 35 (2026-04-20) — multi-booth rework shipped + KI-006 resolved

Shipped. Option A — drop `vendors_user_id_key` — shipped end-to-end with KI-006 resolved as a natural sub-fix of the larger rework. Session-32 v1.2 onboarding backlog bundled into the push. Six-step on-device QA walk passed all steps. Full session notes archived; superseded by session 36 for active whiteboard purposes.

---

## ✅ Session 36 (2026-04-20) — Q-003 resolved across four surfaces + KI-007 resolved + third Tech Rule candidate queued

Shipped. Two user-visible regressions reported on open, both resolved end-to-end in the same session. One-line functional fix + three surgical prop-wiring fixes across two files. Full session notes archived; superseded by session 37 for active whiteboard purposes.

---

## ✅ Session 37 (2026-04-20) — Sprint 4 tail shipped (T4b fold-in + T4c confirmed done + T4d runbook)

Shipped. The longest-parked pre-beta item — Sprint 4 tail — closed in a single session. T4c verified done-via-read (session 35 absorbed the rewrite work); T4b `/shelves` AddBoothSheet folded into `/admin` Vendors tab; T4b `/admin/login` disposition locked as Keep Dedicated; T4d pre-beta QA walk runbook written to disk for David to run on device.

Full session notes archived. Superseded by session 38 for active whiteboard purposes.

---

## ✅ Session 42 (2026-04-21) — DB test-data wipe + admin identity confirmed

Operational cleanup session. No code. Full nuke of test data against production Supabase; admin identity clarified (was already `david@zenforged.com` at the env var, not drifted as CLAUDE.md had implied). 12 test posts + 18 vendor rows + 26 vendor_requests + 19 `auth.users` deleted. One row survives in `auth.users`: `david@zenforged.com`. `NEXT_PUBLIC_ADMIN_EMAIL` confirmed correct (never drifted). iPhone PWA reinstalled from `app.kentuckytreehouse.com` for clean-client state. Verify-remaining-count pattern captured as Tech Rule candidate (two firings in one session against same type of work; watch for firing outside a cleanup context before promoting).

Full session notes archived. Superseded by session 43 for active whiteboard purposes.

---

## ✅ Session 43 (2026-04-21) — Anthropic model audit + billing safeguards (docs-only, session-27 rule fired cleanly)

Session-27 `Anthropic model audit` Tech Rule fired for the first time since promotion, triggered by Anthropic's April 16, 2026 `claude-opus-4-7` announcement (one week before this session). Ran the exact procedure the rule documents: blind grep of `app/` + `lib/` surfaced four Anthropic call sites — `/api/post-caption` + `/api/story` on `claude-sonnet-4-6`, `/api/identify` on `claude-opus-4-7`, `/api/suggest` on `claude-opus-4-6`. All three model strings confirmed **Active** on the Anthropic deprecations page with 10+ month retirement runways (nearest retirement: `claude-opus-4-6` not sooner than Feb 5, 2027). No code swap required. Session-27 remediation is holding cleanly.

Console auto-reload enabled at `console.anthropic.com/settings/billing`: **threshold $10, reload amount $20**. Structurally closes the silent-failure surface the session-27 `Anthropic billing as silent dependency` Tech Rule was written to mitigate. Current balance $5.88 at session close is operationally safe given the effective $10 floor — a typical vendor post costs $0.02–$0.05 combined (identify + post-caption), so a 100-post burst lands inside the current balance and auto-reload triggers before dry-up.

One observation flagged for a future session, not promoted: `/api/suggest` is the only AI route still using raw `fetch` against `api.anthropic.com/v1/messages` rather than the Anthropic SDK. Marginally wider silent-failure surface than the other three routes, no functional impact, and `/api/suggest` is a reseller-intel route that beta vendors won't exercise. Optional future migration to SDK for shape-consistency.

Full session notes in `docs/session-archive.md`. Superseded by session 44 for active whiteboard purposes.

### Session 43 close HITL

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 43 close — Anthropic model audit + billing safeguards" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-21 (session 43 close — Anthropic model audit + billing safeguards complete)

**Status:** All four AI-dependent routes on Active model strings with 10+ month retirement runways. Anthropic console auto-reload on at threshold $10 / reload $20. Production DB clean (session 42). iPhone PWA reinstalled with clean localStorage (session 42). Sprint 4 tail fully closed (sessions 40–41). **All remaining pre-beta items are operational/content polish, not code or silent-failure risks.**

### Recommended next session — Feed content seeding (~30–60 min)

Highest-leverage remaining pre-beta item. Reasons it's the best next move: (a) the DB is clean-slate safe for the first time since session 42, so seeding won't mix with test data; (b) it directly improves the first beta shopper's experience — an empty feed is a bad first impression; (c) it's a natural pairing with beta invite prep; (d) it will exercise the AI pipeline under realistic call volume, which will also serve as a soft-verification that the session-43 billing safeguards are working (this will likely be the session that first trips auto-reload, which is exactly what auto-reload exists for — not a problem, just worth knowing the first $20 charge is coming).

Scope:
- Create 2–3 real (non-test) vendors via `/vendor-request` → `/admin` approve flow
- Seed 10–15 finds across those vendors, mixing status states (mostly available, 1–2 "found a home")
- Photos should be real items, ideally spanning a few material categories (glass, ceramic, brass, wood) to make the feed feel varied on first scroll
- Verify the feed, Find Map, and mall pages all render well with the new population
- Light QA: ensure the session-27 `source: "claude" \| "mock"` field returns `"claude"` for all 10–15 auto-caption calls (catches any subtle AI-pipeline regression that QA at volume would surface)

### Alternative next sessions

- **Q-008** 🟢 (~90–120 min) — Open Window share to unauthenticated shoppers. Product scope expansion from session 41 Q-007 walk Scenario 1.
- **Q-009** 🟢 (~15 min standalone / ~5 min inside Q-008) — Admin can share any booth. Extend ownership check with `isAdmin` bypass.
- **Q-011** 🟢 (~60–90 min) — Window email banner post-it missing/misplaced. Diagnostic + fix across iOS Mail / Gmail / Outlook clients.
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision (masthead → inline under hero banner).
- **Tech Rule promotion batch** (~40 min) — four candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed. NEW session-40 React 19 ref-forwarding candidate (one firing only; watch for second firing before promoting). NEW session-42 verify-remaining-count candidate (two firings this session across two tables; meets the two-firings-before-promote bar if it recurs in any other cleanup-shaped work).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 carry one-liner summaries but no archive detail. Pairs well with Tech Rule batch.
- **Error monitoring** (Sentry or structured logs) — Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first (mockup-first per session-28 rule).

### Session 44 opener (pre-filled for feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running feed content seeding session per CLAUDE.md recommendation. Scope: (1) create 2–3 real (non-test) vendors via /vendor-request → /admin approve flow; (2) seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home"; (3) verify feed, Find Map, mall pages render well with new population; (4) light QA that session-27 `source: "claude"` field returns clean on all auto-caption calls. This session is likely to first trip session-43 auto-reload (threshold $10 / reload $20); expected and non-blocking. ~30–60 min. DB is clean-slate (session 42); PWA is clean-client (session 42); auto-reload is live (session 43).
```

---

## ✅ Session 38 (2026-04-21) — Window Sprint scoping + mockup approved

Design agent session per session-28 mockup-first rule. Four-frame share-booth mockup + full dev-handoff build spec + three queued implementation sessions. No code. Full session notes archived; superseded by session 39 for active whiteboard purposes.

---

## ✅ Session 39 (2026-04-21) — Q-004 rename + Q-005 tagline + Q-007 Window Sprint backend shipped

Shipped. Three queued sessions collapsed into one. Rename sweep (Q-004) and tagline shortening (Q-005) landed across 9 files; Window Sprint backend (Q-007 session 39: `lib/posts.ts:getVendorWindowPosts`, `lib/email.ts:sendBoothWindow` + 5 internal helpers + `ShareBoothWindowPayload` type + `renderEmailShell` footer override, `app/api/share-booth/route.ts` with auth + rate limit + dedup + ownership + empty-window guard) all shipped in the same session. One build-gate error caught (`for...of` over a `Map` at pre-ES2015 tsconfig target) and fixed with a one-line `Map.forEach` swap; promoted immediately as new Tech Rule TS downlevelIteration in `docs/DECISION_GATE.md`. Supabase OTP email templates (Magic Link + Confirm Signup) pasted by David via dashboard.

Full session notes archived. Superseded by sessions 40–41 for active whiteboard purposes.

---

## ✅ Sessions 40–41 (2026-04-21) — Q-007 client shipped + full QA walk marathon (Q-007 + T4d both PASSED)

Two sessions ran back-to-back in a single working sitting, collapsed here because they share the close. Session 40 shipped the Q-007 client (`<ShareBoothSheet>` + `/my-shelf` paper-airplane entry). Session 41 ran TWO on-device QA walks: the Q-007 Window Sprint walk (4 scenarios) AND the T4d pre-beta QA walk (three onboarding flows + multi-booth sanity). **Every scenario in both walks passed**, and **every regression risk (KI-006, session-27, session-32, session-33, session-35, session-36) was verified clean on-device against production.**

### Session 40 — Q-007 client shipped

**Retry of first attempt** — prior session-40 attempt blocked on tool-quota before `components/ShareBoothSheet.tsx` persisted. Retry used split-write strategy (component first, `/my-shelf` wiring second) so quota failure could only lose one file, not the whole session.

**What shipped:**
- `components/ShareBoothSheet.tsx` — new, ~520 lines. Four-state bottom sheet (compose / sending / sent / error) mirroring `<BoothPickerSheet>` chrome exactly (backdrop fade 220ms, y-slide 340ms, paperCream bg, 20px top radius, 44×4 handle, body-scroll lock, 22px padding, transform-free centering per session-21A rule). `EMAIL_REGEX` inlined to match the two server routes — no shared-regex import. Null-guarded `PreviewTile` for `Post.image_url: string | null`. Plain `<style>` keyframes for spinner (no styled-jsx). `errorCopyFor()` function distinguishes 403 / 409 / 429 (dual-case IP vs. dedup) / 400 / 502 / 500 with mode-appropriate copy; 429 preferentially uses the server's error string so IP-rate-limit and per-recipient-dedup messages land differently.
- `app/my-shelf/page.tsx` — surgical delta: masthead right slot now renders 38px `v1.iconBubble` paper-airplane button (inline SVG in `v1.green`) when `canShare = activeVendor && available.length >= 1`, else 38px `<div />` spacer preserving grid centering. Share sheet mounted whenever `activeVendor`, visibility controlled by `shareOpen` state. Two share affordances coexist by design: masthead airplane = typed-email Window send, BoothHero airplane = OG link copy via `navigator.share`/clipboard.

**Build-gate fix caught mid-session:**
React 19's `useRef<HTMLInputElement | null>(null)` returns `RefObject<HTMLInputElement | null>`, which TypeScript's `LegacyRef` slot on `<input ref={}>` rejects. One-line fix: prop type on `ComposeBody` internal `inputRef` changed from `React.RefObject<HTMLInputElement | null>` → `React.Ref<HTMLInputElement>` — the broader union that accepts both flavors. Rule candidate captured but not promoted (only one firing). If this class of bug fires again in a future session, promote as **React 19 ref forwarding prop type** Tech Rule.

### Session 41 — Q-007 QA walk (PASSED all 4 scenarios)

Runbook at `docs/share-booth-qa-walk.md` (new — created at session 41 open as companion to `docs/pre-beta-qa-walk.md`).

- **Scenario 1 — Fresh send (happy path):** passed. Masthead airplane opened sheet cleanly, preview strip rendered, RFC validation gated CTA correctly, send transitioned through sending → sent states, recipient email landed in inbox with subject "A Window into Kentucky Chicken", full email body rendered. Four scoping items surfaced here (see below).
- **Scenario 2 — 60s per-recipient dedup:** passed. Retry within 60s produced error state with correct copy: "Already sent to that address a moment ago — give it a minute." Verified Q-010 fix in the same cycle (CTA URL now routes to `/shelf/{slug}`, not the deprecated `/vendor/{slug}`).
- **Scenario 3 — IP rate limit + copy disambiguation:** passed. 6th send within 10min produced error state with correct copy: "Too many sends — try again in a few minutes." Verified the dedup-vs-rate-limit copy distinction holds (both 429 status, different server error strings, `errorCopyFor` picks the right one).
- **Scenario 4.1 — Empty-window client gate:** passed. Flipped all Kentucky Chicken posts to `sold` via SQL, masthead airplane correctly disappeared, grid balance held (spacer div maintained `38px 1fr 38px` layout). Posts restored cleanly via `updated_at` fingerprint. Scenario 4.2 direct-POST verification skipped — 4.1 gives sufficient confidence.

**Q-010 shipped inline during Scenario 2** (~3 min tool time): one-line fix in `lib/email.ts:sendBoothWindow` changed the CTA href template from `/vendor/${slug}` → `/shelf/${slug}`, plus rename `vendorPageUrl` → `shelfPageUrl` for semantic clarity. Spec corrections logged. Deployed and verified in the same walk cycle.

**Four scoping items captured** (all non-blocking, all logged in `docs/queued-sessions.md` as ready-to-run sessions):
- **Q-008** 🟢 — Open Window share to unauthenticated shoppers. David's product call: share should work for any visitor, not just vendors. ~90–120 min session; requires auth-branching on `/api/share-booth`, additional entry point on `/shelf/[slug]`, sender-attribution rewrite.
- **Q-009** 🟢 — Admin can share any booth (bypass ownership check). ~15 min standalone or ~5 min folded into Q-008. Extend the ownership check to also accept `isAdmin(auth.user)`.
- **Q-010** ✅ — Window email CTA URL fix. **Shipped inline during session 41.**
- **Q-011** 🟢 — Window email banner post-it missing / placed below hero instead of overlaid. ~60–90 min session; email-rendering diagnostic + fix across iOS Mail / Gmail / Outlook.

### Session 41 — T4d pre-beta QA walk (PASSED all 5 exit criteria)

Runbook at `docs/pre-beta-qa-walk.md`. Kicked off after Q-007 walk completed cleanly.

- **Flow 1 — Pre-seeded booth:** passed. Admin created `QA Walk Booth 999` via `/admin` Vendors tab. Verified `user_id: null`, correct slug, correct mall_id. Session-37 Add-Booth primitive holds.
- **Flow 2 — Vendor-present onboarding (+888, no booth_name):** passed all four sub-steps. Submit → approve → OTP sign-in → /setup composite-key link → `/my-shelf` → publish find. Auto-caption returned specific Claude output ("Cast brass eagle figurine"), not session-27 mock fallback. Post attributed to correct `vendor_id`. **Exercised KI-006 path on the first-name+last-name fallback.**
- **Flow 3 — Vendor-initiated with booth_name (+777, `The Velvet Cabinet`):** passed. **The critical KI-006 test.** Approved vendor's `display_name = "The Velvet Cabinet"` (session-32 booth_name priority verified). `/api/setup/lookup-vendor` composite-key match on `(mall_id, booth_number, user_id IS NULL)` linked the row correctly. Session-35 rewrite holds on the hardest input.
- **Multi-booth M-series — same user +777 owns 778 booths:** passed all four M-steps. Second vendor_request for +777 at booth 778 produced new `pending` row (migration 007 composite dedup working). Approval didn't pre-link (session-35 early-link regression absent). Sign-in self-heal linked BOTH booths to the +777 user (session-35 half-migration bug absent — both `bb4a4922-...` and `a68dcbe0-...` now have matching user_id). Picker sheet rendered with both booths, active switch worked, post-publish after switch attributed to booth 778's `vendor_id` (session-36 `detectOwnershipAsync` resolver correct).
- **No graceful-collapse-to-mock on `/api/post-caption`:** verified. Both Flow 2 and M.4 captions were specific, not mock.

### HITL completed this marathon
- ✅ Build check run twice (initial fail on React 19 ref typing, green after one-line prop-type fix)
- ✅ Q-010 build check + commit + deploy verified live in Scenario 2
- ✅ Two runbooks authored to disk: `docs/share-booth-qa-walk.md` (session 41), existing `docs/pre-beta-qa-walk.md` followed
- ✅ Both walks run end-to-end on iPhone PWA (Kentucky Chicken + 3 test throwaway vendors via dbutler80020+* plus-addressing)
- ✅ One debris post cleaned mid-walk (booth 999 post from admin-impersonation slip during initial Flow 2 confusion)
- ✅ Git commits + push for both session-40 and Q-010 shipments

### What this unlocks

**Sprint 4 tail is fully DONE.** T4d was the last gating pre-beta HITL; all five exit criteria passed. The pre-beta blocker column stays clean. Every regression risk that's been tracked across sessions 32–39 has been verified on-device against production. **Beta invites are technically unblocked** — remaining pre-beta work is operational polish (Sentry, Anthropic billing auto-reload, feed seeding, Tally feedback), not code.

### Session 42 close HITL — superseded by actual session 42 close block above

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. As of sessions 40–41, both Q-007 Window Sprint and T4d pre-beta QA walk have passed. No code-level regressions surfaced. Beta invites are technically unblocked.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is now empty and clean-slate safe for seeding. Natural pairing with beta invite prep. *Recommended as session 44.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — four candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed. Plus session-40 React 19 ref-forwarding candidate (one firing only; watch for second firing before promoting). Plus session-42 verify-remaining-count candidate (two firings this session, but both in the same session against the same type of work — watch for it to fire outside a cleanup context before promoting). ~40 min.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail. ~30 min batch.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** 🟢 — Open share to unauthenticated shoppers (scope expansion).
- **Q-009** 🟢 — Admin can share any booth (ownership bypass).
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** 🟢 — Window email banner post-it placement (email-rendering bug).
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

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
- `docs/share-booth-build-spec.md` — keep until Q-008/Q-009/Q-011 all ship (each references it).
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data for clean-slate beta start; session 43 audited AI model surface + locked in billing safeguards. Investor-update trigger point is still valid** — consider running `generate investor update` before opening session 44.
