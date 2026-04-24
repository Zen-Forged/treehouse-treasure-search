# Treehouse — Queued Sessions
> Scoped work that has been deliberated and sequenced behind something else. Each entry is a ready-to-run session opener that a future Claude can pick up without re-deriving the plan.

Status key: 🟢 Ready to run · 🟡 Ready but waiting on a dependency · ⏸️ Superseded

---

## ⏸️ Q-007 — Window Sprint (Direction B) — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-21 (sessions 40+41 close — QA walk PASSED).

**Retirement reason:** All three sub-sessions shipped. Session 39 (backend) + session 40 (client) + session 41 (on-device QA walk, 4 scenarios) all passed clean. Feature is live in production at app.kentuckytreehouse.com.

**What ended up shipping:**

Session 39 (backend):
- `lib/posts.ts:getVendorWindowPosts(vendorId)` — new export, 6-post limit, `status='available'` filter, `created_at DESC`. Intentionally separate from `getVendorPosts` per session-33 dependent-surface-audit rule.
- `lib/email.ts:sendBoothWindow(payload)` + `ShareBoothWindowPayload` type + 5 internal helpers (`renderWindowBody`, `renderBanner`, `renderPostItSvg`, `renderLocationLine`, `renderWindowGrid`) + `escapeAttr` helper. Inline-SVG post-it for Outlook compat. `renderEmailShell` extended with optional `footerHtml` override (preserves the onboarding footer for the two existing callers).
- `app/api/share-booth/route.ts` — new file. Auth (`requireAuth`) + IP rate limit (5/10min) + email/UUID validation + per-recipient 60s dedup + ownership check + empty-window guard (409) + structured error responses. Inline-ownership pattern matching `/api/setup/lookup-vendor`.

Session 40 (client):
- `components/ShareBoothSheet.tsx` — new, ~520 lines. 4-state bottom sheet (compose / sending / sent / error) mirroring `<BoothPickerSheet>` chrome. Inline `EMAIL_REGEX` matching both server routes. Null-guarded `PreviewTile` for `Post.image_url: string | null`. Plain `<style>` keyframes. Status-specific error copy (403 / 409 / 429 / 400 / 502 / 500) with the 429 dual-case (IP rate limit vs. per-recipient dedup) distinguished via server error string preference.
- `app/my-shelf/page.tsx` — surgical masthead delta: paper-airplane bubble right slot (`v1.iconBubble` bg, inline SVG in `v1.green`) gated on `available.length >= 1` — matches server 409 empty-window guard. Two share affordances coexist by design.
- Build-gate fix: `ComposeBody`'s `inputRef` prop typed `React.Ref<HTMLInputElement>` (not `RefObject<HTMLInputElement | null>`) to satisfy React 19's `LegacyRef` shape when forwarding `useRef<T | null>(null)`.

Session 41 (QA walk, all 4 scenarios PASSED):
- Scenario 1 (fresh send happy path) — clean, delivery verified in recipient inbox
- Scenario 2 (60s per-recipient dedup) — correct copy
- Scenario 3 (IP rate limit + copy disambiguation) — correct copy, dedup-vs-rate-limit distinction verified
- Scenario 4.1 (empty-window client gate) — airplane correctly hidden when available=0
- Scenario 4.2 direct-POST verification skipped — 4.1 gave sufficient confidence

**Scoping items surfaced during QA walk** (all captured as new queued sessions below): Q-008 (shopper share), Q-009 (admin share), Q-010 (email URL fix — shipped inline during Scenario 2), Q-011 (email banner post-it rendering).

---

## ⏸️ Q-008 — Open Window share to unauthenticated shoppers — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-23 (session 50 close — shipped, awaiting on-device QA walk).

**Retirement reason:** Shipped in session 50 against the three recommended decisions (1c / 2c / 3a). Commit `0d30fa0`. On-device QA walk (5 scenarios) deferred at David's request; walk runbook preserved in CLAUDE.md CURRENT ISSUE for session 51.

**What shipped:**

- `app/api/share-booth/route.ts` — rewritten to branch on `Authorization` header presence. Auth branch keeps the existing 5/10min rate limit + `requireAuth` + ownership check + admin bypass (Q-009) unchanged. Anon branch: separate 2/10min rate-limit bucket, no ownership check, uses `getServiceClient()` directly. A malformed/expired token on the auth branch still 401s — no silent fallthrough. Per-recipient dedup map is shared across branches.
- `components/ShareBoothSheet.tsx` — added `mode?: "vendor" | "shopper"` prop (default `"vendor"` for back-compat). Shopper mode swaps `authFetch` for plain `fetch` so a signed-in non-owner viewing someone else's booth lands on the anon server branch instead of 403.
- `lib/email.ts:sendBoothWindow` — added `senderMode: "vendor" | "anonymous"` on `ShareBoothWindowPayload`. Anonymous drops the italic `"{X} sent you a Window…"` voice line from body HTML, preheader, AND the plain-text fallback. Vendor-name hero still leads. `senderFirstName` is ignored when anonymous.
- `app/shelf/[slug]/page.tsx` — `canShare` gate dropped `isAdmin(user)` check; now `!!vendor && available.length >= 1` for everyone. `shareMode` derived per viewer: admin OR (user.id === vendor.user_id) → `"vendor"`; everyone else → `"shopper"`. Header comment block extended with a session-50 note documenting the mode-derivation rule.
- `docs/share-booth-build-spec.md` §Rate limiting + abuse — table rewritten to document both branches (auth vs. anon) across all five levers.

**Decisions locked (matched queued recommendations):**
- **(1c)** Keep `requireAuth` for the vendor path AND add a second code path for anonymous shares with tighter rate-limit (2/10min vs. 5/10min).
- **(2c)** Same as 1c — separate code paths, separate rate-limit buckets keyed by IP.
- **(3a)** Drop the sender line entirely for shopper shares. Preheader and plain-text fallback also drop it.

**Still out of scope:** shopper shares of individual finds, email reply-to the shopper, captcha on the anon path.

### Historical scope (preserved for session-archive readers)

Captured David's session-41 QA-walk observation: "This functionality should be available to all users." Shoppers viewing `/shelf/{slug}` (public booth pages) had no share affordance. Session-38 build-spec §Rate limiting explicitly scoped this as "Shoppers cannot share vendor booths in MVP" — that scope was reversed in session 50.

Three design decisions blocked this from being trivial at capture: (1) where the entry point lives for shoppers, (2) how the auth gate relaxes, (3) how the sender voice reconciles when the shopper — not the vendor — is the sender. Recommendation was 1(c) + 2(c) + 3(a); all three shipped verbatim.

### Session opener (historical, for archive readers)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-008 — open Window share to unauthenticated shoppers. Per docs/queued-sessions.md, add a masthead airplane entry point on /shelf/[slug] (public shelf page), branch /api/share-booth on auth state (authenticated = ownership-check path unchanged; unauthenticated = rate-limit-only path with tighter 2/10min cap), drop or genericize the sender voice line for anonymous shares. Keep vendor UX on /my-shelf identical. Update docs/share-booth-build-spec.md §Rate-limit + §Auth gate.
```

---

## Q-009 🟢 Admin can share any booth (bypass ownership check)

**Status:** Ready to run. Captures David's session-41 QA-walk observation: "This explains the message I received when trying to send from an Admin account 'You can only share booths you own'. Will need to ensure that Admins can also share."

**Created:** 2026-04-21 (session 41 Scenario 1 QA walk)

**Severity:** 🟢 Low — admin-only UX hole. Admin impersonation already works on `/my-shelf` via `?vendor=id`, so admin CAN view any booth's shelf; just can't share it. Internal workflow friction, not user-facing.

### The observation

`/api/share-booth`'s ownership check is strict: `.eq("id", activeVendorId).eq("user_id", auth.user.id)`. Admin's auth user-id doesn't match the vendor's user_id, so the route returns 403 "You don't own this booth." The rest of the `/my-shelf` page is admin-impersonation-aware (see `app/my-shelf/page.tsx` `adminOverride` branch) but the share endpoint doesn't know about the admin persona.

### Fix

One surgical change in `app/api/share-booth/route.ts` ownership check — accept the request if `auth.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL` OR the ownership query returns a row. Use `isAdmin(auth.user)` from `lib/auth` if accessible on the server (verify import path — `isAdmin` is client-side today; may need a server-safe variant).

Sender-attribution consideration: when admin shares booth X, the email still says "{X's display_name} sent you a Window" because the vendor row is what's loaded. That reads cleanly and doesn't misattribute (X's booth IS being shared, just via admin). No email-template change needed.

### Files touched

- `app/api/share-booth/route.ts` — extend ownership check with admin bypass
- `lib/adminAuth.ts` (possibly) — add `isAdminUser(user)` server helper if one doesn't exist. Grep for existing admin-check patterns before adding.
- `docs/share-booth-build-spec.md` — update §Auth gate to note admin can share any booth

### Pairs with

Q-008. Both relax the ownership check, but differently (Q-008 removes auth entirely for shoppers; Q-009 keeps auth but allows admin to bypass ownership). If Q-008 lands first with the auth-branch pattern, Q-009 becomes a single-line addition to the vendor branch. Recommend sequencing Q-009 INSIDE Q-008's session.

### Estimate

~15 min standalone, or ~5 min additional inside Q-008's session.

### Session opener (copy/paste when promoted standalone)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-009 — admin can share any booth via Window share. Per docs/queued-sessions.md, extend ownership check in app/api/share-booth/route.ts so admin (NEXT_PUBLIC_ADMIN_EMAIL match or isAdmin-equivalent) bypasses the vendor-ownership match. Sender attribution stays "{vendor.display_name} sent you a Window" — no template change. Update docs/share-booth-build-spec.md §Auth gate.
```

---

## ⏸️ Q-010 — Window email CTA URL: /vendor/{slug} → /shelf/{slug} — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-21 (session 41 inline fix during QA walk Scenario 2).

**Retirement reason:** Shipped inline during the Q-007 QA walk (~3 min tool time) to unblock continued walk progress + give Scenario 2 a natural Q-010-verify cycle. Deploy verified live when the Scenario-2 dedup-blocked retry resent the email with the corrected CTA URL.

**What ended up shipping:** `lib/email.ts:sendBoothWindow` — one line changed from `${siteUrl}/vendor/${payload.vendor.slug}` → `${siteUrl}/shelf/${payload.vendor.slug}`. Local variable renamed `vendorPageUrl` → `shelfPageUrl` for semantic clarity (a reader shouldn't have to trace "why does a variable named vendor lead to /shelf"). Plain-text fallback updated to match. File header comment block documented the Q-010 change with session-41 attribution.

Commit: `fix(Q-010): Window email CTA routes to /shelf/{slug} not /vendor/{slug}`.

Spec + mockup files (`docs/share-booth-build-spec.md` §3, `docs/mockups/share-booth-email-v1.html`) not updated in this pass — stubs carry the old URL. Low-priority Docs-agent follow-on: fold into any Q-008/Q-009/Q-011 session as an incidental fix, OR into the "spec cleanup once Q-007 feature cluster settles" pass.

### Historical scope (preserved for session-archive readers)

Build-spec §3 said `/vendor/{slug}` — spec was wrong against the rest of the app. `/my-shelf` `handleShare` already uses `${BASE_URL}/shelf/${slug}` (canonical public booth URL); `/vendor/{slug}` routes exist for legacy compat but shouldn't be the target for new outgoing links. One-line fix, no client change, no API change, no schema change.

---

## ⏸️ Q-011 — Window email banner redesign — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-24 (session 53 close — v4 on-device QA walk PASSED 4/4 clients).

**Retirement reason:** Shipped session 52 over four iterations after the session-51 Design review surfaced 4-axis brand drift. Session 53 on-device QA walk PASSED all four mail clients. Q-011 is fully closed — from the original session-41 Scenario 1 post-it diagnosis through to four-client verification in the wild. Total arc: sessions 41 → 51 → 52 → 53.

**What shipped (4 commits session 52):**

1. `5c21b90` — v2 banner redesign per session-51 mockup v2.2 (SMALL masthead + universal opener + IM Fell Google Fonts link + PinGlyph SVG + `senderMode` retired from template).
2. `efbf222` — `fix` refactor to negative-margin overlay after Gmail web + iOS Gmail both stripped `position: absolute`.
3. `1abcba2` — v3 info bar pivot. Post-it retired entirely; booth number + mall name + address become a two-cell HTML `<table>` info bar attached below the banner in one unified rounded frame. Variant A locked.
4. `d9279e9` — v4 simplified button-forward. Shell masthead retired (sender envelope already identifies brand), opener collapses to one italic phrase flowing into IM Fell 34px vendor name, full-width green "Explore the booth" CTA directly under info bar, "THE WINDOW" eyebrow deleted, closer block deleted. Subject + preheader + opener all share the phrase `"A personal invite to explore {vendor}"`. Word "Window" retired from user-facing copy (internal identifiers only: `sendBoothWindow`, `ShareBoothWindowPayload`, the QA-walk doc).

**Session 53 QA walk result:** 4/4 clients PASS (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Outlook graceful degradation not tested (low-priority per CLAUDE.md checklist).

**Key hard-won tech fact (candidate for `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS):** Gmail strips `position: absolute` from inline styles on BOTH web and iOS. Stronger than the session-51 SVG-filtering discovery — any overlap-style primitive will die on Gmail. v3's pivot to pure HTML `<table>` + block `<div>` was forced by this, not chosen.

**Mockup artifacts (kept as design-history reference):**
- `docs/mockups/share-booth-email-v1.html` — session 38 original
- `docs/mockups/share-booth-email-v2.html` — session 51 Variant B
- `docs/mockups/share-booth-email-v3.html` — session 52 info bar pivot
- `docs/mockups/share-booth-email-v4.html` — session 52 simplified button-forward (now design-history after session-53 QA PASS)

**Build spec:** `docs/share-booth-build-spec.md` carries v2 + v3 + v4 addendums stacked. Candidate for ~15 min consolidation pass post-QA — the three addendums are easier to read merged than stacked.

### Historical scope (preserved for session-archive readers)

Original Q-011 at session 41 was framed as a single-axis email-rendering bug: "The booth number was displayed below the booth hero image. The plan was to have the booth on top of the image, formatted with the post-it note, as displayed in the my-shelf section." Session 51 Design review expanded scope to 4-axis brand drift (post-it SVG stripping + post-it proportions + wrong pin glyph + vendor name font drift). Session 52 execution doubled the scope again after v2.0 + v2.1 both died on Gmail's `position: absolute` strip, forcing the v3 pivot; then expanded a third time when v3 rendered correctly but David flagged the CTA was buried — v4 simplified the whole email around the button.

Sender-name bug surfaced at session 51 and was eliminated rather than patched: `/api/share-booth` was passing `vendor.display_name` as `senderFirstName` (self-sends read "Kentucky Treehouse sent you a Window into Kentucky Treehouse"). v4 has no sender name to resolve — the opener is universal.

Tech Rule candidates surfaced through the arc: (a) email template parity audit (2nd firing session 52 — promotion-ready), (b) Gmail-hostile primitives list (1st firing session 52 — `position: absolute`, `position: relative` with `overflow: hidden` clipping, SVG `<rect>`/`<circle>` as post-it shapes, CSS `transform: rotate`).

---

## Q-006 🟡 Deep-link CTA for Window email

**Status:** Parked behind Sprint 6+ Universal Links scope. Waiting on that sprint.

**Created:** 2026-04-21 (session 38 close — surfaced during Window mockup approval)

**Severity:** 🟢 Low — cosmetic enhancement. Browser fallback is honest MVP behavior.

### What it is

The Window email's "Open in Treehouse Finds" CTA currently links directly to `/shelf/{slug}` (post-Q-010 correction) — a browser URL. When the recipient has the PWA installed, the ideal behavior is:

1. If PWA installed on iOS/Android → deep-link to the installed app at the booth's shelf
2. If PWA not installed → open in browser, landing on `/shelf/{slug}`, which itself offers an install prompt

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

**Note (sessions 40+41):** The session-40 `/my-shelf` masthead now also carries a right-slot share airplane (Q-007). When Q-002 promotes, the masthead revert to single-variant must preserve the share airplane right slot — revert the center-column picker affordance only, not the whole masthead.

### The revision

**Option 1 — David's approved direction (session 35 close):** inline chevron next to the IM Fell 28px booth name. "Kentucky Treehouse ▾" as one tap target, chevron hanging off the right edge. Preserves brand lockup; the thing you tap to switch is the thing you're currently viewing.

The chevron only appears when `vendorList.length > 1`. Single-booth users see the current title unchanged.

### Files touched

- `docs/mockups/my-shelf-multi-booth-v1.html` — update Frame 2 and Frame 3 to show the affordance under the banner instead of in the masthead. Keep the mockup file as the source of truth for the revised placement per the session-28 mockup-wins rule.
- `app/my-shelf/page.tsx` — two surgical changes:
  1. Revert `Masthead` component's CENTER column to a single variant (remove the `variant`, `activeBoothName`, `onPickerOpen` props; always render "Treehouse Finds"). PRESERVE the session-40 `canShare` + `onShareOpen` right-slot share airplane.
  2. In `<BoothTitleBlock>` consumer or in `/my-shelf` directly, wrap the IM Fell 28px booth name in a `<button>` when `vendorList.length > 1`, with an inline chevron glyph on the right
- `components/BoothPage.tsx` — possibly add an optional `chevronAction` prop to `<BoothTitleBlock>` so the picker action can be bolted on without duplicating the title rendering. Keep the Public Shelf consumer passing null.
- No server/schema changes. No migration. Purely client-side UI revision.

### Execution checklist (estimated ~20 min + on-device QA)

1. 🟢 AUTO — Read `app/my-shelf/page.tsx` and `components/BoothPage.tsx` current state (post-session-40 with the share airplane)
2. 🟢 AUTO — Revert `Masthead`'s center column to single variant; drop the three picker props. KEEP `canShare` + `onShareOpen` right-slot.
3. 🟢 AUTO — Update `<BoothTitleBlock>` (or inline in `/my-shelf`) to conditionally wrap the booth name in a tap target with an inline chevron glyph when a new `onPickerOpen` prop is passed. Non-multi-booth pages don't pass it; affordance is invisible.
4. 🟢 AUTO — Update the mockup HTML so future sessions see the corrected placement
5. 🖐️ HITL — `npm run build 2>&1 | tail -30`
6. 🖐️ HITL — `git add -A && git commit -m "q-002: picker affordance moves from masthead to inline with booth name" && git push`
7. 🖐️ HITL — On-device: confirm single-booth shows no chevron, multi-booth shows `Kentucky Treehouse ▾` under the banner, tap opens the sheet as before, share airplane still visible in masthead right slot
8. 🟢 AUTO — Retire Q-002 (⏸️ Superseded) after on-device confirmation

### Session opener (copy/paste if promoted)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-002 from docs/queued-sessions.md — picker affordance placement revision. Masthead CENTER column reverts to single-variant "Treehouse Finds"; PRESERVE the session-40 right-slot share airplane. Chevron moves inline next to the IM Fell 28px booth name under the hero banner. Update the mockup file too (docs/mockups/my-shelf-multi-booth-v1.html). No server/schema changes. On-device QA after push: single-booth unchanged, multi-booth shows chevron under banner, sheet still works, share airplane still visible in masthead.
```

---

## ⏸️ Q-004 — Rename sweep "Treehouse" → "Treehouse Finds" — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-21 (session 39 close).

**Retirement reason:** Shipped in session 39 as part of the bundled rename-sweep-plus-Window-backend session. David chose "rename first, then backend" at session open — both landed in one commit.

**What shipped:** 9 files touched — `lib/email.ts`, `app/layout.tsx`, `app/vendor-request/page.tsx` (intro + both DoneScreen states), `app/login/page.tsx` (logo alt text), `docs/mockups/email-v1-2.html` (15 anchor points including the stray `</li>` typo fix), `docs/supabase-otp-email-templates.md`, `CONTEXT.md` §1 + title banner + footer, `MASTER_PROMPT.md` title only, `CLAUDE.md` session opener template. `public/manifest.json` verified — `name` already correct; `short_name` intentionally stays as `Treehouse` (iOS 12-char truncation would otherwise render `Treehouse Fin…`).

**HITL completed:** Supabase Dashboard paste (Magic Link + Confirm Signup templates both updated); build green; commit + push.

### Historical scope (preserved for session-archive readers)

Product name confirmed as "Treehouse Finds" at session 38. Rename was bleeding across mockups (Window email used new name; shell lockup still used old). Sweep across user-facing display strings; code identifiers (package names, variables, types, domain, CSS classes) explicitly excluded. See commit `[rename: Treehouse → Treehouse Finds + shorten email tagline (Q-004 + Q-005)]` for full diff.

---

## ⏸️ Q-005 — Email tagline sweep — SUPERSEDED

**Status:** ⏸️ Superseded 2026-04-21 (session 39 close).

**Retirement reason:** Shipped in session 39 bundled with Q-004 as planned (same files, one commit).

**What shipped:** `lib/email.ts` shell subtagline, 3 email frames in `docs/mockups/email-v1-2.html`, `docs/supabase-otp-email-templates.md`. Three-clause product-level tagline (`Embrace the Search. Treasure the Find. Share the Story.`) kept intact in `CONTEXT.md` §1 as the anchor — only the email-surface subtagline shortened to two clauses.

### Historical scope (preserved for session-archive readers)

Shortened email shell subtagline from `"Kentucky & Southern Indiana"` to `"Embrace the Search. Treasure the Find."`. The two-clause trim was deliberate — "Share the Story" stays as an internal pillar but doesn't need to appear on every email. Paired naturally with Q-004 (same files, same session). Shipped as part of the session-39 rename-sweep commit.

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
