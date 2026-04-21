# Treehouse — Queued Sessions
> Scoped work that has been deliberated and sequenced behind something else. Each entry is a ready-to-run session opener that a future Claude can pick up without re-deriving the plan.

Status key: 🟢 Ready to run · 🟡 Ready but waiting on a dependency · ⏸️ Superseded

---

## Q-007 🟢 Window Sprint — Share your booth (Direction B)

**Status:** Ready to run. Mockup approved session 38 (`docs/mockups/share-booth-email-v1.html`). Full build spec at `docs/share-booth-build-spec.md`. First scoped feature sprint post-Sprint-4. 3 sessions.

**Created:** 2026-04-21 (session 38 close — mockup approval + spec landing)

**Severity:** Not a bug — new MVP feature. Closes the full demo cycle (vendor shares booth → recipient inbox → booth discovery).

### Sequencing note

Q-004 + Q-005 (rename sweep) should run EITHER immediately before this sprint OR the Window email's brand lockup ships as "Treehouse" until the rename batch lands. Three emails in the family; mixing lockup copy across them is the worst option. David's call at session 39 open.

### Session plan

| Session | Work | Est. |
|---|---|---|
| 39 | `lib/email.ts: sendBoothWindow()` + `POST /api/share-booth` + rate limit + ownership check + `getVendorWindowPosts` | ~90 min |
| 40 | `<ShareBoothSheet>` component + `/my-shelf` entry point + all 4 states | ~90 min |
| 41 | On-device QA walk + fixes + commit | ~60–90 min |

### Session opener (copy/paste when promoted)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running Q-007 session 39 (Window Sprint — backend). Implement the server side of the share-your-booth feature per docs/share-booth-build-spec.md. New endpoint POST /api/share-booth with requireAuth + ownership check + rate limit. New fn lib/email.ts:sendBoothWindow() extending renderEmailShell. New lib/posts.ts:getVendorWindowPosts helper (do NOT mutate getVendorPosts). Before starting: decide Q-004/Q-005 rename-sweep sequencing — either run the sweep first OR hold the Window lockup at "Treehouse" for now. No client code this session; sheet + /my-shelf wiring comes in session 40.
```

---

## Q-004 🟢 Rename sweep — "Treehouse" → "Treehouse Finds"

**Status:** Ready to run. Surfaced during session 38 Window mockup revision. David confirmed "Treehouse Finds" is the official product name. Currently inconsistent across surfaces.

**Created:** 2026-04-21 (session 38 close)

**Severity:** 🟡 Medium — not a functional issue but a brand-consistency issue. Already bleeding into new mockups (Window email uses "Treehouse Finds" but Email #1/#2 shell uses "Treehouse"). Should ship as part of the rename batch alongside Q-005 so all three emails move together.

### Scope

Files to sweep:
- `lib/email.ts` — `renderEmailShell()` brand lockup (Email #1 + Email #2)
- `docs/mockups/email-v1-2.html` — update mockup to match (source of truth for future sessions)
- `CONTEXT.md` §1 Product Overview — product name references
- `MASTER_PROMPT.md` — project name references in session-opening standup template
- Supabase Dashboard → Auth → Email Templates (Magic Link + Confirm Signup) — brand name in subject lines + body
- `docs/supabase-otp-email-templates.md` — source-of-truth doc for paste target above
- PWA manifest (`app/manifest.ts` or `public/manifest.webmanifest`) — `name` + `short_name`
- Notion roadmap references — top-level page title + any "Treehouse" brand usage
- `app/layout.tsx` — `<title>` metadata, og:title, og:site_name
- README + package.json if "treehouse" appears as a display name (keep as repo name/code identifier unchanged)

Files NOT to sweep (code identifiers stay):
- Package/repo names
- Variable names, function names, TypeScript types (`treehouse_mode`, `TreehouseFind`, etc.)
- Domain name `kentuckytreehouse.com` — stays
- CSS class names

### Execution checklist

1. 🟢 AUTO — grep every surface above for "Treehouse" as display string
2. 🟢 AUTO — update all user-facing display strings to "Treehouse Finds"
3. 🟡 HITL — David updates Supabase Dashboard email templates (not reachable from code)
4. 🟢 AUTO — `npm run build` — verify no regressions
5. 🟡 HITL — on-device QA: open current PWA, confirm title bars / metadata correct
6. 🟡 HITL — `git add -A && git commit -m "rename: Treehouse → Treehouse Finds across user-facing surfaces" && git push`

**Estimate:** 1 session (~60 min including HITL Supabase paste).

**Bundling:** Run alongside Q-005 in the same session — they touch the same files and should ship as one atomic rename.

### Session opener

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running Q-004 + Q-005 together (rename sweep). "Treehouse" → "Treehouse Finds" + email tagline "Kentucky & Southern Indiana" → "Embrace the Search. Treasure the Find." across: lib/email.ts, email-v1-2.html mockup, CONTEXT.md §1, MASTER_PROMPT.md, Supabase email templates, PWA manifest, Notion roadmap. See docs/queued-sessions.md for full file list. Code identifiers + domain stay unchanged. One atomic commit.
```

