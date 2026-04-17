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

**When to flag:** If a requested feature or copy change would make Treehouse feel more like eBay, Etsy, or Facebook Marketplace — stop and discuss before building.

---

## The Business Rules

| Rule | Detail |
|---|---|
| API costs are real | Anthropic + SerpAPI are pay-per-use. Rate limiting on `/api/post-caption` is required before beta. |
| Vendor data is sacred | Vendors trust us with their booth identity. Never expose, delete, or corrupt vendor records. |
| One mall in production | America's Antique Mall (`19a8ff7e-...`) is the only live mall. Changes affecting all malls affect this one. |
| Vercel is the deployment | No other deployment targets. Never bypass Vercel CI/CD without explicit reason. |
| Zen Forged LLC is the operator | David Butler / ZenForged Finds, Booth 369 is both operator and first vendor. Conflicts of interest between "owner" and "user" views should be flagged. |
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
                                   via Resend + Supabase custom SMTP (pending completion as of
                                   2026-04-16). DNS authority in migration from Google Cloud DNS →
                                   Cloudflare. DNSSEC must remain off until migration complete to
                                   avoid a hard-fail on nameserver swap. See CLAUDE.md DNS STATE
                                   section for current nameserver + zone state.
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
| Feature that contradicts the product vision | e.g., adding a "Buy Now" button, price in feed grid, urgency badge |
| Deployment config change (vercel.json, next.config.js) | Can break production silently |
| New external service integration | Cost, privacy, and dependency implications |
| DNS changes during nameserver migration window | Splitting DNS across two authoritative sources causes inconsistent resolution. Do not edit records in either zone until migration is verified via `dig NS +short`. |

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

> Updated: 2026-04-17 | Source: Yahoo magic link delivery end-to-end verified

