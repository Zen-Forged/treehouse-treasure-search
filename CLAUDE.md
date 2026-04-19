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
> Last updated: 2026-04-18 (session 23 — v1.1k activation flow pass shipped: `/vendor-request`, `/login`, `/setup`, new `/admin/login`; build green; committed + pushed to prod)

**Status:** ✅✅ **Session 23 shipped the v1.1k activation flow pass.** The last four v0.2 surfaces in the ecosystem — `/vendor-request` (form + success), `/login` (email + OTP + confirming), `/setup` (linking + success + error), and the PIN entry surface that previously lived as a tab inside `/login` — all moved forward to v1.1j vocabulary in a single commit. New dedicated `/admin/login` route lands with the sprint, resolving the session-8 onboarding-journey commitment to retire the Admin PIN tab. `docs/design-system.md` advanced v1.1j → v1.1k with an eight-point Status paragraph. `docs/mockups/activation-v1-1k.html` built (11 phone frames across 5 sections), David approved first pass ("looks great, ship it"). Build green; commit pushed to main. **Next session (24) opens with David's on-device QA walk of the deployed v1.1k state.**

### What shipped this session (one commit)

**`docs/design-system.md` — v1.1j → v1.1k:**
Version bumped in header (v1.1j → v1.1k; session 23). New Status paragraph at top with eight lettered commitments:
(a) **Mode C resolved for task-first surfaces.** v1.0 header-pattern system committed Mode C for `/post`, `/post/preview`, `/vendor-request`, `/setup`, `/login` but didn't specify interior grammar. v1.1k commits: back-arrow paper bubble (`v1.iconBubble` 38px) top-left, no masthead wordmark, no diamond dividers, no post-it, no cartographic glyphs. Editorial voice (`FONT_IM_FELL`) carries titles/subheads/end-of-path; precise voice (`FONT_SYS`) carries form fields/inputs/email echoes/timers/errors.
(b) **Paper-wash 60px success bubble primitive.** `rgba(42,26,10,0.04)` bg, 0.5px `v1.inkHairline` edge, glyph in `v1.inkPrimary`. Generalizes the v1.1f paper-variant icon bubble to hero scale. Retires SaaS success-toast green chrome across activation flow. *The ink carries the state; the shape carries the gesture.*
(c) **Filled green CTA — commit actions only.** `v1.green` bg + white `FONT_SYS` 15px 500 weight, 14px radius. Reserved for commit actions: Request access, Email me a code, Sign in as Admin, Go to my shelf. End-of-path actions become IM Fell italic dotted-underline text links. Cross-cutting rule for every Mode C surface.
(d) **Form input primitive.** White translucent `rgba(255,253,248,0.70)` bg, 1px `v1.inkHairline` border (focus 1.5px `v1.inkPrimary`; error 1.5px `v1.redBorder`), 14px radius, 14×14px padding, `FONT_SYS` 16px. Labels above in IM Fell italic 13px `v1.inkMuted` with natural sentence casing — retires every uppercase-tracked form label across v0.2 forms.
(e) **Email echo line primitive.** Horizontal row (not a card): 14px mail glyph `v1.inkMuted` + "Sent to " (`FONT_SYS` 14px `v1.inkMuted`) + email (`FONT_SYS` 14px `v1.inkPrimary` 500 weight), 12px vertical padding, 0.5px `v1.inkHairline` rules above/below. Reads as a shipping-label line. Retires v0.2 surface-card treatment.
(f) **Mode C tab switcher retires.** Rounded-pill `Email code / Admin PIN` tab switcher on `/login` retires entirely. Admin PIN moves to new dedicated `/admin/login` route. `/login` becomes curator-only. Resolves session-8 `docs/onboarding-journey.md` commitment.
(g) **`/admin/login` scope committed.** New route, dedicated PIN entry surface. Three states: PIN entry, signing-in bridge (identical treatment to `/login` confirming state), inline error. Composition: Mode C chrome + logo mark with shield glyph + "Admin Sign in" title + PIN input + filled green CTA + signing-in paper-wash bubble. `/admin` page itself deliberately out of scope per STOP rule on auth-flow changes — its unauth-gate redirect was surgically updated (`/login` → `/admin/login`) in one line with zero visual change.
(h) **`<MallSheet>` migration to `/vendor-request` deliberately deferred.** Native HTML `<select>` used in v1.1k with v1.1k form-input styling. MallSheet migration lands in dedicated Sprint 5 sub-sprint alongside `/post` + `/post/preview` consumers.

Pattern retirement log entries: v0.2 `greenLight`/`greenBorder` success check-bubble chrome; rounded-pill tab switcher on `/login`; uppercase + tracked-letter-spacing form labels; green info boxes (`Admin-only access…`, `✓ Approved · ready to sign in`) in favor of typography-carries-the-state.

PENDING table refreshed: "Onboarding screens v1.0 pass" removed (shipped as v1.1k); "`<MallSheet>` migration to `/post` and `/vendor-request`" updated to point to the deferral note.

**Code files touched (5):**

