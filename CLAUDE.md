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
> Last updated: 2026-04-19 (session 27 — vendor-reported AI caption regression resolved + Anthropic model deprecation audit + silent-billing failure mode surfaced and mitigated)

**Status:** ✅✅ **Session 27 shipped a hotfix for a vendor-reported regression: the AI caption auto-populate returned random generic strings regardless of what was photographed.** Diagnosed to a double failure: (1) `claude-opus-4-5` model identifier was retired on the Anthropic API ~1 month ago but was still hardcoded in three routes (`/api/post-caption`, `/api/identify`, `/api/story`), so the SDK threw `NotFoundError` on every call; (2) the route handlers had `catch` blocks that silently returned a random `MOCK_RESPONSES` entry with no distinguishable shape, so the client populated the form with whichever hardcoded string the dice picked. Swapped to current models (post-caption → `claude-sonnet-4-6`, identify → `claude-opus-4-7`, story → `claude-sonnet-4-6`) and added a `source: "claude" | "mock"` observability field so the client can tell a real Claude response from a mock fallback.

On-device QA after deploy surfaced a SECOND silent failure mode the model swap didn't fix: the Anthropic account was out of credits, returning HTTP 400 `invalid_request_error` ("credit balance too low"). Same graceful-collapse-to-mock shape as the model-not-found path. David added credits; live QA then showed correct per-photo captions (copper whistling tea kettle test shot identified accurately with matching caption). **The new `source` field was the diagnostic win** — without it, the billing issue would have looked identical to the original regression (wrong captions, no error visible).

**Deep lesson from session 27:** This is the third sibling of the orphan-pattern (session 13 `imageUpload.ts`, session 23 `/admin/login`) and the phantom-blocker pattern (KI-003, sessions 18–25). All three share one shape: **a graceful-collapse path hiding a real failure behind a working-looking UI.** Prevention beats diagnosis — graceful-collapse paths deserve observability. The `source` field is the shape of that fix for AI integrations; the file-creation-verify Tech Rule was the shape for orphans; the proposed Known-Gaps reconciliation rule (still not promoted, see 28F) is the shape for phantom blockers.

**Next session (28) opens with David's choice from the updated candidate queue.** Top-recommended track remains **Sprint 4 tail batch** (T4c copy polish → T4b admin consolidation → T4d pre-beta QA walk) — unchanged from session 26's framing; session 27 was an unplanned hotfix sprint that doesn't shift the queue.

### What shipped this session (27)

**5 files touched, one commit, one deploy, one ops change (Anthropic credits added manually by David).**

**Code changes:**
- `app/api/post-caption/route.ts` — model swap `claude-opus-4-5` → `claude-sonnet-4-6`; added `source: "claude" | "mock"` field to all three response paths (real Claude, no-key mock, on-error mock); `reason` field distinguishes no-key from error
- `app/api/identify/route.ts` — model swap `claude-opus-4-5` → `claude-opus-4-7` (Opus tier retained for reseller comp-quality stakes; Opus 4.7 has meaningfully better low-level vision perception)
- `app/api/story/route.ts` — model swap `claude-opus-4-5` → `claude-sonnet-4-6` (text-only, narrow task)
- `app/post/page.tsx` — `generateCaption` helper now checks `data.source !== "claude"` and returns empty fields so the amber "Couldn't read this image automatically" notice fires on any non-Claude response
- `app/post/preview/page.tsx` — same guard on `generateTitleAndCaption`

**NOT touched this session:**
- `app/api/suggest/route.ts` uses `claude-opus-4-6` (still live, not a regression). Flagged as 28-queue follow-on for next model audit pass.

**Ops changes:**
- David added credits to the Anthropic account via the console. Account was at zero — had drained through accumulated vision calls over prior weeks of testing. Pre-beta operational risk, see new DECISION_GATE entry below.

**Verification:**
- ✅ `npm run build` green
- ✅ Commit pushed, Vercel deployed clean
- ✅ On-device QA (iPhone 26, Chrome, `app.kentuckytreehouse.com/post`) showed the amber notice correctly firing pre-credit-add, and correct per-photo caption post-credit-add ("Vintage copper whistling tea kettle" + matching caption on the test photo)
- ✅ Vercel function logs confirmed the real error path was the HTTP 400 billing response, not the model string — which retroactively validated the model swap was correct

### Discipline notes — what session 27 teaches

**1. The graceful-collapse sibling pattern.** Orphan files, phantom blockers, and silent mock fallbacks all present the same way from outside the code: build is green, app doesn't crash, docs look self-consistent, but the actual behavior is wrong. Each one was caught only when a human looked at the actual output. Each fix moves the detection earlier:
- File-creation verify (session 25) catches orphans at session close.
- Known-Gaps reconciliation (proposed session 26, still not promoted) would catch phantom blockers at session close.
- The `source: "claude" | "mock"` field (session 27) catches silent mock fallbacks at runtime.

