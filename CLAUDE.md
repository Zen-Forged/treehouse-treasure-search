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

Full session notes archived. Superseded by session 38 for active whiteboard purposes.

---

## ✅ Session 38 (2026-04-21) — Window Sprint scoping + mockup shipped

Direction B (share-your-booth via formatted email) scoped from brainstorm to dev-handoff in one session. No code shipped — this was a Design agent session following the session-28 mockup-first rule. Full product narrative, typography audit, and cross-surface consistency review; three scoped sessions queued to implement.

### What shipped

**`docs/mockups/share-booth-email-v1.html` (new, approved)** — four-frame phone-frame mockup: `/my-shelf` share entry → compose sheet → sent confirmation → recipient’s iOS Mail inbox rendering. Revised twice in-session based on David’s design direction.

Key design locks (full list in build spec):
- **The Window concept** — always 6 auto-picked tiles, never the full booth. "A window into a curated booth, and an invitation to explore it in person." Narrative alignment with the app’s existing Window View.
- **Vendor hero dominates the body** — Georgia 34px/600 vendor name below the committed Treehouse Finds shell lockup. Banner + post-it primitive mirrors `/my-shelf` `BoothHero` exactly; no invented chrome.
- **Mode-neutral surfaces** — all copy reads true whether sender is vendor or curious shopper. Subject line `"A Window into {vendorName}"`; "Share this Window" sheet title; body italic line carries sender attribution.
- **Typography deferred correctly** — Georgia throughout email (respects session-32 IM Fell retirement in email surfaces); IM Fell stays in the in-app sheet. Caught mid-session that my initial pitch to re-voice the email in IM Fell would have silently overturned a committed session-32 decision — dependency-surface-audit rule in action.

**`docs/share-booth-build-spec.md` (new)** — full dev-handoff doc. Database (none), new route (`POST /api/share-booth`), new lib fn (`sendBoothWindow` extending `renderEmailShell`), new posts helper (`getVendorWindowPosts` — new function, NOT a mutation of `getVendorPosts` per session-33 dependent-surface audit rule), client component (`<ShareBoothSheet>` mirroring `<BoothPickerSheet>`), rate-limit pattern, 4-scenario QA walk, three unresolved decisions flagged for build (pronoun handling, sender-name source, caption truncation). ~2,000 words.

**Three scoped sessions queued** — full entries in `docs/queued-sessions.md`:
- **Q-007 Window Sprint** (3 sessions) — implementation of the approved mockup.
- **Q-004 "Treehouse" → "Treehouse Finds" rename sweep** (~60 min) — David confirmed product name. Bleeding across mockups; should run before or alongside Q-007.
- **Q-005 Email tagline sweep** (~10 min) — `"Kentucky & Southern Indiana"` → `"Embrace the Search. Treasure the Find."` in transactional emails. Pairs with Q-004, same session.
- **Q-006 Deep-link CTA** (parked on Sprint 6+ Universal Links) — Window CTA currently browser fallback; PWA deep-link later.

### One observation worth surfacing for session-archive

Caught a process failure in-session that deserves a Tech Rule promotion candidate: I initially used `create_file` (from the computer tool environment) to write the mockup to the project dir. It returned a success payload but wrote nothing — `create_file` is sandboxed to a different working directory than where the project lives. The MCP filesystem tool `filesystem:write_file` is the only reliable write path, which `MASTER_PROMPT.md` > WORKING CONVENTIONS explicitly states. I knew the rule and violated it by reaching for the closer-looking tool.

Landed correctly after David caught it and flagged "file did not land on disk."

**Rule candidate for the next Tech Rules batch:** *Verify the landing surface before declaring scope closed, especially for operations where the return value and the side effect can diverge.* Sits in the same family as session-35 half-migration and session-36 new-consumer-on-old-select. Captured in `docs/known-issues.md` as a candidate.

### Pre-beta blocker column

Clean. T4d walk is still the last gating step before beta invites — not a blocker per se, still the gating verification. Window Sprint is NOT a pre-beta blocker; it’s scoped explicitly as the post-Sprint-4 feature that closes the full demo cycle.

### Session 38 close HITL

1. 🟡 **Build check** (docs-only changes this session, but safe to verify):

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && npm run build 2>&1 | tail -40
```

2. 🟡 **Doc sweep commit:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 38 close — Window Sprint scoped (share-booth mockup + build spec + 3 queued sessions)" && git push
```

3. 🟡 **On-device mockup review** — open `docs/mockups/share-booth-email-v1.html` on your phone or desktop if you want one more look before session 39.

4. 🟡 **T4d walk** still outstanding (pre-beta gating verification). Independent of Window Sprint; run when ready.

---

## CURRENT ISSUE
> Last updated: 2026-04-21 (session 38 close — Window Sprint scoped; implementation ready for session 39)

**Status:** Window Sprint scoped end-to-end. Mockup approved, build spec landed, three scoped sessions queued. Pre-beta blocker column still clean. Next session is the Window Sprint backend — unless David wants to run the rename sweep (Q-004 + Q-005) first.