- `app/vendor-request/page.tsx` — full rewrite. Mode C chrome, v1 palette throughout, IM Fell for intro + success, `FONT_SYS` for form fields, v1.1k form input primitive, filled green CTA only on "Request access", success screen uses paper-wash bubble + email echo line + two IM Fell italic dotted-underline text links (no filled CTA). `Join Treehouse / REQUEST BOOTH ACCESS` eyebrow pair retired. Native `<select>` preserved with TODO comment pointing at v1.1k (h) for MallSheet migration. Preserved: form submission logic, validation rules, POST body shape, mall prefill from URL params.
- `app/login/page.tsx` — full rewrite. PIN tab + `handlePin` + `pin-signing-in` state + `TabMode` type + rounded-pill tab switcher all retired. `/login` is now curator-only. `Screen` type reduced to `"enter-email" | "enter-code" | "confirming"`. v1.1k primitives throughout: paper-wash logo bubble with `/logo.png` at 22px, form input, code input retires monospace → `FONT_SYS` 28px with 0.4em tracking, email echo line (second use of the primitive), paste-link retoned to IM Fell italic dotted-underline, resend row in `FONT_SYS`, confirming bridge uses paper-wash bubble + spinner + IM Fell title. Preserved: BroadcastChannel auth sync, `?redirect=` + `?next=` param handling (KI-003 fix intact), `safeRedirect` logic, 20-attempt 500ms polling on magic-link fallback. File loses ~35% of its LOC from v0.2.
- `app/setup/page.tsx` — full rewrite. Amber state chrome retired entirely. Card-wrapped layout retired — hero-centered on paper surface throughout. Four states (loading, linking, success, error) all use Mode C grammar. Success: paper-wash bubble + "Welcome to your shelf." in IM Fell 30px (name not used — `vendor.display_name` is booth name not person name; mall in subhead carries personalization instead) + booth detail in `FONT_SYS` + 3s auto-redirect countdown + filled green "Go to my shelf" CTA. Error: same bubble primitive retoned red-tint with alert glyph + IM Fell italic error copy + two text links (Try again / Back to sign-in) — no filled CTA on error paths per v1.1k (c). Preserved: 401 retry-with-backoff, `safeStorage` writes, `LocalVendorProfile` shape.
- `app/admin/login/page.tsx` — NEW file. PIN entry + signing-in bridge. Mode C chrome with back-arrow paper bubble top-left, paper-wash logo bubble with `lucide-react Shield` glyph (differentiates from curator's leaf logo), "Admin Sign in" title, IM Fell italic "Enter your PIN to continue." subhead, password input styled as 22px centered with 0.4em tracking, filled green CTA with inline Shield glyph. Signing-in bridge identical treatment to `/login` confirming state (paper-wash bubble + spinner + "Signing you in…" + "Just a moment."). Error surfaces inline on entry screen via red banner primitive. Uses existing `/api/auth/admin-pin` + `supabase.auth.verifyOtp` flow — no backend changes. Success → `router.replace("/admin")`.
- `app/admin/page.tsx` — one-line surgical edit. Unauth gate's "Sign in" button redirect `/login` → `/admin/login`. Zero visual change; admin UI untouched per STOP rule. T4b later decides full disposition.

### Scope calls honored during this sprint

- **`/admin` unauth gate expansion NOT bundled.** Early in scope discussion, Option A (bundling PIN entry into `/admin`'s unauth branch) was considered. DECISION_GATE STOP rule on auth-flow changes was invoked — bundling admin auth-gate expansion with an activation-flow design session would cross the multi-system coupling threshold. Option B (new dedicated route) chosen. Full `/admin` IA consolidation remains T4b's job.
- **MallSheet migration to `/vendor-request` deferred.** The v1.1i primitive is committed and ready, but wiring `/vendor-request` as its first non-Feed consumer widens the blast radius of what was already a 4-route sprint. Explicit TODO comment in code references v1.1k (h) in design-system doc. Sprint 5 sub-sprint bundles this with `/post` + `/post/preview` migration.
- **`/setup` success headline uses no first name.** Initial mockup showed "Welcome to your shelf, David." but the name isn't available at setup time — `vendor.display_name` is the booth name, `vendor_requests.name` isn't joined in. Honest correction before code: retoned to "Welcome to your shelf." (no comma, no name); mall name in subhead carries the personalization weight.
- **Logo glyph differentiation.** Curator's `/login` gets `/logo.png` (existing Treehouse leaf brand mark). `/admin/login` gets `lucide-react Shield` at 20px with `v1.green` stroke + 15% fill to signal the different audience. This is a post-mockup design call — mockup showed inline SVG leaf but the real brand mark is the PNG.

### Tool-environment notes this session

- **Bracket-path `str_replace` fails — use `filesystem:edit_file`.** First tried `str_replace` on `docs/design-system.md` (no brackets in path), got `File not found` despite the file existing and being readable via `filesystem:read_text_file`. Root cause: there are two separate `str_replace`-style tools in this environment — the container's shell `str_replace` and the filesystem MCP's `edit_file`. The container's version doesn't see the Mac filesystem. Always use `filesystem:edit_file` for Mac filesystem operations — it has different parameter shape (`edits` array of `oldText`/`newText` objects) and actually works. Already flagged in session 16 Tech Rules; worth re-surfacing.
- **New route dirs need `mkdir -p` first.** Hit this on `app/admin/login/` — `filesystem:write_file` refuses to write if parent dir doesn't exist, no `create_directory` tool available in this filesystem MCP namespace. Tech Rule already documents this for API routes; same applies to page routes. Workaround: one HITL terminal command before the write. David ran `mkdir -p /Users/davidbutler/Projects/treehouse-treasure-search/app/admin/login` and the write succeeded.
- **Cleaner rewrites this session.** `filesystem:write_file` for all four full rewrites + one `filesystem:edit_file` for the `/admin` surgical edit. Zero box-drawing-anchor bugs this session (unlike the four-fires-across-the-sprint pattern in 22A) because none of the rewritten files had box-drawing comment rules to anchor on.

### 🔆 Session 24 HITL — starts here

Pre-flight on iPhone:
1. Hard-refresh https://app.kentuckytreehouse.com after deploy completes
2. If stale state persists: Settings → Safari → Advanced → Website Data → remove `kentuckytreehouse`, then refresh
3. **Sign out first** — v1.1k changes are invisible if you're already signed in and not hitting `/vendor-request` or `/login` afresh

**QA walk checklist for v1.1k (on-device):**

- **`/vendor-request` form** — back-arrow paper bubble top-left (no "Join Treehouse / REQUEST BOOTH ACCESS" eyebrow pair); title "Bring your booth to Treehouse." in IM Fell 28px; form labels IM Fell italic 13px muted (no uppercase tracking); email input focus turns border 1.5px `inkPrimary`; mall dropdown styled to match (still native `<select>` — MallSheet deferred); "Request access" filled green CTA; invalid email submit → red 1.5px border + red banner in `FONT_SYS`
- **`/vendor-request` success** — paper-wash check bubble (60px, `inkPrimary` check, NOT green); "You're on the list." headline IM Fell 30px; email echo line with hairlines above/below (NOT a card); "Explore the feed →" as IM Fell italic dotted-underline text link; "Go back" returns to the form (NOT to previous page)
- **`/login` email entry** — NO tab switcher (this is the big visible change); paper-wash logo bubble 44px with `/logo.png`; "Curator Sign in" IM Fell 28px; only ONE input + ONE CTA
- **`/login` OTP entry** — email echo line with hairlines above/below; code input 28px `FONT_SYS` (not monospace), 0.4em tracking, centered, NO `••••••` placeholder; paste-link retoned IM Fell italic dotted-underline with tiny green clipboard glyph; fallback "Or tap the link we emailed you — either works."; resend row in `FONT_SYS` with countdown; auto-verifies on 6th digit (no submit button)
- **`/login` confirming bridge** — visible if you tap the magic link instead of typing the code — paper-wash bubble + spinner + "Signing you in…" / "Just a moment."
- **`/admin/login`** — direct URL https://app.kentuckytreehouse.com/admin/login — paper-wash bubble with Shield glyph (green-filled at 15% opacity); "Admin Sign in" title; password input 22px centered with 0.4em tracking; filled green "Sign in as Admin" CTA with Shield glyph inline; PIN verify → signing-in bridge identical to `/login` confirming → lands on `/admin`
- **`/admin` unauth gate** — sign out, visit `/admin` directly; "Admin access only" gate appears; tap "Sign in" → routes to `/admin/login` (NOT `/login` as before)
- **`/setup`** — hardest to test organically; easiest path is full Flow 2 via `dbutler80020+10@gmail.com` test email: admin adds vendor request → approve → open approval email → sign in → land on `/setup`. Success: paper-wash check bubble + "Welcome to your shelf." + mall name in `inkPrimary` woven into italic subhead + booth detail in `FONT_SYS` + 3s auto-redirect + filled green "Go to my shelf" CTA. Error: red-tinted same bubble + alert glyph + "Something didn't line up." + try-again/back-to-sign-in text links

**Things to watch for** (flagged by Claude during session 23 close):

- On `/vendor-request` success, the back-arrow calls `setDone(false)` (back to the form), NOT `router.back()` (out of page). Intentional to match v0.2 "Go back" button logic, but the icon semantics might read wrong. If it feels confusing on device, flag for iteration.
- On `/login` OTP screen, back-arrow goes to email entry, NOT out of `/login`. Preserved v0.2 behavior, probably correct, but worth a look.
- Error bubble tint on `/setup` error is red-retoned (`redBg`/`redBorder` + alert glyph in `red`). Alternative was keeping it paper-wash with only the alert glyph carrying the warning. If the red feels too loud, the quieter version is a one-line iteration.
- Long email addresses in the email-echo line wrap to a second line via `word-break: break-all`. On `dbutler80020+10@gmail.com` the `+10` wraps. Acceptable, or should we truncate with ellipsis?

### Session 24 candidate queue

- **24A — QA feedback from on-device walk of v1.1k** (David's likely next-session opener per the established pattern — 17, 18, 20, 22, 23 all closed with "start next session with on-device feedback").
- **24B — KI-003 diagnosis** (vendors posting under stale identity after approval; pre-beta blocker; still parked since session 18). Now the *only* 🟡 tech item remaining before beta; design-debt inventory is essentially empty after v1.1k.
- **24C — Sprint 4 tail batch** (T4c copy polish remainder + T4b admin surface consolidation + T4d pre-beta QA walk). `/admin/login` being its own route now makes T4b a cleaner sprint — the decision of whether to fold `/admin/login` into `/admin`'s unauth gate lives there.
- **24D — `<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Mechanical work against a committed primitive; ~2 hours.
- **24E — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **24F (Docs agent housekeeping)** — Promote the bracket-path `str_replace` vs `filesystem:edit_file` disambiguation into `docs/DECISION_GATE.md` Tech Rules. The box-drawing anchor lesson from session 22A close also still needs promotion (session 21A close proposed it, session 22A close re-proposed it, session 23 didn't hit it because no box-drawing rewrites were needed — but it'll come back).

### Files touched this session
- `docs/design-system.md` — v1.1j → v1.1k (eight-point Status paragraph; four pattern-retirement entries; PENDING table refresh; footer updated)
- `docs/mockups/activation-v1-1k.html` — NEW, 11 phone frames, decisions pane + primitive annotations throughout; approved first-pass
- `app/vendor-request/page.tsx` — full rewrite
- `app/login/page.tsx` — full rewrite (PIN tab retired, file ~35% shorter)
- `app/setup/page.tsx` — full rewrite
- `app/admin/login/page.tsx` — NEW file
- `app/admin/page.tsx` — one-line surgical edit (unauth gate redirect)
- `CLAUDE.md` (this file) — session 23 close

### Session 23 close HITL — already complete

All HITL steps ran this session:
1. ✅ `mkdir -p /Users/davidbutler/Projects/treehouse-treasure-search/app/admin/login` (one-time fix; new page route dirs always need this before first `write_file`)
2. ✅ `npm run build` — green (confirmed by David)
3. ✅ `git add -A && git commit -m "feat(v1.1k): activation flow pass — /vendor-request, /login, /setup, new /admin/login" && git push` (pushed to main)
4. ✅ Vercel deploy triggered by push (David confirmed the push; deploy status verified on prod next session open)

---

## ARCHIVE — What was done earlier (2026-04-18, session 22A — v1.1j QA polish pass)

**`docs/design-system.md` — v1.1i → v1.1j:**
Version bumped in header (v1.1i → v1.1j; date 2026-04-18 session 22A). New Status paragraph added directly above the v1.1i Status paragraph (chronological-newest-first order). Six numbered commitments:
(a) **Diamond ornament retires from every divider.** The v1.0-era commitment (*section divisions via whitespace, hairline rules, and the diamond ornament*) held up in docs but read as noise on device. All dividers become plain full-width hairlines with no center ornament. Surfaces affected: Feed (×3), Find Map (×2, including the new closer), Find Detail (×2 — cartographic divider + SoldLanding 3B), MallSheet (×1), Booth pages (×2 including BoothCloser). `<DiamondDivider>` primitive keeps its name for export stability but renders a plain hairline.
(b) **Booth numbers switch to `FONT_SYS` globally.** IM Fell English's single-serif `1` reads as capital-I on small inline pills; `FONT_SYS` (system-ui) at the same size resolves it. Scope: `<BoothPill>` on Find Map, `<Pill>` on Find Detail's vendor row, 36px post-it numeral on both Find Detail and the Booth banner. Per the *precise data* typography rule — booth numbers are data, not editorial. Post-it eyebrow stays IM Fell italic (editorial voice); only the numeral moves. Pill weight 500 with `letterSpacing: -0.005em`; 36px numeral weight 500 with `letterSpacing: -0.01em`.
(c) **`/my-shelf` Window View renders 9-cell placeholder composition for owner.** Grid always renders exactly 9 cells: `[AddFindTile]` + real posts + dashed `<PlaceholderTile>`s to fill the remainder. Makes the window-pane metaphor self-evident and reads an empty booth as *panels to fill* rather than *a punishing gap*. Owner-only; public `/shelf/[slug]` does NOT render placeholders. `<WindowView>` gains `showPlaceholders?: boolean` prop.
(d) **`<AddFindTile>` joins Shelf View for owner.** Reverses the session-18 commitment (*AddFindTile is never in Shelf View*). Rationale for reversal: Window View's 9-cell treatment now says *this page is about filling spots*; if Shelf View hides the add affordance, the two views disagree about the page's purpose for the owner. AddFindTile becomes the first tile in Shelf View with `marginLeft: 22` defensive alignment, same 52vw/210px max. `<ShelfView>` gains `showAddTile?: boolean` prop.
(e) **Find Map closer closes the loop.** The v1.1g spine ended in open air — on device this read as *trailing off*, not as *the trip ends here*. v1.1j adds a 48px hairline dropping from the last X down to a 16px filled circle (`v1.inkPrimary`) in the same spine column. Copy ("End of the map. Not the end of the search.") moves directly below, centered, in `FONT_SYS` 15px `v1.inkMid` weight 400 (matches the "Booth" label voice above). Diamond-flanked divider above the closer retires. Intro voice bumps 15px → 16px for the 50+ legibility floor.
(f) **Home masthead left-slot logo enlarges.** 24px/0.72 opacity → 34px/0.92 opacity, no bubble (it's a brand mark, not an action). Sits in a 38px slot so it occupies the same visual weight as the back-button bubble on pages that have one.

Pattern retirement log entries: diamond ornament as divider punctuation, IM Fell for booth numerals on inline/pill contexts.

**Code files touched (6):**

- `components/BoothPage.tsx` — `<DiamondDivider>` primitive now renders a plain hairline (name kept for export stability); post-it 36px numeral switches `FONT_IM_FELL` → `FONT_SYS` with weight 500; new `<PlaceholderTile>` primitive exported; `<WindowView>` gains `showPlaceholders` prop (defaults `false`); new internal `<ShelfAddFindTile>` primitive sized to match `<ShelfTile>`; `<ShelfView>` gains `showAddTile?` + `vendorId?` props; `<ShelfTile>` signature updated to take `isFirst: boolean` (replaces implicit `index === 0`); `<BoothCloser>` retires the diamond divider in favor of a plain hairline. Header comment block updated to document v1.1j changes.
- `app/my-shelf/page.tsx` — passes `showPlaceholders={true}` to WindowView; passes `vendorId` + `showAddTile={true}` to ShelfView; empty-inventory branch now renders `<ShelfView posts={[]} showAddTile={true}>` instead of a dead-end message, giving the owner the same add affordance across both views.
- `app/page.tsx` — Home left-slot logo bumped 24/0.72 → 34/0.92; hero divider (between FeedHero and masonry) retires diamond → plain hairline; vendor CTA divider at bottom of feed retires diamond → plain hairline.
- `app/find/[id]/page.tsx` — `<Pill>` numeral `FONT_IM_FELL` → `FONT_SYS` weight 500 `letterSpacing: -0.005em`; post-it 36px numeral `FONT_IM_FELL` → `FONT_SYS` weight 500 `letterSpacing: -0.01em`; SoldLanding 3B diamond divider retires → plain hairline; main cartographic diamond divider (between caption and cartographic block) retires → plain hairline. Manage section "Manage" labeled-divider untouched (it's a labeled section break, not a pure diamond ornament).
- `app/flagged/page.tsx` — `<BoothPill>` numeral `FONT_IM_FELL` → `FONT_SYS` weight 500 `letterSpacing: -0.005em`; intro voice 15px → 16px; mall-to-itinerary diamond divider retires → plain hairline; **closer rebuilt** — was `<motion.div>` with diamond-flanked divider + IM Fell italic 16px copy, now two stacked `<motion.div>`s: (1) a 26px-1fr grid whose spine column renders a 48px hairline + 16px `v1.inkPrimary` filled circle (aligned to where X glyphs were), (2) centered text block below in `FONT_SYS` 15px `v1.inkMid` weight 400. `<Stop>` component unchanged.
- `components/MallSheet.tsx` — position-6 diamond divider (between subhead and scrollable mall rows) retires → plain hairline. (Stale `{/* ── 6. Diamond divider ── */}` outer comment left in place; inner comment names it as retired per v1.1j. Can tune the outer comment during a future cleanup.)

### Tool-environment lessons reinforced this session

- **Box-drawing comment-rule anchor bug fired four times.** Every file with `// ─── Section title ───` comment rules in its `oldText` anchor bounced on `filesystem:edit_file` (`components/BoothPage.tsx`, `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/MallSheet.tsx`). Workaround that worked reliably: drop the rule line from the anchor entirely; anchor on function signatures or unique inline style-prop combinations instead. **This lesson has now surfaced in sessions 16, 19A, 21A, and 22A.** The next session's Docs agent should finally promote it to `docs/DECISION_GATE.md` Tech Rules as proposed in session 21A close. Proposed wording: *"When `filesystem:edit_file` fails with 'Could not find exact match' and the failing anchor contains box-drawing characters (───, ═══), drop the rule line from the anchor entirely. Anchor on unique code content (function signatures, unique inline-style prop combinations, `}\n\nexport default`, etc.) instead. Do a separate surgical edit to handle the orphaned rule if needed."*
- **`filesystem:edit_file` batches are atomic.** When one `oldText` in a multi-edit batch doesn't match, *every* edit in the batch rolls back — even the ones whose anchors did match. Bit this session on the first `app/page.tsx` attempt (three edits submitted, all three rolled back when the middle one failed on a box-drawing anchor). Good discipline: split edits whose anchors are risky into their own `filesystem:edit_file` calls.

### 🔆 Session 23 HITL — starts here

Pre-flight on iPhone (unchanged from 22A):
1. Hard-refresh https://app.kentuckytreehouse.com after deploy completes
2. If stale state persists: Settings → Safari → Advanced → Website Data → remove `kentuckytreehouse`, then refresh

QA walk checklist for v1.1j (on-device):
- **Global** — no diamond ornaments anywhere in the product. Every divider is a plain full-width hairline.
- **Home** — left-slot logo is clearly visible (34px, 0.92 opacity), feels like a brand mark rather than a placeholder. Divider between feed hero and masonry is plain hairline. Vendor CTA divider at bottom of feed is plain hairline.
- **Find Map** — intro voice reads one size larger (16px). Divider between mall anchor and itinerary is plain hairline. Scroll to the last stop: below the last X, a hairline drops to a small filled circle (same column as the X glyphs); below that, "End of the map. Not the end of the search." renders centered in sans-serif (no more IM Fell italic). No diamond divider above the closer.
- **Find Detail** — post-it numeral reads as sans-serif (booth 1s look like 1s, not Is). Vendor-row booth pill numeral also sans-serif. Divider between caption and cartographic block is plain hairline.
- **Find Detail 3B sold landing** — divider between explanation and links is plain hairline.
- **My Shelf / Public Shelf** — post-it numeral on banner reads as sans-serif. BoothCloser divider is plain hairline.
- **My Shelf — new** — Window View renders exactly 9 cells regardless of post count: `[AddFindTile]` + posts + dashed placeholder tiles to fill. Switch to Shelf View: the first (leftmost) tile is now an `AddFindTile` matching the surrounding tile dimensions. Empty booth in Shelf View: still shows the AddFindTile (no more dead-end message).
- **Public Shelf** — Window View does NOT show placeholders (visitor view shows only real inventory); Shelf View does NOT show an AddFindTile (public visitors can't add).
- **MallSheet** — open from Home feed; divider between subhead and mall rows is plain hairline.

### Session 23 candidate queue

- **23A — QA feedback from on-device walk of v1.1j** (David's likely next-session opener). Iteration on shadow, typography, MallSheet, 3B composition, or anything else that surfaces.
- **23B — KI-003 diagnosis** (vendors posting under stale identity after approval; pre-beta blocker; still parked since session 18).
- **23C — Sprint 5: onboarding v1.0 pass + `<MallSheet>` migration** to `/post` and `/vendor-request` (second + third consumers of the primitive).
- **23D — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **23E — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk).
- **23F (Docs agent housekeeping)** — Promote the box-drawing anchor lesson into `docs/DECISION_GATE.md` Tech Rules, stop it from repeating every design session. Tune the stale `{/* 6. Diamond divider */}` outer comment in `components/MallSheet.tsx`. Optional: bump the `/flagged` file header comment from `v1.1f` to `v1.1j` (the code is already v1.1j-correct but the header hasn't been bumped across sessions 20–22A).

### Files touched this session
- `docs/design-system.md` — v1.1i → v1.1j (six-point Status paragraph added)
- `components/BoothPage.tsx` — DiamondDivider + BoothCloser + post-it numeral + WindowView + ShelfView + new PlaceholderTile + new ShelfAddFindTile
- `app/my-shelf/page.tsx` — WindowView + ShelfView prop passthroughs; empty-inventory branch
- `app/page.tsx` — logo enlarge + two diamond divider retirements
- `app/find/[id]/page.tsx` — Pill + post-it numeral font swap; two diamond divider retirements
- `app/flagged/page.tsx` — BoothPill font swap; intro voice 15→16; mall divider + closer rebuild
- `components/MallSheet.tsx` — position-6 diamond divider retirement
- `CLAUDE.md` (this file) — session 22A close

### Session 22A close HITL — already complete

All HITL steps ran this session:
1. ✅ `npm run build` — green (confirmed by David)
2. ✅ Commit pushed to main with message `polish(v1.1j): retire diamonds, booth-number font swap, /my-shelf 9-cell grid, Find Map closer loop, Home logo`
3. ✅ Vercel deploy confirmed live (David ran the push, verified prod)

---

## ARCHIVE — What was done earlier (2026-04-18, session 21A — v1.1i code sprint + v1.1i-polish)

**Status:** ✅✅ **Session 21A shipped the v1.1i code sprint AND a same-session v1.1i-polish pass from on-device QA feedback.**

### What shipped this session (two commits)

**Commit 1 — `53a382d` — v1.1i core:**
- `components/MallSheet.tsx` NEW (~270 lines) — canonical mall-selection bottom-sheet primitive matching the props contract locked in `docs/design-system.md` v1.1i. paperCream surface, 20px top radius, drag handle, IM Fell 22px "Choose a mall" header + italic subhead + diamond divider, All-malls row (no pin, italic, active-underline) + pin-glyph mall rows (name + city + find-count + active-underline). Backdrop tap-to-dismiss, body scroll lock, safe-area-inset aware. Sort: All first, then alphabetical.
- `app/page.tsx` full rewrite against Feed v1.1i spec — Mode B masthead (logo-placeholder left at 0.72 opacity / wordmark / sign-in-sign-out text link right), paper feed hero (state-dependent "Finds from across / Finds from" eyebrow + 26px mall/geography name as MallSheet trigger + chevron-down glyph + inline pin+dotted address OR italic "Kentucky & Southern Indiana" subtitle), diamond divider, paper masonry (2-col, 50% right-column offset preserved via ResizeObserver on first tile, 6px radius + 1px inkHairline border on every tile, photograph-only, no titles, no prices, frosted paperCream heart top-right with state-independent bg + green glyph when saved), empty state, retoned vendor CTA (diamond divider + italic muted IM Fell prompt + italic dotted-underline link). `safeStorage` mall persistence via `treehouse_saved_mall_id`. All scroll-restore + last-viewed + visibility-reload behaviors preserved from v0.2.
- `app/find/[id]/page.tsx` — new `SoldLanding` component defined before the default export, early branch `if (isSold && !isMyPost) return <SoldLanding …/>` at the top of the render path. 3B layout composition: masthead → "This find / found a home." headline (IM Fell 30px, hard line break) → italic muted explanation ("The piece you saved has been claimed by someone else. That's the way of good things.", max-width 300) → diamond divider @ 60px inset → "Visit [vendor]'s shelf →" + "Back to Treehouse Finds" italic dotted-underline links → BottomNav. Owner exception documented inline. Dead-code note on hero-photo grayscale filter (parked for future cleanup).
- `app/flagged/page.tsx` — `FindTile.isSold` fully retired: no photo grayscale/opacity filter, no "Found a home" price caption. Three-part-contract comment block added explaining why the bookmark key stays + tile stays visible + 3B is the reveal (and why `getPostsByIds` must NOT gain a status filter).
- `components/MallHeroCard.tsx` — DELETED. Zero remaining callers after `app/page.tsx` migrated off the v0.2 hero.

**Commit 2 — v1.1i-polish (same session, post-QA):**
- `components/MallSheet.tsx` — centering fix. Sheet container was using `position: fixed, left: 50%, transform: translateX(-50%), width: 100%, maxWidth: 430` which pairs the static centering transform with Framer Motion's `y` animation. Framer sets `transform: translateY(…)` on the element, wiping the static `translateX(-50%)` mid-animation — the sheet's left edge ended up pinned to mid-viewport on David's iPhone. Fixed by switching to `position: fixed, left: 0, right: 0, bottom: 0, margin: 0 auto, width: 100%, maxWidth: 430`. Transform-free centering, matches the column-centering pattern every page wrapper uses. Long in-file comment explains the root cause for future Dev agents. **This failure mode is now documented twice — once inline in `MallSheet.tsx` and once in the DECISION_GATE Tech Rule lineage (the original rule since session 15: never combine a centering transform with a Framer y-animation on the same element; session 21A demonstrates the failure mode on a real device).**
- **Sticky mastheads** across five pages: `app/page.tsx`, `app/flagged/page.tsx`, `app/find/[id]/page.tsx` (normal + SoldLanding), `app/my-shelf/page.tsx`, `app/shelf/[slug]/page.tsx`. Each masthead now gets `position: sticky, top: 0, zIndex: 40, background: rgba(232,221,199,0.96), backdropFilter: blur(24px), WebkitBackdropFilter: blur(24px), borderBottom: 1px solid v1.inkHairline`. Mirrors BottomNav's chrome pattern at the opposite edge (paperCream translucent + blur + inkHairline separator).
- **My Shelf / Public Shelf — masthead moved inside overflow-auto scroll container.** Sticky's containing block is the nearest scrolling ancestor. Both Booth pages use a `<div style={{ flex: 1, overflowY: "auto" }}>` scroll container as the scroll context. Masthead was previously outside this container, so sticky anchored to the window (which wasn't scrolling) instead of the scroll container. Moving Masthead inside the overflow-auto div makes sticky correctly anchor to the scroll context. No visual change when not scrolling; correct pin behavior when scrolling.
- **Drop-shadows on product photographs** — two shadow strengths. Tile-strength `0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)` on: Home MasonryTile (replaces previous `0 1px 4px`, preserves the elaborate highlighted-tile multi-layer path), Find Map FindTile photo wrapper, Find Detail ShelfCard thumbnails, Booth WindowTile, Booth ShelfTile. Hero-strength `0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)` on Find Detail hero photo (largest photo on any page, earns slightly stronger lift). **Skipped per David's instruction:** Booth banner `BoothHero` (vendor mall image hero, different visual role — already has its own scrim + post-it + share bubble composition). Shadows are tone-matched to `inkHairline`, warm/low-opacity/short-throw — sits the photo *on* the paper, doesn't float it above. Paper-as-surface intact.

### Scope calls surfaced during the core sprint (David's awareness, not blocking)

- Feed masthead left slot — kept low-opacity logo as neutral placeholder. Nav Shelf lands here in 21B (deferred).
- Feed masthead right slot — kept v0.2 sign-in/sign-out as IM Fell italic dotted-underline text link. Didn't invent a profile/user-circle icon because no profile page exists yet.
- Find Detail 3B owner exception — guarded with `isSold && !isMyPost`. Owners retain normal layout with manage affordances ("Mark as On Display" etc). Spec framed 3B as shopper-facing.
- Hero-photo `isSold` grayscale filter on Find Detail — dead code for shopper path (3B branches out), no-op for owner. Left in place with comment; cleanup parked.
- Vendor CTA at feed bottom — kept (only vendor-onboarding surface visible to shoppers). Re-voiced to v1 palette: diamond divider + italic muted IM Fell prompt + italic dotted-underline link.

### Three-part v1.1i sold contract — committed and enforced in code

The spec's three-part contract is now binding across three files. **Breaking any one breaks all three.**

1. `safeStorage` bookmark key NOT pruned when a saved find sells — enforced in `app/flagged/page.tsx` (no new pruning logic added; existing behavior preserved)
2. Find Map FindTile renders sold saves identical to available saves — enforced by the `isSold` retirement in `FindTile` (no grayscale, no opacity, no "Found a home" caption)
3. Find Detail 3B IS the reveal on tap-through — enforced by the `if (isSold && !isMyPost) return <SoldLanding/>` branch

**Do NOT add a status filter to `getPostsByIds`.** That would break path 2 (tile wouldn't render) and path 3 (can't navigate to what doesn't load). The three-part contract is also documented in `docs/design-system.md` v1.1i and in the in-file comment at the top of `FindTile` in `app/flagged/page.tsx`.

### Tool-environment lessons reinforced this session

- **`filesystem:edit_file` + unicode box-drawing rules remains unreliable.** Hit the `═══…` / `─────` anchor-mismatch bug AGAIN mid-session when trying to clean up a duplicate `export default function FindDetailPage()` in `app/find/[id]/page.tsx`. Workaround that finally worked: drop the rule line from the `oldText` anchor entirely; anchor on unique non-unicode content (function signatures, `}\n\nexport default`, etc.). Then a separate surgical remove of the orphan rule line. **This lesson keeps repeating across sessions 16, 19A, 21A — it needs permanent elevation in DECISION_GATE Tech Rules. Next session's Docs agent should add it explicitly.** Proposed wording: *"When `filesystem:edit_file` fails with "Could not find exact match" and the failing anchor contains box-drawing characters (───, ═══), drop the rule line from the anchor entirely. Anchor on unique code content (function signatures, variable names, `}\n\nexport default`, etc.) instead. Do a separate surgical edit to handle the orphaned rule if needed."*
- **Framer Motion y-animation vs static transform centering** — the MallSheet bug is the second appearance of this category (first was flagged in DECISION_GATE after the Find Detail icon-bubble work). New standard: **use `left: 0, right: 0, margin: 0 auto` for column-centering any element that also has Framer Motion transforms.** Not `left: 50% + translateX(-50%)`. Documented in the in-file MallSheet comment and ready for DECISION_GATE promotion.
- **`filesystem:write_file` remained the reliable full-rewrite tool.** `filesystem:edit_file` handled the surgical polish edits with minor anchor tuning.

### 🔆 Session 22 HITL — starts here

David's instruction at session close: **"will start with QA feedback on next sprint."**

Before QA walk on iPhone:
1. Clear stale `th_vendor_profile` on iPhone (KI-003 precondition from session 18) — open https://app.kentuckytreehouse.com, Settings → Safari → Advanced → Website Data → search "kentuckytreehouse" → Remove
2. Hard refresh the site after deploy completes

QA walk checklist (on-device):
- **Feed** loads with "Finds from across / Kentucky" eyebrow+title and "Kentucky & Southern Indiana" italic subtitle
- **Scroll Home** → masthead stays pinned to top with soft paperCream tint + crisp inkHairline bottom border
- **Masonry tiles** have gentle paper-tone lift (not floaty, not flat — tone-matched shadow should feel like the photo is resting on paper, not floating above a marketplace card)
- **Tap mall name** → MallSheet slides up **centered within the 430px column** (bug fix verification)
- **Tap America's Antique Mall** → sheet dismisses, hero flips to "Finds from / America's Antique Mall" + pin + dotted-underline address (tappable → Apple Maps)
- **Hard refresh** → saved mall persists; feed reopens on America's Antique Mall
- **Tap All malls row** in sheet → resets to geography view, saved key cleared
- **Tap a heart on a feed tile** → green fill appears; tile doesn't navigate (tap propagation stopped)
- **Find Map** → scroll → masthead pinned; FindTile photos have matching subtle lift; saved finds visible including any sold ones (identical rendering to available ones)
- **Find Detail** → scroll down past the hero photo → masthead pinned with crisp bottom hairline; hero photo has slightly stronger shadow than tiles (largest photo on any page)
- **My Shelf / `/shelf/[slug]`** → scroll → masthead pinned; Window View + Shelf View tiles have lift; **banner has no shadow** (check preserved — hero image, different visual role)
- **3B reveal** — flip a post to `sold` in Supabase, deep-link to `/find/[id]` → sold landing renders (headline + italic explanation + diamond + vendor shelf link + home link), masthead sticky here too
- **Owner path on sold find** — as admin or as the post owner, deep-link to a sold find → normal Find Detail layout with manage affordances ("Mark as On Display" etc), NOT 3B

### Session 22 candidate queue

- **22A — QA feedback from on-device walk** (David's stated next-session opener). Any iteration on sticky masthead chrome, shadow strength, MallSheet behavior, 3B composition.
- **22B — KI-003 diagnosis** (vendors posting under stale identity after approval — pre-beta blocker per session-18 context, still parked)
- **22C — Sprint 5: onboarding v1.0 pass + `<MallSheet>` migration** to `/post` and `/vendor-request` (second + third consumers of the new primitive)
- **22D — 21B Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`)
- **22E — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk)

### Files touched this session
- `components/MallSheet.tsx` — NEW (core) + centering fix (polish)
- `app/page.tsx` — full rewrite (core) + sticky masthead + tile shadow bump (polish)
- `app/find/[id]/page.tsx` — SoldLanding + 3B branch (core) + sticky mastheads ×2 + hero photo shadow + ShelfCard shadow (polish)
- `app/flagged/page.tsx` — `isSold` retirement in FindTile (core) + sticky masthead + FindTile photo shadow (polish)
- `app/my-shelf/page.tsx` — sticky masthead + moved inside scroll container (polish only)
- `app/shelf/[slug]/page.tsx` — sticky masthead + moved inside scroll container (polish only)
- `components/BoothPage.tsx` — WindowTile + ShelfTile shadows (polish only); BoothHero banner untouched per instruction
- `components/MallHeroCard.tsx` — DELETED (core)
- `CLAUDE.md` (this file) — session 21A close

### Session 21A close HITL — already complete

All HITL steps already ran this session:

1. ✅ Core commit `53a382d` pushed to main
2. ✅ `rm components/MallHeroCard.tsx` ran cleanly post-build
3. ✅ Polish commit pushed to main
4. ✅ Vercel deploy triggered on push (pending verification this deploys cleanly — David noted first polish push didn't deploy; second push after `git push` confirmed cleared the webhook)

Open item for Session 22 start: verify the deployed state matches the committed state, THEN run QA walk.

---

## ARCHIVE — What was done earlier (2026-04-18, session 20)
> Pure design-direction session; v1.1i spec committed to `docs/design-system.md`; two mockups on disk; no production code changed. Fully realized in code by session 21A.

**Status:** 📘 **Session 20 was a pure design-direction session.** `docs/design-system.md` advanced v1.1h → v1.1i with three linked commitments: Feed redesign (paper masonry + feed hero on paper), `<MallSheet>` bottom-sheet primitive, and sold retires from shopper discovery surfaces. David picked **C2** for the feed and **3B** for the sold landing state. The session-21A code sprint realized all three in production.

### What shipped this session (2 commits' worth of doc/mockup work)

**`docs/design-system.md` — v1.1h → v1.1i:**
- Version bumped in header and footer
- New v1.1i Status block paragraph documenting all three commitments
- New `### Feed — COMMITTED v1.1i (session 20)` section with full spec (Mode B masthead, feed hero on paper with state-dependent copy, paper masonry with ResizeObserver 50% right-column offset preserved, 6px radius + inkHairline border, frosted hearts always visible top-right, All-malls default state with "Finds from across / Kentucky" copy, sold items filtered at data layer)
- New `### MallSheet — COMMITTED v1.1i (session 20)` section with full primitive spec + props contract (paper surface, 20px top corner radius, drag handle, IM Fell header + italic subhead + diamond divider + rows, pin glyph per mall row, no-glyph italic "All malls" row, hairline underline on active label matching Booth ViewToggle active treatment, sort: All first then alphabetical)
- New `### Find Detail sold landing state — COMMITTED v1.1i (session 20)` section (full page replaces normal Find Detail when `post.status === "sold"`, masthead stays continuous, headline "This find / found a home." with hard line break, explanation "The piece you saved has been claimed by someone else. That's the way of good things.", diamond divider, two IM Fell italic dotted-underline links to vendor shelf + Treehouse Finds, BottomNav retained)
- Three-part contract explicitly documented so a future Dev agent doesn't break it: **bookmark kept + tile visible + 3B reveal** — removing any one breaks the other two. Do NOT add a status filter to `getPostsByIds`
- Old "Feed header + mall bottom sheet — scope against v1.0 before code" section marked SUPERSEDED with breadcrumb
- Find Map `### Find tile primitive` updated with v1.1i `**Sold state — UPDATED v1.1i**` note retiring the grayscale + "Found a home" caption treatment
- Three new entries in Pattern retirement log: `<MallHeroCard>` + `<GenericMallHero>` gradient cards, inline `ChevronDown` mall dropdown, sold-state grayscale + opacity + "Found a home" caption on feed and Find Map tiles
- Terminology table gains `**Sold-label surface policy (v1.1i)**` paragraph: "Found a home" retained as committed terminology but surfaces only on Find Detail 3B headline + Booth page sold-history surfaces (post-beta); retired from shopper discovery paths for MVP
- PENDING table refreshed: removed completed "Feed + `<MallSheet>` v1.1 pass" and "Token additions to `lib/tokens.ts`" (both done); added "`<MallSheet>` migration to `/post` and `/vendor-request`" (Sprint 5), "3A Find Detail sold landing state (photograph-still-visible treatment)" (post-MVP), "Find Map saved-but-sold tile signal" (post-MVP); tokens cleanup pass note updated to reflect Feed joining `v1` tokens

**`docs/mockups/feed-v1-1h.html` — NEW (v1 exploration):**
- 3 grid treatments (A: Find tile with price, B: Find tile titles only, C: paper masonry) × 2 header treatments (1: Mode B + mall subheader à la Find Map, 2: feed-specific hero on paper)
- 6 phone frames total at real 430px width; tradeoff strips above each section; legend block at top; pick-me combinator block at bottom
- 7th phone showing `<MallSheet>` open state in the first iteration (with diamond-glyph All row, later corrected)

**`docs/mockups/feed-v1-1h-v2.html` — NEW (v2, C2 refined + sold-state variants):**
- **Section 1** — two phones showing C2 refined: all-malls default state (hero "Finds from across / Kentucky" with geo subtitle) and specific-mall state (hero shows mall + address line)
- **Section 2** — MallSheet refined with no-glyph italic All-malls row as active, find-count reading "1 mall live · more soon" for beta honesty
- **Section 3** — three Find Detail sold-state variants side-by-side (3A dim + toast, 3B dedicated page, 3C render-as-normal) each with pros/cons annotation blocks; 3C explicitly flagged not-recommended
- Decisions pane at top locks C2 + All-malls default + "Finds from across Kentucky" + MallSheet no-glyph All row + frosted hearts on tiles; remaining pick at bottom is 3A/3B/3C

### Five questions settled this session (all now in doc)

1. **All-malls hero copy:** "Finds from across Kentucky" (eyebrow stacks "Finds from across" + 26px "Kentucky")
2. **Sold items on masonry grid:** retired entirely across MVP shopper discovery (bigger than feed-only styling — extended to a full product-scope commitment)
3. **MallSheet All row glyph:** no glyph; italic label alone
4. **Feed first-load with no saved mall:** defaults to All malls
5. **Save gesture on masonry tiles:** frosted heart always visible top-right (identical primitive to Find Map's Find tile heart, state-independent bubble, green-glyph active state)

### Follow-on questions settled

6. **Find Detail sold landing state:** 3B (dedicated "found a home" full page). 3A noted as longer-term target post-MVP pending real on-device data
7. **Public Booth page sold policy:** NOT extended — `/shelf/[slug]` continues to show sold posts because vendor story/credibility benefits
8. **Find Map behavior when a saved find sells:** keep the bookmark key so the 3B page resolves via the saved tile tap. Three-part contract (bookmark + tile + 3B) locked

### Files touched (session 20)
- `docs/design-system.md` — v1.1h → v1.1i (seven targeted edits; no full rewrite)
- `docs/mockups/feed-v1-1h.html` — NEW, v1 exploration (3×2 = 6 variants + MallSheet)
- `docs/mockups/feed-v1-1h-v2.html` — NEW, v2 refined (C2 locked + sold-state 3-way)
- `CLAUDE.md` — session 20 close (later archived in session 21A)

### Session 21 scope (shipped in session 21A)
All 21A tasks landed on main across two commits. Retention notes preserved in the session 21A block at top.

---

## ARCHIVE — What was done earlier (2026-04-18, session 19)

**Status:** ✅ **Session 19 opened with 19A — token consolidation cleanup — as the post-session-18 palate-cleanser.** `lib/tokens.ts` extended with canonical `v1` + `fonts` exports alongside the untouched v0.2 `colors` export. The three inline `v1` objects previously duplicated across `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, and `components/BoothPage.tsx` were retired; all three now import from `@/lib/tokens`. `BoothPage.tsx` re-exports `v1`/`FONT_IM_FELL`/`FONT_SYS` so `/my-shelf` and `/shelf/[slug]` imports resolve unchanged. 19B (Feed + `<MallSheet>` redesign against v1.1h) deliberately deferred to its own session given the mockup-first protocol and ~3hr scope. **Build check + commit is HITL at session close — see below.**

### What shipped (pending single commit)

**`lib/tokens.ts` — extended, v0.2 tokens untouched:**
- Added canonical `v1` export (14 keys: `paperCream`, `postit`, `inkPrimary`, `inkMid`, `inkMuted`, `inkFaint`, `inkHairline`, `priceInk`, `pillBg`, `pillBorder`, `pillInk`, `iconBubble`, `green`, `red`, `redBg`, `redBorder`, `imageRadius: 6`, `bannerRadius: 16`) — the union of values previously duplicated across the three pages, byte-identical to what was inline.
- Added `fonts` export (`imFell`, `sys`) plus named convenience exports `FONT_IM_FELL` and `FONT_SYS` matching the constants previously declared in each page.
- Left `colors`, `radius`, `spacing` exports **completely untouched** — the feed and every other v0.2 consumer is unaffected. The two token sets coexist by design during migration; v0.2 retires only when the last v0.2 consumer migrates to v1.1h.
- File-top docstring explicitly names this coexistence and why (palette mismatch: `#f5f2eb` vs `#e8ddc7`, different ink scales) so the next editor doesn't merge them prematurely.

**`components/BoothPage.tsx` — inline `v1` + font consts retired:**
- Imports `v1`, `FONT_IM_FELL`, `FONT_SYS` from `@/lib/tokens`.
- **Re-exports** the same symbols so `app/my-shelf/page.tsx` and `app/shelf/[slug]/page.tsx` keep their existing `import { v1, FONT_IM_FELL, FONT_SYS } from "@/components/BoothPage"` working unchanged. No edits needed on either Booth page.
- File-top comment updated from "v1 inline token set — matches Find Detail exactly. Token promotion to lib/tokens.ts is the final step of this sprint; do not promote mid-build." → a committed-as-of-session-19A statement.

**`app/find/[id]/page.tsx` — inline `v1` + font consts retired:**
- Imports `v1`, `FONT_IM_FELL`, `FONT_SYS` from `@/lib/tokens`.
- Inline `v1 = { ... } as const` block deleted; comment header trimmed to `// ── v1.1 tokens ──` with a two-line "imported from lib/tokens.ts" annotation.
- Zero behavioral or visual change — token values are byte-identical.

**`app/flagged/page.tsx` — inline `v1` + font consts retired:**
- Same treatment as Find Detail.
- `green` key (only used by Find Map for the saved-heart fill) carried into canonical `v1` in `lib/tokens.ts` so the heart still renders correctly.
- Comment header preserved at full box-drawing rule length.

### Tool-environment note from this session

**Session-16 gotcha resurfaced:** `filesystem:edit_file` `oldText` anchoring on comment headers with box-drawing rules (`─────`) is unreliable across files because the rule lengths drift by a character here and there. Workaround that worked cleanly: anchor `oldText` on the unique `const v1 = {` line (not the comment header), then do a separate targeted edit to replace the comment. This is now documented via example in the tool-lesson lineage stretching back to session 16. For future Dev agents: when `edit_file` fails with a "Could not find exact match" error and the failing anchor is a comment rule, drop the comment from the anchor and replace it in a separate edit.

No other gotchas. `filesystem:write_file` worked exclusively for the single full rewrite (`lib/tokens.ts`). `filesystem:edit_file` handled the three targeted retirements.

### Why 19B deferred to its own session

Session 19 opened with 19A → 19B bundled as the intended scope. Mid-session the decision was made to ship 19A alone and open 19B fresh. Rationale:

1. **Mockup-first protocol holds.** Session 17 (Find Map) and session 18 (Booth page) both demonstrated that v1.1h redesigns benefit from 1–2 iterations of static HTML mockups before any code is written, with David reviewing between iterations. Rolling a 45-min cleanup and a 3-hour mockup-first redesign into one session would compress the design conversation too tightly.
2. **Clean commit hygiene.** 19A is a surgical refactor with zero visual change. 19B is a substantial multi-screen redesign with visual change. Keeping them in separate commits preserves the ability to bisect and revert cleanly if 19B surfaces a regression.
3. **Design agent readiness.** 19B scopes against v1.1h Feed + `<MallSheet>` + Find tile primitive reuse from Find Map. The Design agent should open session 20 (or a fresh 19) with a dedicated standup on feed header pattern, mall selector as bottom sheet, and the feed grid retired from its v0.2 masonry treatment toward a v1.1h vocabulary.

### Post-sprint loose ends (deliberately deferred)

- **Mockup HTML cleanup** — `docs/mockups/booth-v1-1g.html`, `docs/mockups/booth-v1-1g-v2.html`, `docs/mockups/find-map-exploration.html`, `docs/mockups/find-map-v2.html` can retire after on-device QA confirms v1.1g + v1.1h hold. No urgency.
- **`components/ShelfGrid.tsx` ruthless deletion** — zero current callers per session 18 audit, retention comments in-file. Could delete in a future cleanup session if a thorough grep confirms no legacy consumers. Still no urgency.
- **Feed + other v0.2 consumers still import `colors`** — this is intended state until 19B (Feed redesign) migrates the feed to v1.1h. At that point the remaining v0.2 consumers (vendor profile page, mall page, `/post`, `/post/preview`, `/admin`, `BottomNav` local `C`) can be audited and a decision made on whether to migrate them or retire the v0.2 token set entirely.

### Session 20 candidates

**20A — Feed header + `<MallSheet>` bottom sheet against v1.1h** (~3 hours). The feed is the front door and is still entirely v0.2. Mode B masthead pattern, pin-glyph in the mall selector, Find tile primitive reused from Find Map in the feed grid. **This is the top-of-queue design sprint now that token consolidation is complete.** Mockup-first protocol — 1–2 iterations in `docs/mockups/feed-v1-1h.html` before code.

**20B — Nav Shelf decision + BottomNav full chrome rework** (~1 hour including David's A/B/C/D selection in `docs/mockups/nav-shelf-exploration.html`). Still held from sessions 16–19. BottomNav hasn't had a full chrome pass since v1.1d's minimal patch; a v1.1h-era rework can land in one sprint once David picks.

**20C — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). ~5.5 hours focused. Non-design work; priority is rising as design-debt shrinks.

**Recommended:** 20A in its own session with full design scoping time. 20B as a shorter follow-on or bundled with 20A if bandwidth allows.

### Files touched this session
- `lib/tokens.ts` — extended with canonical `v1` + `fonts` + `FONT_IM_FELL` + `FONT_SYS` exports (v0.2 tokens untouched)
- `components/BoothPage.tsx` — inline `v1` + font consts retired; imports and re-exports from `@/lib/tokens`
- `app/find/[id]/page.tsx` — inline `v1` + font consts retired; imports from `@/lib/tokens`
- `app/flagged/page.tsx` — inline `v1` + font consts retired; imports from `@/lib/tokens`
- `CLAUDE.md` (this file) — session 19 close

### Session close HITL (session 19 — superseded, kept for reference)

Session close included a required build verification per the session-14 tech rule. The session-19 close commands were:

```bash
cd ~/Projects/treehouse-treasure-search && npm run build 2>&1 | tail -30
```

If the build is green, commit:

```bash
git add -A && git commit -m "refactor(tokens): promote v1.1h palette + fonts to lib/tokens.ts (19A)" && git push
```

Then `thc` for the standard docs-update commit (this CLAUDE.md edit).

If the build fails, surface the error — most likely cause is a missed import somewhere in the three migrated files. All three were verified by reading, so a failure would be something the Dev agent missed. Rollback is `git checkout -- lib/tokens.ts components/BoothPage.tsx app/find/\[id\]/page.tsx app/flagged/page.tsx` and a fresh session.

---

## ARCHIVE — What was done earlier (2026-04-18, session 18)

**Status:** ✅✅ **Session 18 shipped the Booth page redesign that's been the biggest outstanding design debt since session 15.** Both `/my-shelf` (owner) and `/shelf/[slug]` (public) rebuilt from the ground up against v1.1h: banner becomes a pure photograph with the booth post-it pinned to it (same primitive as Find Detail), vendor display name becomes the IM Fell 32px page title, mall + address demote to a small pin-prefixed block, and the availability tabs (On Display / Found homes) retire in favor of Window View (3-col 4:5 grid) + Shelf View (horizontal scroll, 52vw tiles). Four v0.2 components retired and deleted in the same commit. Build green. Commit `9271ecc` on main. Token promotion to `lib/tokens.ts` remains parked as final cleanup (safer post-QA).

### What shipped (1 commit — `9271ecc`)

Following the session-17 close, session 18 scoped into candidate 18A (Booth page v1.1g second pass). The second pass was scope-creeped into a more ambitious v1.1h after a mockup-first exploration surfaced an IA problem the v1.1g plan hadn't anticipated.

**Mockup-first protocol (two iterations before code):**
- v1 mockup (`docs/mockups/booth-v1-1g.html`): applied v1.1g cartographic pin+tick+X block with vendor name on the banner and "Explore booth →" pill on vendor row — essentially Find Map's grammar transplanted to the Booth page with the booth as a secondary content block
- David's redirect: *"Booth is the hero, not the mall."* The mall-as-title pattern is wrong for this page — the booth IS the page. Vendor name off the banner, booth post-it onto the banner (same primitive as Find Detail)
- v2 mockup (`docs/mockups/booth-v1-1g-v2.html`): vendor name relocated to IM Fell 32px page title below banner; booth post-it pinned to banner bottom-right (96×96px variant, +6° rotation, stacked "Booth Location" eyebrow, 36px numeral); small pin-prefixed mall+address block as secondary location statement below the title; cartographic pin+X block retired for this page (the post-it substitutes for the inline X when the booth is the page's subject); Window View + Shelf View toggle replaces the availability tabs; Shelf View tiles bumped 42vw/170px → 52vw/210px
- David approved v2 with one fix applied in code: Shelf View first tile needs 22px left padding so it doesn't sit flush to the screen edge

**Design-system doc updated v1.1g → v1.1h.** Key additions:
- **Post-it primitive becomes cross-page.** Find Detail's photograph and Booth's banner both carry it; identical in rotation/shadow/typography. The rule that lets them coexist: *post-it names the booth when the photograph is the subject; X names the booth when the photograph is a stop along a list.* First committed case of the post-it acting as a substitute for the inline X glyph.
- **Window View + Shelf View tabs replace availability tabs.** Not "On Display vs Found homes" anymore — both views show the same available inventory, differently. Window View = 3-col 4:5 portrait grid (window-pane gestalt). Shelf View = horizontal scroll of the same items at larger size (slower walk). AddFindTile (owner only) is the top-left cell in Window View, never in Shelf View. Sold items retire from this page entirely.
- **`<ExploreBanner>` retires.** The v0.2 green-gradient "Discover more finds" CTA card contradicted paper-as-surface. Replaced with diamond-divider quiet closer: "The shelf ends here. More booths await you." No link; BottomNav carries navigation.
- **Banner 16px radius** (the lone exception to the 6px photograph rule, justified by banner's wide-aspect hero role and larger surface area where 6px would read as almost square).
- **Booth page title eyebrow "a curated shelf from"** documented as the one italic lowercase eyebrow allowed on this page.
- **Terminology table gains Window View / Shelf View** as committed names.
- Three v0.2 components formally retired in doc: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`.

**Code (2 page rewrites, 1 new shared component):**
- `components/BoothPage.tsx` — NEW. Shared primitives file. Exports: `BoothHero` (banner + post-it + edit/share bubbles), `BoothTitleBlock` (eyebrow + 32px vendor name), `MallBlock` (pin + mall name + dotted-underline address), `DiamondDivider`, `ViewToggle` (text-link pair), `AddFindTile`, `WindowView` (3-col grid), `ShelfView` (horizontal scroll with `marginLeft: 22` on first tile — matches Find Detail's defensive alignment), `BoothCloser`, `BoothPageStyles`. Inline `v1` token object with Booth-specific additions (`bannerRadius: 16`).
- `app/my-shelf/page.tsx` — full rewrite. Preserved: auth gating, self-heal via `/api/setup/lookup-vendor` (KI-003 fix), hero upload with 12MB guard + compression, admin vendor param handling, ADMIN_DEFAULT_VENDOR_ID fallback chain, LocalVendorProfile caching. New: owner variant Masthead (no back, empty right slot), view state defaults "window", re-typed NoBooth + Skeleton in IM Fell. `canEdit={true}` for BoothHero.
- `app/shelf/[slug]/page.tsx` — full rewrite. Preserved: `getVendorBySlug` → `getVendorPosts` → mall resolution, NotFound state, bookmark-count passthrough. New: public variant Masthead with back arrow (visitors arrive from Find Detail deep links), `canEdit={false}`, no AddFindTile in Window View, empty-state copy "Nothing on the shelf yet — check back soon."

**Components retired in same commit:**
- `components/LocationStatement.tsx` — DELETED. Full grep across app/ and components/ confirmed zero callers.
- `components/BoothLocationCTA.tsx` — DELETED.
- `components/ExploreBanner.tsx` — DELETED.
- `components/TabSwitcher.tsx` — DELETED.

**`components/ShelfGrid.tsx` — annotated with retention comments.** `FoundTile` explicitly parked ("PARKED v1.1h — retained for future post-beta vendor-story surface"). File has zero current callers but exports (`ThreeColGrid`, `AvailableTile`, `SkeletonGrid`, `ShelfGridStyles`) may have legacy consumers that weren't audited with 100% certainty. Ruthless cleanup possible in a future session; safer to leave now.

**Build state:** `npm run build` green before commit. `/my-shelf` bundle 5.09 kB, `/shelf/[slug]` bundle 2.64 kB — both smaller than v0.2 after retiring four unused components. Commit `9271ecc` on main.

### IA shift that v1.1h lands (worth re-stating)

The Booth page now has an inverted information architecture vs. Find Map. Find Map is *"these saved finds are at this mall"* — mall is the subject, booths are the stops. Booth page is *"this booth has these finds"* — the booth IS the subject, the mall is secondary context. The design vocabulary now reflects this: Find Map uses the cartographic pin+X+tick grammar explicitly (mall pin at top, X at each booth stop); Booth page uses the post-it primitive to name the booth as the page's subject and demotes the mall to a small pin-prefixed block.

This generalizes into a rule: **post-it names the booth when the photograph is the subject; X names the booth when the photograph is a stop along a list.** The rule is now documented in the cartographic vocabulary section of the design system.

### Tool-environment notes from this session

No new gotchas. `filesystem:write_file` used exclusively for all Mac filesystem writes (the lesson from session 16 holds). `filesystem:edit_file` used for surgical doc updates. The bash container filesystem is still separate from the real Mac filesystem — can't use it for grep across the project. Worked around it with `filesystem:read_multiple_files` → pipe result into `bash_tool` grep on the stored tool-result JSON. Slow but reliable for orphan detection.

### Post-sprint loose ends (deliberately deferred)

- **Token promotion to `lib/tokens.ts`** — v1.1 palette (`paperCream`, `postit`, `inkPrimary`, `inkMid`, `inkMuted`, `inkFaint`, `inkHairline`, `priceInk`, `imageRadius: 6`, `bannerRadius: 16`) now lives as an inline `v1` object in three places: `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx`. Consolidation to `lib/tokens.ts` was intentionally parked as the final step of this sprint — safer order than mid-build. Recommend session 19 opens with this as a quick (~45 min) cleanup commit before starting on the next big piece.
- **Mockup HTML cleanup** — `docs/mockups/booth-v1-1g.html` and `docs/mockups/booth-v1-1g-v2.html` can retire after on-device QA confirms the redesign holds.
- **`ShelfGrid.tsx` ruthless deletion** — if a future session wants to be thorough, grep once more across the full codebase for `ThreeColGrid`, `AvailableTile`, `SkeletonGrid`, `ShelfGridStyles` callers; if zero, delete the file entirely.

### Session 19 candidates

**19A — Token consolidation cleanup** (~45 min). Opens with the post-sprint loose end above. Promotes `v1` inline tokens to `lib/tokens.ts`, rewires Find Detail + Find Map + BoothPage to import from the canonical source. Good palate-cleanser opener.

**19B — Feed header + `<MallSheet>` bottom sheet against v1.1h** (~3 hours). The feed is the front door and is still entirely v0.2. Mode B masthead pattern, pin-glyph in the mall selector, Find tile primitive (from v1.1g) reused in the feed grid. This was 18B; carrying forward.

**19C — Nav Shelf decision + BottomNav full chrome rework** (~1 hour including David's A/B/C/D selection in `docs/mockups/nav-shelf-exploration.html`). Still held from sessions 16–18. Worth picking soon — BottomNav hasn't had a full chrome pass since v1.1d's minimal patch, and a v1.1h-era full rework can land it in one sprint.

**19D — Sprint 4 tail batch** (T4c copy polish + T4b admin surface consolidation + T4d pre-beta QA walk). ~5.5 hours focused. Non-design work; still needed pre-beta. Priority rising as design-debt shrinks.

**Recommended:** 19A → 19B in the same session if bandwidth allows. Token consolidation is small enough to not earn its own session; bundling with Feed work keeps momentum.

### Files touched this session
- `docs/design-system.md` — v1.1g → v1.1h (Booth page redesign + cross-page post-it primitive + glyph substitution rule)
- `docs/mockups/booth-v1-1g.html` — NEW, v1 mockup (mall-as-title exploration — superseded but retained as historical record)
- `docs/mockups/booth-v1-1g-v2.html` — NEW, v2 mockup (final spec — approved by David with the 22px left-padding fix applied in code)
- `components/BoothPage.tsx` — NEW, shared primitives for both Booth pages
- `components/ShelfGrid.tsx` — retention comments added; code unchanged
- `components/LocationStatement.tsx` — DELETED
- `components/BoothLocationCTA.tsx` — DELETED
- `components/ExploreBanner.tsx` — DELETED
- `components/TabSwitcher.tsx` — DELETED
- `app/my-shelf/page.tsx` — full rewrite against v1.1h spec
- `app/shelf/[slug]/page.tsx` — full rewrite against v1.1h spec
- `CLAUDE.md` (this file) — session 18 close

---

## ARCHIVE — What was done earlier (2026-04-18, session 17)
> Find Detail v1.1e/v1.1f on-device polish + Find Map v1.1g full redesign; paper-cream bg globalized; glyph hierarchy locked

**Status:** ✅✅ Session 17 shipped two full pieces of work: (1) a two-pass polish refinement of Find Detail from v1.1d → v1.1e → v1.1f based on live iPhone QA, and (2) a complete mockup-first redesign of `/flagged` (the Find Map page) from v0.2 marketplace chrome → v1.1g journal vocabulary. Plus a glyph hierarchy commitment that locks `pin = mall` / `X = booth` as a cross-cutting rule. All code built green. Doc evolved v1.1d → v1.1e → v1.1f → v1.1g in three targeted update passes across the session.

### Three commits shipped in session 17

**Commit 1 — Find Detail v1.1e polish pass (morning):**
Body background `#f0ede6` → `#e8ddc7` paperCream globalized in `app/layout.tsx` + `app/globals.css`. Ten on-device polish items on `app/find/[id]/page.tsx`: masthead wordmark italic-on-"Finds" retired (Title Case single style, 16 → 18px, letter-spacing `-0.005em`); save + share relocated from masthead to frosted paperCream bubbles on photograph top-right (`backdrop-filter: blur(8px)`, 0.5px inkHairline edge, 38px diameter); icon bubble default size 34 → 38; new `IconBubble` `variant` prop (`paper` vs `frosted`); vendor row label `Explore` → `Explore booth →` (arrow moves INTO label); shelf-link pill slimmed to pure numeric badge (no "Booth" word, no arrow, 13 → 16px IM Fell non-italic, padding tightened to `2px 9px`); X glyph `paddingTop: 5 → 3` for vendor-name ascender alignment. Design-system doc advanced v1.1d → v1.1e.

**Commit 2 — Find Detail v1.1f same-session follow-up (mid-morning):**
Three refinements from immediate on-device follow-up: frosted icon-bubble bg now state-independent (v1.1e green-tint active state blended into warm/dark photos; bubble stays paperCream, only glyph flips color when saved); post-it pulled inward from viewport edge (`right: -12 → 4`, sits inside 22px page margin); post-it rotation bumped `+3 → +6deg` (committed range `+3` to `+8`, `+6` as default); post-it eyebrow stacks "Booth" / "Location" on two lines (14px IM Fell italic, line-height `1.1`; `minHeight: 84 → 92` to accommodate). Design-system doc advanced v1.1e → v1.1f.

**Commit 3 — Find Map v1.1g full redesign (afternoon):**
Product decision: `/flagged` route name kept for backwards compatibility, UI everywhere reads "Find Map." Glyph hierarchy committed: pin = mall (page-level, once), X = booth (per-stop, once per stop). Locked.

Mockup-first protocol: 3-approach exploration (`docs/mockups/find-map-exploration.html`) with Journal Itinerary / Pinned Postcards / Map Journal. Approach A (Journal Itinerary) selected. Then 4-iteration refinement mockup (`docs/mockups/find-map-v2.html`) with David before code — v2 with X glyph spine + Caveat opener + ordinal labels + end-of-path marker + Maps action; v3 dropped ordinals + end-of-path + Caveat (added intro voice + closer with "Continue exploring" link); v4 final spec dropped Continue link (BottomNav handles it), threshold horizontal-scroll for 3+ finds, prices on each find, closer pulled from primary ink → mid ink 16px.

`app/flagged/page.tsx` full rewrite against v1.1g: Mode A masthead → "Find Map" subheader (IM Fell 30px) → intro voice (IM Fell italic 15px) → pin + mall + dotted-underline address → diamond divider → per-stop itinerary (X glyph spine + hairline ticks + `Booth [NNN pill]` row to `/shelf/[slug]` + vendor italic + saved-count + 2-up grid or horizontal scroll for 3+ finds) → find tiles (4:5 photo + 6px radius + inkHairline border + frosted paperCream heart top-right + italic title + system-ui priceInk price or "Found a home" italic muted for sold) → diamond rule + closer. All v0.2 localStorage scanning, stale pruning, grouping/sorting, focus rehydration, unsave wiring, `BottomNav flaggedCount` passthrough preserved intact. Design-system doc advanced v1.1f → v1.1g.

### Glyph hierarchy rule committed

**pin = mall. X = booth. Locked.** These two cartographic glyphs do not swap, substitute, or appear interchangeably. On any page that shows both a mall and its booths, the pin appears *once* (mall anchor, page-level) and the X appears *once per booth stop* (inline, content-level). Find Detail uses this grammar already (pin + mall + tick + X + booth). Find Map establishes the paginated version (one pin at top, N X's down the spine). *Session 18 extended this rule with the post-it substitution clause: when the booth is the page's subject, the post-it on the hero photograph substitutes for the inline X.*

### Files touched in session 17
- `app/layout.tsx` — body background to paperCream
- `app/globals.css` — `@layer base body` background to paperCream
- `app/find/[id]/page.tsx` — two polish passes (v1.1e, v1.1f)
- `app/flagged/page.tsx` — full rewrite to v1.1g
- `docs/design-system.md` — v1.1d → v1.1e → v1.1f → v1.1g (three targeted edit passes)
- `docs/mockups/find-map-exploration.html` — 3-approach exploration
- `docs/mockups/find-map-v2.html` — final-spec mockup, iterated 4 times

---

## ARCHIVE — What was done earlier (2026-04-18, session 16)
> Find Detail v1.0 code build + 4 iteration passes v1.0 → v1.1d; BottomNav minimal chrome patch; nav-shelf exploration mockup

### What shipped (code + docs, committed incrementally)

**Code files modified:**
- `app/layout.tsx` — added IM Fell English (400 normal + italic) and Caveat (500) via `next/font/google` exposed as `--font-im-fell` and `--font-caveat` CSS variables on `<html>` className. Required prerequisite for Find Detail v1.0 build.
- `app/find/[id]/page.tsx` — full rewrite v1.0, then iterative refinement through v1.1 → v1.1d using `filesystem:edit_file` targeted edits
- `components/BottomNav.tsx` — two-line minimal patch: background `rgba(245,242,235,0.97)` → `rgba(232,221,199,0.96)` (paperCream translucent); top border `rgba(26,24,16,0.09)` → `rgba(42,26,10,0.18)` (inkHairline). Full chrome rework deferred to Booth v1.1 sprint.
- `docs/mockups/nav-shelf-exploration.html` — NEW. Four nav-as-wood-shelf approaches (A Suggestion, B Grain, C Full Shelf, D Line Alone) rendered at real mobile dimensions with surrounding page context. Pending David's review + selection in session 17.

**Docs updated:**
- `docs/design-system.md` — evolved v1.0 → v1.1d across the session via many targeted edits (see change log below)

### Design evolution: v1.0 → v1.1d

**v1.0 initial build** — masthead wordmark · photograph with post-it top-left + status pill bottom-right · title + price em-dash · centered quoted caption · diamond divider · cartographic pin+X block · "Visit the shelf →" IM Fell italic · "more from this shelf…" strip · Owner Manage block. Inline `v1` token object.

**v1.1 — legibility pass** from on-device feedback:
- Typography +1–2px across small type for 50+ audience (title 30→32, caption 17→19, pill 11→13, eyebrows grown)
- Title Case everywhere, uppercase + letter-spacing retired (was SaaS dashboard chrome)
- Post-it top-left → bottom-left (collision + legibility)
- 6px corner radius on hero photo + shelf thumbnails
- X glyph anchored to vendor name baseline (was drifting to shelf link)
- "Visit the shelf →" IM Fell italic → system-ui 400 matching address voice
- Shelf strip insets to 22px page margin
- Booth number styled as pill on vendor line (visual twin to status pill)

**v1.1b — post-it anchor + accessibility floor:**
- Post-it dimensions 78×72 → 92×84, numeral 28→36, eyebrow 11→12
- Accessibility font-size floor committed in doc: 16px primary reading, 15px section announcements, 13–14px secondary, 12px absolute floor. Calibrated against WCAG 2.1/2.2, Apple HIG, Material Design 3, NN/g.
- "More from this shelf…" and Manage eyebrows 13→15
- "Visit the shelf" weight 500→400 (exact match to address line)

**v1.1c — paper calibration + post-it contrast:**
- `paperCream` `#f1ead8` → `#e8ddc7` (warmer/browner, sheds yellow cast)
- `inkMuted` `#7a6244` → `#6b5538` (darkened to maintain WCAG AA 5.1:1 on new paper; old would have dropped to 4.2:1 failing AA at 14px)
- Post-it triple-dial contrast: color `#faf3dc` → `#fffaea`, shadow `0 4px 8px/0.20` → `0 6px 14px/0.28`, hairline edge `0.08` → `0.16`
- Vendor row restructured: name alone on top, shelf-link pill below (retires standalone "Visit the shelf →")
- Defensive `marginLeft: 22` on first shelf thumbnail; container `paddingLeft: 0`
- Post-it "Booth" eyebrow 12→14

**v1.1d — status pill retirement + post-it relocation + push pin + Explore label:**
- **Status pill fully retired.** "On Display" was redundant chrome on a browse page where every visible find is by definition available. Sold state is carried by photograph grayscale treatment.
- **Photo 1px `inkHairline` border** added to hero photo AND shelf thumbnails. Critical separation for warm-toned subjects against paper. Feature not workaround — paper-tone-respecting photography is the brand intent; the hairline is what makes it hold the page.
- **Post-it moved bottom-left → bottom-right** with `rotate(+3deg)` opposing direction, `transformOrigin: bottom right`, `right: -12, bottom: -14`. Single grounded object on the photo's bottom-right corner post status-pill removal.
- **Push pin added** at top-center of post-it: 8px circle `rgba(42,26,10,0.72)` with inset `0 0 0 2px rgba(42,26,10,0.55)` ring and `0 1px 2px rgba(42,26,10,0.35)` lift shadow. Matte ink, no shine, no metallic highlight. The pin is a second detail *on the post-it* (not a third object on the photo), reinforcing the *placed* verb beyond rotation alone.
- **Vendor row becomes `[Name]` on top, `Explore [Booth NNN →]` inline below** — "Explore" matches mall address voice exactly (system-ui 400 dotted-underline, inkMuted, 14px). Whole row wrapped in single `Link` to `/shelf/[slug]`. Names the verb so the pill reads as tappable at a glance for 50+ users.
- **BottomNav minimal chrome patch** — bg paperCream translucent, border inkHairline. Full chrome rework deferred to Booth v1.1 sprint.

### 🔆 Tool lesson surfaced this session — IMPORTANT for future Dev agents

**`create_file` does NOT write to the mounted filesystem in this environment.** It returns "File created successfully" but the file is unchanged on disk. **`filesystem:write_file` is the ONLY reliable write tool.** `filesystem:edit_file` works for targeted edits. `str_replace` fails on bracket-path files.

This is documented in `docs/DECISION_GATE.md` Tech Rules but was missed on the first pass this session (wasted one round-trip each on `app/layout.tsx` and `app/find/[id]/page.tsx` before diagnosing). **Future Dev agents: before your first file write in any session, verify you're using `filesystem:write_file` or `filesystem:edit_file` exclusively for Mac filesystem operations.**

Secondary gotcha refresher: `filesystem:edit_file` `oldText` must match exact bytes including box-drawing comment rule lengths and rare Unicode characters. Prefer unique surrounding content (function signatures, variable names) over comment-header rules as anchors. When a long block edit fails, decompose into smaller targeted edits rather than re-transcribing.

### Design-system doc evolution

`docs/design-system.md` is now at **v1.1d**. Net additions across the session:
- Accessibility commitments section: font-size floor table, WCAG contrast ratios for every ink on new paper, tap-target reaffirmation, Dynamic Type flagged for Sprint 5
- Paper color + ink palette recalibrated with new hex values and contrast math
- Push-pin spec + pin-restraint rule ("single pin only, matte ink, no shine — second pin or drawing pin head tips into costume")
- "Explore" label pattern documented
- BottomNav minimal-patch subsection added
- Pill primitive collapsed from 2 roles (status + shelf-link) to 1 role (shelf-link only) after status retirement
- Multiple retirements logged: bottom-left post-it, standalone "Visit the shelf →" link, status pill, top-left post-it

### Session 16 candidates were

17A (nav-shelf) **held** into session 17 and beyond. 17B (Booth page) **held** — still the next recommended design sprint (now called 18A). 17C (Sprint 4 tail) **held** — still queued (now 18D).

### Files touched in session 16
- `app/layout.tsx` — IM Fell + Caveat font loading
- `app/find/[id]/page.tsx` — full rewrite + 4 iteration passes (superseded by session 17 v1.1e/v1.1f polish)
- `components/BottomNav.tsx` — minimal chrome patch (bg + border)
- `docs/design-system.md` — v1.0 → v1.1d (many targeted edits; further evolved in session 17 to v1.1g)
- `docs/mockups/nav-shelf-exploration.html` — NEW, 4 approaches (still held for future review)

---

## ARCHIVE — What was done earlier (2026-04-17, session 15)
> Design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed

**Status:** 🪴 **Session 15 was a design-direction session, not a feature session.** No production code changed. Two docs updated: `docs/design-system.md` rewritten v0.2 → v1.0 with full journal vocabulary committed; `docs/DECISION_GATE.md` updated with tagline anchor, refreshed Brand Rules, refreshed Design agent prompt, and updated Risk Register. Find Detail mockup landed after an extended iteration pass that redirected the entire design language.

### What shipped (2 doc updates, 0 code changes)

**`docs/design-system.md` — v0.2 → v1.0 full rewrite:**
- **Tagline anchor committed:** *Embrace the Search. Treasure the Find. Share the Story.* Operating voice: presence over pressure, story over speed, rooted in reality yet elevated for perspective. Threshold to the physical world, not a replacement for it.
- **Cartographic vocabulary committed:** the mall is a pin on the map, the booth is an X on the spot, connected by a thin vertical tick. Single reusable grammar for location across Find Detail, Booth page, Feed, Find Map.
- **Material vocabulary committed:** booth post-it as the one skeuomorphic signature per find (cream paper, slight rotation, soft shadow, placed top-left on photograph). Status pill as straight clarity marker (pill outline, near-primary ink, no rotation). Max two material objects per photograph.
- **Typography system rewritten:** IM Fell English is now the editorial voice (titles, captions, labels, booth numbers, mall names, status). Georgia retired from the ecosystem layer. Caveat reserved for rare handwritten beats — one per screen maximum. system-ui reserved for precise data (addresses, timestamps). Mono retired entirely.
- **Paper as surface:** no card chrome, no border halos around content. Section divisions via whitespace, hairline rules, and the diamond (`◆`) ornament. The cross (`✚`) divider was retired for religious connotations.
- **Find Detail spec locked:** masthead wordmark ("Treehouse *Finds*" centered), photograph with post-it top-left + status pill bottom-right, title + price (em-dash, softer ink on price), centered quoted caption, diamond divider, cartographic pin+X block with connecting tick, IM Fell English italic "Visit the shelf →" link with dotted underline, "more from this shelf…" thumbnails (no leading dash, trailing ellipsis).
- **v0.2 pattern retirement log:** `<LocationStatement>` deprecated. `<BoothLocationCTA>` deprecated. Four-button system retired. Georgia retired from ecosystem. Mono retired. Pulsing green status dot retired. Card pattern system retired. The word "Directions" as explicit link copy retired.
- **Copy commitments:** captions always in typographic quotation marks (“ ”), centered, italic — about *how it feels*, never *what it's made of*. Price named honestly after title in softer ink. No "might pair with" / "related items" language. No narrating the metaphor ("Turn back to the booth" was rejected for this reason; "Visit the shelf →" is the right voice).

**`docs/DECISION_GATE.md` — targeted updates:**
- Tagline inserted at the top of "The Vision" section as a committed brand anchor with operating voice
- Brand Rules table updated: Georgia rule replaced with IM Fell English / Caveat / system-ui commitments, paper-as-surface rule added, cartographic language rule added, material restraint rule added, captions-always-quoted rule added, no-narrating-the-metaphor rule added
- New STOP gate added: "UI change not scoped against `docs/design-system.md` v1.0" — mirrors the onboarding-journey drift-prevention rule
- Risk Register: added "Design direction drifted toward generic across sessions 12–14" as a resolved risk with session-15 context; added Booth page component deprecation as a tracked low-severity item; added `lib/tokens.ts` token additions as a tracked low-severity item pending Booth v1.0 sprint
- Design agent prompt rewritten to reflect v1.0 language — names the "canonical primitive trap" explicitly so the next Design agent doesn't fall back into v0.2 vocabulary
- Sprint Context: Design sprints now tracked as a parallel track to Sprint 4 tail
- Related Documents: updated to reflect design-system.md v1.0 status
- Tech Rules: "session close build check" rule (added session 14) is now documented here

### The design-direction redirection — narrative summary

Session 15 opened as a Find Detail polish sprint against v0.2 but evolved into a fundamental redirection of the entire design language. The trigger was David's pushback on the first mockup: the cards, buttons, and canonical primitives committed in v0.2 were producing "generic app" aesthetics regardless of small corrections. The session worked through extended iteration (6+ mockup passes on Find Detail alone) to find the real direction — a restrained field-journal voice rooted in:

1. **Material gestures, not UI components** — post-it note replacing a card-wrapped booth badge
2. **Cartographic language, not data display** — pin + X glyphs binding mall and booth as a zoom relationship, replacing the v0.2 `<LocationStatement>` icon+mono+separator grammar
3. **Editorial typography, not UI typography** — IM Fell English doing the work that v0.2 assigned 90% to system-ui
4. **Paper as surface, not cards on surface** — section dividers become typographic ornaments, not border halos
5. **Quoted captions as reflections** — captions are about *how it feels*, never specs
6. **One handwritten beat per screen** — Caveat reserved for margin notes that represent genuine human presence, not decoration
7. **Restraint is the discipline** — the journal metaphor fails when it becomes costume (paperclips, tape, brass fittings on every surface). It succeeds when a few load-bearing gestures carry the weight and everything else steps back.

The tagline **Embrace the Search. Treasure the Find. Share the Story.** emerged mid-session as the tiebreaker for every decision going forward.

### Implications for prior work

**Booth page (shipped session 14) needs a v1.0 second pass.** The components built and shipped in session 14 (`components/LocationStatement.tsx`, `components/BoothLocationCTA.tsx`, the updated `ShelfGrid.tsx` terminology pass, the `TabSwitcher` relabeling) remain functional in production but do not align with v1.0 language. The cartographic pin+X block replaces `<LocationStatement>`. The post-it + paper-as-surface treatment replaces `<BoothLocationCTA>`. Georgia → IM Fell English throughout. Tracked as a dedicated Design sprint after Find Detail code ships.

**No production breakage.** The deprecated components still render on `/my-shelf` and `/shelf/[slug]` exactly as they did at session-14 close. Users see no change. The deprecation is internal to the design system doc; code replacement is a separate sprint.

### Context for the next session

Two session-16 candidates, both independent of Sprint 4 tail:

**Session 16 candidate A — Find Detail code build against v1.0 spec.** The mockup is locked. `docs/design-system.md` v1.0 has the full spec. This session writes the `/find/[id]/page.tsx` rewrite: masthead wordmark, post-it, status pill, centered quoted caption, diamond divider, cartographic pin+X block, "Visit the shelf →" link, "more from this shelf…" thumbnails. Requires loading IM Fell English + Caveat fonts (Google Fonts), possibly inlining new token values that formalize later in the Booth sprint. Estimated ~3 hours including QA.

**Session 16 candidate B — Sprint 4 tail batch (T4c + T4b + T4d).** Copy polish, admin surface consolidation, pre-beta QA pass. ~5.5 hours of focused work. Boring-but-important; clears the pre-beta runway.

**Recommended:** 16A first. Momentum is on design after session 15's redirection, and Find Detail is the surface that proves the v1.0 language in production. Sprint 4 tail can batch afterward.

### Sprint 4 tail still queued

- 🟡 T4c remainder (copy polish): `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b admin surface consolidation: Add Booth tab in `/admin`, Add Vendor in-person flow, remove Admin PIN from `/login`, remove Booths from BottomNav, retire `AddBoothSheet` from `/shelves`. ~4 hours.
- 🟡 T4d pre-beta QA pass walking all three onboarding flows. ~1 hour.
- 🟢 Session 13 test data cleanup (5+ "David Butler" variants in DB). ~5 min SQL via `docs/admin-runbook.md` Recipe 4.

### Files touched this session
- `docs/design-system.md` — full rewrite v0.2 → v1.0
- `docs/DECISION_GATE.md` — tagline anchor added, Brand Rules updated, Design agent prompt refreshed, Risk Register updated, Tech Rule for session-close build check documented, STOP gate added for design-system drift
- `CLAUDE.md` (this file) — session 15 close

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 14)
> Booth page v0.2 redesign shipped; `lib/imageUpload.ts` reconstructed

**Status:** 🌿 **Session 14 executed the Design agent's first Dev pass against `docs/design-system.md` v0.2.** Booth page redesign landed on both `/my-shelf` and `/shelf/[slug]`. Pre-existing build break on `@/lib/imageUpload` imports (orphaned from session 13's uncommitted image-upload migration) was diagnosed and fixed mid-session so everything ships together. Curator's Statement block was explicitly deferred pending vendor feedback — David's call, not a miss.

**Session-15 note on session 14 work:** The components shipped this session (`LocationStatement`, `BoothLocationCTA`, `ShelfGrid` rewrite, `TabSwitcher` relabeling) are still live in production and functional. As of session 15 they are *deprecated per `docs/design-system.md` v1.0* but remain in the repo. The Booth v1.0 second pass will replace them. Users see no change in the meantime.

### What shipped (one commit, multiple files)

**Session 14 design work:**
1. **`components/LocationStatement.tsx`** (NEW) — canonical location-pattern primitive per v0.2 spec. Deprecated in v1.0. 
2. **`components/BoothLocationCTA.tsx`** (NEW) — canonical CTA card variant. Deprecated in v1.0.
3. **`components/ShelfGrid.tsx`** (REWRITE) — three batched changes per v0.2: (a) grid gap 6 → `spacing.tileGap` (10), (b) `AvailableTile`: pure image, no title overlay, (c) `FoundTile`: 0.5 opacity + full grayscale + italic Georgia "Found a home" caption bottom-left on subtle gradient. Grid structure survives v1.0; Georgia caption will be swapped to IM Fell English in the Booth v1.0 pass.
4. **`components/TabSwitcher.tsx`** (EDIT) — inactive label "Found a home" → "Found homes" (plural) per v0.2 terminology table. Survives v1.0.
5. **`app/my-shelf/page.tsx`** (EDIT) — `BoothFinderCard` → `BoothLocationCTA`, address prop threaded from `mall?.address`, Found-homes empty-state copy removed.
6. **`app/shelf/[slug]/page.tsx`** (EDIT) — same treatment as `/my-shelf` for the public state.
7. **`components/BoothFinderCard.tsx`** (DELETED) — orphan after Task 6.

**Session 13 carry-ins (discovered mid-session, shipped together):**
8. **`lib/imageUpload.ts`** (NEW — reconstruction) — Session 13's CLAUDE.md documented this file as "single source of truth" but it was never actually committed. Reconstructed from the documented contract.
9. **`app/post/page.tsx`, `app/post/edit/[id]/page.tsx`, `app/post/preview/page.tsx`, `lib/posts.ts`** (pre-session mods) — session-13 image-upload migration work that was on disk but not committed.

### Task-4 ("titles on tiles") mockup-first protocol (session 14)
Before removing titles from `AvailableTile`, Claude generated a disposable side-by-side mockup showing current vs. v0.2. David approved the no-titles direction with eyes on the comparison. Worth keeping as a pattern: when a design-system change has a visible perceptual cost, mockup the change before code. This protocol continued in session 15 where the mockup-first approach caught the fundamental direction drift before any Find Detail code was written.

### `lib/imageUpload.ts` reconstruction — root cause + new tech rule
Session 13 closed without running `npm run build` before `thc`. CLAUDE.md was updated to describe the image-upload pattern as shipped, but the module itself was never created. New session-close tech rule (added to DECISION_GATE session 14, formalized session 15): *A session is not closed until `npm run build` has run green against the committed state of the repo.*

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped, toast visual polish

**Status:** ✅✅✅ **Session 13 resolved a pre-beta blocker surfaced during live test.** KI-004 closed. In-mall diagnostic UI shipped. Admin runbook created. All 5 QA tests passed on device.

Key shipped: `app/api/admin/diagnose-request/route.ts` (NEW diagnostic endpoint), `app/api/admin/vendor-requests/route.ts` (REWRITE — constraint-aware approval), `app/admin/page.tsx` (REWRITE — Diagnose links, inline DiagnosisPanel, toast polish), `docs/admin-runbook.md` (NEW — 9 SQL recipes).

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim (reuse existing row)
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject with named details
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- All error responses include `diagnosis` code + `conflict` object for admin UI rendering

**Toast visual polish — final state:** outer non-animated `<div>` does centering, inner `<motion.div>` animates opacity+y only with `pointer-events:auto`. zIndex 9999, solid opaque backgrounds, `boxShadow` opacity 0.18.

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is orphaned. Safe to delete next sprint.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 12)
> Design agent's first full direction pass shipped; docs/design-system.md v0.2 committed

**Status:** 🪴 **Session 12 was the Design agent's first real pass.** No production code changed. One doc updated: `docs/design-system.md` moved from v0.1 scaffold to v0.2 with committed direction for cross-cutting primitives (typography, headers, buttons, cards, Location Statement) and four priority screens.

**Session-15 note on session 12 work:** v0.2 was rewritten in session 15 to v1.0. The v0.2 vocabulary (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system, Georgia-as-primary-serif, mono for booth numbers) is retired per v1.0. The "Cards, Buttons, LocationStatement" framing of v0.2 produced generic marketplace aesthetics when actually composed — this was the core finding of session 15. v1.0 replaces the component-first framing with a language-first framing (cartographic pin+X, post-it material gesture, paper-as-surface, IM Fell English editorial voice).

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 11)
> Design agent activated, design system scaffolded, agent orchestration tightened

**Status:** 🪴 **Session 11 was a system-infrastructure session, not a feature session.** Four docs updated to activate the Design agent and establish `docs/design-system.md` as canonical source of truth for all multi-screen UI work.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 10)
> /setup 401 race polish shipped; T4c orphan cleanup A/B/E shipped

**Status:** ✅✅ **Session 10 polished the onboarding journey that Session 9 unblocked.** Two commits shipped.

1. Orphan cleanup (T4c partial — A + B + E) — `app/page.tsx` EmptyFeed "Add a Booth" button removed; `app/my-shelf/page.tsx` NoBooth "Post a find" button removed; `app/api/debug-vendor-requests/route.ts` deleted.
2. `/setup` 401 race polish — `setupVendorAccount()` in `app/setup/page.tsx` now retries once with 800ms backoff on 401 response.

Verified `public/manifest.json` already has `"orientation": "portrait"`. Supabase cleanup pre-session: three-orphan cleanup SQL ran.

---

## ARCHIVE — What was done earlier (2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002
**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`.
**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern.

### Phase 2 — KI-003 diagnosis
Clean-slate Flow 2 repro revealed two cascading bugs: `/login` mount useEffect read `searchParams.get("next")` but approval email uses `?redirect=/setup`; approve endpoint's 23505 duplicate-key handler silently reuses existing vendors row on booth collision (deferred as KI-004, now RESOLVED session 13).

### Phase 3 — KI-003 three-part fix
Fix 1: `app/login/page.tsx` — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`.
Fix 2: `app/post/page.tsx` — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy.
Fix 3: `app/my-shelf/page.tsx` — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as self-heal before falling through to NoBooth.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging
Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` for 401 branch observability.

### Phase 5 — End-to-end verification
Flow 2 onboarding end-to-end verified working on iPhone.

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)
`docs/onboarding-journey.md` created as canonical spec. Three flows committed: Pre-Seeded, Demo, Vendor-Initiated.

### Phase 2 — T4a email infrastructure
New file `lib/email.ts` (~260 lines) — Resend REST API wrapper. Wired into `app/api/vendor-request/route.ts` + `app/api/admin/vendor-requests/route.ts`. End-to-end QA verified in production.

### Phase 3 — QA issues logged
KI-001, KI-002, KI-003 logged to `docs/known-issues.md`.

---

## ARCHIVE — Earlier sessions (1–7)
> Condensed — full history available in git log

- **Session 7** — `/admin` mobile-first approval polish (T3); full database reset; QA pass exposed onboarding fragility
- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit code entry primary auth path; meta-agent work (Dev · Product · Docs active)
- **Session 5** — `emailRedirectTo` fix + strategic Sprint 4+ scoping; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot Path B → Path A (Shopify authoritative); Resend → Supabase SMTP; Yahoo magic link verified
- **Session 3** — Resend account setup; DNS migration decision (later reversed in session 4)
- **Session 2** — Setup flow status-filter bug fix
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

**Tagline (committed session 15):** *Embrace the Search. Treasure the Find. Share the Story.* Anchored in `docs/DECISION_GATE.md`.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v1.1i for the visual + interaction system. All multi-screen UI work scopes against it before code. v1.1i (session 20) commits the Feed redesign (paper masonry + feed hero on paper), the `<MallSheet>` bottom-sheet primitive, and retires sold from shopper discovery surfaces (Find Detail 3B sold landing state replaces the normal layout when a shopper lands on a sold find; feed filters sold at data layer; Find Map keeps bookmark + tile + uses 3B as the reveal; public Booth pages keep sold posts for vendor story credibility).

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)

Design v1.0 fonts (session 16+ code build):
  IM Fell English (editorial voice) · Caveat (rare handwritten beats) · system-ui (precise data)
  Loaded via Google Fonts.
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

Key records (via Shopify DNS): A `@` → `23.227.38.65`, CNAME `app` → Vercel, Resend DKIM + SPF + MX on `send`/`resend._domainkey`. Full record list in session-14 archive.

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

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8):**
- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop
- All collision errors return `{error, diagnosis, conflict}` for UI rendering

---

## WORKING ✅
- Discovery feed, magic link auth, Admin PIN login, OTP delivery
- Magic link `?redirect=` param preserved across round trip
- My Booth, Post flow, Post preview, Find detail, Public shelf
- Vendor request flow, Vendor account setup, admin approval workflow
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates for Magic Link and Confirm Signup
- Agent roster: Dev · Product · Docs · Design active
- KI-001, KI-002, KI-003, KI-004 all resolved
- Flow 2 onboarding end-to-end verified working on iPhone
- `/setup` 401 race absorbed with retry+backoff
- Design agent activated, `docs/design-system.md` at **v1.1i** (sessions 15–20)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes
- **Design v1.1i shipped in code (session 21A)** — Feed paper masonry + `<MallSheet>` primitive + Find Detail 3B sold landing state + Find Map `isSold` retirement + MallHeroCard deletion, all landed on main. v1.1i-polish follow-up added sticky mastheads (Home, Find Map, Find Detail normal + 3B, My Shelf, Public Shelf), MallSheet centering fix (transform-free `left:0/right:0/margin:0 auto`), and subtle paper-tone drop-shadows on product photographs (Home tiles, Find Map FindTiles, Find Detail hero + shelf thumbnails, Booth Window/Shelf tiles — banner exempt).
- **Design v1.1h token consolidation (session 19A)** — `lib/tokens.ts` is now the canonical source of truth for the v1.1h `v1` palette + fonts (`FONT_IM_FELL`, `FONT_SYS`). Find Detail, Find Map, and BoothPage all import from it. Inline duplicates retired. `BoothPage.tsx` re-exports `v1`/`FONT_IM_FELL`/`FONT_SYS` so `/my-shelf` and `/shelf/[slug]` imports resolve unchanged. v0.2 `colors`/`radius`/`spacing` exports coexist in the same file for unmigrated surfaces (feed + vendor profile + mall page + post flow + admin + BottomNav local `C`).
- Booth page redesign shipped against **v1.1h** spec (session 18) — both `/my-shelf` and `/shelf/[slug]`: banner as pure photograph with booth post-it pinned to it (cross-page primitive shared with Find Detail), vendor display name as IM Fell 32px page title, small pin-prefixed mall+address block as secondary location statement, Window View (3-col 4:5 portrait grid) + Shelf View (horizontal scroll with 52vw/210px tiles, 22px left padding on first tile) replacing availability tabs, AddFindTile in top-left cell of Window View (owner only), banner edit button top-left + frosted share bubble top-right, diamond-divider quiet closer. Sold items retired from the page entirely. Four v0.2 components deleted: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`. Georgia cleared from the last major surface.
- **Find Detail shipped against v1.1f spec (sessions 16–17)** — masthead Title Case single style 18px, photograph with 1px hairline border, post-it bottom-right with push pin + stacked "Booth Location" eyebrow + `+6deg` rotation + 4px inset, title + price em-dash, quoted caption, diamond divider, cartographic pin+X block, X-aligned vendor row with "Explore booth →" label + numeric-only shelf-link pill, frosted on-image save+share top-right (state-independent bg), shelf strip with defensive alignment, owner manage block. IM Fell English + Caveat loaded via Google Fonts in root layout.
- **Find Map shipped against v1.1g spec (session 17)** — `/flagged` full redesign: Mode A masthead, "Find Map" subheader, intro voice, pin+mall anchor, diamond divider, X-glyph itinerary spine with hairline ticks, `Booth [NNN pill]` row wrapping Link to `/shelf/[slug]`, vendor italic, saved-count, 2-up grid (≤2 finds) or horizontal scroll (≥3 finds), find tiles with frosted heart unsave + prices + sold-state treatment, empty state, chapter-break closer. All v0.2 localStorage / pruning / grouping / focus-rehydration / unsave wiring preserved intact.
- **App-wide background paperCream `#e8ddc7` globally committed** (session 17) — `app/layout.tsx` body inline + `app/globals.css` `@layer base body`. Legacy `#f0ede6` retired.
- **BottomNav minimal chrome patch (session 16)** — background paperCream translucent, top border inkHairline. Full rework still deferred to Booth v1.1g sprint.
- **Glyph hierarchy locked (session 17)** — pin = mall, X = booth, cross-cutting rule documented in `docs/design-system.md` Cartographic Vocabulary.

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 15 close._

### 🟡 Sprint 4 remainder
- 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
- 🟡 T4b — admin surface consolidation. ~4 hours.
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end.
- 🟢 Session 13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.

### 🟡 Design v1.1i follow-on work (sessions 22+)
- **Session 22A — QA walk of v1.1i + v1.1i-polish** (David's stated next-session opener). Iteration on anything surfaced on-device: sticky masthead chrome strength, shadow tone/throw, MallSheet centering verification, 3B composition legibility, etc.
- **Session 22B — KI-003 diagnosis** (vendors posting under stale identity after approval; pre-beta blocker; still parked).
- **Session 22C (or later) — Sprint 5: onboarding v1.0 pass + `<MallSheet>` migration** to `/post` and `/vendor-request` (second + third consumers of the primitive built in 21A).
- **Session 22D (or later) — 21B Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **Post-MVP candidates** — 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal, `docs/design-system.md` PENDING table entries.

### 🟡 Sprint 3 leftovers still pending beta invites
- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" + `/welcome` guest-friendly landing
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design v0.2 components retired and deleted across sessions: `components/LocationStatement.tsx`, `components/BoothLocationCTA.tsx`, `components/ExploreBanner.tsx`, `components/TabSwitcher.tsx` (session 18), `components/MallHeroCard.tsx` (session 21A)
- `components/ShelfGrid.tsx` — parked with retention comments (session 18); zero current callers but retention rationale documented in-file. Can delete in a future cleanup if grep across full codebase confirms no legacy consumers
- **`CONTEXT.md` is stale** — last updated 2026-04-07 (pre-v1.1i). Sections 8–10 still describe v0.2 feed/detail/palette. Non-urgent; CLAUDE.md is the authoritative session-state doc. Recommend refreshing after beta launch when the v1.1i surface area stabilizes.
- `docs/mockups/feed-v1-1h.html` + `docs/mockups/feed-v1-1h-v2.html` — historical record; can delete after on-device QA confirms v1.1i-polish holds
- `docs/mockups/find-map-exploration.html`, `docs/mockups/find-map-v2.html`, `docs/mockups/booth-v1-1g.html`, `docs/mockups/booth-v1-1g-v2.html` — historical record; can delete once on-device QA confirms v1.1g + v1.1h hold

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

---
