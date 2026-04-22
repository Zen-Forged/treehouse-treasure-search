# Treehouse — Decision Gate
> Version: 1.0 | Created: 2026-04-15 | Repo: Zen-Forged/treehouse-treasure-search
> This document is the operating constitution for every agent and every session. Read it first. Every decision flows through it.

---

## Purpose

This document exists to surface the right information at the right time. Before any work begins — feature, fix, or architectural change — the relevant gate checks below are applied. No agent proceeds without passing through this filter.

The goal is to protect three things simultaneously:
1. **The product** — Treehouse stays coherent, calm, and on-brand
2. **The business** — Zen Forged LLC stays financially healthy and legally protected
3. **The users** — vendors and shoppers are safe, their data is protected

---

## The Vision (anchor for all decisions)

### The tagline (committed session 15)

**Embrace the Search. Treasure the Find. Share the Story.**

This is the backbone of Kentucky Treehouse. When a proposed feature, copy change, or design decision is questioned, the tiebreaker is *which of these three does it serve, and does it serve it honestly?* If it serves none of them — or if it works against any one of them — it does not belong in the product.

- **Embrace the Search** — discovery is part of the value, not friction to be removed. No filters pretending to save time. No algorithm picking for you. The app respects the hunt.
- **Treasure the Find** — the object matters. Photograph it with weight, describe it with care, name the price honestly.
- **Share the Story** — finds accumulate. They become a personal path, a journey, a treasure hunt. The system supports this by design, not by feature.

**The operating voice:** Presence over pressure. Story over speed. Rooted in reality yet elevated for perspective. The app is a **threshold** to the physical world, not a replacement for it — every digital gesture points back at a real booth, a real mall, a real object.

### The product

Treehouse is a **calm, story-driven local discovery experience** for vintage, antique, and thrift finds in Kentucky and Southern Indiana.

- Buyers browse before making the trip
- Vendors post finds for visibility without needing a full e-commerce stack
- Mall operators get organic foot traffic through vendor content
- Resellers (future premium) get comp and profit analysis

**What Treehouse is NOT:**
- Not a marketplace (no buying/selling on-platform)
- Not a filter-heavy listings site
- Not a social network
- Not a fast-fashion or urgency-driven shopping experience

**The feeling:** Calm. Intentional. Story-first. Like a thoughtful friend who noticed something worth sharing — not a storefront, not an algorithm.