### Recommended next session — Q-007 Window Sprint (session 39 backend)

Implement the server side of the share-your-booth feature per `docs/share-booth-build-spec.md`. Three deliverables:

1. `lib/email.ts: sendBoothWindow(payload)` — new export extending `renderEmailShell()`. Body composition with inline-SVG post-it (Outlook-safe), table-based 6-tile Window grid, Georgia throughout.
2. `POST /api/share-booth` — `requireAuth` + ownership check + rate limit (5/10min/IP) + per-recipient dedup + Resend send + structured error responses.
3. `lib/posts.ts: getVendorWindowPosts(vendorId)` — new function, NOT a mutation of `getVendorPosts` (session-33 dependent-surface audit rule).

~90 min. No client code this session; `<ShareBoothSheet>` + `/my-shelf` entry point come in session 40.

**Sequencing decision to make at session 39 open:** Run Q-004 + Q-005 rename sweep FIRST, OR ship the Window email with "Treehouse" (legacy) shell lockup and do the rename later as one atomic sweep across all three emails. Recommend running Q-004+Q-005 first — adds ~60 min but avoids mixed lockup copy across the three-email family.

### Alternative next sessions

- **Q-004 + Q-005 rename batch solo** (~60 min) — "Treehouse" → "Treehouse Finds" + email subtagline shorten. Runs before or independent of Window Sprint.
- **T4d pre-beta QA walk** 🟡 HITL — still outstanding. Required gating verification before beta invites; independent of Window Sprint.
- **Q-002 picker polish solo** (~20 min) — masthead single-variant + chevron moves inline. Ready to run.
- **Tech Rule promotion batch** (~35 min) — three queued dependency-surface-audit cousins + the new session-38 candidate ("verify landing surface before declaring scope closed"). All ready for prose.
- **Anthropic model audit + billing safeguards** (~30 min) — cheap hygiene.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first.

### Session 39 opener (pre-filled for Window Sprint backend, no rename-first)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running Q-007 session 39 — Window Sprint backend. Implement lib/email.ts:sendBoothWindow() + POST /api/share-booth + lib/posts.ts:getVendorWindowPosts() per docs/share-booth-build-spec.md. Extend renderEmailShell; inline-SVG post-it (Outlook-safe); 5/10min/IP rate limit matching /api/vendor-request; per-recipient 60s dedup; ownership check via getVendorsByUserId; Resend REST API via existing lib/email.ts pattern. NEW function getVendorWindowPosts — do not mutate getVendorPosts (session-33 dependent-surface-audit rule). NO client code this session; sheet + /my-shelf wiring is session 40. Before starting: decide whether to run Q-004+Q-005 rename sweep first (recommended, ~60 min) or ship Window email under legacy "Treehouse" lockup and rename everything at once later.
```

### Session 39 opener (alternate — run rename sweep first)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running Q-004 + Q-005 together (rename sweep) per docs/queued-sessions.md before kicking off the Window Sprint backend. "Treehouse" → "Treehouse Finds" + email tagline "Kentucky & Southern Indiana" → "Embrace the Search. Treasure the Find." across: lib/email.ts, email-v1-2.html mockup, CONTEXT.md §1, MASTER_PROMPT.md, Supabase email templates, PWA manifest, app/layout.tsx metadata. Code identifiers + domain stay unchanged. One atomic commit. If session has budget after the sweep, proceed into Q-007 session 39 (Window Sprint backend).
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty at session 38 close. Window Sprint is explicitly NOT a pre-beta blocker — it’s a post-Sprint-4 feature. T4d QA walk remains the gating verification before beta invites.)*

### 🟡 Remaining pre-beta tech work

- **T4d pre-beta QA walk** 🟡 HITL — follow `docs/pre-beta-qa-walk.md` on device. All three onboarding flows + multi-booth sanity + test-data cleanup. Not code; execution.
- **Test data cleanup** — multiple "David Butler" variants + test booths in production DB. Built into the T4d runbook's "Post-walk cleanup" section.
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotion batch** — now four candidates: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed. ~40 min. Block location in `docs/DECISION_GATE.md` > The Tech Rules section.

### 🟡 Window Sprint queued work (`docs/queued-sessions.md`)

- **Q-007 Window Sprint** (3 sessions) — server (39) + client (40) + on-device QA (41). Mockup approved, build spec at `docs/share-booth-build-spec.md`.
- **Q-004 Rename sweep** (~60 min) — run before or alongside Q-007.
- **Q-005 Email tagline sweep** (~10 min) — bundles with Q-004.
- **Q-006 Deep-link CTA** (🟡 parked) — waits on Universal Links (Sprint 6+).

### 🟡 Session 35 non-gating follow-up (captured in `docs/queued-sessions.md`)

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). Mockup update + surgical `/my-shelf` edit. ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence.

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`, `email-v1-2.html` — partial retirement pending rename sweep; email-v1-2 will be updated by Q-004/Q-005 so keep until then.
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
- `docs/multi-booth-build-spec.md` — archived reference.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence
