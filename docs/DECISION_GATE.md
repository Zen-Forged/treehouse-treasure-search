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
| Georgia for humanity | Headings, captions, and titles use serif. UI uses system font. |
| Warm parchment palette | `#f5f2eb` bg, `#1e4d2b` green — earthy, not digital |
| "Found a home" not "Sold" | Terminology is committed. See CLAUDE.md. |
| Auth is for curators, not shoppers | Shoppers browse without an account. Sign-in is a curator action. Guest-user accounts contradict the vision. |

**When to flag:** If a requested feature or copy change would make Treehouse feel more like eBay, Etsy, or Facebook Marketplace — stop and discuss before building.

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
Framer Motion transforms           motion.div cannot have centering transform — use wrapper div
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
DNS / email sending                Transactional email (magic links) sends from `kentuckytreehouse.com`
                                   via Resend + Supabase custom SMTP. Shopify remains authoritative
                                   for the zone; Resend records (`resend._domainkey`, `send` TXT/MX)
                                   live in Shopify DNS. See CLAUDE.md DNS STATE section.
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

> Updated: 2026-04-17 (session 7 — T3 shipped; 🔴 High-severity onboarding scope risk added; 3 🟡 Medium risks added under the scope-risk parent; 2 🟢 Low risks resolved via DB reset + T3 ship; Known vendors drift flagged and resolved)