**Operator note:** David Butler (Zen Forged LLC) is an **online reseller**, not a physical mall booth operator. In-person vendor onboarding is a deliberate scheduled activity, not incidental foot traffic. The ZenForged Finds booth (#369 at America's Antique Mall) exists in the data model and serves as a test vendor / operator persona, but David's primary sales channel is online.

---

## The Brand Rules

Any feature, copy, or UI change is evaluated against these:

| Rule | What it means in practice |
|---|---|
| No prices in the feed | Items feel like discoveries, not listings |
| No urgency cues | No "only 1 left", no countdowns, no "SALE" badges |
| Sold items stay visible | "Found a home" — they tell a story |
| Copy is warm and observational | Never salesy, never hype, never transactional |
| Layout breathes | Density is the enemy. Whitespace is intentional. |
| **IM Fell English** for the editorial voice | Titles, captions, labels, status, eyebrows, booth numbers, mall names — all set in IM Fell English. Georgia is retired from the ecosystem layer (session 15). See `docs/design-system.md` v1.1g. |
| **Caveat** for rare handwritten moments only | One per screen maximum. Margin notes — never decorative. Find Map tried a Caveat opener and retired it in v1.1g; prose voice did the same job more honestly. |
| **system-ui** for precise data | Addresses, timestamps, technical labels. The precision voice. Mono is retired. |
| Warm parchment palette | `#e8ddc7` paper bg (paperCream, committed globally session 17), `#1e4d2b` green — earthy, not digital |
| Paper as surface | No card chrome around content. No border halos. Paper *is* the container. Section divisions use whitespace, hairline rules, and the diamond (`◆`) ornament. |
| Cartographic language | The mall is a pin on the map. The booth is an X on the spot. Connected by a thin vertical tick. This is the location grammar everywhere in the product. |
| **Glyph hierarchy locked (session 17)** | **pin = mall. X = booth.** These two glyphs never swap, substitute, or appear interchangeably. On any page that names both, the pin appears once (mall anchor, page-level) and the X appears once per booth stop (inline, content-level). Locked in `docs/design-system.md` v1.1g. |
| Material restraint | One skeuomorphic gesture per find (the booth post-it). Two material objects on a single photograph is the maximum. A third (paperclip, stamp, tape) is decoration. |
| Captions always quoted | They're reflections, not specs. Always in typographic quotation marks (“ ”), centered, italic. About *how it feels*, never *what it's made of*. |
| "Found a home" not "Sold" | Terminology is committed. See CLAUDE.md. |
| No narrating the metaphor | The design does the work, the language stays out of its way. "Turn back to the booth" was rejected for this reason; "Visit the shelf →" is the right voice. |
| Auth is for curators, not shoppers | Shoppers browse without an account. Sign-in is a curator action. Guest-user accounts contradict the vision. |

**When to flag:** If a requested feature or copy change would make Treehouse feel more like eBay, Etsy, or Facebook Marketplace — stop and discuss before building. The tagline is the tiebreaker.

---

## The Business Rules

| Rule | Detail |
|---|---|
| API costs are real | Anthropic + SerpAPI are pay-per-use. Rate limiting on `/api/post-caption` is required before beta. |
| Vendor data is sacred | Vendors trust us with their booth identity. Never expose, delete, or corrupt vendor records. |
| One mall in production | America's Antique Mall (`19a8ff7e-...`) is the only live mall. Changes affecting all malls affect this one. |
| Vercel is the deployment | No other deployment targets. Never bypass Vercel CI/CD without explicit reason. |
| Zen Forged LLC is the operator | David Butler is an online reseller; ZenForged Finds (Booth 369) is the test vendor / operator persona. Conflicts of interest between "owner" and "vendor" views should be flagged. Admin role and vendor role live in the same account — keep admin UI on `/admin` and vendor UI on `/my-shelf` cleanly separated. |
| No PII beyond what's necessary | Vendor email (for magic link auth) is the only PII collected. Do not add fields that collect personal data without deliberate review. |

---

## The Tech Rules

These are non-negotiable. Violating them has broken production before.

```
git add -A                         Always — never individual paths (zsh glob-expands [slug])
filesystem:write_file              ONLY reliable way to write files to disk from MCP
str_replace                        Fails on bracket-path files — use write_file for those
Read before rewriting              Always read current file contents before a full rewrite
safeStorage                        Use instead of raw localStorage in all ecosystem client components
export const dynamic               Required on all ecosystem pages importing supabase at module scope
Framer Motion transforms           motion.div cannot have centering transform — use wrapper div.
                                   Recurring bug: session 7 /admin toast re-introduced this when
                                   applying left:50% + translateX(-50%) inline on a motion.div
                                   that animates y. Framer replaces the transform entirely.
                                   (See docs/known-issues.md KI-002.)
Framer Motion transitions          Never two transition props on same motion.div — merge them
Framer ease arrays                 Must use `as const` — e.g. [0.25,0.46,0.45,0.94] as const
createVendor                       Handles 23505 duplicate key — do not revert this upsert logic
env vars in Vercel functions       Must be read inside function bodies, not at module scope
useSearchParams()                  Requires Suspense boundary
New API route dirs                 Must be created in Terminal with mkdir -p before MCP can write
Service-role-only tables           `vendor_requests` and any future service-role-only table MUST be
                                   accessed via /api/* routes using requireAdmin or requireAuth from
                                   lib/adminAuth.ts. NEVER via browser anon client — RLS silently
                                   returns empty results with no error (broke vendor-request flow on
                                   2026-04-16). Use authFetch() from lib/authFetch.ts on the client
                                   to attach the bearer token.
Admin API routes                   All /api/admin/* routes MUST call requireAdmin(req) server-side
                                   as the first line of the handler. UI gating alone is not enough —
                                   routes are directly reachable. No exceptions.
DNS / email sending                Transactional email sends from `kentuckytreehouse.com` via TWO
                                   channels: (1) Supabase Auth OTP emails via Resend SMTP integration,
                                   (2) our own transactional emails (receipt, approval) via Resend
                                   REST API in lib/email.ts using RESEND_API_KEY env var. Shopify
                                   remains authoritative for the zone; Resend records (`resend.
                                   _domainkey`, `send` TXT/MX) live in Shopify DNS. See CLAUDE.md
                                   DNS STATE section.
Post-auth redirects                Use safeRedirect(next, fallback) helper in app/login/page.tsx.
                                   Only same-origin relative paths are honored; rejects absolute
                                   and protocol-relative URLs. Added session 5 (2026-04-17).
OTP email templates                Supabase `signInWithOtp` sends BOTH magic link AND 6-digit code,
                                   but the default email templates for Magic Link and Confirm
                                   Signup only render the link. The code must be explicitly added
                                   via `{{ .Token }}` in a selectable element (`<code>` with
                                   `user-select: all; -webkit-user-select: all`). Confirm Signup
                                   template is a separate save from Magic Link — update both.
                                   Supabase OTP Length setting (Auth → Providers → Email) must
                                   match the app's input length (default is 8; we use 6).
                                   Added session 6 (2026-04-17).
Transactional email best-effort    `lib/email.ts` functions return `{ ok, error? }` and never throw.
                                   Callers MUST log the error but return HTTP success if the
                                   underlying transaction (DB insert, status update) succeeded —
                                   email is a notification, not part of the transaction. Added
                                   session 8 (2026-04-17).
Onboarding flow work               All vendor onboarding-adjacent work (sign-in, approval,
                                   `/setup`, `/post` identity resolution) must scope against
                                   `docs/onboarding-journey.md` before code. Three committed
                                   flows: Pre-Seeded, Demo, Vendor-Initiated. If a proposed
                                   change doesn't fit one of these three, pause and re-scope
                                   the journey doc first. Added session 8 (2026-04-17).
Multi-screen UI work               Any UI change touching more than one screen, or introducing
                                   a new visual/interaction pattern, must scope against
                                   `docs/design-system.md` before code. The design system is
                                   the single source of truth for typography, spacing, color,
                                   components, motion, and copy voice. If a proposed change
                                   doesn't align with the system, pause and update the system
                                   doc first — or explicitly decide to diverge and document why.
                                   Mirrors the onboarding-journey rule pattern. Added session 11
                                   (2026-04-17) when Design agent was activated.
Session close build check          A session is not closed until `npm run build` has run green
                                   against the committed state of the repo. Docs cannot claim
                                   files exist on disk that don't. Added session 14 after
                                   `lib/imageUpload.ts` orphan was discovered — CLAUDE.md had
                                   documented a file as shipped that was never committed.
                                   Docs agent responsibility at `thc`.
str_replace vs filesystem:edit_file Two separate `str_replace`-shaped tools exist in this
                                   environment: (1) the container shell `str_replace` which
                                   cannot see the Mac filesystem, (2) the filesystem MCP's
                                   `edit_file` which is the ONLY way to modify files at
                                   /Users/davidbutler/Projects/... from inside a Claude session.
                                   Parameter shape differs: `edit_file` takes an `edits` array
                                   of `{oldText, newText}` objects, not the shell's two-arg
                                   form. If `str_replace` returns "File not found" on a path
                                   you know exists and can read via `filesystem:read_text_file`,
                                   switch to `filesystem:edit_file`. Added session 23.
Box-drawing anchor bug             `filesystem:edit_file` fails intermittently on `oldText`
                                   anchors containing box-drawing characters (───, ═══, etc.)
                                   inside comment rules like `// ─── Section title ───`.
                                   Symptom: "Could not find exact match" despite the string
                                   visibly matching in the file. Workaround: drop the rule
                                   line from the anchor entirely. Anchor instead on unique
                                   code content (function signatures, unique inline-style
                                   prop combos, `}\n\nexport default`). Also: `edit_file`
                                   batches are atomic — if one `oldText` in a multi-edit
                                   batch doesn't match, EVERY edit rolls back, even the ones
                                   whose anchors did match. Good discipline: split risky
                                   anchors into separate `edit_file` calls. Fired across
                                   sessions 16, 19A, 21A, 22A before promotion. Added
                                   session 23.
File-creation verify at close      When a session's CLAUDE.md close declares that a NEW file
                                   was created (not edited), the Docs agent MUST verify the
                                   file's presence on disk via `filesystem:list_directory` or
                                   `filesystem:read_text_file` before `thc`. The session-14
                                   build-check rule is necessary but not sufficient: it does
                                   not catch missing page routes, missing API routes whose
                                   callers reference them only via fetch strings, or any file
                                   referenced by runtime string rather than import. TypeScript
                                   and Next.js build steps cannot verify that a runtime string
                                   resolves to a page file. Verification is one tool call per
                                   new file — cheap insurance against the orphan pattern that
                                   bit sessions 13 (`lib/imageUpload.ts`) and 23
                                   (`app/admin/login/page.tsx`). Added session 25.
Required Supabase migrations       Any sprint that ships a new `supabase/migrations/*.sql`
                                   file that production code depends on MUST list the migration
                                   as an explicit 🖐️ HITL step in the CLAUDE.md session-close
                                   checklist — not just inside a comment header in the SQL file.
                                   Code that depends on a missing table should graceful-collapse
                                   (silent null return, not a thrown error) so the app does not
                                   break if the HITL is missed, but the HITL itself must be
                                   surfaced visibly enough that David runs it before on-device
                                   QA. Fired session 24 (v1.1l `004_site_settings.sql` shipped
                                   as code but the migration wasn't applied until session 25,
                                   so featured banners rendered invisibly via graceful-collapse
                                   for a full session). Added session 25.
Anthropic model audit              At sprint boundaries (or when Anthropic announces a new
                                   Opus/Sonnet), grep `model: "claude-*"` across the codebase
                                   and cross-reference against Anthropic's current model
                                   deprecation page (https://docs.claude.com/en/docs/about-claude
                                   /model-deprecations). Retired models silently fail the SDK
                                   call; if the route has any mock fallback path (which is
                                   common for AI-dependent features by design), the failure
                                   goes undetected by build checks AND by most forms of
                                   monitoring. Cheap: one `grep -r "claude-" app lib` every
                                   ~4–6 weeks or at Opus/Sonnet release. Fired session 27
                                   when vendor reported generic auto-captions on every post;
                                   3 routes (`/api/post-caption`, `/api/identify`, `/api/story`)
                                   had been running against retired `claude-opus-4-5` for
                                   ~1 month. Added session 27.
Graceful-collapse observability    Any route or feature that silently falls back to a mock,
                                   default, or cached response on failure MUST expose a
                                   distinguishable response shape (e.g. a `source: "real" |
                                   "mock"` field, or a distinct HTTP header) so the client
                                   can tell real responses from fallbacks. The graceful-collapse
                                   pattern is correct UX (keep the app working) but becomes
                                   a silent-failure-concealer without observability. The
                                   session-27 `/api/post-caption` fix is the canonical shape:
                                   `{title, caption, source: "claude" | "mock", reason?}`,
                                   where `source !== "claude"` triggers a visible "couldn't
                                   read this" amber notice on the client rather than silently
                                   populating the form. Pairs with the file-creation-verify
                                   rule (orphan pattern) and the proposed Known-Gaps
                                   reconciliation rule (phantom-blocker pattern) as a family
                                   of discipline moves that each catch a different flavor of
                                   "working-looking UI over a real failure." Added session 27.
Anthropic billing as silent         Anthropic API credit balance is a silent dependency of
dependency                          every AI-powered route. HTTP 400 `invalid_request_error`
                                   on low balance returns a generic error shape indistinguishable
                                   from model-not-found or malformed-request errors, and
                                   graceful-collapses to mock in the exact same way. Mitigations:
                                   (1) Enable auto-reload in the Anthropic console so balance
                                   never hits zero. (2) Before any vendor demo, beta QA pass,
                                   or session where AI features will be exercised, verify the
                                   balance at https://console.anthropic.com/settings/billing is
                                   above a comfortable floor (rule of thumb: $20+ covers many
                                   weeks at current call volume). (3) Treat "captions look
                                   wrong + logs show HTTP 400 credit error" as an ops issue,
                                   not a code bug. Fired session 27 (discovered during the
                                   on-device QA that followed the model-swap fix). Added
                                   session 27.
Known-Gaps reconciliation       When writing a session close, any item listed in CLAUDE.md's
at session close                    "Known Gaps → Pre-beta blockers" or "Remaining pre-beta tech
                                   work" sections MUST be cross-referenced against
                                   `docs/known-issues.md` Resolved section and
                                   `docs/DECISION_GATE.md` Risk Register before `thc`. If
                                   any of those canonical sources records the item as
                                   resolved, strike it from CLAUDE.md's Known Gaps in the
                                   same close. Cost per item: one read. Proposed session 26
                                   when the KI-003 phantom-blocker pattern was named (a fix
                                   resolved session 9 but restated as open across 17 close
                                   blocks). Not promoted session 26 or 27; finally promoted
                                   session 28 as part of the structural cleanup pass.
                                   Pairs with file-creation-verify (catches orphan pattern)
                                   and graceful-collapse observability (catches silent-
                                   mock-fallback pattern) as a family of close-ritual
                                   discipline moves that each catch a different flavor of
                                   "working-looking UI over a real failure." Added session
                                   28.
Design: mockup-first as         Design work for David is mockup-first, not spec-first. The
default, not exception          prior pattern — Design agent writes a 14-paragraph commitment
                                   block into `docs/design-system.md`, David reviews dense
                                   design-system prose, signs off — creates two costs David
                                   named explicitly session 28: (1) reviewing the commitment
                                   requires executive-level fluency in design-system vocabulary,
                                   and (2) changing direction after commit pulls the whole
                                   14-paragraph block back up for dissection. The v1.2 session
                                   reversed this: three approved mockups + structured plain-
                                   English decisions via ask_user_input_v0 → short build spec
                                   written AFTER approval as a dev-handoff doc. David does not
                                   read the build spec; future Claude sessions do. The mockups
                                   are the source of truth. Rules going forward: (a) any UI-
                                   touching work gets a mockup FIRST (phone-frame HTML, dark-
                                   background review doc, 2-3 variant frames, plain-English
                                   decisions pane at top, 2-3 multiple-choice questions at
                                   bottom via ask_user_input_v0); (b) David's mockup approval
                                   IS the commitment — the build spec is written after and is
                                   explicitly a dev-handoff doc, not a decision doc, and its
                                   front-matter must state so; (c) if the mockup and the build
                                   spec ever disagree, the mockup wins; (d) revisions are cheap
                                   — one mockup iteration per direction change, NOT a design-
                                   system-doc reopen; (e) the build spec can still fold into
                                   `docs/design-system.md` as a condensed Status block during
                                   the code sprint, at Design agent's discretion, but never
                                   before David's mockup approval. Added session 28.
TS downlevelIteration            This project's tsconfig `target` is pre-ES2015 (or
                                   `downlevelIteration: false`). `for...of` over a `Map`,
                                   `Set`, or any non-array iterable does not compile —
                                   `error TS2569: can only be iterated through when using
                                   the '--downlevelIteration' flag or with a '--target' of
                                   'es2015' or higher`. When writing new server code that
                                   needs to iterate over a `Map` or `Set`, prefer the
                                   collection's built-in method (`Map.prototype.forEach`,
                                   `Set.prototype.forEach`), or materialize via `Array.from`
                                   first (`Array.from(map.entries()).forEach(...)`,
                                   `Array.from(set).forEach(...)`). Arrays are fine either
                                   way. `Map.forEach` callback signature is `(value, key,
                                   map)` — value first, key second (opposite of
                                   destructured `for...of`). Deletion during `forEach` is
                                   safe per ECMAScript spec (only affects entries not yet
                                   visited). Do NOT change the compiler target to ES2015+ or
                                   flip `downlevelIteration` just to make a `for...of` work
                                   — either change would ripple to every other file in the
                                   project and is a scope much larger than the code that
                                   surfaced the issue. Fired session 39 during Q-007 Window
                                   Sprint build verification (Map-based dedup cleanup loop
                                   in `/api/share-booth/route.ts`). One-line fix: replace
                                   `for (const [k, ts] of recentSends)` with
                                   `recentSends.forEach((ts, k) => ...)`. Added session 39.