---

## Q-005 🟢 Email tagline sweep — shorten to two clauses

**Status:** Ready to run. Pairs with Q-004 — same files, same session.

**Created:** 2026-04-21 (session 38 close)

**Severity:** 🟡 Medium — brand-consistency in email surfaces.

### Scope

The email shell subtagline changes from `"Kentucky & Southern Indiana"` to `"Embrace the Search. Treasure the Find."` across all transactional emails. Two-clause trim is deliberate — "Share the Story" is an internal pillar but one that doesn’t need to be said on every email.

**Important distinction:** The full three-clause tagline `"Embrace the Search. Treasure the Find. Share the Story."` stays as the product-level anchor in `CONTEXT.md` §1. Only the *email-surface* subtagline shortens.

Files:
- `lib/email.ts` — `renderEmailShell()` subtagline literal
- `docs/mockups/email-v1-2.html` — match
- Supabase Dashboard Auth email templates — match (subject + body tagline)
- `docs/supabase-otp-email-templates.md` — update paste target doc

### Execution checklist

Bundle into Q-004 session. Same HITL Supabase paste step covers both. Same commit.

**Estimate:** Adds ~10 min to Q-004's session budget.

---

## Q-006 🟡 Deep-link CTA for Window email

**Status:** Parked behind Sprint 6+ Universal Links scope. Waiting on that sprint.

**Created:** 2026-04-21 (session 38 close — surfaced during Window mockup approval)

**Severity:** 🟢 Low — cosmetic enhancement. Browser fallback is honest MVP behavior.

### What it is

The Window email's "Open in Treehouse Finds" CTA currently links directly to `/vendor/{slug}` — a browser URL. When the recipient has the PWA installed, the ideal behavior is:

1. If PWA installed on iOS/Android → deep-link to the installed app at the booth's shelf
2. If PWA not installed → open in browser, landing on `/vendor/{slug}`, which itself offers an install prompt

### Why parked

Universal Links (iOS) + Intent Filters (Android) are Sprint 6+ infrastructure per `CONTEXT.md` §15. Without them, any attempt to deep-link opens in Safari regardless. MVP behavior (browser fallback) is the only honest option available.

### When to unpark

When Universal Links / apple-app-site-association ship. At that point:
1. Update `sendBoothWindow()` CTA href to use the universal link scheme
2. Browser fallback stays as-is
3. Test on iOS + Android before declaring resolved

**Estimate:** ~20 min post-Universal-Links. Not independently scopable.

---

## Q-002 🟢 Picker affordance placement revision

**Status:** Ready to run. Captures David's session-35 on-device observation: the masthead center slot reads as the app brand lockup ("Treehouse Finds"), so the "Viewing · [Booth Name] ▾" block sits in the wrong place in the session-34-approved mockup. The picker affordance should be inline with the booth name under the hero banner instead.

**Created:** 2026-04-20 (session 35 close — after on-device QA walk confirmed the feature works end-to-end but the placement drifts on the brand-lockup role of the masthead)

**Severity:** 🟢 Low — doesn't gate beta; multi-booth is a minority use case right now. David wanted this captured so it's fixable when it comes up with a vendor.

### The observation

The session-34 mockup (`docs/mockups/my-shelf-multi-booth-v1.html`) put "Viewing · [Name] ▾" in the masthead center slot. That was approved and built. On-device:

- Single-booth masthead reads "Treehouse Finds" → clearly the app brand lockup
- Multi-booth masthead reads "Viewing · Kentucky Treehouse ▾" → competes with the brand

The booth identity lives under the hero banner as a 28px IM Fell title ("Kentucky Treehouse") with a "a curated shelf from" eyebrow. That's where the picker affordance belongs — next to the booth name, inline, as one tap target.

### The revision

**Option 1 — David's approved direction (session 35 close):** inline chevron next to the IM Fell 28px booth name. "Kentucky Treehouse ▾" as one tap target, chevron hanging off the right edge. Preserves brand lockup; the thing you tap to switch is the thing you're currently viewing.

The chevron only appears when `vendorList.length > 1`. Single-booth users see the current title unchanged.

### Files touched

- `docs/mockups/my-shelf-multi-booth-v1.html` — update Frame 2 and Frame 3 to show the affordance under the banner instead of in the masthead. Keep the mockup file as the source of truth for the revised placement per the session-28 mockup-wins rule.
- `app/my-shelf/page.tsx` — two surgical changes:
  1. Revert `Masthead` component to a single variant (remove the `variant`, `activeBoothName`, `onPickerOpen` props; always render "Treehouse Finds")
  2. In `<BoothTitleBlock>` consumer or in `/my-shelf` directly, wrap the IM Fell 28px booth name in a `<button>` when `vendorList.length > 1`, with an inline chevron glyph on the right
- `components/BoothPage.tsx` — possibly add an optional `chevronAction` prop to `<BoothTitleBlock>` so the picker action can be bolted on without duplicating the title rendering. Keep the Public Shelf consumer passing null.
- No server/schema changes. No migration. Purely client-side UI revision.

### Execution checklist (estimated ~20 min + on-device QA)

