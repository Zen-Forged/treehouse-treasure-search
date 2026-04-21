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

## ✅ Session 38 (2026-04-21) — Window Sprint scoping + mockup approved

Design agent session per session-28 mockup-first rule. Four-frame share-booth mockup + full dev-handoff build spec + three queued implementation sessions. No code. Full session notes archived; superseded by session 39 for active whiteboard purposes.

---

## ✅ Session 39 (2026-04-21) — Q-004 rename + Q-005 tagline + Q-007 Window Sprint backend shipped

Shipped. Three queued sessions collapsed into one. Rename sweep (Q-004) and tagline shortening (Q-005) landed across 9 files; Window Sprint backend (Q-007 session 39 deliverables: `lib/posts.ts:getVendorWindowPosts`, `lib/email.ts:sendBoothWindow` + 5 internal helpers + `ShareBoothWindowPayload` type + `renderEmailShell` footer override, `app/api/share-booth/route.ts` with auth + rate limit + dedup + ownership + empty-window guard) all shipped in the same session. One build-gate error caught (`for...of` over a `Map` at pre-ES2015 tsconfig target) and fixed with a one-line `Map.forEach` swap; that fix promoted immediately as a new Tech Rule in `docs/DECISION_GATE.md`. Build green; deployed; committed and pushed. Supabase OTP email templates (Magic Link + Confirm Signup) pasted by David via dashboard.

### What shipped

**Q-004 rename** across 9 files — `lib/email.ts` (FROM_ADDRESS, 3 subject lines, 3 `— Treehouse Finds` signatures in HTML + plaintext, shell `<title>`, brand lockup block, footer, CTA strong-text, file-header comment), `app/layout.tsx` (metadata + appleWebApp + apple-mobile-web-app-title meta), `app/vendor-request/page.tsx` (intro copy + DoneScreen `created` + DoneScreen `already_approved`), `app/login/page.tsx` (logo alt text), `docs/mockups/email-v1-2.html` (title, 3 subjects, 3 brand lockups, B2 instruct-box, B3 OTP body, B1 body + footer, decisions-pane PWA bullet, 2 decisions-pane "After" code blocks, 2 pwa-intro-body paragraphs, 3 iOS Mail mail-from labels, stray `</li>` typo fixed), `docs/supabase-otp-email-templates.md` (subject, HTML title, preheader, brand lockup, sign-in prose, signature, footer), `CONTEXT.md` (title banner, §1 product-overview, §1 "is NOT" heading, footer trailer, last-updated), `MASTER_PROMPT.md` (title only), `CLAUDE.md` (session opener template project name). `public/manifest.json` verified: `name` already correct; `short_name` intentionally stays as `Treehouse` (iOS home-screen 12-char truncation would render `Treehouse Fin…`).

**Q-005 tagline** — `Kentucky & Southern Indiana` → `Embrace the Search. Treasure the Find.` across `lib/email.ts` shell, 3 mockup email frames, `docs/supabase-otp-email-templates.md`. Three-clause product-level tagline intact in `CONTEXT.md` §1 as the anchor.