| Risk | Severity | Status | Owner |
|---|---|---|---|
| RLS disabled on `malls`, `vendors`, `posts` | 🔴 High | ✅ Resolved 2026-04-15 — 12 policies live, stale policies cleaned up (003_cleanup_old_rls_policies.sql) | Dev agent |
| No rate limiting on `/api/post-caption` | 🔴 High | ✅ Resolved 2026-04-15 — in-memory 10 req/60s per IP; upgrade to Upstash Redis at scale | Dev agent |
| Vendor approval + setup flows silently blocked by RLS | 🔴 High | ✅ Resolved 2026-04-16 — moved admin reads/writes of `vendor_requests` to `/api/admin/vendor-requests` and `/api/setup/lookup-vendor` using service role; browser anon client is read-only for ecosystem data | Dev agent |
| `/api/admin/*` routes had no server-side auth check | 🔴 High | ✅ Resolved 2026-04-16 — added `requireAdmin()` (bearer token + email match) to `/api/admin/posts` and `/api/admin/vendor-requests`; UI was the only gate before, routes were directly reachable | Dev agent |
| Magic link delivery broken for Yahoo/AOL (pre-beta blocker) | 🔴 High | ✅ Resolved 2026-04-17 — Resend SMTP via Shopify DNS + Resend→Supabase native integration. End-to-end Yahoo test passed. | Dev agent |
| `emailRedirectTo` hardcoded in `lib/auth.ts` — loses `/setup` redirect across magic-link round trip | 🟡 Medium | ✅ Resolved 2026-04-17 session 5 — `sendMagicLink(email, redirectTo?)` now accepts optional path, `safeRedirect()` helper in `app/login/page.tsx` validates same-origin relative paths only. Verified end-to-end with fresh email → `/setup` → admin approval → `/my-shelf`. | Dev agent |
| Magic link breaks PWA session continuity (Safari opens outside PWA context) | 🟡 Medium | ✅ Resolved 2026-04-17 session 6 — OTP 6-digit code entry is now the primary auth path with clipboard paste button. Entire flow stays in home-screen PWA context. Magic link remains as fallback. Verified end-to-end on iPhone PWA. | Dev agent |
| "Sign In" button is unlabeled for audience — any shopper clicking it can authenticate and hit a dead-end `/my-shelf` | 🟡 Medium | Open — Sprint 5. Fix: Option B — rename to "Curator Sign In" + add `/welcome` landing for signed-in non-vendors with warm "still curator-only" copy + "Request a booth" CTA. **NEW 2026-04-17 session 5.** | Dev agent |
| Vercel URL (`treehouse-treasure-search.vercel.app`) is a tech-flavored URL for vendor-facing onboarding | 🟢 Low | ✅ Resolved 2026-04-17 session 6 — `app.kentuckytreehouse.com` live (CNAME in Shopify DNS → Vercel, HTTP/2, cert issued). Supabase Auth Site URL + Redirect URLs aligned. `.vercel.app` remains live as safety net for ~1 week. | Dev agent |
| `/admin` approval UX has dead copy-paste email template flow (obsolete since Resend SMTP) | 🟢 Low | ✅ Resolved 2026-04-17 session 7 — T3 shipped: email template flow removed, structured toast replaces inline banner, Approve button sized for 44px iOS thumb-reach. | Dev agent |
| **Onboarding journey scope is ambiguous across sessions — Dev agent has been building against shifting assumptions** | 🔴 **High** | **Open — session 7 discovery; blocks all remaining Sprint 4 execution until scope-out complete. Three distinct failures surfaced in one QA pass: (1) approve endpoint sends no email; (2) `/setup` has no organic path from `/login`; (3) `/my-shelf` has no self-heal on stale localStorage. Fix: Product Agent runs full journey mapping at next standup, outputs canonical `docs/onboarding-journey.md`.** | Product + Dev agents |
| Vendor approval does not trigger any email to the vendor — vendor has no organic way to know they've been approved | 🟡 Medium | Open — surfaced session 7 as consequence of the broader scope ambiguity above. Fix decision deferred to onboarding scope-out. Options: (a) approve endpoint fires `signInWithOtp()` automatically, (b) admin notifies vendor out-of-band, (c) vendor-request success screen polls for approval and self-directs. | Product + Dev agents |
| `/setup` bootstrap requires vendor to arrive via `/login?redirect=/setup` — no organic path exists | 🟡 Medium | Open — surfaced session 7. A vendor who goes to `/login` directly lands on `/my-shelf` with no profile bootstrap. Fix decision deferred to onboarding scope-out. | Dev agent |
| `/my-shelf` does not self-heal on stale or empty localStorage — DB state and client state can diverge silently | 🟡 Medium | Open — surfaced session 7. In QA, David's iPhone showed "posting as Zen · booth 300" after a database reset wiped the Zen vendor entirely. Fix decision deferred to onboarding scope-out. | Dev agent |
| CLAUDE.md "Known vendors" section was stale — claimed vendors were linked to auth that were not | 🟢 Low | ✅ Resolved 2026-04-17 session 7 — section rewritten to reflect post-reset truth. Docs agent to verify schema-vs-docs drift as part of each session close going forward. | Docs agent |
| `/vendor-request` success screen is generic — loses the "in-person magic moment" when admin is standing there approving in real time | 🟢 Low | Open — Sprint 4 (T4). Fix: real-time approval poll OR in-person variant of success screen. **NEW 2026-04-17 session 5.** | Dev agent |
| PWA install experience is improvised (user has to find "Add to Home Screen" manually) | 🟢 Low | Open — Sprint 5. Low priority while onboarding is in-person (David walks vendors through install). Escalates to 🟡 Medium if/when remote onboarding starts. **NEW 2026-04-17 session 5.** | Dev agent |
| No error monitoring (Sentry / structured logs) | 🟡 Medium | Open — Sprint 3/4 carryover | Dev agent |
| Bookmarks localStorage-only (ITP wipe risk) | 🟡 Medium | Open — Sprint 5 | Dev agent |
| No automated testing | 🟡 Medium | Open — Sprint 6+ | Dev + Product agents |
| Admin PIN not QA'd in production | 🟡 Medium | Open — Sprint 3/4 carryover; quick curl test | Dev agent |
| Public Storage bucket (`post-images`) | 🟡 Medium | Intentional — monitor | Dev agent |
| No terms of service / privacy policy | 🟡 Medium | Open — before public launch beyond in-person beta | David |
| Deprecated lib functions still in `lib/posts.ts` | 🟢 Low | Open — `getVendorByEmail`, `linkVendorToUser`, `getVendorRequests`, `createVendorFromRequest`, `markVendorRequestApproved` marked `@deprecated` 2026-04-16; remove once confirmed no other callers import them | Dev agent |
| Magic link emails landing in Yahoo junk folder on first send | 🟡 Medium | Accepted — expected for any new sending domain. Resolution: passive reputation seasoning as real usage grows + users marking "not junk". Branded email template (Sprint 4 item) will help marginally. | Dev agent |
| DNS archaeology assumption from session 3 was wrong (Google Cloud DNS) | 🟢 Low | ✅ Resolved 2026-04-17 — Shopify is actual DNS authority, Squarespace is registrar | Dev agent |
| Orphaned Cloudflare DNS zone for `kentuckytreehouse.com` | 🟢 Low | Open — dormant; no cost | Dev agent |
| Feed pagination missing (flat 80-post fetch) | 🟢 Low | Open — Sprint 6+ | Dev agent |
| `/enhance-text` caption is mock (not real Claude call) | 🟢 Low | Open — future sprint | Dev agent |
| `/api/debug-vendor-requests` left in production | 🟢 Low | Open — useful for QA; remove in a later cleanup sprint | Dev agent |
| Supabase OTP email template variables not validated at deploy time (session 6 discovery) | 🟢 Low | ✅ Resolved 2026-04-17 session 6 — new Tech Rule added: email templates for `signInWithOtp` must include `{{ .Token }}` in a selectable element (`<code>` with `user-select: all`) AND Supabase OTP Length must match the app input length (6 digits). Both Magic Link and Confirm Signup templates updated. The "Save changes" button in Supabase template editor can silently no-op between tab switches — always verify with Preview tab. | Dev agent |
| Test vendor from session 5 end-to-end test needs cleanup-or-document decision | 🟢 Low | ✅ Resolved 2026-04-17 session 7 — full DB reset wiped all test data including this row. | Dev agent |
| Post-reset stale vendor row `David Butler / booth 123 / America's Antique Mall` (unlinked) from session 7 QA | 🟢 Low | Open — session 7. Keep for QA re-run or clean up pending scope-out outcome. | Dev agent |

