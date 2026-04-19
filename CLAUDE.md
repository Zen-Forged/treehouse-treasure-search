## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## TERMINAL COMMAND FORMATTING CONVENTION
> Whenever Claude surfaces multiple terminal commands that must be run in sequence, they MUST be broken out into separate code blocks — one command per block. This lets David copy each command individually without accidentally running the next one before verifying the previous succeeded. Applies to deploy checklists, QA sequences, debug scripts, and HITL steps.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

```bash
npx vercel --prod
```

**Not this:**

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
npx vercel --prod
```

Exception: A single chained command with `&&` stays in one block (that's one atomic action by design).

---

## CURRENT ISSUE
> Last updated: 2026-04-19 (session 28 — v1.2 post-flow trilogy mockup-first design session; three mockups approved; build spec on disk; no code shipped)

**Status:** ✅✅ **Session 28 was a design session that produced three approved mockups and one build spec, all on disk, no production code changed.** The session opened as the Sprint 4 tail batch warm-up David was considering but pivoted early to the v1.2 post-flow trilogy work (`/post`, `/post/preview`, and a not-yet-built `/find/[id]/edit`). The session also surfaced and resolved a meta-problem about how the Design agent had been operating.

**What David named as the real problem mid-session:** the Design agent's output pattern — write a 14-paragraph commitment block into `docs/design-system.md`, hand David dense design-system prose to audit, lock commitments, then pull the whole block back up for dissection when direction changes — was creating expensive revision cycles and required executive-level design-system fluency just to review work. This was naming the exact anti-pattern that had been slowing every Design sprint since session 15.

**The reversed pattern, tested live session 28 and now locked as default:** mockup FIRST (phone-frame HTML in `docs/mockups/`, dark-background review doc, 2–3 variant frames, plain-English decisions pane, multi-choice questions via `ask_user_input_v0`), David approves visually, build spec written AFTER as an explicit dev-handoff doc David doesn't read. The mockup IS the commitment. The build spec serves the mockup, not the other way around. Shipped three UI surfaces approved in one session with zero spec-doc reopens — vs. the v1.1k/v1.1l pattern which typically took 1–2 full sessions just to lock a spec before code even started.

**Next session (29) is the v1.2 code sprint** against `docs/design-system-v1.2-build-spec.md`. Estimated 3–4 hours. No mockup review required — David already approved.

### What shipped this session (28)

**No production code changes.** Five files touched on disk, one retired, four doc/rule updates.

**New mockups (approved by David via `ask_user_input_v0` plain-English questions):**
- `docs/mockups/add-find-sheet-v1-2.html` — Add Find bottom sheet on `/my-shelf`. Frame 3 (stripped variant — no row subtitles, no sheet subhead) approved. Two rows: Take a photo / Choose from library.
- `docs/mockups/review-page-v1-2.html` — Review Your Find page (formerly `/post/preview`). Three photo-shape variants (portrait / near-square / landscape) all rendering at 4:5 aspect with `objectFit: contain` and paperCream letterbox. Post-it pinned on preview. Title / Caption / Price field order. "Publish" CTA (changed from "Save to Shelf" per David).
- `docs/mockups/edit-listing-v1-2.html` — new `/find/[id]/edit` page. Three states: just-landed / mid-edit with inline save checkmark / marked-sold with photo grayscale + confirmation line. Status toggle labels "Available" / "Sold" per David. Replace-photo dark pill top-left approved. Confirmation line "Marked sold. Shoppers will see this as 'Found a home.'" approved. Remove-from-shelf quiet red italic link approved.

**Build spec (David doesn't read; future Claude sessions do):**
- `docs/design-system-v1.2-build-spec.md` — 10 build tasks, component contracts, API route spec, build-order recommendation, pre-deploy checklist. Explicit front-matter states mockups are source of truth; if mockup and build spec ever disagree, mockup wins.

**Retired:**
- `docs/design-system-v1.2-draft.md` — gutted to a tombstone pointer doc. This was the spec-first draft authored earlier this session; superseded when David's insight pivoted the approach.

**Tech Rule + Risk Register updates (`docs/DECISION_GATE.md`):**
- New Tech Rule: "Design: mockup-first as default, not exception." Captures the session-28 pattern as the committed operating default for all future UI work.
- Two Risk Register rows added: (1) post-flow trilogy v0.2 chrome + missing Edit Listing → spec approved, code sprint pending session 29; (2) Design agent process was spec-first by default → resolved session 28 via mockup-first promotion.

**MASTER_PROMPT.md updates:**
- Design agent section gains a "Core operating principle (session 28)" block naming the mockup-first flow as the default. Six-step flow committed: mockup first → David reviews → build spec after approval → mockup-wins-on-disagreement → cheap revisions → optional later fold into design-system.md.

### What was NOT done this session (and why)

- **No code was written.** This was deliberate per David's "Spec only — no code this session, design lock next session" answer at session open. Session 28 is entirely design-approval work; session 29 is the code sprint.
- **`docs/design-system.md` was NOT updated** to a v1.2 Status block. Per the new mockup-first rule step 6, folding into the canonical design-system doc happens during or after the code sprint, not at spec-approval time. Design agent will decide during session 29 how much of v1.2 needs to live in `docs/design-system.md` versus staying in the build spec.
- **Sprint 4 tail (T4b/T4c/T4d) did NOT run this session.** Still the longest-parked pre-beta tech work. Queued for session 30 or whenever David routes there after session 29 ships v1.2.
- **Anthropic model audit (28G) + billing safeguards (28H) did NOT run.** Low-effort, low-risk, can fold into session 29 close or session 30 open.

### Discipline notes — what session 28 teaches

**1. The Design agent was optimizing for the wrong audience.** Every prior version of `docs/design-system.md` was written at senior-product-designer reading level. That audience doesn't exist in this project. David is the reader, and he is the executive, not a design peer. The fix wasn't to dumb down the writing — it was to change what gets written, when, and by whom for whom. Mockups for David; specs for future Claude. Different artifacts, different audiences, no overlap.

**2. Revision cost was the hidden killer.** A 14-paragraph commitment block is cheap to write and expensive to change, because every paragraph cross-references every other paragraph. A mockup is medium-cost to write and trivially cheap to iterate — one image, one review, one yes/no. The cost profile inversion matters more than the absolute cost. Over 10 design sessions, the mockup-first approach is likely 5–10x cheaper on revisions alone.

**3. `ask_user_input_v0` was load-bearing.** Every decision David made this session landed as a structured multi-choice question (scope / edit fields / image truth / sheet commit / admin-posting / tips / save-vs-autosave / sold-label / etc.). No "what do you think?" open questions. The tool's shape forced Claude to name specific alternatives up front, which is exactly what David told us he needed: commitments stated in plain English with options he could pick between, not prose essays for him to distill. Future design sessions should lean on this tool heavily.

**4. The "let you decide" option mattered.** On several questions David picked "Let you decide — you're the design agent." This is the executive-delegation pattern working correctly: David trusts the agent's judgment on style-level calls, holds the line on scope-level ones. The agent earning that trust depends on being transparent about WHICH calls it's making and WHY when David delegates — not just silently committing.

### Session 28 close HITL — done

1. ✅ Three mockups authored + approved via `ask_user_input_v0` structured decisions
2. ✅ `docs/design-system-v1.2-build-spec.md` authored as dev-handoff doc
3. ✅ `docs/design-system-v1.2-draft.md` retired to tombstone pointer
4. ✅ `docs/DECISION_GATE.md` updated — new Tech Rule + 2 Risk Register rows + footer timestamp
5. ✅ `MASTER_PROMPT.md` updated — Design agent core operating principle + footer timestamp
6. ✅ All four new files verified on disk via `filesystem:read_text_file` head-read (file-creation verify Tech Rule, session 25)
7. 🟢 **TODO at commit:** this CLAUDE.md update (final HITL: `thc` to commit session 28)

### Session 29 candidate queue

- **29A — v1.2 code sprint** against `docs/design-system-v1.2-build-spec.md`. **Strongly recommended opener.** Three surfaces, ~3–4 hours. Build order in spec: `<AmberNotice>` → `<PostingAsBlock>` → `<PhotographPreview>` → `/post/preview` rewrite → `<AddFindSheet>` → `/my-shelf` wiring → `/post` redirect shim → `BoothPage.tsx` AddFindTile props change → `PATCH /api/my-posts/[id]` → `/find/[id]/edit` page → `/find/[id]` owner-edit bubble. On-device QA on iPhone at end.
- **29B (lightweight warm-up before 29A)** — Anthropic model audit pass (28G, ~15 min) + billing safeguards (28H, ~15 min ops). Clears session-27 follow-ons cleanly before diving into v1.2.
- **29C — Sprint 4 tail batch** (T4c remainder copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). Longest-parked pre-beta item. Defer unless David explicitly routes here — v1.2 code sprint is higher leverage because it clears three surfaces at once and delivers the first vendor-visible feature since session 24.
- **29D — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; mockups in `docs/mockups/nav-shelf-exploration.html`). Should follow the new mockup-first rule when David routes here — four existing mockups already exist, he picks one.
- **29E — Guest-user UX batch, post-beta candidates, other deferred items.** All parked pending 29A completion.
- **29F — Known-Gaps reconciliation rule promotion to DECISION_GATE** (proposed session 26, still not promoted; ~15 min). Lower priority now that session 28's Tech Rule additions covered the adjacent process-discipline space.

**Recommended for session 29:** 29B warm-up (~30 min) → 29A (3–4 hours). If David wants to hit v1.2 cold, skip 29B and open directly into 29A.

---

## ARCHIVE — What was done earlier (2026-04-19, session 27 — AI caption regression hotfix)

**Status at the time:** ✅✅ Session 27 shipped a hotfix for a vendor-reported regression: AI caption auto-populate returned random generic strings regardless of what was photographed. Root cause was a double failure — (1) `claude-opus-4-5` model identifier was retired on Anthropic API ~1 month ago but still hardcoded in three routes (`/api/post-caption`, `/api/identify`, `/api/story`), so the SDK threw `NotFoundError` on every call; (2) route handlers had `catch` blocks that silently returned random `MOCK_RESPONSES` entries with no distinguishable shape, so the client populated the form with whichever hardcoded string the dice picked.

Swapped to current models (post-caption → `claude-sonnet-4-6`, identify → `claude-opus-4-7`, story → `claude-sonnet-4-6`) and added `source: "claude" | "mock"` observability field. On-device QA post-deploy surfaced a SECOND silent failure: Anthropic account was out of credits (HTTP 400 `invalid_request_error`). David topped up credits; live QA confirmed correct per-photo captions. The `source` field was the diagnostic win — without it, billing issue was invisible.

**Deep lesson:** graceful-collapse paths need observability. Third sibling of orphan-pattern (sessions 13, 23) and phantom-blocker (KI-003, sessions 18–25). All three shared one shape: a graceful-collapse path hiding a real failure behind a working-looking UI.

5 files touched: `/api/post-caption`, `/api/identify`, `/api/story` model swaps + `source` field; `/post` and `/post/preview` client guards on `data.source !== "claude"`; `/api/suggest` flagged as stale `claude-opus-4-6` (not a regression, queued as 28G follow-on). Two Tech Rules added to DECISION_GATE: Anthropic model audit + billing as silent dependency.

---

## ARCHIVE — What was done earlier (2026-04-19, session 26 — documentation reconciliation)

**Status at the time:** ✅ Session 26 was a documentation reconciliation pass, not a code sprint. Session opener surfaced a material contradiction: CLAUDE.md had been carrying "KI-003 diagnosis (pre-beta blocker, longest-parked)" across 17 consecutive session closes (18 through 25), while `docs/known-issues.md`, `docs/DECISION_GATE.md` Risk Register, `docs/onboarding-journey.md`, and CLAUDE.md's own session-9 archive line all correctly recorded KI-003 as resolved session 9.

Two memory user-edits written, full CONTEXT.md rewrite (16 sections covering v1.1l reality — was 18 sessions stale), CLAUDE.md Status block rewritten. The "phantom-blocker" pattern named: the orphan-file pattern has a sibling where a resolved status keeps being restated as open across close blocks. Proposed Known-Gaps reconciliation Tech Rule (not yet promoted to DECISION_GATE as of session 28).

---

## ARCHIVE — What was done earlier (2026-04-19, session 25 — v1.1k `/admin/login` orphan + v1.1l `site_settings` migration)

**Status at the time:** ✅✅ Session 25 closed the last two loose ends from the v1.1k + v1.1l sprints. Session 23's CLAUDE.md claimed `app/admin/login/page.tsx` shipped but the file was never actually written — a repeat of the session 13 `lib/imageUpload.ts` orphan pattern. Discovered when the session opener's QA walk of `/admin/login` returned a 404. One commit shipped: the missing file, written from session 23's documented spec against v1.1k primitives. In parallel, the `supabase/migrations/004_site_settings.sql` migration (committed in session 24 as 🖐️ HITL) was applied by David in the Supabase SQL editor; `site-assets` bucket verified public; hero banners uploaded for both Home (Featured Find, eyebrow variant) and Find Map (hero banner, overlay variant); both render live on device.

Two new Tech Rules landed in DECISION_GATE:
- **File-creation verify at session close** — Docs agent must `filesystem:list_directory` or `filesystem:read_text_file` any NEW file declared in a session close before `thc`. Build-check rule is necessary but not sufficient (runtime navigation strings aren't type-checked).
- **Required Supabase migrations as explicit HITL** — any sprint shipping a new `supabase/migrations/*.sql` file that production code depends on must list the migration as an explicit 🖐️ HITL step in the session-close checklist, not just inside a comment header.

### v1.1l sprint (session 24) — StickyMasthead + FeaturedBanner + Find Map polish + post-it Times New Roman

Shipped in commit `9edc897` on 2026-04-18. 18 files changed, 1205 insertions, 256 deletions.

**New primitives:**
- `<StickyMasthead>` (`components/StickyMasthead.tsx`) — shared scroll-linked masthead chrome replacing six inline implementations. `scrollTarget` prop for Booth pages.
- `<FeaturedBanner>` (`components/FeaturedBanner.tsx`) — two variants (eyebrow + overlay). 16px radius, 10px horizontal inset. Graceful collapse when `imageUrl` is null.
- `site_settings` data model — keyed-row table with jsonb values. Public-readable, service-role-write via new `/api/admin/featured-image` route.
- `FeaturedBannerEditor` (inlined in `app/admin/page.tsx`) — admin-UI upload component.

**Find Map polish (v1.1k/j → v1.1l):**
- Spine connects to terminal 16px filled circle (was open air)
- Closer composition: circle + copy in one grid row, vertically centered
- Closer copy changed to **"Embrace the Search. Treasure the Find."** — first in-product tagline surfacing
- X glyph strokeWidth 1.5 → 2.2 on both Find Map spine X and Find Detail vendor-row X
- Vendor name italic retires — IM Fell non-italic 18px

**Post-it font — partial v1.1j reversal to Times New Roman:**
- 36px numeral goes to `"Times New Roman", Times, serif` (narrow exception)
- Scope limited to 36px post-it numeral ONLY — inline pills stay on `FONT_SYS`
- Token: `FONT_POSTIT_NUMERAL` in `lib/tokens.ts`
- Auto-scale: 36px ≤4 digits, 28px @ 5, 22px @ 6+ via `boothNumeralSize(boothNumber)` helper

**BottomNav idle-tab color:** `#8a8476` → `v1.inkMuted` (`#6b5538`). Full Nav Shelf rework still held.

---

## ARCHIVE — What was done earlier (2026-04-18, session 23 — v1.1k activation flow pass)

**Status at the time:** Session claimed the v1.1k activation flow pass shipped in full: `/vendor-request`, `/login`, `/setup`, new `/admin/login`. Build green, commit pushed.

**Correction logged session 25:** `app/admin/login/page.tsx` was documented as shipped but was never on disk. The `mkdir -p` ran successfully — that part verified — but the subsequent `filesystem:write_file` call did not actually land the file. Same class of bug as session 13's `lib/imageUpload.ts` orphan. Session 25 wrote the file from the documented spec; it is now on disk and verified on device.

The four files that DID ship correctly in session 23: `app/vendor-request/page.tsx` (full rewrite), `app/login/page.tsx` (full rewrite, ~35% shorter), `app/setup/page.tsx` (full rewrite), and `app/admin/page.tsx` (one-line surgical redirect update to `/admin/login`).

**v1.1k commitments in `docs/design-system.md`:** (a) Mode C interior grammar for task-first surfaces, (b) paper-wash 60px success bubble primitive, (c) filled green CTA for commit actions only, (d) form input primitive, (e) email echo line primitive, (f) Mode C tab switcher retires, (g) `/admin/login` scope committed, (h) `<MallSheet>` migration to `/vendor-request` deferred.

---

## ARCHIVE — What was done earlier (2026-04-18, session 22A — v1.1j QA polish pass)

Six-point Status paragraph advancing v1.1i → v1.1j. (a) Diamond ornament retires. (b) Booth numbers switch to `FONT_SYS` globally (1-vs-I disambiguation). (c) `/my-shelf` Window View renders 9-cell placeholder composition for owner. (d) `<AddFindTile>` joins Shelf View for owner. (e) Find Map closer closes the loop. (f) Home masthead logo enlarges 24/0.72 → 34/0.92.

---

## ARCHIVE — What was done earlier (2026-04-18, session 21A — v1.1i code sprint)

**Status:** v1.1i shipped in two same-session commits. Commit 1: `<MallSheet>` primitive NEW + `app/page.tsx` full rewrite (paper masonry + feed hero) + Find Detail 3B sold landing state + `app/flagged/page.tsx` `isSold` retirement + `components/MallHeroCard.tsx` DELETED. Commit 2: sticky mastheads across 5 pages + MallSheet centering fix (transform-free) + paper-tone drop-shadows on product photographs.

**Three-part v1.1i sold contract locked:** bookmark key kept when a saved find sells + Find Map tile renders identically to available + Find Detail 3B IS the reveal. Breaking any one breaks all three. Do NOT add a status filter to `getPostsByIds`.

---

## ARCHIVE — What was done earlier (2026-04-18, session 20)
> Pure design-direction session; v1.1i spec committed; two mockups on disk; no production code changed.

David picked **C2** for feed treatment and **3B** for sold landing state. Five questions settled. Follow-on questions on 3B + `/shelf/[slug]` sold retention + Find Map bookmark + tile.

---

## ARCHIVE — What was done earlier (2026-04-18, session 19A)

Token consolidation cleanup. `lib/tokens.ts` extended with canonical `v1` + `fonts` (`FONT_IM_FELL`, `FONT_SYS`) exports. Inline `v1` objects retired from `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx`. `BoothPage.tsx` re-exports the symbols.

---

## ARCHIVE — What was done earlier (2026-04-18, session 18 — v1.1h Booth page redesign)

Both `/my-shelf` and `/shelf/[slug]` rebuilt: banner as pure photograph with booth post-it pinned, vendor name as IM Fell 32px title, pin-prefixed mall+address block, Window View + Shelf View. Four v0.2 components DELETED: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`. `components/BoothPage.tsx` NEW, shared between both Booth pages.

---

## ARCHIVE — What was done earlier (2026-04-18, session 17)

Find Detail v1.1e/v1.1f on-device polish (app-wide background to paperCream globally, masthead Title Case, frosted on-image save+share bubbles, status pill retirement, post-it bottom-right with push pin + stacked "Booth Location" eyebrow + `+6deg` rotation). Find Map v1.1g full redesign of `/flagged`. Glyph hierarchy locked: pin = mall, X = booth.

---

## ARCHIVE — What was done earlier (2026-04-18, session 16)

Find Detail v1.0 code build + 4 iteration passes v1.0 → v1.1d. BottomNav minimal chrome patch. Nav-shelf exploration mockup (4 approaches, still held for review). Critical tool lesson: `create_file` in the container does NOT write to the Mac filesystem; `filesystem:write_file` is the only reliable write tool.

---

## ARCHIVE — What was done earlier (2026-04-17, session 15)
> Design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed.

Tagline anchor committed: **Embrace the Search. Treasure the Find. Share the Story.** Cartographic vocabulary committed. Material vocabulary committed. Typography rewritten (IM Fell English editorial, Caveat rare, system-ui precise, Georgia + Mono retired).

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 14)

Booth page v0.2 redesign shipped. `lib/imageUpload.ts` reconstructed mid-session — session-13 orphan pattern. New Tech Rule added: *"A session is not closed until `npm run build` has run green against the committed state of the repo."* Session 25 amended this rule with a companion file-creation verify step.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped.

`app/api/admin/diagnose-request/route.ts` NEW. `app/api/admin/vendor-requests/route.ts` REWRITE (constraint-aware approval). `app/admin/page.tsx` REWRITE (Diagnose links, inline DiagnosisPanel). `docs/admin-runbook.md` NEW with 9 SQL recipes.

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- Error responses include `diagnosis` code + `conflict` object for UI rendering

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is active for hero banners specifically.

---

## ARCHIVE — Earlier sessions (1–12)
> Condensed — full history available in git log

- **Session 12** — Design agent first direction pass; `docs/design-system.md` v0.2 (later rewritten v1.0 session 15)
- **Session 11** — Design agent activated; `docs/design-system.md` scaffolded
- **Session 10** — `/setup` 401 race polish; T4c orphan cleanup A/B/E
- **Session 9** — KI-001, KI-002, **KI-003 all resolved**; Flow 2 end-to-end verified on device (three-part KI-003 fix: `/login` redirect-param unification, `/post` localStorage guard, `/my-shelf` self-heal)
- **Session 8** — Onboarding scope-out (`docs/onboarding-journey.md`); T4a email infrastructure (Resend REST via `lib/email.ts`)
- **Session 7** — `/admin` mobile-first approval polish (T3); full database reset
- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit primary auth path
- **Session 5** — `emailRedirectTo` fix; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot to Shopify-authoritative; Resend → Supabase SMTP
- **Session 3** — Resend account setup; DNS migration decision
- **Session 2** — Setup flow status-filter bug fix
- **Session 1** — RLS-blocked vendor-request flow fix; admin API hardening

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

**Operator note:** David Butler is an **online reseller** (Zen Forged LLC, ZenForged Finds online sales). He is not a physical storefront operator at any mall. In-person vendor onboarding sessions are deliberate scheduled meetups, not incidental. This matters for scoping — "in person" is a product choice, not a default.

**Tagline (committed session 15):** *Embrace the Search. Treasure the Find. Share the Story.* Anchored in `docs/DECISION_GATE.md`. First in-product surfacing: Find Map closer, v1.1l.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v1.1l for the visual + interaction system. v1.2 post-flow trilogy spec approved session 28 lives in `docs/design-system-v1.2-build-spec.md` (build doc, not decision doc) + three mockups in `docs/mockups/`.

**Design process:** Mockup-first, not spec-first. Any UI-touching work gets a mockup FIRST (phone-frame HTML in `docs/mockups/`), plain-English decisions via `ask_user_input_v0`, build spec written AFTER approval as dev-handoff. Locked session 28. See `docs/DECISION_GATE.md` Tech Rules + `MASTER_PROMPT.md` Design agent section.

**Architecture canonical reference:** See `CONTEXT.md` — refreshed session 26 against v1.1l reality; covers schema, routes, API table, lib catalog, component catalog, auth pattern, design system summary.

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-sonnet-4-6 for caption + story, claude-opus-4-7 for identify — session 27) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope, Shield, Image, Upload, Loader icons)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)

Design v1.0 fonts (sessions 16+):
  IM Fell English (editorial voice) · Caveat (rare handwritten beats) · system-ui (precise data)
  Loaded via Google Fonts in app/layout.tsx.

v1.1l addition:
  Times New Roman (narrow exception for 36px post-it numeral only — token FONT_POSTIT_NUMERAL)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com (for lib/email.ts absolute URLs)
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request + /api/admin/featured-image + /api/my-posts/[id] — v1.2)
RESEND_API_KEY                   Server-only Resend API key for lib/email.ts transactional emails (session 8)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails).

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains
**Authoritative nameservers:** Shopify's default nameservers
**DNSSEC:** Off

Key records (via Shopify DNS): A `@` → `23.227.38.65`, CNAME `app` → Vercel, Resend DKIM + SPF + MX on `send`/`resend._domainkey`. Full record list in session-14 archive.

**Dormant:** Cloudflare account has nameservers assigned but is not authoritative. Leftover from session 3's Path B plan.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅ — **site_settings (v1.1l, RLS disabled by design, anon-read service-role-write)**
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **site_settings table (v1.1l):** `key text PRIMARY KEY, value jsonb, updated_at timestamptz, updated_by uuid`. Seed rows: `featured_find_image_url`, `find_map_banner_image_url` (both `{"url": null}` initially). Anon reads OK, writes via service role via `/api/admin/featured-image`.
- **Storage buckets:**
  - `post-images` — PUBLIC (vendor post images)
  - `site-assets` — PUBLIC (admin-uploaded hero banners, v1.1l)
- **Auth:** Magic link (OTP) via email, 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraints on vendors** (ALL FOUR):
  - `vendors_pkey` PRIMARY KEY (id)
  - `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision per session 13
  - `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve
  - `vendors_user_id_key` UNIQUE (user_id) — one vendor row per auth user

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch`
- Server: first line of every `/api/admin/*` handler: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes: `requireAuth()`

**Redirect-preservation pattern (session 5 + session-9 KI-003 unification):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only
- `/login` reads BOTH `?redirect=` (approval email) AND `?next=` (magic link round-trip)

**Email pattern (session 8):**
- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery. Returns `{ ok, error? }`, never throws.

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop (`-2`, `-3`, …)
- All collision errors return `{error, diagnosis, conflict}` for UI rendering

**Admin sign-in pattern (v1.1k session 23 + orphan fix session 25):**
- `/admin/login` route — dedicated PIN entry for admin audience
- POST `/api/auth/admin-pin` with `{pin}` → server verifies + returns `{otp, email}`
- Client calls `supabase.auth.verifyOtp({email, token, type: "email"})` → `router.replace("/admin")`
- `/admin` unauth gate redirects here (not `/login`)

**Featured banner pattern (v1.1l session 24):**
- `lib/siteSettings.ts:getSiteSettingUrl(key)` — anon read, returns `string | null`
- `/api/admin/featured-image` POST `{base64DataUrl, settingKey}` — admin-only upload + site_settings upsert
- `<FeaturedBanner>` renders null when URL is absent (graceful collapse)

**Vendor post-edit pattern (v1.2 session 28 — spec approved, code sprint session 29):**
- `PATCH /api/my-posts/[id]` — partial update of vendor's own post via `requireAuth` + server-side ownership check. Body whitelist: `{title?, caption?, price_asking?, status?, image_url?}`. Rate-limited 20/60s per user.
- Autosave pattern: client debounces field edits 800ms, PATCHes changed field only, inline success/error feedback.
- Status toggle + photo replace are immediate writes (explicit user gestures, different UX contract).

---

## WORKING ✅
- Discovery feed, magic link auth, Admin PIN login (via `/admin/login`), OTP delivery
- Magic link `?redirect=` + `?next=` preserved across round trip (unified session 9)
- My Booth, Post flow, Post preview, Find detail, Public shelf
- Vendor request flow, Vendor account setup, admin approval workflow
- RLS — 12 policies + vendor_requests (service role only); site_settings intentionally no RLS (public read, service-role write)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min, `/api/auth/admin-pin` 5 req/min per IP
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates for Magic Link and Confirm Signup
- Transactional email receipt + approval via `lib/email.ts`
- Agent roster: Dev · Product · Docs · Design active
- **KI-001, KI-002, KI-003, KI-004 all resolved (sessions 9 + 13)**
- Flow 2 onboarding end-to-end verified working on iPhone (session 9)
- `/setup` 401 race absorbed with retry+backoff (session 10)
- Design agent activated, `docs/design-system.md` at **v1.1l** (sessions 15–24)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes
- Admin-editable hero banners on Home + Find Map (v1.1l, session 24 — migration applied session 25)
- AI caption regression resolved session 27 — model swap + `source` observability
- **v1.2 post-flow trilogy design approved session 28** — three mockups + build spec on disk, code sprint queued session 29

### Design v1.1l — shipped + verified on device (session 24 + session 25 verification)
- **`<StickyMasthead>`** primitive — all 6 mastheads migrated. Scroll-linked bottom hairline past `scrollY > 4`.
- **`<FeaturedBanner>`** primitive — Home (eyebrow) + Find Map (overlay). Both admin-editable via `/admin` → Banners tab.
- **`site_settings` table + `site-assets` storage bucket** — migration applied session 25.
- **`/api/admin/featured-image`** upload route.
- **Find Map closer rework** — spine connects to terminal circle; copy is the tagline fragment (first in-product surfacing).
- **X glyph strokeWidth 1.5 → 2.2** on Find Map + Find Detail.
- **Vendor name italic retires on Find Map** — IM Fell non-italic 18px.
- **Post-it 36px numeral font** — Times New Roman (narrow exception; `FONT_POSTIT_NUMERAL` token).
- **Post-it numeral auto-scale** — `boothNumeralSize(boothNumber)`: 36/28/22px.
- **BottomNav idle color** — `v1.inkMuted` (`#6b5538`).

### Design v1.1k — activation flow pass (session 23 + orphan fix session 25)
- **`/vendor-request`**, **`/login`** (curator-only; PIN tab retired), **`/admin/login`** (NEW dedicated route with Shield glyph), **`/setup`** — all Mode C chrome against v1.1k primitives.
- **`/admin` unauth gate redirect** — to `/admin/login`.

### Design v1.2 — approved session 28, code sprint pending session 29
- **Three approved mockups in `docs/mockups/`:** `add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`.
- **Build spec:** `docs/design-system-v1.2-build-spec.md` (dev-handoff doc; David doesn't need to read).
- **Scope:** retire `/post` to redirect shim; rewrite `/post/preview` as "Review your find" with full-photo-no-crop treatment; new `/find/[id]/edit` with autosave + Available/Sold toggle + Replace-photo + Remove-from-shelf link.
- **New primitives:** `<AddFindSheet>`, `<PhotographPreview>`, `<PostingAsBlock>`, `<AmberNotice>`.
- **New API route:** `PATCH /api/my-posts/[id]`.
- **Code sprint estimate:** 3–4 hours session 29.

### Infrastructure
- **App-wide background paperCream `#e8ddc7` globally committed** (session 17)
- **BottomNav minimal chrome patch + v1.1l idle color** — full Nav Shelf rework still deferred

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None._ All KIs closed. Design debt empty. Last tech work before beta-ready is Sprint 4 tail (open, not a blocker) + v1.2 code sprint (spec approved session 28, code sprint queued session 29).

### 🟡 Remaining pre-beta tech work
- **v1.2 post-flow trilogy code sprint** — spec approved session 28; code queued for session 29. ~3–4 hours. See `docs/design-system-v1.2-build-spec.md` + three mockups in `docs/mockups/`. Delivers: retire `/post` → sheet from `/my-shelf`; refreshed Review page with truth-rule photo treatment; new Edit Listing page with Available/Sold toggle. First vendor-visible feature since session 24.
- **Sprint 4 tail batch** — longest-parked pre-beta item.
  - 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
  - 🟡 T4b — admin surface consolidation. `/admin/login` keep-vs-fold disposition (now grounded in a real dedicated route); `/shelves` AddBoothSheet retirement; admin BottomNav cleanup; possibly new Add-Vendor sub-flow per onboarding-journey.md Flow-2 scope. ~4 hours.
  - 🟡 T4d — pre-beta QA pass walking all three flows end-to-end against a clean DB. ~1–2 hours.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.
- **Anthropic model audit + billing safeguards** (session 28G/28H follow-ons). ~30 min combined. Swap `/api/suggest` to Opus 4.7; enable Anthropic auto-reload; add pre-beta credit floor checklist item.

### 🟡 Sprint 5 + design follow-ons
- **`<MallSheet>` migration to `/vendor-request`** — v1.2 wires it to `/my-shelf`/Add sheet; `/vendor-request` still deferred per v1.1k (h). Pick up whenever next activation-flow design pass runs.
- **Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **Guest-user UX parked items:** Home masthead + BottomNav "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB-backed).
- **Known-Gaps reconciliation Tech Rule promotion** — proposed session 26, still not promoted. ~15 min at any session close.

### 🟡 Sprint 3 leftovers still pending beta invites
- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage (12MB guard in admin banners editor session 24; post flow guard predates)
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory
- Post-MVP: 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- `lib/posts.ts:uploadPostImage` deprecated (anon client, can't see bucket through RLS)
- `lib/posts.ts:uploadVendorHeroImage` active — used for vendor hero banners specifically
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- `docs/design-system-v1.2-draft.md` — tombstone pointer; retire after session 29 code sprint completes
- Design v0.2 components deleted across sessions (LocationStatement, BoothLocationCTA, ExploreBanner, TabSwitcher, MallHeroCard, BoothFinderCard)
- `components/ShelfGrid.tsx` — parked with retention comments (session 18); zero current callers
- Mockup HTML files in `docs/mockups/` — many historical records can retire once on-device QA confirms their respective versions hold. No urgency.

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
mkdir -p app/api/your-route-name
```

Commit and push (atomic, keep chained):

```bash
git add -A && git commit -m "..." && git push
```

Source `.env.local` into the current shell for a one-off curl with auth:

```bash
cd ~/Projects/treehouse-treasure-search && set -a && source .env.local && set +a
```

Check Supabase auth logs:
```
https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
```

Check Resend delivery logs:
```
https://resend.com/emails
```

Check Vercel function logs:
```
https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
```

Check DNS state:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

Quick site_settings read (v1.1l debug):

```sql
select key, value, updated_at from site_settings
where key in ('featured_find_image_url', 'find_map_banner_image_url');
```

---