| Risk | Severity | Status | Owner |
|---|---|---|---|
| RLS disabled on `malls`, `vendors`, `posts` | 🔴 High | ✅ Resolved 2026-04-15 — 12 policies live, stale policies cleaned up (003_cleanup_old_rls_policies.sql) | Dev agent |
| No rate limiting on `/api/post-caption` | 🔴 High | ✅ Resolved 2026-04-15 — in-memory 10 req/60s per IP; upgrade to Upstash Redis at scale | Dev agent |
| Vendor approval + setup flows silently blocked by RLS | 🔴 High | ✅ Resolved 2026-04-16 — moved admin reads/writes of `vendor_requests` to `/api/admin/vendor-requests` and `/api/setup/lookup-vendor` using service role; browser anon client is read-only for ecosystem data | Dev agent |
| `/api/admin/*` routes had no server-side auth check | 🔴 High | ✅ Resolved 2026-04-16 — added `requireAdmin()` (bearer token + email match) to `/api/admin/posts` and `/api/admin/vendor-requests`; UI was the only gate before, routes were directly reachable | Dev agent |
| Magic link delivery broken for Yahoo/AOL (pre-beta blocker) | 🔴 High | ✅ Resolved 2026-04-17 — Path pivoted from Cloudflare migration to adding 3 Resend records directly in Shopify DNS (discovery: Shopify was already authoritative for the domain, not Google Cloud DNS as session 3 assumed). Resend verified the domain; Resend→Supabase native SMTP integration configured; end-to-end magic link test passed for `dbutlerproductions@yahoo.com` — email delivered (junk folder on first send, acceptable), magic link click authenticated, `/setup` linking completed, `/my-shelf` rendered correct vendor. Sender identity: `Kentucky Treehouse <hello@kentuckytreehouse.com>`. | Dev agent |
| No error monitoring (Sentry / structured logs) | 🟡 Medium | Open — Sprint 3 | Dev agent |
| Bookmarks localStorage-only (ITP wipe risk) | 🟡 Medium | Open — Sprint 4 | Dev agent |
| No automated testing | 🟡 Medium | Open — Strategy needed | Dev + Product agents |
| Admin PIN not QA'd in production | 🟡 Medium | Open — quick curl test | Dev agent |
| Public Storage bucket (`post-images`) | 🟡 Medium | Intentional — monitor | Dev agent |
| No terms of service / privacy policy | 🟡 Medium | Open — before public launch | David |
| Deprecated lib functions still in `lib/posts.ts` | 🟢 Low | Open — `getVendorByEmail`, `linkVendorToUser`, `getVendorRequests`, `createVendorFromRequest`, `markVendorRequestApproved` marked `@deprecated` 2026-04-16; remove once confirmed no other callers import them | Dev agent |
| `emailRedirectTo` hardcoded in `lib/auth.ts` — loses `/setup` redirect across magic-link round trip | 🟡 Medium | Open — surfaced 2026-04-17. Workaround: manual navigation to `/setup` post-auth (the lookup route short-circuits on already-linked). Fix: accept optional `redirectTo` param in `sendMagicLink()` and pass through from `/login`. ~5-line change. | Dev agent |
| Magic link emails landing in Yahoo junk folder on first send | 🟡 Medium | Accepted — expected for any new sending domain. Resolution: passive reputation seasoning as real usage grows + users marking "not junk". Branded email template (Sprint 3 item) will help marginally. | Dev agent |
| DNS archaeology assumption from session 3 was wrong (Google Cloud DNS) | 🟢 Low | ✅ Resolved 2026-04-17 — Shopify is actual DNS authority, Squarespace is registrar (inherited from Google Domains acquisition). Documented in CLAUDE.md DNS STATE. | Dev agent |
| Orphaned Cloudflare DNS zone for `kentuckytreehouse.com` | 🟢 Low | Open — inverted from session 3's framing. Cloudflare has nameservers assigned but is dormant (Shopify remains authoritative). No cost to keeping; delete at leisure. | Dev agent |
| Feed pagination missing (flat 80-post fetch) | 🟢 Low | Open — Sprint 4 | Dev agent |
| `/enhance-text` caption is mock (not real Claude call) | 🟢 Low | Open — future sprint | Dev agent |
| `/api/debug-vendor-requests` left in production | 🟢 Low | Open — useful for QA; remove in a later cleanup sprint | Dev agent |

---

## Agent Roster

| Agent | Status | Scope |
|---|---|---|
| **Dev agent** | ✅ Active | Codebase, architecture, sprint execution, bug triage, deployment |
| **Product agent** | 🔲 Sprint 3 | Backlog management, feature specs, sprint planning, scope decisions |
| **Security agent** | 🔲 Sprint 3 | RLS audit, API surface review, secrets hygiene, auth hardening |
| **Finance agent** | 🔲 Phase 2 | API cost tracking, booth revenue, burn rate, Zen Forged financials |
| **Brand agent** | 🔲 Phase 2 | Tone review, copy consistency, launch messaging, design system governance |
| **Docs agent** | 🔲 Phase 2 | Session close ritual, CLAUDE.md updates, risk register, decision log, Notion sprint summaries |

**Docs agent — draft system prompt:**
> You are the Docs agent for the Kentucky Treehouse system. Your job is to maintain the memory of the system across sessions. At session close you: (1) update CLAUDE.md with what was done and what's next, (2) update the Risk Register in DECISION_GATE.md for any resolved or new risks, (3) append to decision-log.md if an architectural decision was made, (4) keep CONTEXT.md current if architecture changed, (5) append to the Sprint Log in the Notion Agent System Operating Manual. You are precise, brief, and always write in the past tense for completed work. You never invent status — only document what actually happened.

---

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
| Sprint 3 | Vendor bio, Find Map overhaul, error monitoring, rate limiting | 🔄 In progress |
| Sprint 4 | RLS, testing, pagination, search, terms of service | 🔲 Planned |

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
> Last updated: 2026-04-17