**Q-007 session 39 deliverables:**
- `lib/posts.ts:getVendorWindowPosts(vendorId): Promise<Post[]>` — new export. 6-post hard limit, `status='available'` filter, `created_at DESC` order. Docstring explains the session-33 dependent-surface-audit reason it's a NEW function, not a mutation of `getVendorPosts` (which has no status filter because `/my-shelf` + `/vendor/[slug]` need sold posts visible for the three-part sold contract).
- `lib/email.ts:sendBoothWindow(payload)` — new public export. Five internal helpers: `renderWindowBody`, `renderBanner` (hero + pinned post-it), `renderPostItSvg` (inline SVG with `transform="rotate(4, 43, 43)"` — Outlook strips CSS rotation, SVG internal `transform` is respected; auto-scaling numeral by digit count 36/28/22), `renderLocationLine` (⛲ pin glyph + mall + Google Maps link), `renderWindowGrid` (3×2 HTML table, 4:5 aspect tiles, 12px italic captions with `max-height: 2.7em + overflow: hidden`, pads to multiple of 3 with empty cells). New `ShareBoothWindowPayload` interface explicitly omits `price_asking` (brand rule: no prices in the Window). `renderEmailShell` extended with optional `footerHtml` override — defaults to the legacy onboarding footer so the two existing callers don't shift; Window overrides with "someone shared a Treehouse Finds Window with you" copy. New `escapeAttr` internal helper alongside `escapeHtml`.
- `app/api/share-booth/route.ts` — new file. `POST { recipientEmail, activeVendorId }` → in-IP rate limit (5/10min) → `requireAuth` → email RFC + UUID validation → per-recipient 60s dedup → inline ownership check via service client (`vendors.user_id === auth.user.id`) → `getVendorWindowPosts` → empty-window guard (409 `empty_window`) → mall null-guard + array-or-object normalization (Supabase join cardinality) → `sendBoothWindow` → structured error responses (429 / 400 / 403 / 409 / 500 / 502). `logError` + `maskEmail` helpers for structured logging.

**Build-time decisions (build-spec §Unresolved closed):**
1. Pronoun: dropped entirely. Voice line reads `"{sender} sent you a Window into {vendorName}."` — no his/her/their guessing, matches subject-line pattern.
2. Sender first-name source: `vendor.display_name` for MVP. Ownership check guarantees vendor-shares-own-booth is the only reachable path.
3. Title truncation: natural word-wrap at ~130px cell width with `max-height: 2.7em + overflow: hidden` — mockup-matching CSS, no server-side truncation.

### Tech Rule promoted mid-session

`for...of` over a `Map` or `Set` does not compile at this project's tsconfig target — surfaced as build error `TS2569` on the `/api/share-booth/route.ts` dedup cleanup loop. One-line fix: replace `for (const [k, ts] of recentSends)` with `recentSends.forEach((ts, k) => ...)` (note callback signature is value-first, key-second). Promoted immediately as new Tech Rule **TS downlevelIteration** in `docs/DECISION_GATE.md`. The rule explicitly forbids flipping the compiler target or enabling `downlevelIteration` to work around it — either change would ripple to every other file in the project. Tech Rule block now holds 30+ entries.

### HITL completed this session
- ✅ Build check run twice (initial fail on `TS2569`, green after the one-line fix)
- ✅ Supabase Dashboard paste: Magic Link + Confirm Signup templates both updated with new subject line + brand lockup + tagline
- ✅ Git commit + push for the Q-004/Q-005/Q-007 shipment
- ✅ Git commit + push for the DECISION_GATE Tech Rule promotion

### Session 39 close HITL

All build-gate and commit steps ran inline during the session. Only pending HITL after this close is the standard session-close commit for CLAUDE.md + session-archive updates:

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 39 close — CLAUDE.md + session-archive update" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-21 (session 39 close — Q-004/Q-005 rename sweep + Q-007 Window Sprint backend all shipped; TS downlevelIteration Tech Rule promoted; Supabase OTP templates updated)

**Status:** Window Sprint backend fully shipped. Server can now send Window emails end-to-end — but there's no client entry point yet. Next session is the **Q-007 client** (session 40): `<ShareBoothSheet>` component, `/my-shelf` paper-airplane entry, 4 sheet states (compose / sending / sent / error). Pre-beta blocker column still clean. T4d QA walk still the gating verification before beta invites.

### Recommended next session — Q-007 client (session 40)

Implement the client half of the Window share feature per `docs/share-booth-build-spec.md` §3–4.

1. **`<ShareBoothSheet>` component** — mirrors `<BoothPickerSheet>` pattern. Compose state with email input + RFC-shape client validation matching the server regex. Submit via `authFetch()` to `POST /api/share-booth`.
2. **`/my-shelf` entry point** — paper-airplane icon next to the existing share button. Hidden when `getVendorWindowPosts().length < 1` to match the server's empty-window guard. Needs a light server-side check on page render to decide whether to show the icon.
3. **Four sheet states:** compose, sending (spinner + disabled CTA), sent (success copy + auto-dismiss or manual close), error (distinguishes 429 rate-limit / 429 dedup / 403 ownership / 409 empty-window / 502 send-failed with mode-appropriate copy per build spec).
4. **Toast / confirmation** on success — match existing post-publish toast pattern for consistency.

~90 min. Builds against the green backend shipped session 39; no server changes needed unless QA surfaces something.

### Session 41 — on-device QA walk

Four scenarios per build spec: (a) fresh send, (b) send to same recipient within 60s (expect 429 dedup), (c) 5 rapid sends to trigger IP rate limit, (d) empty-window guard (clear all posts, try to share — expect icon hidden; direct-POST returns 409).

### Alternative next sessions

- **T4d pre-beta QA walk** 🟡 HITL — still outstanding. Required gating verification before beta invites; independent of Q-007.
- **Q-002 picker polish solo** (~20 min) — masthead single-variant + chevron moves inline. Ready to run.
- **Tech Rule promotion batch** (~35 min) — four candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed. All ready for prose; pairs well with session-archive drift cleanup.
- **Session-archive drift cleanup** (~30 min) — sessions 28–37 exist as CLAUDE.md one-liners but have no archive detail. Not urgent but compounds session-by-session. Pairs naturally with Tech Rule batch.
- **Anthropic model audit + billing safeguards** (~30 min) — cheap hygiene.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first.

### Session 40 opener (pre-filled for Q-007 client)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running Q-007 session 40 — Window Sprint client. Implement <ShareBoothSheet> component + /my-shelf paper-airplane entry point + 4 sheet states (compose / sending / sent / error) per docs/share-booth-build-spec.md §3–4. Backend is green and deployed from session 39: POST /api/share-booth with auth + 5/10min rate limit + 60s per-recipient dedup + ownership check + 409 empty-window guard. Use authFetch() pattern. Mirror <BoothPickerSheet> sheet construction. Hide /my-shelf share entry when server-side check finds posts.length < 1. Error copy distinguishes 429/403/409/502 per spec. Session 41 is on-device QA walk (4 scenarios); this session ships client code only.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty at session 38 close. Window Sprint is explicitly NOT a pre-beta blocker — it’s a post-Sprint-4 feature. T4d QA walk remains the gating verification before beta invites.)*

### 🟡 Remaining pre-beta tech work

- **T4d pre-beta QA walk** 🟡 HITL — follow `docs/pre-beta-qa-walk.md` on device. All three onboarding flows + multi-booth sanity + test-data cleanup. Not code; execution.
- **Test data cleanup** — multiple "David Butler" variants + test booths in production DB. Built into the T4d runbook's "Post-walk cleanup" section.
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotion batch** — four candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed. ~40 min. Block location in `docs/DECISION_GATE.md` > The Tech Rules section. (Session 39 promoted TS downlevelIteration directly since it surfaced + resolved mid-build; no queue impact.)
- **Session-archive drift cleanup** — sessions 28–37 carry CLAUDE.md one-liners but have no archive detail. Not urgent; compounds. ~30 min batch whenever convenient. Pairs naturally with the Tech Rule batch above.

### 🟡 Window Sprint queued work (`docs/queued-sessions.md`)

- **Q-007 Window Sprint** — session 39 backend ✅ shipped. Session 40 client + session 41 on-device QA walk still queued. Mockup approved; build spec at `docs/share-booth-build-spec.md`.
- **Q-004 Rename sweep** ✅ shipped session 39.
- **Q-005 Email tagline sweep** ✅ shipped session 39.
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
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — reference for Q-007 client session 40.
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
