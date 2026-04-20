# Treehouse — Session Archive

> Append-only log of session close summaries. Session 1 is at the bottom, most recent at the top.
> CLAUDE.md holds only the current session's whiteboard. Everything older lives here.
> Split out of CLAUDE.md during session 28 structural cleanup (2026-04-19).

---

## Session 27 — AI caption regression hotfix (2026-04-19)

**Status at the time:** ✅✅ Session 27 shipped a hotfix for a vendor-reported regression: AI caption auto-populate returned random generic strings regardless of what was photographed. Root cause was a double failure — (1) `claude-opus-4-5` model identifier was retired on Anthropic API ~1 month ago but still hardcoded in three routes (`/api/post-caption`, `/api/identify`, `/api/story`), so the SDK threw `NotFoundError` on every call; (2) route handlers had `catch` blocks that silently returned random `MOCK_RESPONSES` entries with no distinguishable shape, so the client populated the form with whichever hardcoded string the dice picked.

Swapped to current models (post-caption → `claude-sonnet-4-6`, identify → `claude-opus-4-7`, story → `claude-sonnet-4-6`) and added `source: "claude" | "mock"` observability field. On-device QA post-deploy surfaced a SECOND silent failure: Anthropic account was out of credits (HTTP 400 `invalid_request_error`). David topped up credits; live QA confirmed correct per-photo captions. The `source` field was the diagnostic win — without it, billing issue was invisible.

**Deep lesson:** graceful-collapse paths need observability. Third sibling of orphan-pattern (sessions 13, 23) and phantom-blocker (KI-003, sessions 18–25). All three shared one shape: a graceful-collapse path hiding a real failure behind a working-looking UI.

5 files touched: `/api/post-caption`, `/api/identify`, `/api/story` model swaps + `source` field; `/post` and `/post/preview` client guards on `data.source !== "claude"`; `/api/suggest` flagged as stale `claude-opus-4-6` (not a regression). Two Tech Rules added to DECISION_GATE: Anthropic model audit + billing as silent dependency.

---

## Session 26 — documentation reconciliation (2026-04-19)

**Status at the time:** ✅ Session 26 was a documentation reconciliation pass, not a code sprint. Session opener surfaced a material contradiction: CLAUDE.md had been carrying "KI-003 diagnosis (pre-beta blocker, longest-parked)" across 17 consecutive session closes (18 through 25), while `docs/known-issues.md`, `docs/DECISION_GATE.md` Risk Register, `docs/onboarding-journey.md`, and CLAUDE.md's own session-9 archive line all correctly recorded KI-003 as resolved session 9.

Two memory user-edits written, full CONTEXT.md rewrite (16 sections covering v1.1l reality — was 18 sessions stale), CLAUDE.md Status block rewritten. The "phantom-blocker" pattern named: the orphan-file pattern has a sibling where a resolved status keeps being restated as open across close blocks. Proposed Known-Gaps reconciliation Tech Rule (finally promoted to DECISION_GATE session 28).

---

## Session 25 — v1.1k `/admin/login` orphan + v1.1l `site_settings` migration (2026-04-19)

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

## Session 23 — v1.1k activation flow pass (2026-04-18)

**Status at the time:** Session claimed the v1.1k activation flow pass shipped in full: `/vendor-request`, `/login`, `/setup`, new `/admin/login`. Build green, commit pushed.

**Correction logged session 25:** `app/admin/login/page.tsx` was documented as shipped but was never on disk. The `mkdir -p` ran successfully — that part verified — but the subsequent `filesystem:write_file` call did not actually land the file. Same class of bug as session 13's `lib/imageUpload.ts` orphan. Session 25 wrote the file from the documented spec; it is now on disk and verified on device.

The four files that DID ship correctly in session 23: `app/vendor-request/page.tsx` (full rewrite), `app/login/page.tsx` (full rewrite, ~35% shorter), `app/setup/page.tsx` (full rewrite), and `app/admin/page.tsx` (one-line surgical redirect update to `/admin/login`).

**v1.1k commitments in `docs/design-system.md`:** (a) Mode C interior grammar for task-first surfaces, (b) paper-wash 60px success bubble primitive, (c) filled green CTA for commit actions only, (d) form input primitive, (e) email echo line primitive, (f) Mode C tab switcher retires, (g) `/admin/login` scope committed, (h) `<MallSheet>` migration to `/vendor-request` deferred.

---

## Session 22A — v1.1j QA polish pass (2026-04-18)

