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
> Last updated: 2026-04-17 late-night (session 14 — Booth page v0.2 redesign shipped; `lib/imageUpload.ts` reconstructed)

**Status:** 🌿 **Session 14 executed the Design agent's first Dev pass against `docs/design-system.md` v0.2.** Booth page redesign landed on both `/my-shelf` and `/shelf/[slug]`. Pre-existing build break on `@/lib/imageUpload` imports (orphaned from session 13's uncommitted image-upload migration) was diagnosed and fixed mid-session so everything ships together. Curator's Statement block was explicitly deferred pending vendor feedback — David's call, not a miss.

### What shipped (one commit, multiple files)

**Session 14 design work:**
1. **`components/LocationStatement.tsx`** (NEW) — canonical location-pattern primitive per v0.2 spec. Two variants (`compact` row-1-only, `full` row-1 + row-2 with address + Directions Link). Two tones (`light` default, `dark` for hero overlays — built in for session 15's Find Detail pass). MapPin 14px icon + mono booth number + system-ui mall + muted city on row 1. Graceful omission when boothNumber is null.
2. **`components/BoothLocationCTA.tsx`** (NEW) — canonical CTA card variant wrapping `<LocationStatement variant="full">` + Secondary button "Explore the full mall" with 14×14 vendor-hue swatch. Routes to `mapsUrl(mallName, city)` until dedicated mall profile page ships (Sprint 6+); button label is future-safe.
3. **`components/ShelfGrid.tsx`** (REWRITE) — three batched changes per v0.2: (a) grid gap 6 → `spacing.tileGap` (10) for more breathing room, (b) `AvailableTile`: pure image, no title overlay, (c) `FoundTile`: 0.5 opacity + full grayscale + italic Georgia "Found a home" caption bottom-left on subtle gradient (replaces the centered translucent badge).
4. **`components/TabSwitcher.tsx`** (EDIT) — inactive label "Found a home" → "Found homes" (plural) per v0.2 terminology table.
5. **`app/my-shelf/page.tsx`** (EDIT) — `BoothFinderCard` → `BoothLocationCTA`, address prop threaded from `mall?.address`, Found-homes empty-state copy removed (icon stays — copy was reading awkward; David's call).
6. **`app/shelf/[slug]/page.tsx`** (EDIT) — same treatment as `/my-shelf` for the public state.
7. **`components/BoothFinderCard.tsx`** (DELETED) — orphan after Task 6; tree kept pruned.

**Session 13 carry-ins (discovered mid-session, shipped together):**
8. **`lib/imageUpload.ts`** (NEW — reconstruction) — Session 13's CLAUDE.md documented this file as "single source of truth" but it was never actually committed. Three consumers (`app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`) had been migrated to import from it, breaking the build. Reconstructed from the documented contract: `compressImage(dataUrl, maxWidth?, quality?)` + `uploadPostImageViaServer(base64DataUrl, vendorId)` (THROWS on failure — callers must try/catch and abort writes). Defensive error handling on both paths.
9. **`app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`, `lib/posts.ts`** (pre-session mods) — session-13 image-upload migration work that was on disk but not committed. Verified consistent with the documented pattern; committed as part of this session to make the build green.

### Curator's Statement block — deferred deliberately
Spec'd in `docs/design-system.md` v0.2 as Georgia italic pull-quote below the hero with owner edit affordance. David pulled it from session-14 scope before Sprint Brief finalization: *"I want a bit more control over how these are configured and identifying if users actually want them."* The `bio` column on `vendors` stays dormant data until vendor-facing feedback shapes the editor pattern. Revisit trigger: post-beta, once 3+ vendors have asked for a way to describe themselves OR once we've heard none have.

### Task-4 ("titles on tiles") mockup-first protocol
Before removing titles from `AvailableTile`, Claude generated a disposable side-by-side mockup showing current vs. v0.2. David approved the no-titles direction with eyes on the comparison. Worth keeping as a pattern: when a design-system change has a visible perceptual cost, mockup the change before code. Adds ~5 minutes to the session and de-risks the biggest bet of the sprint.

### `lib/imageUpload.ts` reconstruction — root cause + lesson
**Root cause:** Session 13 closed without running `npm run build` before `thc`. CLAUDE.md was updated to describe the image-upload pattern as shipped, but the module itself was never created and the four consumer-file migrations were never committed. Session-close captured nothing because nothing was staged.

**New session-close tech rule (added to DECISION_GATE):** *A session is not closed until `npm run build` has run green against the committed state of the repo.* Docs cannot claim files exist on disk that don't. This is the Docs agent's responsibility at `thc`.

### Context for the next session

Booth redesign is done. Next three Design sessions are queued and independent:
- **Session 15 candidate — Find Detail polish:** hierarchy fix (28px Georgia 700 title, 17px italic caption, floating availability pill bottom-left of hero), retire split booth-pill/address card, adopt `<LocationStatement variant="full">` + Secondary "Explore {vendor}'s shelf →" with hue swatch. `<LocationStatement>` already built — this is a composition session, not a primitives session.
- **Session 16 candidate — Feed header + `<MallSheet>`:** Mode B editorial header with logo + user-circle icon, bottom-sheet pattern for mall selector + sign-in affordance. Becomes canonical bottom-sheet for `/post`, `/vendor-request`, Find Map filter.
- **Session 17 candidate — Find Map emotional redesign:** italic Georgia pull-quote opener, dotted green spine with `PiLeaf` markers, CTA card variant for stops, multi-waypoint Apple Maps URL "Open all N stops" button.

Sprint 4 tail is still queued independent of Design:
- **T4c copy polish (orphans C + D)** — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. 🟢 S effort, ~30 min.
- **T4b — admin surface consolidation.** 🟡 M effort, ~4 hours.
- **T4d — pre-beta QA pass** walking all three flows end-to-end. 🟢 S effort, ~1 hour.

### Test data hygiene (nice-to-have, not blocking)
Session 13 live test left 5+ "David Butler" variant vendor_requests and vendor rows scattered in the DB. Still not blocking. Recipe 4 in `docs/admin-runbook.md` is the canonical approach.

### Files touched this session
- **NEW** `components/LocationStatement.tsx`
- **NEW** `components/BoothLocationCTA.tsx`
- **NEW** `lib/imageUpload.ts` (reconstruction of session-13 orphan)
- **REWRITE** `components/ShelfGrid.tsx`
- **EDIT** `components/TabSwitcher.tsx`
- **EDIT** `app/my-shelf/page.tsx`
- **EDIT** `app/shelf/[slug]/page.tsx`
- **DELETE** `components/BoothFinderCard.tsx`
- **COMMIT** pre-existing session-13 mods in `app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`, `lib/posts.ts`
- `CLAUDE.md` (this file) — session 14 close

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped, toast visual polish

**Status:** ✅✅✅ **Session 13 resolved a pre-beta blocker surfaced during live test.** KI-004 closed. In-mall diagnostic UI shipped. Admin runbook created. All 5 QA tests passed on device. Two commits shipped.

### What shipped (2 commits, 5 files)
1. **`app/api/admin/diagnose-request/route.ts`** (NEW) — admin-gated diagnostic endpoint. Takes `requestId`, returns full collision picture: the request row, booth collisions, slug collisions, auth.users row (if any), a diagnosis code, and a human-readable suggested action. Uses `auth.admin.listUsers({ perPage: 1000 })` for email lookup — pragmatic now, won't scale past a few thousand users.
2. **`app/api/admin/vendor-requests/route.ts`** (REWRITE) — constraint-aware approval with pre-flight booth check, auto-suffix slug collision resolution, and named error responses carrying `diagnosis` + `conflict` for UI rendering. Resolves KI-004's original silent-reuse bug AND the slug-collision variant discovered during session 13 live test.
3. **`app/admin/page.tsx`** (REWRITE + polish) — "Diagnose" link on every request, inline DiagnosisPanel component, error toast exposes "Run full diagnosis" button with conflict details. Toast visual polish: `zIndex: 100 → 9999`, solid opaque backgrounds (was rgba 0.08 alpha, caused bleed-through), stronger shadow.
4. **`docs/admin-runbook.md`** (NEW) — 9-recipe SQL runbook for in-mall triage: request state lookup, booth occupancy, freeing a booth, test vendor cleanup, unlinked row audit, auth status lookup, request reset, constraint inspection, deep diagnostic dump.
5. **`docs/known-issues.md`** (UPDATE) — KI-004 moved to Resolved with full session-13 analysis.

### KI-004 — the bug, the diagnosis, the fix

**What we thought it was:** booth-collision silent-reuse (identified session 9).

**What it actually was** (discovered session 13 via live test + Vercel log diagnosis): a BROADER bug. The 23505 handler assumed any duplicate-key error was a booth-constraint violation, but `vendors` has FOUR unique constraints (booth, slug, user_id, pkey). A slug collision would silently fall through to a booth-by-(mall, booth_number) `.single()` lookup that returned zero rows, throwing "Cannot coerce the result to a single JSON object" — surfaced to admin as a generic "Vendor exists but couldn't be loaded" toast. The live repro: two David Butler vendor requests at different booths both trying to create slug `david-butler`, the second hitting `vendors_slug_key` instead of `vendors_mall_booth_unique`.

**The fix policy (committed):**
- Booth collision + unlinked + name match → safe claim (reuse existing row)
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject with named details
- Slug collision → auto-append `-2`, `-3`, … up to 20 attempts (preserves clean URLs for common case, graceful degradation for duplicates)
- All recovery paths use `.maybeSingle()` not `.single()` — zero rows return null instead of throwing
- All error responses include `diagnosis` code + `conflict` object for admin UI rendering

### QA verification (all 5 tests passed on device)
1. Re-approval of stuck `dbutler80020+4@gmail.com` (slug-collision path) — success toast with note "Slug 'david-butler' was taken; assigned 'david-butler-2' instead."
2. Proactive Diagnose on healthy request — green panel, diagnosis `no_conflict`
3. Diagnose on already-claimed booth — red panel, diagnosis `booth_already_claimed`
4. Error toast on blocked approval — diagnosis + conflict details monospace + "Run full diagnosis" button
5. Dismiss + re-open diagnosis — clean state transition

### Toast visual polish — final state
**Working pattern** (keep this, it's load-bearing): outer non-animated `<div>` does `position:fixed; left:0; right:0; bottom:env(...); display:flex; justify-content:center; pointer-events:none`. Inner `<motion.div>` animates opacity+y only and carries `pointer-events:auto`. Framer Motion can't fight the centering because centering lives on the shell.

Session 13 additions: `zIndex: 9999` (was 100 — too low once the content sitting near the toast started being complex), solid opaque backgrounds `#f0ede6` success / `#fff` error (was rgba ~0.08 alpha — let content behind bleed through), `boxShadow` opacity `0.14 → 0.18` (clearer elevation).

### Lesson logged — don't over-engineer presentation bugs
Session 13 included one failed iteration: I pushed a `createPortal(toastNode, document.body)` change to fix the stacking issue, which introduced a regression where Approve button clicks stopped firing entirely. Rolled back to inline render with just the z-index + opacity + shadow fixes. **Rule for future:** when working code has a presentation bug, fix the presentation, not the architecture. Three-line changes are better than portal refactors.

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage`
  and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and
  abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket
  through RLS). Don't use. Logs a warning if something still calls it.
- `lib/posts.ts:uploadVendorHeroImage` is orphaned (my-shelf uses
  /api/vendor-hero directly). Safe to delete next sprint.

### Context for the next session

Sprint 4 is VERY close to done. Remaining items:
- **T4c copy polish (orphans C + D)** — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. 🟢 S effort, ~30 min.
- **T4b — admin surface consolidation** — Add Booth tab in `/admin`, Add Vendor in-person flow, remove Admin PIN from `/login`, remove Booths from BottomNav, retire `AddBoothSheet` from `/shelves`. 🟡 M effort, ~4 hours.
- **T4d — pre-beta QA pass** — walk all three flows end-to-end against `docs/onboarding-journey.md`. 🟢 S effort, ~1 hour.

Then Sprint 4 ships and beta invites unblock.

**Design agent work** (sessions 14–16) remains queued and independent of the Sprint 4 tail:
- Session 14 candidate: Booth page redesign against `docs/design-system.md` v0.2 (the session-13 recommended start that got preempted)
- Session 15 candidate: Find Detail polish
- Session 16 candidate: Feed header + mall bottom sheet
- Session 17 candidate: Find Map emotional redesign

### Test data hygiene (nice-to-have, not blocking)
Session 13 live test left 5+ "David Butler" variant vendor_requests and vendor rows scattered in the DB. None block anything now that approval is collision-aware, but a 5-minute cleanup pass is worth scheduling before beta invites go out. Recipe 4 in `docs/admin-runbook.md` is the canonical approach.

### Files modified this session
- **NEW** `app/api/admin/diagnose-request/route.ts`
- **REWRITE** `app/api/admin/vendor-requests/route.ts`
- **REWRITE** `app/admin/page.tsx`
- **NEW** `docs/admin-runbook.md`
- **UPDATE** `docs/known-issues.md`
- `CLAUDE.md` (this file) — session 13 close

---

## 🌿 Next session opener — either T4 remainder OR Design session 14

Two viable openers depending on energy:

**If you want to ship Sprint 4:**
```
CURRENT ISSUE:
Sprint 4 tail — finish T4b (admin surface consolidation), T4c (copy polish on /api/setup/lookup-vendor error + /vendor-request success), and T4d (pre-beta QA pass walking Flows 1/2/3 against docs/onboarding-journey.md). Start with the Sprint Brief laying out task order, get approval, then execute. Budget ~5 hours across the three items.
```

**If you want to get design moving:**
```
CURRENT ISSUE:
Booth page redesign against docs/design-system.md v0.2. Scope: /my-shelf and /shelf/[slug]. Build <LocationStatement> component, add Curator's Statement block (Georgia italic pull-quote), convert BoothFinderCard to CTA card variant at bottom with full-form Location Statement + "Explore the full mall" Secondary button, terminology pass to "On Display" / "Found homes" / "Found a home". 3-col 1:1 grid preserved with no titles on tiles. Owner "Add" tile as first square. Mode A cinematic header unchanged. Do NOT touch Find Detail, Feed header, or Find Map — those are separate sessions. Start with a Sprint Brief, get approval, then execute.
```

Recommended: Design session 14 first — Sprint 4 tail items are boring-but-important and can be batched into one dedicated session. Design has been waiting longer and the Booth page is the highest-leverage surface for vendor pride (what they'll text friends after you set them up in-mall).

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 12)
> Design agent's first full direction pass shipped; docs/design-system.md v0.2 committed

**Status:** 🪴 **Session 12 was the Design agent's first real pass.** No production code changed. One doc updated: `docs/design-system.md` moved from v0.1 scaffold to v0.2 with committed direction for cross-cutting primitives (typography, headers, buttons, cards, Location Statement) and four priority screens (Booth page both states, Find Detail, Feed header + mall sheet, Find Map). Two mockups generated for Booth page public + owner states. Session 13 was supposed to open with a crisp Dev sprint brief against v0.2, but the in-mall test surfaced KI-004 as a blocker and the Booth redesign deferred to session 14+.

### Key commitments for Dev agent to execute against (Booth redesign)

**Cross-cutting primitives (all committed):**
- **Typography:** Georgia reserved for emotional beats only (hero vendor names, find titles, curator's statements, pull-quote captions, empty-state headlines). system-ui carries ~90% of the chrome (eyebrows, meta, tabs, buttons, body, labels). Mono for booth numbers and data.
- **Header modes:** A (cinematic, over hero image — Booth, Find Detail), B (editorial, sticky blur with logo — Feed, Find Map, admin), C (minimal, back + title — forms and onboarding).
- **Buttons:** 4 variants — Primary (filled green), Secondary (green-tinted bg), Ghost (transparent + border), Link (inline green). Destructive variant = Ghost with red.
- **Cards:** 1 canonical base (surface + border + radius.md + no shadow) with 4 composition variants (Plain, Thumbnail, Metric, CTA).
- **`<LocationStatement>` component:** single-line format `⌂ Booth 369 · Mall name · City` with optional address + Directions link. Compact variant (white, over images) and full variant (inside cards).
- **Terminology:** "Mall" everywhere in UI (Treehouse Spot retired entirely). "On Display" / "Found homes" for tabs. Georgia italic "Found a home" caption for sold tiles.

**Booth page direction (both states):**
- Header Mode A (cinematic hero, no sticky bar)
- 3-column 1:1 square grid preserved — no titles or meta on/under tiles (tap through for the story) — supports future 9-item free-tier limit and matches older-vendor familiar mental model
- Curator's statement (Georgia italic 16px pull-quote) directly under hero
- Tabs "On Display" / "Found homes" (existing TabSwitcher, relabeled)
- Owner "Add" tile as first square in On Display grid (emptyTile bg, dashed green border)
- Sold tiles: 0.5 opacity + grayscale + small italic "Found a home" caption in bottom-left (one exception to no-text-on-tiles rule)
- Location CTA card at bottom: full Location Statement + "Explore the full mall" Secondary button with vendor-hue swatch
- Owner-only: edit-banner pencil top-left of hero, "Edit your story" Link below curator's statement, "Add" tile, Home · My Booth nav

**Find Detail fixes:**
- Title: 28px Georgia 700 (dominant)
- Caption: 17px Georgia italic (pull-quote)
- Availability: floating pill bottom-left on hero image, out of content flow
- Location card: single `<LocationStatement>` full-form + full-width Secondary "Explore {vendor}'s shelf →" with hue swatch

**Feed header + mall sheet:**
- Mode B header: logo + wordmark left, quiet user-circle icon top-right (32×32 ghost)
- Sign-in icon opens bottom sheet (Curator Sign In / Request booth access / browse copy)
- Mall selector becomes `<MallSheet>` — search + scrollable list + "All Malls" default. Canonical bottom-sheet pattern — reused on Find Map filter, /post, /vendor-request.

**Find Map emotional pass:**
- Opening italic Georgia pull-quote ("A Saturday made of stops")
- Dotted green spine at 0.30 alpha, `PiLeaf` icons at each stop, mono "~ 8 min drive" between stops
- Stop cards as canonical CTA card variant
- Bottom "Open all N stops in Maps →" Secondary button (multi-waypoint Apple Maps URL)

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 11)
> Design agent activated, design system scaffolded, agent orchestration tightened

**Status:** 🪴 **Session 11 was a system-infrastructure session, not a feature session.** Four docs updated to activate the Design agent and establish `docs/design-system.md` as canonical source of truth for all multi-screen UI work. DECISION_GATE Agent Roster expanded; MASTER_PROMPT standup updated with Design agent hooks; `docs/design-system.md` v0.1 scaffolded.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 10)
> /setup 401 race polish shipped; T4c orphan cleanup A/B/E shipped; onboarding journey is now both working AND clean end-to-end

**Status:** ✅✅ **Session 10 polished the onboarding journey that Session 9 unblocked.** Two commits shipped.

### What shipped (2 commits)
1. **Orphan cleanup (T4c partial — A + B + E)** — `app/page.tsx` EmptyFeed "Add a Booth" button removed; `app/my-shelf/page.tsx` NoBooth "Post a find" button removed; `app/api/debug-vendor-requests/route.ts` deleted.
2. **`/setup` 401 race polish** — `setupVendorAccount()` in `app/setup/page.tsx` now retries once with 800ms backoff on 401 response. Absorbs the ~500ms Supabase token-replication window that was flashing "Setup Incomplete" before `/my-shelf` self-heal caught it.

### Orientation lock check (no-op discovery)
Verified `public/manifest.json` already has `"orientation": "portrait"` on line 8 — locks installed PWA.

### Supabase cleanup (pre-session)
Three-orphan cleanup SQL ran before coding: `John Doe / 1234`, `Claude Code / 123`, `David Butler / 123 at AAM` deleted. KI-004 collision hazards cleared.

---

## ARCHIVE — What was done earlier (2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002
**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`.
**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern (outer non-animated div does `position:fixed; left:0; right:0; flex justifyContent:center`, inner motion.div animates only opacity+y).

### Phase 2 — KI-003 diagnosis
Clean-slate Flow 2 repro revealed two cascading bugs: `/login` mount useEffect read `searchParams.get("next")` but approval email uses `?redirect=/setup`; approve endpoint's 23505 duplicate-key handler silently reuses existing vendors row on booth collision (deferred as KI-004, now RESOLVED session 13).

### Phase 3 — KI-003 three-part fix
Fix 1: `app/login/page.tsx` — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`.
Fix 2: `app/post/page.tsx` — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy.
Fix 3: `app/my-shelf/page.tsx` — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as self-heal before falling through to NoBooth.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging
Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` for 401 branch observability. Retry-with-backoff deferred to session 10.

### Phase 5 — End-to-end verification
Flow 2 onboarding end-to-end verified working on iPhone.

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)
- **`docs/onboarding-journey.md`** created as canonical spec. Three flows committed: Pre-Seeded, Demo, Vendor-Initiated.

### Phase 2 — T4a email infrastructure
- **New file: `lib/email.ts`** (~260 lines) — Resend REST API wrapper
- **Wired into:** `app/api/vendor-request/route.ts` + `app/api/admin/vendor-requests/route.ts`
- **End-to-end QA verified:** Email #1 (receipt) and Email #2 (approval) both arriving in production

### Phase 3 — QA issues logged
KI-001, KI-002, KI-003 logged to `docs/known-issues.md`.

---

## ARCHIVE — What was done earlier (2026-04-17 late evening, session 7)
> Sprint 4 T3 shipped, onboarding fragility exposed, scope-out flagged

### T3 — `/admin` mobile-first approval polish ✅
Rewrote `app/admin/page.tsx` to polish the in-person approval moment. Removed obsolete copy-paste email template flow.

### Database reset — full clean slate
Executed 7-block SQL cleanup. Plus storage pass deleting 25 orphaned image files.

### QA pass findings — three onboarding failures from one clean slate
1. Approve endpoint sent no email
2. No organic path to `/setup` from `/login`
3. `/my-shelf` showed stale localStorage identity after device cache survived DB reset

---

## ARCHIVE — Earlier sessions (1–6)
> Condensed for brevity — full history available in git log

- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit code entry primary auth path; meta-agent work (Dev · Product · Docs active)
- **Session 5** — `emailRedirectTo` fix + strategic Sprint 4+ scoping; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot Path B → Path A (Shopify authoritative); Resend → Supabase SMTP; Yahoo magic link verified
- **Session 3** — Resend account setup; DNS migration decision (later reversed in session 4)
- **Session 2** — Setup flow status-filter bug fix: `lookup-vendor` `.eq("status", "pending")` → `.neq("status", "rejected")`
- **Session 1** — RLS-blocked vendor-request flow fix; admin API hardening with `requireAdmin` + service role

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

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v0.2 for the visual + interaction system. All multi-screen UI work scopes against it before code.

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes. 9 recipes covering request state, booth occupancy, freeing booths, test vendor cleanup, and deep diagnostic dumps. For 95% of admin issues, the Diagnose panel on `/admin` is sufficient — the runbook covers the remaining 5%.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)
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
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request)
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