1. 🟢 AUTO — Read `app/my-shelf/page.tsx` and `components/BoothPage.tsx` current state
2. 🟢 AUTO — Revert `Masthead` to single variant; drop the three picker props
3. 🟢 AUTO — Update `<BoothTitleBlock>` (or inline in `/my-shelf`) to conditionally wrap the booth name in a tap target with an inline chevron glyph when a new `onPickerOpen` prop is passed. Non-multi-booth pages don't pass it; affordance is invisible.
4. 🟢 AUTO — Update the mockup HTML so future sessions see the corrected placement
5. 🖐️ HITL — `npm run build 2>&1 | tail -30`
6. 🖐️ HITL — `git add -A && git commit -m "q-002: picker affordance moves from masthead to inline with booth name" && git push`
7. 🖐️ HITL — On-device: confirm single-booth shows no chevron, multi-booth shows `Kentucky Treehouse ▾` under the banner, tap opens the sheet as before
8. 🟢 AUTO — Retire Q-002 (⏸️ Superseded) after on-device confirmation

### Session opener (copy/paste if promoted)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-002 from docs/queued-sessions.md — picker affordance placement revision. Masthead reverts to single-variant "Treehouse Finds"; chevron moves inline next to the IM Fell 28px booth name under the hero banner. Update the mockup file too (docs/mockups/my-shelf-multi-booth-v1.html). No server/schema changes. On-device QA after push: single-booth unchanged, multi-booth shows chevron under banner, sheet still works.
```

---

## ⏸️ Q-003 — BottomNav flaggedCount prop on non-Home pages — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-20 (session 36 close).

**Retirement reason:** Shipped in session 36 across four surfaces — `/my-shelf` and Find Detail (`/find/[id]` main + SoldLanding) were wired in session 36; `/flagged` was already wired pre-session-36; `/shelves` was already wired on-mount and intentionally left without focus/visibilitychange resync per surgical-changes principle (admin-only surface, T4b retirement candidate).

**What ended up shipping:** `loadFollowedIds` import + `bookmarkCount` state + focus/visibilitychange sync pattern, mirroring Home's reference implementation. Find Detail additionally resyncs inside `handleToggleSave` so the badge reflects in-page heart toggles.

**Scope-completeness note:** The original Q-003 entry below names three surfaces (`/my-shelf`, `/flagged`, `/shelves`). `/find/[id]` was overlooked at session-35 capture and surfaced only when David's on-device testing walked the path in session 36. Rule candidate queued in `docs/known-issues.md` Q-003 Resolved entry: grep every `<BottomNav>` instantiation before declaring scope on prop-wiring gaps.

**Commits:**
- (session-36 commit A) — fix: edit gate + BottomNav badge (session 36) — covers `/my-shelf`
- (session-36 commit B) — fix(session 36): BottomNav flaggedCount on Find Detail (Q-003 addendum) — covers Find Detail

### Historical scope (preserved for session-archive readers)

Non-blocking polish — `/my-shelf`, `/flagged`, and `/shelves` all render `<BottomNav>` without passing `flaggedCount`, so the Find Map heart icon's saved-items badge disappears on every page except Home. Two-line fix per page, mirroring Home's reference pattern. Non-gating — badge visibility, not flow failure. Session 36 scope expanded to include Find Detail + SoldLanding when David surfaced the overlooked fourth surface.

---

## ⏸️ Q-001 — KI-006 surgical hotfix (Path B from session 33) — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-20 (session 35 close).

**Retirement reason:** Multi-booth rework (Path A) shipped in session 35 and naturally included the array-returning `lookup-vendor` rewrite. KI-006 was fixed as a sub-fix of that larger change, exactly as the retirement trigger predicted when Q-001 was first logged.

**What ended up shipping:** `/api/setup/lookup-vendor` rewritten to composite-key lookup on `(mall_id, booth_number, user_id IS NULL)` across an array of requests, linking all matches in one UPDATE. KI-006's broken display_name join is gone. Session 35 on-device walk step 2 verified — fresh Flow 3 request with `booth_name` set now links cleanly.

**What Path B would have done:** surgical rewrite preserving `vendors.user_id UNIQUE`. Cheaper per line but would have needed a redo after Path A anyway. Sequencing call stands.

### Historical scope (preserved for session-archive readers)

Session-32 regression in `/api/setup/lookup-vendor`. The route matched `vendor_requests.name` against `vendors.display_name`. These no longer matched after session 32's approval priority change (`booth_name → first+last → name`) — so any Flow 3 vendor who filled in `booth_name` couldn't complete `/setup` linkage. OTP verified cleanly, session established, lookup-vendor returned 404, `/my-shelf` rendered `<NoBooth>`. Vendor was stranded.

Caught session 33 walk step 6 on-device. Resolved session 35 via the multi-booth rework composite-key lookup. Full fix documented in `docs/known-issues.md` → KI-006 (Resolved) and `docs/DECISION_GATE.md` Risk Register.

---
> Maintained by Docs agent. Entries are scoped, sequenced work — not vague ideas. Anything here should be runnable by a future Claude session with no additional deliberation.
