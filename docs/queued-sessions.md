# Treehouse — Queued Sessions
> Scoped work that has been deliberated and sequenced behind something else. Each entry is a ready-to-run session opener that a future Claude can pick up without re-deriving the plan.

Status key: 🟢 Ready to run · 🟡 Ready but waiting on a dependency · ⏸️ Superseded

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

## Q-003 🟢 BottomNav flaggedCount prop on non-Home pages

**Status:** Ready to run. Non-blocking polish — `/my-shelf`, `/flagged`, and `/shelves` all render `<BottomNav>` without passing `flaggedCount`, so the Find Map heart icon's saved-items badge disappears on every page except Home.

**Created:** 2026-04-20 (session 35 close — surfaced during on-device walk when David noticed the Find Map counter zeros out on My Booth)

**Severity:** 🟢 Low — doesn't gate beta; saved items still work, the badge is just invisible outside Home. Two-line fix per page.

### The symptom

On Home: Find Map heart icon shows a small green badge with the saved-items count (e.g. "7"). On My Booth / Find Map / Booths: same heart icon, no badge — even when the user has saved items.

### Root cause

`<BottomNav>` in `components/BottomNav.tsx` takes `flaggedCount?: number` with default `0`. The badge is rendered only when `flaggedCount > 0`:

```tsx
{showBadge && (
  <div style={{ ... }}>
    {badgeLabel(flaggedCount)}
  </div>
)}
```

Only `app/page.tsx` (Home) passes the prop (`<BottomNav active="home" flaggedCount={bookmarkCount} />`). Every other BottomNav consumer passes no count and gets the default `0` → badge hidden.

### The fix (per page)

Three pages need the same pattern:

1. `app/my-shelf/page.tsx`
2. `app/flagged/page.tsx` (Find Map itself)
3. `app/shelves/page.tsx`

Each page:
1. Import `loadBookmarkCount` from `lib/utils`
2. Add a `bookmarkCount` useState, initialized to 0
3. On mount (and on `visibilitychange` so it stays fresh when the user saves from another tab/page), call `loadBookmarkCount()` and set state
4. Pass `flaggedCount={bookmarkCount}` to `<BottomNav>`

Home already has this wired; the other pages just need to lift the same pattern. Look at `app/page.tsx` for the reference implementation.

### Files touched

- `app/my-shelf/page.tsx` — add bookmark-count hook + pass to BottomNav
- `app/flagged/page.tsx` — same
- `app/shelves/page.tsx` — same

No other files. No server/schema changes.

### Execution checklist (estimated ~15 min + on-device spot-check)

1. 🟢 AUTO — Read `app/page.tsx` lines that set up `bookmarkCount` and pass to BottomNav (reference pattern)
2. 🟢 AUTO — Add the same pattern to `/my-shelf`, `/flagged`, `/shelves`
3. 🖐️ HITL — `npm run build 2>&1 | tail -30`
4. 🖐️ HITL — `git add -A && git commit -m "q-003: pass flaggedCount to BottomNav on my-shelf/flagged/shelves" && git push`
5. 🖐️ HITL — On-device: save a find, navigate to My Booth, confirm Find Map heart shows the badge
6. 🟢 AUTO — Retire Q-003 (⏸️ Superseded) after on-device confirmation

### Natural batch-mate

Q-002 and Q-003 are both small UI polish items on the same page. Natural to run together as a single 30-minute session if either is promoted — same build, same push, same on-device pass. Session opener would combine both CURRENT ISSUE lines.

### Session opener (copy/paste if promoted)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-003 from docs/queued-sessions.md — pass flaggedCount to BottomNav on the three pages that currently omit it (/my-shelf, /flagged, /shelves). Reference pattern is app/page.tsx (Home). Two-line fix per page, no server work.
```

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