**Live records (via Shopify DNS):**
- A `kentuckytreehouse.com` → `23.227.38.65` (Shopify)
- AAAA `kentuckytreehouse.com` → `2620:0127:f00f:5::`
- CNAME `www` → `shops.myshopify.com`
- CNAME `account` → `shops.myshopify.com`
- CNAME `app` → `d21d0d632a8983e0.vercel-dns-017.com.` (Vercel)
- CNAME DKIM records for Shopify email
- MX `@` → `mx.kentuckytreehouse.com.cust.b.hostedemail.com` priority 1
- TXT `_provider` → `shopify`
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `@` → `v=spf1 include:_spf.hostedemail.com ~all`
- TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM)
- TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF)
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10

**Dormant:** Cloudflare account has nameservers assigned but is not authoritative. Leftover from session 3's Path B plan.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email, 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraints on vendors** (ALL FOUR — relevant for approve-endpoint logic):
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

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8 — T4a):**
- `lib/email.ts` — Resend REST API wrapper, two functions: `sendRequestReceived`, `sendApprovalInstructions`
- Best-effort delivery — callers never fail HTTP response on email error

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop (`david-butler` → `david-butler-2` → `-3`…)
- All collision errors return `{error, diagnosis, conflict}` for UI rendering
- `/api/admin/diagnose-request` is the reusable diagnostic surface for any request in any state