**2. The AI dependency surface has TWO silent failure modes, not one.** Model deprecation (code-visible, grep-catchable) and billing (ops-visible, grep-invisible). A code audit would miss the billing one; a billing check would miss the deprecation one. Both need their own mitigation.

**3. The test photo (copper kettle) was a good demonstrator.** Non-branded vintage object with distinctive material, clear lighting, identifiable form. Worth using again as a canonical QA test shot for vision-dependent features.

### Session 27 close HITL — done

1. ✅ Model swap code changes committed
2. ✅ Client-side `source` guard committed
3. ✅ Deploy to Vercel green
4. ✅ Anthropic credits topped up
5. ✅ On-device QA passed
6. ✅ CLAUDE.md updated with session 27 close block (this file)
7. 🔴 **TODO at next commit:** `docs/DECISION_GATE.md` Risk Register updated (below) — NEEDS ONE MORE `git push` AFTER THIS RECONCILIATION EDIT LANDS

### Session 28 candidate queue (updated)

- **28A — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). **Unchanged from session 26’s recommendation — genuinely the longest-parked pre-beta item.** Recommended opener. T4c ~30 min, T4b ~4 hr, T4d ~1–2 hr.
- **28B — `<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Mechanical work against committed primitive. ~2 hours.
- **28C — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups).
- **28D — Guest-user UX batch:** Home masthead + BottomNav "Sign in" → "Curator Sign In" rename; `/welcome` guest landing; PWA install prompts; vendor onboarding Loom; bookmarks persistence migration.
- **28E — Post-beta candidates** (3A Find Detail sold landing, feed pagination, ToS/privacy, Sentry, feed content seeding, Tally.so feedback).
- **28F — Known-Gaps reconciliation rule promotion to DECISION_GATE** (~15 min — proposed session 26, still not promoted; pairs with session-27 lessons).
- **28G — NEW: Anthropic model audit pass** (~15 min — `/api/suggest` → Opus 4.7; verify no other stale model strings. Per new DECISION_GATE rule proposed session 27.) Pairs well as a lead-in to 28A if David wants a warm-up task.
- **28H — NEW: Anthropic billing safeguards** (~15 min ops — enable auto-reload in Anthropic console; add pre-beta ops checklist item for min credit balance before vendor demos). Per new DECISION_GATE rule proposed session 27.

**Recommended for session 28: 28A (Sprint 4 tail)** — unchanged. But if David wants ~30 min of lower-stakes warm-up, 28G + 28H clear out the session-27 follow-ons cleanly before diving into T4.

---

## ARCHIVE — What was done earlier (2026-04-19, session 26 — documentation reconciliation)
> Last updated: 2026-04-19 (session 26 — CLAUDE.md + CONTEXT.md + memory reconciled; KI-003 stale framing struck; candidate queue restored to honest state)

**Status:** ✅ **Session 26 was a documentation reconciliation pass, not a code sprint.** Session opener's standup surfaced a material contradiction: CLAUDE.md had been carrying "KI-003 diagnosis (pre-beta blocker, longest-parked)" across 17 consecutive session closes (18 through 25), while `docs/known-issues.md` Resolved section, `docs/DECISION_GATE.md` Risk Register, `docs/onboarding-journey.md` T4c entry, and CLAUDE.md's own session-9 archive line all correctly recorded KI-003 as resolved session 9 with a three-part fix verified end-to-end on device. The stale framing had also propagated into the Anthropic-generated memory summary ("top of mind: KI-003 diagnosis is the top priority for the next session"), which meant every new session's memory-informed opener started from a false premise.

David confirmed option A: KI-003 is genuinely fixed; CLAUDE.md is stale. Session 26 reconciled in-session:
1. Two explicit memory user-edits written via `memory_user_edits` tool — one striking KI-003 as open, one naming Sprint 4 tail as the actual longest-parked pre-beta item.
2. Full CONTEXT.md rewrite — was 18 sessions stale (last touched 2026-04-07, pre-v1.1), now documents v1.1l reality: 16 sections covering product model, tech stack with dual-font commitment + Times New Roman exception, full env var list, Supabase schema including `site_settings` + extended mall/vendor fields + all four unique constraints, complete route map split across shopper/auth/admin/reseller, full API route table with auth pattern per route, current lib catalog with deprecation notes, current component catalog with v1.1 primitives + v0.2 legacy + retired lists, auth+server pattern section (bearer-token Option B), email pattern, vendor approval pattern with KI-004 constraint handling, admin sign-in pattern, featured banner pattern, design system v1.1l summary pointing at `docs/design-system.md` for the canonical spec, user flows A–E (shopper browse, shopper save, vendor onboard three sub-flows, vendor post, reseller intel), reseller layer data model + comp pipeline + pricing logic, DNS state with dual email channels, full known constraints list (zsh/git/Next.js 14/framer-motion/Supabase/Safari/Vercel/tool-environment), current dev state with all resolved KIs + open pre-beta + Sprint 5 items + parked Sprint 6+ + cleanup, roadmap, and how-to-use pointers to the companion docs.
3. CLAUDE.md rewrite (this file) — strikes KI-003 from Known Gaps + candidate queue + Status framing; installs Sprint 4 tail as honest longest-parked pre-beta item; adds session 26 close block.

**Next session (27) opens with David's choice from the reconciled candidate queue.** The top-recommended track is now **Sprint 4 tail batch** (T4c remainder copy polish → T4b admin surface consolidation → T4d pre-beta QA walk) — genuinely the longest-parked pre-beta item, and the last tech work before beta-ready. 26C CONTEXT.md refresh shipped this session.

### What shipped this session (26)

**No production code changes.** Two-file doc reconciliation + two memory edits.

**Files touched:**
- `CONTEXT.md` — full rewrite against v1.1l reality. 16 sections. Replaces a 2026-04-07 snapshot that predated: v1.0 design direction, v1.1d–v1.1l design-system sessions, `lib/adminAuth.ts`, `lib/authFetch.ts`, `lib/email.ts`, `lib/imageUpload.ts`, `lib/siteSettings.ts`, `<MallSheet>` / `<StickyMasthead>` / `<FeaturedBanner>` / `<BoothPage>` primitives, the `site_settings` table + `site-assets` bucket, four mall-identity and location-extended vendor fields, the bearer-token auth pattern, the `vendor_requests` service-role gating, magic-link OTP as primary, custom domain, transactional email infra, constraint-aware vendor approval, admin diagnostic UI, `/admin/login` as a dedicated route, and 12 RLS policies. The refresh was overdue and was the structural cause of the KI-003 drift.
- `CLAUDE.md` (this file) — Status block rewritten; Top-of-mind memory entries struck and replaced; Known Gaps reconciled; session 26 candidate queue renumbered; session 25 archive preserved verbatim; session-26 close block added.
- Memory — two `memory_user_edits` entries added: (1) KI-003 resolved session 9, (2) Sprint 4 tail is longest-parked pre-beta.

**Verification (session-25 file-creation verify discipline, applied to doc rewrites):**
- ✅ `filesystem:read_text_file` on both CONTEXT.md and CLAUDE.md before commit to confirm on-disk state matches written state
- ✅ `npm run build` — green (no code touched, but run anyway to confirm no doc syntax broke anything, e.g. README-embedded code blocks)

### Discipline notes — what this reconciliation teaches

**The orphan-pattern has a sibling: the phantom-blocker pattern.** Session 13's `lib/imageUpload.ts` and session 23's `app/admin/login/page.tsx` orphans were documented-as-shipped files that weren't on disk. KI-003's phantom-blocker status is the reverse shape: a fix documented-as-shipped in three other canonical docs, correctly on disk, but still being dragged forward in CLAUDE.md's "open blockers" list across 17 session closes. Both shapes have the same root cause — the Docs agent's session close ritual writes what was ATTEMPTED or what was the FOCUS, not what was VERIFIED AGAINST GROUND TRUTH.

**The session-25 file-creation-verify Tech Rule doesn't catch this.** That rule verifies NEW files exist on disk. KI-003 is about a STATUS that had already been correctly logged elsewhere but was still being restated as open in CLAUDE.md's Known Gaps section. No file verification would have caught it — only cross-doc reconciliation at session close would.

**Proposed Tech Rule for DECISION_GATE** (not yet promoted — flagged for session 27 to decide):
> **Known-Gaps reconciliation at session close.** When the Docs agent writes a session close, any item listed in CLAUDE.md's "Known Gaps → Pre-beta blockers" or "Remaining pre-beta tech work" sections MUST be cross-referenced against `docs/known-issues.md` Resolved section and `docs/DECISION_GATE.md` Risk Register before closing. If any of those canonical sources records the item as resolved, it must be struck from CLAUDE.md's Known Gaps sections in the same close. Cost per item is one grep/read — cheap insurance against the 17-session drift that bit sessions 18–25 with KI-003.

**The deeper structural lesson:** `CLAUDE.md` and `CONTEXT.md` had drifted far enough apart that new-session openers were getting contradictory signals (CLAUDE.md said blocker; CONTEXT.md didn't mention KI-003 at all because the 2026-04-07 snapshot predated it). The refresh this session brings them back into sync. The drift rate is what actually matters — session 26F was parked across four candidate-queue listings before David's "go" this session pulled it in. A periodic CONTEXT.md health check (proposed: every ~10 sessions, not waiting for a drift-induced crisis) would keep this cheaper.

### Session 26 close HITL — already complete

1. ✅ Memory edits applied (`KI-003 resolved session 9` + `Sprint 4 tail is longest-parked`)
2. ✅ `CONTEXT.md` written + read back for verify
3. ✅ `CLAUDE.md` (this file) written + read back for verify
4. ✅ `npm run build` — green
5. ✅ This CLAUDE.md update (final HITL: `thc` to commit the docs reconciliation)

### Session 27 candidate queue (reconciled — KI-003 struck)

- **27A — Sprint 4 tail batch** (T4c remainder copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). **This is the actual longest-parked pre-beta item** and the last tech work before beta-ready. T4c is S-effort (~30 min: `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy). T4b is M-effort (~4 hours: `/admin/login` keep-vs-fold disposition now that the route is a real dedicated surface, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow per onboarding-journey.md Flow-2 scope). T4d is S-effort + High-value (~1–2 hours: walk Flow 1/2/3 end-to-end against a clean DB). **Recommended opener.**
- **27B — `<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Mechanical work against committed primitive; deferred explicitly in v1.1k (h). ~2 hours.
- **27C — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **27D — Guest-user UX batch:** Home masthead + BottomNav "Sign in" → "Curator Sign In" rename (v1.1k partially did this — `/login` says "Curator Sign in" — but the entry-point affordances still say "Sign in"); `/welcome` guest landing for signed-in non-vendors; PWA install prompts; vendor onboarding Loom; bookmarks persistence migration (localStorage → DB-backed).
- **27E — Post-beta candidates surfacing now that design is landed:** 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal, feed pagination, ToS/privacy, error monitoring (Sentry or structured logs), feed content seeding (10–15 real posts), beta feedback mechanism (Tally.so).
- **27F — Known-Gaps reconciliation rule promotion to DECISION_GATE** (~15 min — promote the proposed Tech Rule from this session's discipline note into the canonical list).

**Recommended for session 27: 27A (Sprint 4 tail)** — longest-parked pre-beta, clears the path to beta-ready, and T4b is genuinely cleaner now that `/admin/login` is a real dedicated route rather than a theoretical one.

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

**Design canonical spec:** See `docs/design-system.md` v1.1l for the visual + interaction system. All multi-screen UI work scopes against it before code.

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
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request + /api/admin/featured-image)
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
- **CONTEXT.md refreshed to v1.1l reality (session 26)** — replaces 2026-04-07 snapshot that had become 18 sessions stale

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

### Infrastructure
- **App-wide background paperCream `#e8ddc7` globally committed** (session 17)
- **BottomNav minimal chrome patch + v1.1l idle color** — full Nav Shelf rework still deferred

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 26 close._ KI-003 was resolved session 9 (three-part fix, Flow 2 verified on device); the phantom-blocker framing that carried it across sessions 18–25 was struck this session. All four KIs are closed. Design debt is empty. Last tech work before beta-ready is the Sprint 4 tail batch, which is open but is not a blocker.

### 🟡 Remaining pre-beta tech work
- **Sprint 4 tail batch** — longest-parked pre-beta item as of session 26.
  - 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
  - 🟡 T4b — admin surface consolidation. `/admin/login` keep-vs-fold disposition (now grounded in a real dedicated route); `/shelves` AddBoothSheet retirement; admin BottomNav cleanup; possibly new Add-Vendor sub-flow per onboarding-journey.md Flow-2 scope. ~4 hours.
  - 🟡 T4d — pre-beta QA pass walking all three flows end-to-end against a clean DB. ~1–2 hours.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.

### 🟡 Sprint 5 + design follow-ons
- **`<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Deferred explicitly in v1.1k (h). ~2 hours.
- **Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **Guest-user UX parked items:** Home masthead + BottomNav "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB-backed).
- **Known-Gaps reconciliation Tech Rule promotion** — proposed this session, not yet in DECISION_GATE. ~15 min at session 27 close.

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
- Post-MVP: 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- `lib/posts.ts:uploadPostImage` deprecated (anon client, can't see bucket through RLS)
- `lib/posts.ts:uploadVendorHeroImage` active — used for vendor hero banners specifically
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
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
