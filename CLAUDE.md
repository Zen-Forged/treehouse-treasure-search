## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
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
| Multi-booth rework — dev handoff (archived after session 35 shipped) | `docs/multi-booth-build-spec.md` (mockup at `docs/mockups/my-shelf-multi-booth-v1.html`) |
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

Shipped. Two user-visible regressions reported on open, both resolved end-to-end in the same session. One-line functional fix + three surgical prop-wiring fixes across two files.

### What shipped

**KI-007 — `/find/[id]/edit` redirect loop for non-admin vendors:**

`lib/posts.ts` `getPost()` vendor select now includes `user_id`. Two downstream consumers — the edit-page auth gate and Find Detail's `detectOwnershipAsync` path 2 — both evaluate `post.vendor.user_id`; the field had been silently undefined because no prior `getPost()` consumer needed it. Vendors hit the "forbidden" exit on the auth gate and got bounced back to Find Detail. Admin path worked only because `isAdmin(user)` short-circuits the gate before the ownership check — which is why the bug stayed latent from session 31E through session 36 (admin is the primary testing account).

One-line change plus an explanatory comment. Also silently hardens `detectOwnershipAsync` path 2 for multi-booth users viewing their own posts when the active booth doesn't match the post's vendor row (pre-fix, path 3's `LOCAL_VENDOR_KEY` fallback was saving the single-booth majority case).

**Q-003 — BottomNav `flaggedCount` badge on four surfaces:**

Original Q-003 capture at session-35 close named three surfaces (`/my-shelf`, `/flagged`, `/shelves`). During on-device QA for the session-36 KI-007 fix, David surfaced a fourth overlooked surface: Find Detail (`/find/[id]`), both the main render AND the SoldLanding component. Session 36 resolved across all four:

- `app/my-shelf/page.tsx` — `loadFollowedIds` + `bookmarkCount` state + focus/visibilitychange sync, passed to BottomNav
- `app/find/[id]/page.tsx` — same pattern for main render AND SoldLanding component. Additionally resyncs inside `handleToggleSave` so the badge reflects in-page heart toggles in real time
- `app/flagged/page.tsx` — already correct pre-session-36
- `app/shelves/page.tsx` — already correct on-mount pre-session-36; intentionally not touched (surgical-changes principle + T4b retirement candidate + admin-only surface)

**Edit page (`/find/[id]/edit`) left without BottomNav intentionally** per session-31E focused-management-surface commitment. Adding nav chrome would reopen the design-agent question of whether edit should look more like the other pages. Flagged to David as 🖐️ REVIEW during the session; David confirmed "just Find Detail, proceed."

### Two commits, bisectable

- Commit A — `fix: edit gate + BottomNav badge (session 36)` — `lib/posts.ts` getPost select + `/my-shelf` Q-003 wiring in one commit since both are session-36 scope and test together on device
- Commit B — `fix(session 36): BottomNav flaggedCount on Find Detail (Q-003 addendum)` — Find Detail main + SoldLanding after David's on-device pass surfaced the overlooked fourth surface

### On-device QA — all checks passed

1. ✅ Admin account — pencil on any find → `/find/[id]/edit` loads (was already working pre-fix; confirmed unbroken)
2. ✅ Vendor account — tap into own find → pencil renders → tap → edit page loads and renders fields (the KI-007 verification)
3. ✅ Find Map badge visible on Home, My Booth, Find Detail — counts accurate, in-page heart toggle on Find Detail updates badge in real time

### Tech Rule yield — third cousin to the session-33/35 family

This session's KI-007 root cause is a third distinct flavor of the same bug class that drove session 33's "dependent-surface audit when changing a field's semantic source" and session 35's "half-migration audit when changing return-shape cardinality" candidates. The session-36 flavor: **new-consumer-on-old-select audit** — when a page, route, or hook starts consuming a shared data-access function, grep the function's Supabase `.select(...)` against the new consumer's field reads on the returned object.

The most dangerous version of this bug class is when an auth gate silently passes for the testing account (admin, via `isAdmin(user)` short-circuit) while failing for the production audience (vendors). That asymmetry is exactly what kept KI-007 latent from session 31E through session 36 — David primarily tests as admin, and the admin path never touched the missing field. Companion observability note for the rule: ownership-check failures on the asymmetric path should log distinctly so the asymmetry would surface in logs even when the happy path looks clean.

All three rules are cousins in the same family — *dependency-surface audit when something about a shared contract changes* — and would benefit from being promoted together. Full text queued in `docs/DECISION_GATE.md` Tech Rule promotion queue. Proposed promotion session: "Dependency-surface audit Tech Rule batch (sessions 33 + 35 + 36)."

### Scope-completeness note on Q-003

Q-003 was captured at session-35 close with three surfaces. The fourth (Find Detail) was overlooked — session-35 scope-write didn't grep every `<BottomNav>` instantiation before declaring the scope. Minor Tech Rule candidate queued in the Q-003 Resolved entry of `docs/known-issues.md`: *scope-completeness audit when a prop-wiring gap is named across multiple surfaces*. Less urgent than the three cousins above but the same family shape.

### Session 36 close HITL

1. 🖐️ **Commit doc sweep:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 36 close — Q-003 resolved across four surfaces, KI-007 resolved, third Tech Rule candidate queued" && git push
```

This picks up CLAUDE.md, `docs/DECISION_GATE.md`, `docs/known-issues.md`, `docs/queued-sessions.md`. The two code commits already pushed during the session.

2. 🟢 **Post-push sanity:** Vercel dashboard shows the docs commit landed (no-op deploy is fine; docs don't affect the build).

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 36 close — Q-003 resolved across four surfaces, KI-007 resolved)

**Status:** Session 36 ships. Sprint 4 tail batch is the longest-parked pre-beta item, unchanged since session 26. Q-002 is the remaining non-gating polish item from the session-35 multi-booth rework. Tech Rule promotion batch is now a richer session with three cousin candidates instead of two. Next session picks a direction.

### Recommended next session — Sprint 4 tail (T4c + T4b + T4d)

Still the longest-parked pre-beta item. Session 36 didn't touch it. Same scope as session 35 close described:

**Remaining T4c copy polish:**
- Minor `/api/setup/lookup-vendor` error copy review (session-35 rewrite may already have this — re-read before editing)
- `/vendor-request` v1.2 success-screen copy review (sessions 32 + 35 changed the surrounding behavior; verify the copy still fits)

**T4b admin surface consolidation:**
- Fold `/shelves` `AddBoothSheet` into `/admin` Vendors tab (or retire — remaining decision)
- Retire the public `/login` page admin PIN affordance leftover (already done in v1.1k session 23?) — verify
- Decide `/admin/login` disposition (keep dedicated / fold into `/admin` unauth gate) — documented as T4b open decision

**T4d pre-beta QA pass:**
- End-to-end dry run of all three onboarding flows (Flow 1 pre-seeded, Flow 2 demo, Flow 3 vendor-initiated) against session-35 schema + session-36 fixes
- Test data cleanup — multiple "David Butler" variants + test booths in DB from session 30+ testing

### Alternative next sessions (if Sprint 4 tail isn't the right call)

- **Q-002 solo** — ~20 min. Picker placement inline refinement (no longer has Q-003 batch-mate since Q-003 retired session 36). Low-cost polish.
- **Tech Rule promotion batch** — ~35 min. Now THREE queued candidates (session-33 dependent-surface audit + session-35 half-migration audit + session-36 new-consumer-on-old-select). All three are cousins in the same dependency-surface audit family. Richer batch than session-35 close anticipated.
- **Anthropic model audit + billing safeguards (33B)** — ~30 min. Grep for stale model strings; verify Anthropic account auto-reload is on.

### Session 37 opener (pre-filled for whichever direction picks up)

If Sprint 4 tail:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Sprint 4 tail batch — T4c remainder (copy polish on /api/setup/lookup-vendor error states + /vendor-request success screens, re-read session-35 changes first), T4b admin surface consolidation (fold /shelves AddBoothSheet, verify /admin/login disposition, retire the legacy public /login admin PIN affordance if still present), T4d pre-beta QA walk of all three onboarding flows (Flow 1 pre-seeded, Flow 2 demo, Flow 3 vendor-initiated) against the session-35 schema + session-36 fixes. Also clean up test data (multiple "David Butler" variants + test booths from session 30+ on). This is the longest-parked pre-beta item.
```

If Tech Rule promotion batch:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running the Tech Rule promotion batch. Three queued candidates in docs/DECISION_GATE.md > Tech Rule promotion queue, all cousins in the dependency-surface audit family: (1) session-33 dependent-surface audit when changing a field's semantic source, (2) session-35 half-migration audit when changing return-shape cardinality, (3) session-36 new-consumer-on-old-select audit when a page starts calling a shared data-access function. Promote all three into the main Tech Rules block with the same careful prose treatment as the existing rules. Also fold the scope-completeness companion rule from Q-003's Resolved entry in known-issues.md if there's session budget. ~35 min estimate.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty at session 36 close. KI-007 resolved this session; multi-booth + KI-006 resolved session 35. Pre-beta blocker column is clean.)*

### 🟡 Remaining pre-beta tech work

- **Sprint 4 tail batch** (longest-parked): T4c remainder (copy polish — partly absorbed by session-35 rewrites, re-verify), T4b (admin surface consolidation + `/admin/login` disposition decision), T4d (pre-beta QA walk).
- **Test data cleanup** — multiple "David Butler" variants + test booths in production DB.
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotion batch** — now three queued candidates ready for prose, all cousins in the same dependency-surface-audit family: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit. ~35 min. Block location in `docs/DECISION_GATE.md` > The Tech Rules section.

### 🟡 Session 35/36 non-gating follow-ups (captured in `docs/queued-sessions.md`)

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). Mockup update + surgical `/my-shelf` edit. ~20 min. *(Q-003 retired session 36; Q-002 stands alone now.)*

### 🟡 Sprint 5 + design follow-ons

- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). Multi-booth makes this richer — per-booth editing possible now.
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, Universal Links, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration** (if/when co-ownership or role-based permissions become a real roadmap item — multi-vendor-per-booth rather than multi-booth-per-vendor). Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim (loud `console.warn`, no callers expected). Schedule cleanup pass after N+1 sessions confirm no warn hits during QA. *(Session 36 added no new warn paths.)*
- Cloudflare nameservers dormant (no cost)
- `/shelves` AddBoothSheet — retire decision lives in T4b
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- `docs/design-system-v1.2-draft.md` (tombstone; retire now that v1.2 shipped)
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`, `email-v1-2.html` — can retire now that v1.2 polish + onboarding are in ✅
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it (then retire)
- `docs/multi-booth-build-spec.md` — archived reference; consider folding key decisions into CONTEXT.md and retiring the file post-Q-002
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence
