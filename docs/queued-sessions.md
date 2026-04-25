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

## Q-012 🟡 Treehouse opener animation — full Design redesign

**Status:** 🟡 Parked. Needs a dedicated Design session, mockup-first. **Not a continuation** of the session-64 first-pass implementation — that's reverted; revisit means starting from scratch on visual direction.

**Created:** 2026-04-25 (session 64 — first pass shipped + reverted same session)

**What happened:** David received a React Native / Expo intent doc for a "Treehouse opener" — a cinematic threshold animation for the home page. Session 64 ported it to a framer-motion + CSS web component (commit `c9043c8`), wired it into `/` with first-visit-only mobile-only gating, then reverted it (`1946ddd`) after on-device QA — "first pass looked pretty terrible." The wood-frame + skeleton-preview combo read flat on real iPhone. The literal "wooden window" metaphor probably doesn't survive a redesign; the brand is paper + IM Fell, not lacquered carpentry.

### Why this is a full redesign, not an iteration

The reverted commit was a faithful translation of the RN intent doc — same colors, same easings, same 4-phase beat. It compiled, it ran, it ticked every spec checkbox. It just didn't land aesthetically. That's a Design problem, not a Dev problem. A Dev iteration ("tweak the wood gradient," "shorten the sweep") won't fix it because the underlying visual direction is wrong. The next pass needs to re-derive what a Treehouse Finds opener should *feel* like, mockup-first, before any code lands.

### What's recoverable from `c9043c8` (reference only, not direction)

If the future session wants to mine the prior pass for ideas, the design intent is preserved in git history. But treat these as "what was tried" not "what should ship":

- **4-phase structure:** stillness → frame appears → light sweep → reveal. Total ~3.2s. The beat structure may survive a redesign even if the visuals don't.
- **Color tokens:** cream `#F4EFE6`, forest `#1F3D2B`, gold `#E6C27A`, wood three-tone (`#8B6F47` / `#6B502E` / `#3E2C18`). Cream + forest + gold are aligned with the Treehouse palette; wood was the experimental direction that didn't land.
- **Easings:** `cubic-bezier(0.32, 0.72, 0.24, 1)` (organic) and `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out for the frame). Nothing brand-specific; reusable in any animation.
- **Microcopy:** "Embrace the search." Italic Georgia, lowercase, 14px tracked 0.1em. The phrase is good; the typographic treatment is generic.
- **Skip affordance:** tap-anywhere mid-animation → fade out + onFinish. Worth keeping in any direction.
- **Gating logic in `app/page.tsx`:** localStorage flag `treehouse_opener_seen_v1`, `matchMedia('(max-width: 768px)')` for mobile-only. Reusable wholesale once a new opener exists.

The original RN intent doc itself is also in `c9043c8` git history — the file `components/TreehouseOpener.tsx` at that commit. Not the React Native original (that was overwritten in the first port), but the framer-motion port that preserved the same animation grammar.

### Decisions already locked from session 64 (apply to redesign too)

- **D1 — Frequency:** First-visit-only. localStorage flag `treehouse_opener_seen_v1` (the `_v1` suffix lets us reset for everyone if a v2 ships).
- **D2 — Skip affordance:** Tap-anywhere mid-animation → fade out + onFinish.
- **D3 — Behind the glass:** Real feed mounts behind the opener (load-state-as-art). The session-64 first pass used a static skeleton preview as a compromise; a v2 should consider transparent cutout + live `backdrop-filter` blur of the actual feed.
- **D4 — Mobile only:** Hide on viewports >768px. Desktop never plays it.

### What the Design session should produce

Mockup-first per the session-28 rule. The animation IS the commitment surface — phone-frame HTML mockups don't capture motion, so the working framer-motion component itself is the mockup. But before any code, a still-frame design pass:

1. **Mood-board / direction picker** — 2–3 distinct visual directions for the opener, each as a still-frame phone mockup showing the peak moment of the animation. Examples of direction (not prescriptions): paper unfolding, light coming through leaves, a vintage shop sign lighting up at dusk, IM Fell letterforms assembling. The wood-frame window is explicitly NOT one of the directions.
2. **Beat structure decision** — 4-phase (current) vs. 3-phase vs. 2-phase. Total duration 2–3.5s.
3. **Microcopy** — keep "Embrace the search." or revise.
4. **The build is one session** after Design picks a direction. ~1 session for mockup + scoping, ~1 session for build + iterate in `/opener-preview` route. The route should ship in the same commit as the rebuilt component.

**Estimate:** 1 Design session (~1 hr) + 1 build session (~1 hr). Not for the immediate near term — V1 unblocker (feed content seeding) takes priority.

### Session opener (when picked up)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Q-012 — Treehouse opener animation, full Design redesign. Session 64 shipped + reverted a first pass (commits c9043c8 + 1946ddd) — wood-frame + skeleton-preview combo didn't land aesthetically. This session is NOT a continuation of that implementation; it's a fresh Design pass. Read docs/queued-sessions.md §Q-012 for what's recoverable as design intent vs. what needs to be re-derived. Decisions D1–D4 (first-visit-only, tap-to-skip, real-feed-behind-the-glass, mobile-only) are locked from session 64. Goal of this session: produce a still-frame mood board with 2–3 distinct visual directions for the peak moment of the animation (none of them the literal wooden-window metaphor), pick one with David, then close as design-to-Ready for a follow-up build session.
```

---

## ⏸️ Q-002 — Picker affordance placement revision — SHIPPED session 57

**Retirement reason:** Shipped session 57 (2026-04-24) exactly per the approved direction. `Masthead` center column reverted to the "Treehouse Finds" brand lockup (session-40 right-slot share airplane preserved). `<BoothTitleBlock>` gained an optional `onPickerOpen` prop that turns the 32px IM Fell booth name into a tap target with an inline `▾` chevron when `/my-shelf` detects `vendorList.length > 1` (i.e. `showPicker`). Public Shelf + single-booth consumers omit the prop; the affordance is invisible in those contexts. Mockup `docs/mockups/my-shelf-multi-booth-v1.html` Frames 2 + 3 updated in the same commit to keep the mockup as the source of truth per the session-28 mockup-wins rule.

---

## ⏸️ Q-002 — Original spec (preserved as history)

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

## Operational backlog (small items, not Q-tickets)

> Items below are small recurring or one-off operational tasks that compete with the active arc as alternative next sessions. Sized + ordered so a session-open standup can pluck one without re-deriving the plan. **CLAUDE.md keeps 2–3 high-signal alternatives inline; everything else lives here.** Update this list when items resolve or new ones surface.

### 🟡 Pre-beta polish (operational, not code-gating)

| Item | Effort | Type | Why parked |
|------|--------|------|------------|
| **Staging migration paste + seed-staging re-run** | ~15 min HITL | Infra paste | Staging is N migrations behind prod (currently 009 + 010 + 011). Each prod migration adds drift; cheaper to batch. Run when staging needs to mirror prod for a QA walk. |
| **Staging Supabase OTP email template paste** | ~15 min HITL | Infra paste | Staging sends generic Supabase emails (session 54 discovery). Paste from `docs/supabase-otp-email-templates.md`. Non-gating — only matters when staging needs realistic email QA. |
| **Booths view on-device verification on staging** | ~5 min HITL | QA walk | Deferred from session 54 Task 10. Single-tap verification. |
| **Q-002 on-device QA walk** | ~5 min HITL | QA walk | Shipped session 57 commit `080689a`; single-booth + multi-booth + share-airplane preservation pass. |
| **`filter_applied` instrumentation verification** | ~5 min HITL | Verify | Session 58 QA didn't exercise the FEED filter chips so `filter_applied` count stayed at 0. Session 60 confirmed admin Events tab filter chips do NOT (and should not) fire `filter_applied` — that event is only emitted by [app/page.tsx:749](../app/page.tsx:749) on shopper-facing filter taps. Single test on `/` (tap a category chip, watch Vercel logs for the POST) confirms whether the track call works end-to-end. |
| **R3 raw-PostgREST probe** | ~10 min including deploy | Diagnostic | Parked from session 60. Write `/api/admin/events-raw` that uses bare `fetch()` against PostgREST (bypassing `@supabase/supabase-js`) and compare its response to the supabase-js path. **Only run if the admin-Events stale-data symptom is freshly reproducing on David's phone** — not worth chasing on dormant intermittent. If raw path is fresh → bug is in supabase-js. If raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either answer is publishable to support. |
| **`/find/[id]` `navigator.share()` instrumentation gap** | ~5 min decision + ~15 min if implementing | Decision then maybe code | Session 59 surface, untouched session 60. iOS native share sheet from `/find/[id]` never hits any server endpoint and is not captured. Decide: (a) fire `track("find_shared", {post_id})` at intent-capture time before `navigator.share()` opens, or (b) document the gap in `docs/r3-analytics-design.md` and accept it. |
| **Disable debug toast post-R3-stabilization** | ~10 sec | Cleanup | `localStorage.removeItem("th_track_debug")` once R3 finishing pass closes. Or leave on; harmless when disabled. |
| **Strip verbose console.logs from R3 routes** | ~10 min | Cleanup | Deferred again at session 60 close — keep until R3 mystery actually resolves, since the diag is the only visibility into the symptom when it recurs. |
| **R3 design-record retroactive update** | ~10 min | Docs only | Migration 010 deviated from `docs/r3-analytics-design.md`'s RLS-on spec (referenced an `admin_emails` table that doesn't exist). Update the design record so the spec matches what shipped. |
| **Design agent principle addition** | ~10 min | Docs only | "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. Add to MASTER_PROMPT.md §Design Agent. |
| **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** | ~10 min | Docs only | Three new gotchas to capture: Gmail `position: absolute` (session 52), new-Supabase-project URL Configuration prereq (session 54), force-`vercel --prod`-during-prod-QA (session 58). |
| **Session-archive drift cleanup** | ~30 min | Docs only | Sessions 28–38 + 44–58 are tombstone-only in CLAUDE.md. Backfill detail from git log into `docs/session-archive.md`. |
| **`/admin` UI `auth.users` delete reliability spike** | ~20–30 min | Investigation | Session 46 observed UI delete didn't stick. Not blocking. |
| **`/api/suggest` SDK migration or delta note** | ~30 min | Cleanup or docs | Session 43 confirmed this is the only AI route still on raw `fetch`. Either migrate to the Anthropic SDK for shape-consistency or document the delta in `CONTEXT.md`. Not beta-gating. |

### 🟢 Recurring next-session alternatives (always available)

These compete for the "Recommended next move" slot whenever the current arc closes or stalls:

| Item | Effort | Why it's always Ready |
|------|--------|----------------------|
| **Feed content seeding** | ~30–60 min | 10–15 real posts across 2–3 vendors. Has been "next" since session 55. Once content lands, V1 beta invites can ship per `docs/beta-plan.md`. |
| **R12 Error monitoring (Sentry)** | ~1 session | Horizon 1 roadmap item. Pairs naturally with R3 analytics — once event-capture lands, error-capture is the obvious sibling. |
| **R15 technical-path decision** | ~30–60 min, no-code | Single load-bearing scoping decision on the whole roadmap (Capacitor wrapper vs. Expo rebuild vs. full native). Design session, not implementation. |

### Closing items

When an item ships or becomes irrelevant: cut its row, note resolution in the next session-close block, no further entry needed here.

---
> Maintained by Docs agent. Entries are scoped, sequenced work — not vague ideas. Anything here should be runnable by a future Claude session with no additional deliberation.