Six-point Status paragraph advancing v1.1i → v1.1j. (a) Diamond ornament retires. (b) Booth numbers switch to `FONT_SYS` globally (1-vs-I disambiguation). (c) `/my-shelf` Window View renders 9-cell placeholder composition for owner. (d) `<AddFindTile>` joins Shelf View for owner. (e) Find Map closer closes the loop. (f) Home masthead logo enlarges 24/0.72 → 34/0.92.

---

## Session 21A — v1.1i code sprint (2026-04-18)

**Status:** v1.1i shipped in two same-session commits. Commit 1: `<MallSheet>` primitive NEW + `app/page.tsx` full rewrite (paper masonry + feed hero) + Find Detail 3B sold landing state + `app/flagged/page.tsx` `isSold` retirement + `components/MallHeroCard.tsx` DELETED. Commit 2: sticky mastheads across 5 pages + MallSheet centering fix (transform-free) + paper-tone drop-shadows on product photographs.

**Three-part v1.1i sold contract locked:** bookmark key kept when a saved find sells + Find Map tile renders identically to available + Find Detail 3B IS the reveal. Breaking any one breaks all three. Do NOT add a status filter to `getPostsByIds`.

---

## Session 20 (2026-04-18)

Pure design-direction session; v1.1i spec committed; two mockups on disk; no production code changed. David picked **C2** for feed treatment and **3B** for sold landing state. Five questions settled. Follow-on questions on 3B + `/shelf/[slug]` sold retention + Find Map bookmark + tile.

---

## Session 19A (2026-04-18)

Token consolidation cleanup. `lib/tokens.ts` extended with canonical `v1` + `fonts` (`FONT_IM_FELL`, `FONT_SYS`) exports. Inline `v1` objects retired from `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx`. `BoothPage.tsx` re-exports the symbols.

---

## Session 18 — v1.1h Booth page redesign (2026-04-18)

Both `/my-shelf` and `/shelf/[slug]` rebuilt: banner as pure photograph with booth post-it pinned, vendor name as IM Fell 32px title, pin-prefixed mall+address block, Window View + Shelf View. Four v0.2 components DELETED: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`. `components/BoothPage.tsx` NEW, shared between both Booth pages.

---

## Session 17 (2026-04-18)

Find Detail v1.1e/v1.1f on-device polish (app-wide background to paperCream globally, masthead Title Case, frosted on-image save+share bubbles, status pill retirement, post-it bottom-right with push pin + stacked "Booth Location" eyebrow + `+6deg` rotation). Find Map v1.1g full redesign of `/flagged`. Glyph hierarchy locked: pin = mall, X = booth.

---

## Session 16 (2026-04-18)

Find Detail v1.0 code build + 4 iteration passes v1.0 → v1.1d. BottomNav minimal chrome patch. Nav-shelf exploration mockup (4 approaches, still held for review). Critical tool lesson: `create_file` in the container does NOT write to the Mac filesystem; `filesystem:write_file` is the only reliable write tool.

---

## Session 15 (2026-04-17)

Design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed. Tagline anchor committed: **Embrace the Search. Treasure the Find. Share the Story.** Cartographic vocabulary committed. Material vocabulary committed. Typography rewritten (IM Fell English editorial, Caveat rare, system-ui precise, Georgia + Mono retired).

---

## Session 14 (2026-04-17 late-night)

Booth page v0.2 redesign shipped. `lib/imageUpload.ts` reconstructed mid-session — session-13 orphan pattern. New Tech Rule added: *"A session is not closed until `npm run build` has run green against the committed state of the repo."* Session 25 amended this rule with a companion file-creation verify step.

---

## Session 13 — KI-004 resolved, in-mall diagnostic tooling shipped (2026-04-17 late-night)

`app/api/admin/diagnose-request/route.ts` NEW. `app/api/admin/vendor-requests/route.ts` REWRITE (constraint-aware approval). `app/admin/page.tsx` REWRITE (Diagnose links, inline DiagnosisPanel). `docs/admin-runbook.md` NEW with 9 SQL recipes.

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- Error responses include `diagnosis` code + `conflict` object for UI rendering

**Image uploads — canonical pattern committed:**
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with `image_url: null`.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is active for hero banners specifically.

---

## Earlier sessions (1–12) — condensed

Full history available in git log.

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
> Append new session closes to the top, above session 27.
> Older than ~10 sessions may be condensed to a single line; git log is the authoritative history.