---

## Agent Roster

| Agent | Status | Scope |
|---|---|---|
| **Dev agent** | ✅ Active | Codebase, architecture, sprint execution, bug triage, deployment |
| **Product agent** | ✅ Active (2026-04-17 session 6) | Backlog management, feature specs, sprint planning, scope decisions. Runs at session open per MASTER_PROMPT.md. |
| **Docs agent** | ✅ Active (2026-04-17 session 6) | Session close ritual, CLAUDE.md updates, Risk Register, decision log, Notion Roadmap sync. Activated when Notion drift from code was flagged. |
| **Security agent** | 🔲 Sprint 5 | RLS audit, API surface review, secrets hygiene, auth hardening. Activation trigger: recurring security-surface work (next: RLS for posts) |
| **Finance agent** | 🔲 Phase 2 | API cost tracking, booth revenue, burn rate, Zen Forged financials. Activation trigger: API costs become non-trivial or booth revenue begins. |
| **Brand agent** | 🔲 Phase 2 | Tone review, copy consistency, launch messaging, design system governance. Activation trigger: pre-launch / launch messaging work. |

**Docs agent — draft system prompt:**
> You are the Docs agent for the Kentucky Treehouse system. Your job is to maintain the memory of the system across sessions. At session close you: (1) update CLAUDE.md with what was done and what's next, (2) update the Risk Register in DECISION_GATE.md for any resolved or new risks, (3) append to decision-log.md if an architectural decision was made, (4) keep CONTEXT.md current if architecture changed, (5) append to the Sprint Log in the Notion Agent System Operating Manual. You are precise, brief, and always write in the past tense for completed work. You never invent status — only document what actually happened.

---

## Standup Agent Roster Check

Every session standup includes a one-line Agent Roster block confirming who is active for the session. This prevents silently dropping an activated agent from the loop.

**Standard standup preamble:**
> **Active agents:** Dev · Product · Docs — *(current as of 2026-04-17)*

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
| Sprint 4 | Beta-readiness — custom domain, OTP auth, `/admin` polish, `/vendor-request` magic moment | 🔄 In progress (T1 + T2 shipped 2026-04-17 session 6; T3 shipped 2026-04-17 session 7; **T4 blocked pending onboarding scope-out at next session open — session 7 surfaced the broader scope-ambiguity risk that T4 sits inside**) |
| Sprint 5 | Guest-user UX + onboarding polish — "Curator Sign In" rename, `/welcome` landing, PWA install prompts, vendor onboarding Loom | 🔲 Planned |
| Sprint 6+ | QR-code approval, Universal Links, native app eval, feed pagination, ToS/privacy, admin-cleanup tool | 🔲 Parked |

---

## How to Use This Document

**Every Claude session:** Read this before the opening standup. It replaces the need to re-explain the product vision, brand rules, or tech constraints in every conversation.

**Every agent:** Reference this as the operating constitution. When in doubt about whether to proceed, escalate to the appropriate gate level.

**Every sprint:** Update the Risk Register when risks are resolved or discovered. Update the Sprint Context table at sprint boundaries.

**David:** This is the document that prevents the system from optimizing for the wrong thing. If you ever feel like the work is drifting from the vision — this is where you come to re-anchor it.

---

## Related Documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Live session whiteboard — current issue, what was done, next steps |
| `CONTEXT.md` | Full architecture — schema, routes, data flow, design system |
| `.claude/MASTER_PROMPT.md` | Operator rulebook — session structure, phase gating, approval boundaries |
| `SPRINT_PLAN.md` | Sprint-level feature roadmap |
| `docs/decision-log.md` | Architectural decisions and their rationale *(create when first decision is logged)* |
| `docs/known-issues.md` | Active bugs, gaps, deferred items *(create when first issue is logged)* |

---
> This document is the operating constitution for the Treehouse system.
> It is maintained by the Dev agent and reviewed by David at each sprint boundary.
> Last updated: 2026-04-17 (session 7)