---

## HOW TO CLEAR AN EMAIL FROM SUPABASE (for QA iterations)
> ⚠️ CAUTION: In session 4 the `vendor_requests` row was accidentally deleted during cleanup. Use `docs/admin-runbook.md` Recipe 4 for the full pattern. Short version below.

**Preferred: SQL diagnostic + surgical delete**

```sql
-- Diagnostic: see current state across all 3 tables
SELECT 'vendor_requests' AS tbl, id::text, name AS name_or_display, email, booth_number, status, created_at
FROM public.vendor_requests WHERE email = 'TARGET@example.com'
UNION ALL
SELECT 'vendors', id::text, display_name, NULL, booth_number,
  CASE WHEN user_id IS NULL THEN 'unlinked' ELSE 'linked' END, created_at
FROM public.vendors WHERE display_name = 'TARGET_NAME'
UNION ALL
SELECT 'auth.users', id::text, raw_user_meta_data->>'full_name', email, NULL, 'auth', created_at
FROM auth.users WHERE email = 'TARGET@example.com';
```

For anything more complex, use `docs/admin-runbook.md` Recipes 1–9.

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- Magic link delivery via Resend SMTP — verified end-to-end for Yahoo
- Magic link `?redirect=` param preserved across round trip
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- PWA manifest
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol
- Notion Roadmap — seeded
- Investor update system — Drive folder + first PDF + Notion process doc
- Custom domain `app.kentuckytreehouse.com` (session 6)
- OTP 6-digit code entry as primary auth path (session 6)
- Branded email templates for Magic Link and Confirm Signup (session 6)
- Agent roster: Dev · Product · Docs · Design active (session 11)
- KI-001, KI-002, KI-003 all resolved (session 9)
- Flow 2 onboarding end-to-end verified working on iPhone (session 9)
- `/setup` 401 race absorbed with retry+backoff (session 10)
- Shopper path de-orphaned (session 10)
- `/api/debug-vendor-requests` retired (session 10)
- PWA orientation lock verified (session 10)
- Design agent activated, `docs/design-system.md` v0.1 scaffolded (session 11)
- `docs/design-system.md` v0.2 — full direction pass for Booth, Find Detail, Feed header, Find Map, plus cross-cutting primitives (session 12)
- **KI-004 resolved** — constraint-aware vendor approval with slug auto-suffix (session 13)
- **Admin diagnostic UI** — "Diagnose" on every request, full collision panel, named error toasts (session 13)
- **`docs/admin-runbook.md`** — 9-recipe SQL triage guide for in-mall use (session 13)
- **Toast visual polish** — z-index 9999, solid backgrounds, stronger shadow (session 13)

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 13 close._ No blockers remain; Sprint 4 is finishing polish + consolidation.

