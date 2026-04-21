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

Shipped. Two user-visible regressions reported on open, both resolved end-to-end in the same session. One-line functional fix + three surgical prop-wiring fixes across two files. Full session notes archived; superseded by session 37 for active whiteboard purposes.

---

## ✅ Session 37 (2026-04-20) — Sprint 4 tail shipped (T4b fold-in + T4c confirmed done + T4d runbook)

Shipped. The longest-parked pre-beta item — Sprint 4 tail — closed in a single session. T4c verified done-via-read (session 35 absorbed the rewrite work); T4b `/shelves` AddBoothSheet folded into `/admin` Vendors tab; T4b `/admin/login` disposition locked as Keep Dedicated; T4d pre-beta QA walk runbook written to disk for David to run on device.

### What shipped

**T4b — Fold `/shelves` AddBoothSheet into `/admin` Vendors tab:**

New `<AddBoothInline>` primitive rendered above the Requests header in `/admin` Vendors tab. Two states: collapsed (single-row entry point with paper-wash bubble + plus glyph + IM Fell title + italic helper + chevron) and expanded (inline form — mall select, booth number, booth name, filled green CTA). Success triggers the existing admin toast with a "Booth pre-seeded. Ready for vendor claim when they request access." note.

Chrome: v1.1k primitives (`v1.paperCream`, `v1.inkWash`, `v1.inkHairline`, IM Fell italic labels, filled green CTA) so that when `/admin` eventually gets its v1.2 pass, this primitive doesn't need re-chroming. Reads as a Treehouse-shaped insertion inside the legacy v0.2 admin tab — intentional mismatch flagged at session close. The rest of `/admin` (Posts tab, Banners tab, tab switcher, chrome) remains on v0.2 Georgia serif + `colors.*` palette; that full redesign is Sprint 5+ scope.

`/shelves` retirements:
- `AddBoothSheet` component deleted entirely
- Add Booth header button + empty-state CTA removed
- `showAddSheet` + `malls` + `handleBoothCreated` state/handlers removed
- `AnimatePresence` import dropped (no longer needed)
- Admin badge link to `/admin` preserved (still the admin-facing affordance)

`/shelves` is now strictly a browse-only surface. Admin pencil affordance on vendor cards preserved; public shoppers unaffected.

**T4b — `/admin/login` disposition:**

David's call: Keep dedicated (zero change). File was already v1.1k-clean from session 25. Risk Register row closed.

**T4c — Copy polish re-verification:**

David's call: trust the read. Both T4c surfaces read clean on inspection:
- `/api/setup/lookup-vendor` error strings — warm and on-voice ("Your vendor account isn't ready yet. An admin needs to approve your request first." / "No vendor request found for this email. Contact admin if you believe this is an error."). Session 35's full route rewrite absorbed the copy refresh.
- `/vendor-request` v1.2 success screens (three states: `created`, `already_pending`, `already_approved`) — Clock glyph + paper-wash bubble + email echo line primitive + on-voice copy across all three.

No code change. Marked done in Risk Register.

**T4d — Pre-beta QA walk runbook:**

New file: `docs/pre-beta-qa-walk.md`. Step-by-step on-device checklist covering:
- Flow 1 — new `/admin` Add-Booth path (session-37 T4b primitive verification)
- Flow 2 — Vendor-present demo end-to-end (`/vendor-request` v1.2 → `/admin` approve → OTP → `/setup` → `/my-shelf` → first post)
- Flow 3 — Vendor-initiated async with `booth_name` set (KI-006 verification trigger)
- Multi-booth sanity — one user with two booths, picker switches, post inherits active booth
- Post-walk test-data cleanup SQL (walk artifacts + pre-existing "David Butler" variants)

Walk itself is 🖐️ HITL — David runs on device post-commit. Any red flags come back as session-38+ scope.

### One commit

- `t4b: fold /shelves AddBoothSheet into /admin Vendors tab + T4d walk runbook` — covers both files plus the new runbook. Three discrete changes that test together on device.

### Chrome mismatch flag (explicit)

The `/admin` Vendors tab now mixes v1.1k chrome (new Add-Booth primitive) with v0.2 legacy chrome (existing Requests cards, tab switcher, Posts/Banners tabs). This is deliberate per session 37 scope — T4b was tight consolidation, not an `/admin` redesign. Full v0.2 → v1.2 pass on `/admin` is Sprint 5+ scope, now explicitly named in KNOWN GAPS below so it doesn't disappear.

### Pre-beta blocker column

Clean. T4d walk is the last gating step between now and beta invites — not a blocker per se, but the gating verification. Sprint 4 substantively complete.

### Session 37 close HITL

1. 🖐️ **Build check:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && npm run build 2>&1 | tail -40
```

2. 🖐️ **Commit + push:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "t4b: fold /shelves AddBoothSheet into /admin Vendors tab + T4d walk runbook" && git push
```