```

### Tech Rule promotion queue (pending a dedicated Tech Rule batch session)

Three Tech Rules are queued for promotion from recent session observations. All three are cousins in the same family — variations of *dependency-surface audit when something about a shared contract changes* — and would land in the block above together. All three are waiting on a dedicated Tech Rule batch session so they get the same careful prose treatment as the rest.

1. **Dependent-surface audit when changing a field's semantic source** (named session 33 close). Session 32 changed how `display_name` was *derived* at write time (in `/api/admin/vendor-requests`: `booth_name → first+last → name`), but didn't audit the routes that *read* it. `/api/setup/lookup-vendor` kept the stale `display_name == name` equality assumption. Result: KI-006, a pre-beta blocker that stranded half of v1.2 onboarding for a full week. Rule: when a session changes how a canonical field is derived, grep for every read of the old source field AND every write that assumed the old equality, and add those audit hits to the session close HITL checklist.

2. **Half-migration audit when changing return-shape cardinality** (named session 35 close). Session 35 migrated `getVendorByUserId(userId): Vendor | null` → `getVendorsByUserId(userId): Vendor[]` and `/api/setup/lookup-vendor` from single-vendor return → array return. The return-shape change landed cleanly but two control-flow bugs remained hidden in the first pass, both the same class: early-return short-circuits that assumed "any result = fully resolved." Session 35's `/my-shelf` resolver short-circuited on `vendors.length > 0` and never triggered self-heal for newly-approved add-on booths; `/api/setup/lookup-vendor` short-circuited on "any already-linked vendor" and never processed new unlinked rows. Rule: when migrating from one-of-N to N-of-N return shapes, audit every early-return for the assumption `result != null` or `result.length > 0` equates to "done." Such short-circuits are correct under the old cardinality contract and become silent bugs under the new one. Two fix-commits were needed before session 35 closed cleanly; the rule would have caught both.

3. **New-consumer-on-old-select audit when a page starts calling a shared data-access function** (named session 36 close, driven by KI-007). Session 31E introduced `/find/[id]/edit` as a new consumer of `lib/posts.ts` `getPost()`. The new page's auth gate read `fetched.vendor?.user_id`, but `getPost()`'s vendor select had never included `user_id` because no prior consumer needed it. The field was silently undefined, the owner check always failed for non-admin users, and vendors got kicked in a redirect loop for every edit attempt. Admin path worked only because `isAdmin(user)` short-circuited the gate before the ownership check — so the bug stayed latent from session 31E through session 36 because admin is the primary testing account. Rule: when a new page, route, or hook starts consuming a shared data-access function (`lib/posts.ts` or any other `lib/*.ts` getter), grep the function's Supabase `.select(...)` against the new consumer's field reads on the returned object, and add the diff to the session close HITL. The most dangerous version of this bug class is when an auth gate silently passes for the testing account (admin) while failing for the production audience (vendors). A companion observability note: ownership-check failures on the testing account's asymmetric path should log distinctly enough that the asymmetry would surface in logs even when the happy path looks clean.

All three share a common shape and would benefit from being promoted together. Proposed promotion session name: "Dependency-surface audit Tech Rule batch (sessions 33 + 35 + 36)."

```

---

## The Decision Gate — Three Levels

Every significant request passes through this before work begins.

### 🔴 STOP — Flag immediately, do not proceed

These conditions require a conversation with David before any code is written or changed.

| Trigger | Why |
|---|---|
| Supabase RLS disabled on a new table | Any authenticated user can read/write/delete any row |
| API route with no auth or rate limiting | Direct cost and abuse exposure |
| Secrets or keys appearing in client-side code | Security breach — keys must stay server-only |
| Auth flow change | Magic link and admin PIN are the two auth paths — changes here break vendor access |
| Deleting or overwriting production data | Irreversible |
| Changing the publish flow (`/post`, `/api/post-image`, `createPost`) | Core vendor revenue path — highest blast radius |
| Feature that contradicts the product vision | e.g., adding a "Buy Now" button, price in feed grid, urgency badge, guest-user accounts for shoppers |
| Deployment config change (vercel.json, next.config.js) | Can break production silently |
| New external service integration | Cost, privacy, and dependency implications |
| DNS changes during nameserver migration window | Splitting DNS across two authoritative sources causes inconsistent resolution. Currently: Shopify is sole authority; Cloudflare is dormant. No migration in progress. |
| Onboarding change not scoped against `docs/onboarding-journey.md` | Three flows are committed. Drift-by-patch is what drove the session-7 scope crisis. Added session 8. |
| UI change not scoped against `docs/design-system.md` v1.1g | Journal vocabulary is committed. Drift-by-patch is what drove the session-14 → 15 redirection. Added session 15, version-bumped to v1.1g session 17. |

### 🟡 SURFACE — Flag before proceeding, then get approval

These don't stop work but must be called out explicitly before the session continues.

| Trigger | Why |
|---|---|
| Architecture pattern change | Naming, file structure, data flow — easier to align upfront |
| Token or API cost increase | Any change that significantly increases call volume to Anthropic or SerpAPI |
| Component restructuring or deletion | May have invisible dependents |
| Feature scope creep | Is this MVP or Sprint 4+? Does it belong in this sprint? |
| Personal preference vs. product vision conflict | David's taste is good but the vision is the tie-breaker |
| Tech debt accumulation | If a shortcut is taken, name it and log it in `docs/known-issues.md` |
| Brand tone mismatch in copy | Copy should feel like Treehouse, not like an e-commerce template |
| Performance implications | Unnecessary re-renders, unbounded fetches, large bundle additions |
| Mobile edge cases (iPhone Safari, Android Chrome) | safeStorage, safe-area insets, scroll restore — these have bitten before |
| Auth UX change | Magic link → OTP code, redirect preservation, post-auth landing — low-risk individually but compounds fast |

### 🟢 PROCEED — Standard work, no gate check needed

| Type | Examples |
|---|---|
| Bug fixes | Typos, broken styles, off-by-one logic |
| Styling consistency | Spacing, color, typography alignment with design system |
| TypeScript improvements | Type tightening, removing `any` |
| Documentation | CLAUDE.md, CONTEXT.md, this file, decision-log |
| Test additions | Non-destructive — always welcome |
| Input validation on existing patterns | Adding a size guard to an existing upload field |
| CLAUDE.md / CONTEXT.md updates | Session close maintenance |

---

## Current Risk Register

> Last updated: 2026-04-22 (session 44 — /shelves Add-a-Booth restored; partial T4b reversal. `<AddBoothInline>` lifted to `components/AddBoothInline.tsx` with optional hero-photo field; rendered on BOTH `/admin` Vendors tab AND `/shelves` (admin-gated via `<AdminOnly>`). Decision Gate fired at session open and caught the reversal as a 🔴 STOP trigger; David explicitly approved + explicitly waived the mockup-first step. Code on disk; build + commit + on-device walk pending HITL at session close. T4b Risk Register row flipped from Resolved → Partially reversed; chrome-mismatch row extended to cover `/shelves` alongside `/admin`.)

| Risk | Severity | Status | Owner |
|---|---|---|---|
| RLS disabled on `malls`, `vendors`, `posts` | 🔴 High | ✅ Resolved 2026-04-15 — 12 policies live, stale policies cleaned up (003_cleanup_old_rls_policies.sql) | Dev agent |
| No rate limiting on `/api/post-caption` | 🔴 High | ✅ Resolved 2026-04-15 — in-memory 10 req/60s per IP; upgrade to Upstash Redis at scale | Dev agent |
| Vendor approval + setup flows silently blocked by RLS | 🔴 High | ✅ Resolved 2026-04-16 — moved admin reads/writes of `vendor_requests` to `/api/admin/vendor-requests` and `/api/setup/lookup-vendor` using service role; browser anon client is read-only for ecosystem data | Dev agent |
| `/api/admin/*` routes had no server-side auth check | 🔴 High | ✅ Resolved 2026-04-16 — added `requireAdmin()` (bearer token + email match) to `/api/admin/posts` and `/api/admin/vendor-requests`; UI was the only gate before, routes were directly reachable | Dev agent |
| Magic link delivery broken for Yahoo/AOL (pre-beta blocker) | 🔴 High | ✅ Resolved 2026-04-17 — Resend SMTP via Shopify DNS + Resend→Supabase native integration. End-to-end Yahoo test passed. | Dev agent |
| `emailRedirectTo` hardcoded in `lib/auth.ts` — loses `/setup` redirect across magic-link round trip | 🟡 Medium | ✅ Resolved 2026-04-17 session 5 | Dev agent |
| Magic link breaks PWA session continuity (Safari opens outside PWA context) | 🟡 Medium | ✅ Resolved 2026-04-17 session 6 — OTP 6-digit code entry is now the primary auth path. | Dev agent |
| "Sign In" button is unlabeled for audience | 🟡 Medium | Open — Sprint 5. Fix: rename to "Curator Sign In" + add `/welcome` landing for signed-in non-vendors. | Dev agent |
| Vercel URL is a tech-flavored URL for vendor-facing onboarding | 🟢 Low | ✅ Resolved 2026-04-17 session 6 — `app.kentuckytreehouse.com` live. | Dev agent |
| `/admin` approval UX has dead copy-paste email template flow | 🟢 Low | ✅ Resolved 2026-04-17 session 7 | Dev agent |
| Onboarding journey scope is ambiguous across sessions | 🔴 High | ✅ Resolved 2026-04-17 session 8 — `docs/onboarding-journey.md` committed. | Product + Dev agents |
| Vendor approval does not trigger any email to the vendor | 🟡 Medium | ✅ Resolved 2026-04-17 session 8 — T4a shipped. | Dev agent |
| `/setup` bootstrap requires vendor to arrive via `/login?redirect=/setup` | 🟡 Medium | ✅ Resolved 2026-04-17 session 8 — T4a approval email carries URL directly. | Dev agent |
| **KI-003** — "Posting as Zen · booth 300" stale identity post-T4a | 🔴 **High** | ✅ Resolved 2026-04-17 session 9 — three-part fix. Flow 2 verified on device. | Dev agent |
| CLAUDE.md "Known vendors" stale | 🟢 Low | ✅ Resolved 2026-04-17 session 7 | Docs agent |
| PWA install experience improvised | 🟢 Low | Open — Sprint 5 | Dev agent |
| No error monitoring (Sentry / structured logs) | 🟡 Medium | Open — Sprint 3/4 carryover | Dev agent |
| Bookmarks localStorage-only (ITP wipe risk) | 🟡 Medium | Open — Sprint 5 | Dev agent |
| No automated testing | 🟡 Medium | Open — Sprint 6+ | Dev + Product agents |
| Admin PIN not QA'd in production | 🟡 Medium | ✅ Resolved session 9 — KI-001 shipped | Dev agent |
| Public Storage bucket (`post-images`) | 🟡 Medium | Intentional — monitor | Dev agent |
| No terms of service / privacy policy | 🟡 Medium | Open — before public launch beyond in-person beta | David |
| Deprecated lib functions still in `lib/posts.ts` | 🟢 Low | Open — remove once confirmed no callers | Dev agent |
| Magic link emails in Yahoo junk on first send | 🟡 Medium | Accepted — passive reputation seasoning | Dev agent |
| Orphaned Cloudflare DNS zone | 🟢 Low | Open — dormant, no cost | Dev agent |
| Feed pagination missing | 🟢 Low | Open — Sprint 6+ | Dev agent |
| `/enhance-text` caption is mock | 🟢 Low | Open — future sprint | Dev agent |
| `/api/debug-vendor-requests` left in production | 🟡 Medium | ✅ Resolved session 10 — deleted in T4c orphan cleanup | Dev agent |
| **KI-001** — Admin PIN sign-in redirect | 🟡 Medium | ✅ Resolved session 9 | Dev agent |
| **KI-002** — Toast centering breaks on `/admin` | 🟡 Medium | ✅ Resolved session 9 | Dev agent |
| **KI-004** — approve-endpoint 23505 silent-reuse on booth collision | 🟡 Medium | ✅ Resolved session 13 — constraint-aware approval with slug auto-suffix | Dev agent |
| `/setup` 401 race | 🟡 Medium | ✅ Resolved session 10 — retry+backoff. | Dev agent |
| Email send has no retry/DLQ | 🟡 Medium | Open — best-effort acceptable for beta | Dev agent |
| `/shelves` `AddBoothSheet` will be orphaned after T4b | 🟢 Low | 🟡 **Partially reversed session 44 (2026-04-22)** — `<AddBoothInline>` primitive now renders on BOTH `/admin` Vendors tab AND `/shelves` (admin-gated). Lifted to `components/AddBoothInline.tsx`; same primitive, two consumers. Hero-photo field added for mall-walk pre-seed workflow. David's explicit call at session-44 open, Decision Gate fired and David approved the reversal + explicitly skipped the mockup-first step. `/shelves` is no longer strictly a browse-only surface for admins. Session-44 code shipped to disk; build + commit + on-device walk pending HITL at session close. | Dev agent |
| `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` obsolete | 🟢 Low | Open — doc cleanup | Docs agent |
| **Design direction drifted toward generic across sessions 12–14** | 🟡 **Medium** | ✅ Resolved session 15 — `docs/design-system.md` rewritten v0.2 → v1.0 with journal vocabulary committed. Doc has continued to evolve v1.1 → v1.1g across sessions 16–17 as Find Detail + Find Map shipped against it. | Design agent |
| **Booth page `LocationStatement` / `BoothLocationCTA` components deprecated** | ✅ | ✅ Resolved session 18 — both components deleted with the v1.1h Booth page redesign. Cartographic pin+X block and banner post-it replace their roles. File deletions committed alongside `components/BoothPage.tsx` rewrite. | Design + Dev agents |
| **lib/tokens.ts token additions for v1.1g** (post-it, ink scale, price ink, paperCream, Find tile primitive) | 🟢 Low | ✅ Resolved session 19A — `lib/tokens.ts` extended with canonical `v1` + `fonts` exports. Find Detail, Find Map, and BoothPage all import from it. v0.2 `colors`/`radius`/`spacing` coexist untouched during migration. | Dev agent |
| **Feed, Find Map, Find Detail sold state contradict `/shelf/[slug]` policy for MVP surfacing** | 🟡 Low | ✅ Resolved session 20 — `docs/design-system.md` v1.1i commits the sold-retirement policy: feed filters sold at data layer (already does via `getFeedPosts.eq("status","available")`), Find Map keeps bookmark + tile + uses Find Detail 3B sold landing state as the reveal, public Booth pages retain sold posts. Three-part contract (bookmark / tile / 3B) explicitly documented so no future Dev agent adds a status filter to `getPostsByIds` and breaks the reveal path. | Design + Dev agents |
| **v1.1i code sprint pending** (Feed + MallSheet + 3B) | ✅ | ✅ Resolved session 21A — Feed paper-masonry + `<MallSheet>` component + Find Detail 3B sold landing state all shipped; `<MallHeroCard>` + `<GenericMallHero>` + inline `ChevronDown` dropdown all retired. | Dev agent |
| **Onboarding screens (`/vendor-request`, `/setup`, `/login`) on v0.2 chrome** | 🟡 Medium | ✅ Resolved session 23 — v1.1k activation flow pass shipped. Four files rewritten + one new file (`/admin/login`) + one surgical edit (`/admin/page.tsx` unauth-gate redirect). Eight v1.1k commitments locked in `docs/design-system.md`: Mode C interior grammar, paper-wash success bubble, filled-green-CTA-commit-actions-only rule, form input primitive, email echo line primitive, tab switcher retirement, `/admin/login` scope, MallSheet deferral. | Design + Dev agents |
| **`/admin/login` route disposition** (keep dedicated / fold into `/admin` unauth gate / remove `/login` fallback) | 🟢 Low | ✅ Resolved session 37 — David's call: Keep dedicated. The route was v1.1k-clean from session 25 already. `/admin` unauth-gate still redirects to `/admin/login`. Zero code change needed. T4b closed on this decision. | Product + Dev agents |
| **`<MallSheet>` migration to `/post`, `/post/preview`, `/vendor-request`** | 🟢 Low | Open — Sprint 5 sub-sprint. Primitive committed session 20; Feed is its first consumer (shipped 21A). The three remaining consumers wire mechanically against the committed interface; `/vendor-request` was explicitly deferred in v1.1k (h) rather than bundled. | Dev agent |
| **`app/admin/login/page.tsx` orphan from session 23** — documented as shipped in session-23 CLAUDE.md close but never written to disk. `/admin` unauth-gate redirect pointed at a missing route; `/admin/login` direct URL returned 404. Same class of bug as session-13 `lib/imageUpload.ts` orphan. Build stayed green because the redirect target is a runtime string, not an import. | 🟡 Medium | ✅ Resolved session 25 — file written from session 23's documented spec (Mode C chrome, paper-wash Shield logo bubble, v1.1k form input primitive, filled green CTA, signing-in bridge). Verified on disk via `filesystem:list_directory` before commit. Build green. Deploy confirmed. On-device QA passed. Drove the new file-creation-verify Tech Rule. | Dev + Docs agents |
| **Session-14 build-check rule amended** — original rule (*"A session is not closed until `npm run build` has run green against the committed state"*) is necessary but not sufficient. Next.js builds do not validate that runtime navigation strings resolve to page files. | 🟢 Low | ✅ Resolved session 25 — new Tech Rule "File-creation verify at session close" added; the build-check rule now has an explicit companion that catches the orphan class of bugs. Docs agent runs `filesystem:list_directory` or `filesystem:read_text_file` on every NEW file declared in the session close before `thc`. | Docs agent |
| **`004_site_settings.sql` migration shipped as code but never applied to Supabase** — v1.1l featured banners relied on a `site_settings` table + `site-assets` Storage bucket that did not exist in production. `getSiteSettingUrl()` hit a missing table and silently returned null, so both banners collapsed invisibly. Graceful-collapse was correct behavior, but the HITL instruction was buried in a SQL comment header rather than surfaced as a session-close checklist item. | 🟡 Medium | ✅ Resolved session 25 — David ran the migration in the Supabase SQL editor; `site_settings` table created with seed rows; `site-assets` bucket created and verified public; Home + Find Map banners uploaded via `/admin` Banners tab; both render live on device. Drove the new "Required Supabase migrations" Tech Rule: any sprint shipping a new `supabase/migrations/*.sql` file that production code depends on must list the migration as an explicit 🖐️ HITL step in the session-close checklist, not just inside a comment header. | Dev + Docs agents |
| **Find Map v0.2 (page called "My Finds") pre-beta chrome mismatch** | 🟡 Medium | ✅ Resolved session 17 — `/flagged` full redesign to v1.1g shipped (journal itinerary, pin+mall anchor, X-glyph spine, Booth pill rows, find tiles with prices + unsave heart, intro voice + chapter-break closer). All v0.2 localStorage / pruning / grouping / focus-rehydration / unsave wiring preserved. | Design + Dev agents |
| **Glyph hierarchy not documented as a cross-cutting rule** (risk: future screens pick the wrong glyph and dilute the language) | 🟢 Low | ✅ Resolved session 17 — pin = mall, X = booth locked in `docs/design-system.md` v1.1g Cartographic Vocabulary section. Propagates to Booth redesign (18A), Feed redesign (18B), and any future location-naming surface. | Design agent |
| **App-wide background color inconsistent across routes** (Find Detail used paperCream; `/flagged` and chrome elsewhere still used legacy `#f0ede6`) | 🟢 Low | ✅ Resolved session 17 — `app/layout.tsx` body inline + `app/globals.css` `@layer base body` both committed to `#e8ddc7` paperCream. Global bg commitment documented in design-system doc "Paper as surface" section. | Design + Dev agents |
| **Stale `claude-opus-4-5` model identifier across 3 API routes** (`/api/post-caption`, `/api/identify`, `/api/story`) — model was retired on Anthropic API ~1 month ago but routes still referenced it; SDK threw `NotFoundError` on every call; `catch` blocks silently returned random `MOCK_RESPONSES` entries with no distinguishable shape, so clients populated forms with hardcoded generic strings regardless of photo. Vendor-reported as "auto-populate does not match photo." | 🟡 Medium | ✅ Resolved session 27 — swapped to `claude-sonnet-4-6` (post-caption, story), `claude-opus-4-7` (identify). Added `source: "claude" \| "mock"` field + `reason` to `/api/post-caption` response; clients on `/post` and `/post/preview` now treat non-claude source as failure and fire the amber "Couldn't read this image" notice rather than silently populating with mock strings. On-device QA confirmed correct per-photo captions after credit top-up. | Dev agent |
| **Anthropic API credit balance can silently take the AI pipeline offline** — HTTP 400 `invalid_request_error` returns the same shape as model-not-found, graceful-collapses to mock, user sees "wrong captions" with no error signal. Discovered session 27 on-device QA post-model-swap: model fix was correct, but Anthropic account was at zero credits; symptom identical to the original regression. | 🟢 Low | ✅ Fully resolved session 43 (2026-04-21) — Anthropic console auto-reload enabled at threshold $10 / reload $20. Effective balance floor is now $10 rather than $0; under any realistic call-volume scenario, auto-reload fires well before the pipeline can graceful-collapse to mock. Current balance $5.88 at session close is operationally safe: a typical vendor post costs $0.02–$0.05 (identify + post-caption combined), so even a 100-post burst lands inside the current balance and auto-reload triggers before dry-up. The session-27 `source: "claude" \| "mock"` observability field on `/api/post-caption` remains the diagnostic backstop. Pairs with the session-43 Tech-Rule-firing as confirmation that the session-27 family of discipline moves is working as designed. | David (ops) + Dev agent |
| **`/api/suggest/route.ts` uses `claude-opus-4-6`** (still live on Anthropic API; audit re-verified session 43 against the deprecations page — Active with retirement not sooner than February 5, 2027) | 🟢 Low | Open — lowest-priority follow-on. `/api/suggest` is a reseller-intel route (not ecosystem), so beta vendors don't exercise it. Two shape notes worth a future session: (a) this is the only AI route still using raw `fetch` against `api.anthropic.com/v1/messages` rather than the Anthropic SDK; marginally wider silent-failure surface than the other three routes, no functional difference. (b) Optional migration to SDK for shape-consistency, or explicit note of the delta in CONTEXT.md. Not beta-gating. | Dev agent |
| **Post-flow trilogy on v0.2 chrome + missing Edit Listing page** (`/post` on legacy Georgia + `#f0ede6`; `/post/preview` same; no `/find/[id]/edit` route exists; vendors cannot edit a published find). | 🟡 Medium | ✅ Spec approved session 28 — three mockups signed off by David (`docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`). Build spec in `docs/design-system-v1.2-build-spec.md`. Code sprint deferred to session 29. `/post` retires in favor of `<AddFindSheet>` from `/my-shelf`; `/post/preview` fully rewrites with `<PhotographPreview>` truth rule (no crop, paper fills letterbox); new `/find/[id]/edit` with autosave + status toggle + Replace-photo + Remove-from-shelf link + `PATCH /api/my-posts/[id]` route. Primitives introduced: `<AddFindSheet>`, `<PhotographPreview>`, `<PostingAsBlock>`, `<AmberNotice>`. | Design + Dev agents |
| **Design agent process was spec-first by default — created expensive revision cycles** | 🟡 Medium | ✅ Resolved session 28 — new Tech Rule "Design: mockup-first as default, not exception" added. David named the problem explicitly: reviewing 14-paragraph `docs/design-system.md` commitment blocks required executive-level fluency in design-system vocabulary, and changing direction after commit pulled the whole block back up for dissection. v1.2 session successfully tested the reversed pattern — mockup-first review via phone-frame HTML + structured plain-English questions + build spec written AFTER approval as dev-handoff doc. Three UI surfaces approved in one session with zero spec-doc reopens. Pattern now the committed default for all future UI work. | Design agent |
| **`check-vendor-requests.js` plaintext service_role JWT exposed in public git history** (surfaced session 28; resolved session 29) — commit `3492f8d`, key valid through 2036, full RLS-bypass capability, identical to production `SUPABASE_SERVICE_ROLE_KEY`. | 🔴 High | ✅ Resolved session 29 (2026-04-20) — full migration to Supabase's new API key system. Server on `sb_secret_Bhtc7...`; client on `sb_publishable_tK5EpAqb...` (named `treehouse_search_prod_client`). Both legacy JWT keys disabled at Supabase's edge; exposed JWT returns HTTP 401 via direct curl. `check-vendor-requests.js` deleted from working tree AND scrubbed from git history via `git filter-repo` across all 340 commits, all branches, force-pushed to GitHub. `.gitignore` extended with `check-*.js` + `scripts/debug/`. Secrets audit grep returned 0 real matches; `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` JWT-header grep returned `0`. Zero production code changes required — Supabase SDK handles new key format transparently. See `docs/SECURITY-INCIDENT-2026-04-19.md` for full postmortem. | Dev + David |
| **Dormant `claude/nervous-raman` branch + worktree on GitHub** — leftover from early Claude Code session, never cleaned up, pushed alongside main during session-29 filter-repo force-push. | 🟢 Low | ✅ Resolved session 29 — confirmed ancestor of main (zero content loss), worktree removed via `git worktree remove`, branch deleted locally and on GitHub. Repo now has single `main` branch. | Dev agent |
| **Secrets scan not yet promoted to Tech Rule** — session 29 postmortem identifies this as a backlog follow-on. Canonical grep pattern documented in `docs/SECURITY-INCIDENT-2026-04-19.md` under "Follow-ons added to backlog". | 🟢 Low | Open — session 30 candidate item 30C (~5 min). Add Tech Rule to `docs/DECISION_GATE.md`: run secrets grep at sprint boundaries; verify JWT-header grep returns `0`. | Docs agent |
| **Project-root agent-system cruft** (15 files + `{app` directory + `.session_state.json` + `tsconfig.tsbuildinfo` + `ai-text-demo/`) from a prior Python-based agent-system experiment. | 🟢 Low | ✅ Resolved session 29 — 16 files deleted via staged `rm -rf`, committed as `e2510ba` (~4,856 lines removed). `git log --all` retains full history if anything is ever needed back. Working tree and `ls` output now tidy; future sessions don't waste tokens parsing `AGENT_SYSTEM_COORDINATOR.py`. | Dev agent |
| **KI-005 — Pre-approval sign-in signaling gap** (surfaced session 33 QA walk). Pending vendor taps Sign In at `/login` before admin approval; page doesn't recognize the in-flight request, sends an unnecessary OTP, vendor lands on `/my-shelf` `<NoBooth>` state. Soft recovery, not a dead-end, but the signal lands at the wrong step. | 🟢 Low | Open — deferred to Sprint 5 guest-user UX batch. Full scope + fix shape in `docs/known-issues.md` → KI-005. Natural batch-mate to "Curator Sign In" rename + `/welcome` landing. `/login` is a 🔴 STOP surface so deserves its own dedicated session, not a sidebar fix. | Dev agent |
| **KI-006 — `/api/setup/lookup-vendor` stale name join (session-32 regression, pre-beta blocker)** — route joins `vendor_requests.name` against `vendors.display_name`, which diverge after session 32's `booth_name → first+last → name` priority. Any Flow 3 vendor with a booth_name set is stranded post-sign-in. Caught session 33 walk step 6 on-device. | 🔴 High | ✅ Resolved session 35 (2026-04-20) — KI-006 killed as a natural sub-fix of the multi-booth rework. Lookup route rewritten to composite-key lookup on `(mall_id, booth_number, user_id IS NULL)` across an array of requests; display_name join is gone entirely. Two follow-up fixes needed during the session (client-side `/my-shelf` self-heal short-circuit, then server-side lookup-vendor short-circuit — both same class of half-migration bug) before the on-device walk step-2 verification passed clean. Full detail in `docs/known-issues.md` Resolved. | Dev agent |
| **Multi-booth data model** — same person can hold multiple booths (same mall or across malls). Current schema forbids: `vendors.user_id UNIQUE` constraint is one-vendor-per-user. Named by David at session-33 close as a pre-beta blocker. Collides with: `vendors_user_id_key`, `/my-shelf` single-vendor resolution, `/api/setup/lookup-vendor`, `/post` identity resolution, `/admin` approval flow, session-32 v1.2 email dedup (currently collapses to one-request-per-email; multi-booth needs `(email, mall_id, booth_number)` composite). | 🔴 High | ✅ Resolved session 35 (2026-04-20) — Option A shipped. Migration 006 drops `vendors_user_id_key`; migration 007 rekeys vendor_requests dedup index to composite; `getVendorsByUserId` (array return) + `lib/activeBooth.ts` resolver + `<BoothPickerSheet>` primitive + `/api/setup/lookup-vendor` rewrite all shipped as one bundle (also absorbed the uncommitted session-32 v1.2 onboarding code). On-device QA walk passed all six steps: single-booth unchanged, KI-006 verified fixed, multi-booth picker appears when N>1, switches persist, post inherits active booth, composite dedup works. Commits: `54ba898`, `aa94656`, and the session-35 lookup-vendor short-circuit fix. | Product + Design + Dev agents |
| **Picker affordance placement drifts on brand-lockup role of masthead** — session-35 on-device walk surfaced that "Viewing · Name ▾" in the masthead center slot (per approved mockup) competes with the "Treehouse Finds" app brand lockup. David's called direction: move chevron inline with the IM Fell 28px booth name under the hero banner. | 🟢 Low | Open — captured as Q-002 in `docs/queued-sessions.md`. Non-gating; multi-booth is a minority use case in beta. Ready to run as scoped mockup revision + surgical `/my-shelf` edit, ~20 min. | Design + Dev agents |
| **BottomNav `flaggedCount` badge hidden on `/my-shelf`, `/flagged`, `/shelves`** — `<BottomNav>` takes an optional `flaggedCount` prop that defaults to 0. Only `app/page.tsx` (Home) wires it; the three other consumers render without it, so the Find Map heart icon's saved-items badge only appears on Home. | 🟢 Low | ✅ Resolved 2026-04-20 session 36 — Q-003 shipped. Scope expanded to include `/find/[id]` (main + SoldLanding) when David's on-device testing surfaced the overlooked fourth surface. `/flagged` was already correct; `/shelves` was already correct on-mount. Edit page intentionally left without BottomNav per session-31E focused-management-surface commitment. See `docs/known-issues.md` Q-003 Resolved. | Dev agent |
| **KI-007 — `/find/[id]/edit` redirect loop for non-admin vendors** (latent from session 31E, surfaced session 36). `lib/posts.ts` `getPost()` vendor select missing `user_id`. Two downstream consumers (the edit-page auth gate + Find Detail's `detectOwnershipAsync` path 2) evaluated `post.vendor.user_id` as undefined, so vendors got kicked back to Find Detail. Admin path bypassed the check via `isAdmin(user)` short-circuit. | 🔴 High | ✅ Resolved 2026-04-20 session 36 — one-line fix added `user_id` to the vendor select. Also silently hardens `detectOwnershipAsync` path 2 for multi-booth users viewing their own posts when the active booth doesn't match the post's vendor (pre-fix path 3 was rescuing that case via `LOCAL_VENDOR_KEY`). See `docs/known-issues.md` KI-007 Resolved. | Dev agent |
| **Session-35 half-migration bug class (return-shape cardinality)** — two bugs surfaced during session-35 on-device QA, both the same class: early-return short-circuits assumed `result != null` or `result.length > 0` meant "fully resolved," which was correct under `Vendor \| null` but broke under the new `Vendor[]` shape. Fixed mid-session (two extra commits). Rule candidate queued for promotion. | 🟡 Medium | Open — Tech Rule candidate queued in the Tech Rules block above as "Half-migration audit when changing return-shape cardinality." Promote as a batch alongside the session-33 "dependent-surface audit" candidate when there's a Tech Rule promotion session. | Docs agent |
| **`/admin` v0.2/v1.1k chrome mix post-T4b** — session 37 added a v1.1k-chromed `<AddBoothInline>` primitive above the Requests header, but the rest of `/admin` (Posts tab, Banners tab, tab switcher, header, approval toast, Requests cards, diagnosis panel, `<FeaturedBannerEditor>`) remains on v0.2 Georgia serif + `colors.*` palette. Reads as a Treehouse-shaped patch inside a legacy surface. Admin-only, not beta-blocking. **Session 44 extended the same chrome mismatch to `/shelves`** — `<AddBoothInline>` renders in v1.1k chrome inside an otherwise-v0.2 browse surface. Same intentional mismatch, same Sprint 5+ v1.2 redesign will fold both. | 🟢 Low | Open — Sprint 5+ `/admin` + `/shelves` v0.2 → v1.2 redesign pass. Size L (~2–3 sessions for `/admin`, ~1 session for `/shelves`). Both need design scoping first (mockup-first per session-28 rule). Captured in CLAUDE.md KNOWN GAPS > Sprint 5 + design follow-ons. | Design + Dev agents |
| **Session 44 T4b reversal** — `/shelves` Add-a-Booth restored at David's explicit direction. Decision Gate fired correctly at session open and caught the reversal as a 🔴 STOP trigger (architecture pattern change + UI change not scoped against design-system.md). David approved the reversal and explicitly waived the mockup-first step. `<AddBoothInline>` lifted from `/admin` to its own component; both `/admin` Vendors tab and `/shelves` (admin-gated) now render the same primitive. Hero-photo field added for the mall-walk pre-seed workflow. | 🟡 Medium | 🟡 Open — build check, commit + push, and six-step on-device walk all pending HITL at session-44 close. On-device walk may surface a pre-existing `<VendorCard>` admin-tap surface bug (route to `/my-shelf?vendor={id}` may not resolve post-session-35 multi-booth rework for `user_id: null` Flow-1 vendors) — if fired, treat as distinct ~15-min queued session to honor the `?vendor={id}` query param as admin-impersonation override, not a session-44 regression. | Dev agent + David |

---

## Agent Roster

| Agent | Status | Scope |
|---|---|---|
| **Dev agent** | ✅ Active | Codebase, architecture, sprint execution, bug triage, deployment |
| **Product agent** | ✅ Active (2026-04-17 session 6) | Backlog management, feature specs, sprint planning, scope decisions. Runs at session open per MASTER_PROMPT.md. |
| **Docs agent** | ✅ Active (2026-04-17 session 6) | Session close ritual, CLAUDE.md updates, Risk Register, decision log, Notion Roadmap sync. Activated when Notion drift from code was flagged. |
| **Design agent** | ✅ Active (2026-04-17 session 11) | Visual + interaction system ownership: typography, spacing, color, component library, motion, copy voice. Reviews every cross-cutting UI decision before code. Maintains `docs/design-system.md` as canonical source of truth. Runs a design standup alongside Product at session open. Activation trigger: recurring per-screen drift across sessions — three themes, inconsistent sold terminology, four button styles — made cross-cutting design work into a genuine bottleneck. |
| **Security agent** | 🔲 Sprint 5 | RLS audit, API surface review, secrets hygiene, auth hardening. Activation trigger: recurring security-surface work (next: RLS for posts) |
| **Finance agent** | 🔲 Phase 2 | API cost tracking, booth revenue, burn rate, Zen Forged financials. Activation trigger: API costs become non-trivial or booth revenue begins. |
| **Brand agent** | 🔲 Phase 2 | Tone review, copy consistency, launch messaging, design system governance. Activation trigger: pre-launch / launch messaging work. Note: brand/copy voice currently sits inside Design agent's scope until Brand activates. |

**Docs agent — draft system prompt:**
> You are the Docs agent for the Kentucky Treehouse system. Your job is to maintain the memory of the system across sessions. At session close you: (1) update CLAUDE.md with what was done and what's next, (2) update the Risk Register in DECISION_GATE.md for any resolved or new risks, (3) append to decision-log.md if an architectural decision was made, (4) keep CONTEXT.md current if architecture changed, (5) append to the Sprint Log in the Notion Agent System Operating Manual. You are precise, brief, and always write in the past tense for completed work. You never invent status — only document what actually happened.

**Design agent — draft system prompt (updated session 15):**
> You are the Design agent for the Kentucky Treehouse system. Your job is to hold the entire product's visual and interaction language in your head at once, and to prevent cross-screen drift. You think like a senior product designer who cares about earthy materiality, editorial restraint, and the feeling of calm intention. You believe the app should feel like a field journal kept by someone who loves the hunt — not like a marketplace, not like a SaaS dashboard, not like a generic AI app, and not like a skeuomorphic costume drama.
>
> The backbone is the tagline: **Embrace the Search. Treasure the Find. Share the Story.** Every decision returns to it. Presence over pressure. Story over speed. Rooted in reality yet elevated for perspective.
>
> Your responsibilities:
> 1. Own `docs/design-system.md` v1.0 as the canonical source of truth for typography, spacing, color, components, motion, copy voice, and interaction patterns. Keep it current; update it before any UI code changes.
> 2. Run a design standup at session open alongside Product.
> 3. Review every UI-touching sprint brief before Dev writes code. Flag cross-screen drift. Call out when a per-screen fix would make the system worse. Propose system-level alternatives.
> 4. Maintain the living design direction doc — when a new pattern is needed, draft a short spec and update the system doc before Dev builds.
> 5. Hold the brand feeling firm: warm parchment, IM Fell English as the editorial voice, system-ui for precise data, Caveat reserved for rare handwritten beats (one per screen max), cartographic pin-and-X for location everywhere, paper as surface (no card chrome), one skeuomorphic gesture per find (the booth post-it). Push back when a proposal would dilute the brand even if it would ship faster.
>
> You do not write production code — that's Dev's job. You do not make product decisions — that's Product's job. You do not decide what ships — that's David's job. Your output is clarity: a crisp visual/interaction system that Dev can execute against without drift, and a set of design decisions documented with rationale.
>
> You are honest, direct, and never flatter. You tell David when a proposed direction would weaken the system. You are patient with iteration — premium design is rarely first-pass — but you hold the line on the commitments already made in `docs/design-system.md` unless there's a deliberate reason to change them, in which case you update the doc.
>
> Specific trap to avoid: the "canonical primitive" impulse. Every time the system reaches for "we need a reusable component for this," it tends to produce the most generic version of that primitive. v0.2 did this (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system) and the product started to feel like Etsy. v1.0 corrects this by leading with *language and material* — the cartographic pin+X, the post-it, the paper surface — and letting composition fall out of those commitments rather than out of a component library.

---

## Standup Agent Roster Check

Every session standup includes a one-line Agent Roster block confirming who is active for the session. This prevents silently dropping an activated agent from the loop.

**Standard standup preamble:**
> **Active agents:** Dev · Product · Docs · Design — *(current as of 2026-04-20 session 35)*

When an agent is activated or deactivated:
1. Update the Agent Roster table above
2. Update the standard standup preamble line
3. Note the trigger that caused the change in the Risk Register or session notes

## Session Management Protocol

### Standard close
At the end of a session where code was written or changed:
1. Tell Claude: *"close out the session"*
2. Claude updates CLAUDE.md — what was done, what's next
3. Run: `git add -A && git commit -m "docs: update session context" && git push`

### Re-close (when to do it)
Only needed if you **kept building after the first close** — a bug fix, a file change, anything in the codebase. Tell Claude "close out the session" again and commit again. The last commit is always the source of truth.

**You do NOT need to re-close if:**
- You asked a question after the close
- You had a strategic conversation that produced no code changes
- You clarified a process or made a decision

### Capturing post-session context
If a conversation after session close produces something worth keeping permanently — a new process, an agent definition, a decision — capture it before ending the conversation:
- **Repo-level knowledge** (rules, architecture, processes) → update the relevant file directly and commit
- **Strategic/operating knowledge** → update the Notion Agent System Operating Manual
- **Purely conversational** → no action needed; it lived in the chat and that's fine

### The test
Ask: *"If I started a new session tomorrow with only the repo files, would I be missing something important from today?"* If yes — capture it now. If no — you're done.

**How agents are activated:** An agent is created when the work it covers becomes a recurring bottleneck. Not before. Each agent gets a focused system prompt, relevant context files, and a defined scope. They report through the same three-level gate above.

---

## Sprint Context (current)

| Sprint | Focus | Status |
|---|---|---|
| Sprint 1 | MVP core — feed, post flow, auth, booths | ✅ Complete |
| Sprint 2 | UI polish — animations, detail page, scroll restore | ✅ Complete |
| Sprint 3 | Vendor bio, Find Map overhaul, error monitoring, rate limiting | 🔄 Carryovers folded into Sprint 4 |
| Sprint 4 | Beta-readiness — custom domain, OTP auth, `/admin` polish, vendor onboarding | ✅ Substantively complete (session 37). Shipped: T1/T2/T3/T4a, KI-001/002/003/004, `/setup` 401 polish, T4c, session-32 v1.2 onboarding refresh, session-35 multi-booth rework + KI-006 fix, T4b admin surface consolidation (session 37), `/admin/login` dedicated (T4b decision, session 37). Remaining: T4d pre-beta QA walk (runbook in `docs/pre-beta-qa-walk.md`, execution HITL). |
| Sprint 5 | Guest-user UX + onboarding polish — "Curator Sign In" rename, `/welcome` landing, PWA install prompts, vendor onboarding Loom, `<MallSheet>` migration to `/post` + `/vendor-request`, KI-005 pre-approval sign-in signaling, typography reassessment | 🔲 Planned |
| **Design sprints (parallel to Sprint 4 tail)** | **v1.1i execution against `docs/design-system.md`** | 🔄 Session 15: direction lock v0.2 → v1.0. Session 16: Find Detail v1.0 → v1.1d code build. Session 17: Find Detail polish v1.1e → v1.1f; Find Map v1.1g full redesign; glyph hierarchy locked; paperCream globalized. Session 18: Booth page v1.1h full redesign; post-it cross-page primitive; Window View + Shelf View; four v0.2 components deleted. Session 19A: token consolidation — `lib/tokens.ts` canonical for v1.1h `v1` palette + fonts. Session 20: v1.1i spec committed. Session 21A: Feed + MallSheet + 3B code. Session 28: v1.2 post-flow trilogy spec + three mockups approved. Session 29: v1.2 code. Session 34: multi-booth scoping mockup approved. Session 35: multi-booth code shipped. |
| Sprint 6+ | "Claim this booth" flow, QR-code approval, Universal Links, native app eval, feed pagination, ToS/privacy, admin-cleanup tool, Option B `vendor_memberships` migration (if/when co-ownership becomes a real roadmap item) | 🔲 Parked |

---

## How to Use This Document

**Every Claude session:** Read this before the opening standup. It replaces the need to re-explain the product vision, brand rules, or tech constraints in every conversation.

**Every agent:** Reference this as the operating constitution. When in doubt about whether to proceed, escalate to the appropriate gate level.

**Every sprint:** Update the Risk Register when risks are resolved or discovered. Update the Sprint Context table at sprint boundaries.

**David:** This is the document that prevents the system from optimizing for the wrong thing. If you ever feel like the work is drifting from the vision — this is where you come to re-anchor it. The tagline is the anchor.

---

## Related Documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Live session whiteboard — current issue, what was done, next steps |
| `CONTEXT.md` | Full architecture — schema, routes, data flow, design system |
| `.claude/MASTER_PROMPT.md` | Operator rulebook — session structure, phase gating, approval boundaries |
| `SPRINT_PLAN.md` | Sprint-level feature roadmap |
| `docs/onboarding-journey.md` | **Canonical vendor onboarding spec — three flows, email matrix, re-scoped T4.** All onboarding-adjacent work scopes against this first. *(created session 8)* |
| `docs/design-system.md` | **Canonical visual + interaction system — v1.1k.** Journal vocabulary, cartographic pin+X (glyph hierarchy locked session 17), IM Fell English typography, post-it material gesture at +6deg with stacked "Booth Location" eyebrow, paper-as-surface globally committed at `#e8ddc7`, Feed paper-masonry + `<MallSheet>` primitive (v1.1i), diamond ornaments retired + `FONT_SYS` for booth numerals (v1.1j), Mode C interior grammar + paper-wash success bubble + form input primitive + email echo line + filled-green-CTA-commit-actions-only rule (v1.1k). All multi-screen UI work scopes against this first. Owned by Design agent. *(rewritten session 15, evolved through v1.1k in sessions 16–23)* |
| `docs/known-issues.md` | Active bugs, gaps, deferred items |
| `docs/admin-runbook.md` | 9-recipe SQL triage guide for in-mall use *(created session 13)* |
| `docs/decision-log.md` | Architectural decisions and their rationale *(create when first decision is logged)* |
| `docs/multi-booth-build-spec.md` | Dev handoff for session 35. Archived reference after shipping. |
| `docs/queued-sessions.md` | Scoped-but-sequenced work awaiting promotion. Active: Q-002 (picker placement), Q-003 (BottomNav badge). Superseded: Q-001 (KI-006 Path B, retired by session 35). |

---
> This document is the operating constitution for the Treehouse Finds system.
> It is maintained by the Dev agent and reviewed by David at each sprint boundary.
> Last updated: 2026-04-22 (session 44 — /shelves Add-a-Booth restored, partial T4b reversal; two Risk Register rows updated, no new Tech Rules promoted)