### 🟡 Sprint 4 remainder
- 🟡 T4c remainder (copy polish) — orphans C + D: `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. Focused copy session, ~30 min.
- 🟡 T4b — admin surface consolidation (Add Booth tab in /admin, Add Vendor in-person flow, remove Admin PIN from /login, remove Booths from BottomNav, retire `AddBoothSheet` from /shelves) — ~4 hours.
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end against `docs/onboarding-journey.md`.
- 🟢 Session 13 test data cleanup — 5+ "David Butler" variants in DB. Not blocking; 5-minute SQL cleanup via `docs/admin-runbook.md` Recipe 4.

### 🟡 Design execution (sessions 14+)
- **Session 14 candidate:** Booth page redesign against `docs/design-system.md` v0.2. Build `<LocationStatement>`, add Curator's Statement block, convert BoothFinderCard to CTA card variant, terminology pass.
- **Session 15 candidate:** Find Detail polish (hierarchy fix + single Location Statement + weighted "Explore the Booth" button).
- **Session 16 candidate:** Feed header + mall bottom sheet (`<MallSheet>` as canonical bottom-sheet pattern).
- **Session 17 candidate:** Find Map emotional redesign.

Sprint 3 leftovers still pending beta invites:
- Error monitoring (Sentry or structured logs)
- Vendor bio UI — partly superseded by Curator's Statement design direction, but the tap-to-edit + public display still needs to ship
- Hero image upload size guard (12MB client check) — verify coverage
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" everywhere + `/welcome` guest-friendly landing for signed-in non-vendors
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed, ITP wipe mitigation)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors (now a purely additive change — just add `claim: true` flag on vendor_request to override the session-13 reject-on-booth-collision policy)
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation (Capacitor/Expo/React Native wrapper)
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, Find Map overhaul
- Upgrade `/api/admin/diagnose-request` email lookup from `listUsers({perPage:1000})` to `getUserByEmail()` once `@supabase/supabase-js` supports it — pragmatic now, won't scale past a few thousand users

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- Cloudflare nameservers for `kentuckytreehouse.com` — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships, remove then
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design cleanup pass: inline Georgia → system-ui on chrome; inline `C` color objects → `colors` import; magic-number spacing → spacing tokens — bundled as a single dedicated session post-Booth redesign

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

Check Supabase auth logs (magic link dispatch status):

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

Check DNS state for `kentuckytreehouse.com`:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

---