3. 🖐️ **Doc sweep commit** (this close):

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 37 close — Sprint 4 tail shipped (T4b fold-in, T4c confirmed, T4d runbook)" && git push
```

4. 🖐️ **Vercel deploy confirmation** — verify `app.kentuckytreehouse.com` picks up commit #2 (docs commit from #3 is no-op for deploy).

5. 🖐️ **T4d walk on device** — follow `docs/pre-beta-qa-walk.md`. If red flags surface, paste back in a fresh session.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 37 close — Sprint 4 tail shipped; T4d walk is next HITL)

**Status:** Sprint 4 tail closed. Pre-beta blocker column is clean. Next session's choice depends on T4d walk outcome:
- **Walk passes clean** → Tech Rule promotion batch (three queued cousins) is the natural next move; OR promote Q-002 picker polish; OR Anthropic model audit (33B).
- **Walk surfaces red flags** → session-38 triage covers whatever broke.

### Recommended next session (after T4d walk) — Tech Rule promotion batch

Three queued candidates ready for promotion, all cousins in the *dependency-surface audit* family: (a) session-33 dependent-surface audit (changing a field's semantic source), (b) session-35 half-migration audit (changing return-shape cardinality), (c) session-36 new-consumer-on-old-select audit (new page starts calling a shared data-access function). Promote all three into the main Tech Rules block with the same careful prose treatment as existing rules. Also fold the Q-003 scope-completeness companion rule from `docs/known-issues.md` if session budget allows. ~35 min.

Block location in `docs/DECISION_GATE.md` > The Tech Rules section > Tech Rule promotion queue.

### Alternative next sessions

- **Q-002 solo** (~20 min) — picker affordance placement revision. Masthead reverts to single-variant "Treehouse Finds"; chevron moves inline with IM Fell 28px booth name under hero banner. Runbook ready in `docs/queued-sessions.md` Q-002.
- **Anthropic model audit + billing safeguards (33B)** (~30 min) — grep stale model strings; verify Anthropic console auto-reload is on. Cheap hygiene.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — fold the rest of `/admin` (Posts tab, Banners tab, tab switcher, header, toast) onto v1.1k/v1.2 primitives so the T4b insertion stops reading as a mismatch. Needs design scope first.

### Session 38 opener (pre-filled for Tech Rule batch)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running the Tech Rule promotion batch. Three queued candidates in docs/DECISION_GATE.md > Tech Rule promotion queue, all cousins in the dependency-surface audit family: (1) session-33 dependent-surface audit when changing a field's semantic source, (2) session-35 half-migration audit when changing return-shape cardinality, (3) session-36 new-consumer-on-old-select audit when a page starts calling a shared data-access function. Promote all three into the main Tech Rules block with the same careful prose treatment as the existing rules. Also fold the Q-003 scope-completeness companion rule from known-issues.md if there's session budget. ~35 min estimate.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty at session 37 close. Sprint 4 tail shipped this session; T4d QA walk is the next HITL but not a blocker itself — it's the gating verification. If the walk surfaces issues, they'll be captured as session-38+ items.)*

### 🟡 Remaining pre-beta tech work

- **T4d pre-beta QA walk** 🖐️ HITL — follow `docs/pre-beta-qa-walk.md` on device. All three onboarding flows + multi-booth sanity + test-data cleanup. Not code; execution.
- **Test data cleanup** — multiple "David Butler" variants + test booths in production DB. Built into the T4d runbook's "Post-walk cleanup" section.
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotion batch** — three queued candidates ready for prose, all cousins in the same dependency-surface-audit family: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit. ~35 min. Block location in `docs/DECISION_GATE.md` > The Tech Rules section.

### 🟡 Session 35 non-gating follow-up (captured in `docs/queued-sessions.md`)

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). Mockup update + surgical `/my-shelf` edit. ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (new, session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel, and all downstream primitives on `/admin` still render on v0.2 chrome (Georgia serif + `colors.*` palette). Session 37's T4b Add-Booth insertion reads as a Treehouse-shaped patch inside a legacy surface. Full v1.1k/v1.2 pass would harmonize the tab. Size L. Needs design scoping first (mockup-first per session-28 rule). Estimated ~2–3 sessions.
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

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim (loud `console.warn`, no callers expected). Schedule cleanup pass after N+1 sessions confirm no warn hits during QA. *(Session 37 added no new warn paths. Session 37 did add a fresh `createVendor` caller on `/admin`, which hits the non-deprecated path.)*
- Cloudflare nameservers dormant (no cost)
- ~~`/shelves` AddBoothSheet — retire decision lives in T4b~~ ✅ Resolved session 37 (folded into `/admin`)
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
