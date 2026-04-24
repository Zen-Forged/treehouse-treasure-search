# Treehouse Finds — Beta Rollout Plan

> Thin plan (Ladder B session 53, 2026-04-24 — docs/ladder-b-design.md D4(a)). Deliberately scoped for N=1→5 vendors. When the first complaint of "I can't tell where we are in the rollout" surfaces, promote this to a thicker version with vendor vetting + support protocols + incident playbooks.

---

## What "beta" means here

A **private beta** with real vendors using the live production domain (app.kentuckytreehouse.com), production Supabase, production Resend. No fake data, no sandboxed stub environment. The thing we're de-risking is whether the end-to-end product flow holds up when the people using it aren't the founder.

**In scope for beta:**
- Vendor onboarding end-to-end: `/vendor-request` → receipt email → admin approval → approval email → `/login` OTP → `/my-shelf`
- Post workflow: upload photo → `/post` compose → feature in Window → share Window via email
- Shopper flow: Home feed → save to Your Finds → Find Detail → Booth page → Window share to other shoppers (Q-008)
- Admin: approve/reject vendor requests; manage featured banners; delete bad data via `/admin` or `/shelves`

**Out of scope for beta:**
- ToS / privacy policy (Sprint 6+)
- Native app distribution — PWA install only
- Payments / commerce
- Marketing site, SEO, acquisition funnel
- Multi-mall vendor support at scale (N=1–2 works; N=10+ untested)
- Feedback form inside the app — direct channel only (§Feedback loop below)

---

## Rollout cadence

| Phase | Target | Vendor count | Gate to next phase |
|-------|--------|--------------|--------------------|
| **V0** — internal | Session 54–55 | 0 (admin + test booths only) | Staging env lives; feed seeding script works end-to-end |
| **V1** — first real vendor | TBD (session 55+) | 1 | No rollback-criterion fires within 7 days of V1 invite |
| **V2** — early cohort | V1 + 1–2 weeks | 2–3 total | No rollback-criterion fires within 7 days of V2 expansion |
| **V3** — widen | V2 + 2–4 weeks | up to 5 total | — |

**V1 vendor selection:** someone the founder knows well enough to text directly if something breaks, and who is patient with pre-release software. Not someone we're trying to impress; someone who'll tolerate a bug report and wait 24 hours for a fix.

**Between phases:** at least one full week of live-traffic quiet before widening. A weekend doesn't count.

---

## Rollback criteria

Any of these firing pauses new invites immediately and triggers investigation. Severity escalates by category.

### 🔴 Halt + revert to previous deploy
- Any vendor's posts, booth assignments, or mall association disappear or get reassigned incorrectly
- Any signed-in user sees a blank feed (RLS regression — cf. session 48 featured-banner incident)
- The admin can't approve a pending `vendor_request` (session 47-class gap)
- OTP sign-in fails for any vendor who was previously able to sign in

### 🟡 Halt invites, investigate before next deploy
- Onboarding flow breaks at any step: `/vendor-request` form submit, receipt email not delivered, approval email not delivered, OTP email not delivered, `/setup` linkage 404
- Window email fails to render in >1 major client (Gmail web, iOS Gmail, iOS Mail, Apple Mail — re-verify against [share-booth-qa-walk.md](share-booth-qa-walk.md))
- Home → Find Detail → Save → Your Finds roundtrip breaks for any user
- Featured banner reads fail (session 48-class RLS drift)

### 🟢 Log + fix in next deploy, don't halt
- Cosmetic issues (layout, typography, microcopy)
- Mobile-only / specific-browser quirks that have obvious workarounds
- Non-blocking warnings in the browser console

**Rollback mechanic:** Vercel dashboard → production deployment list → promote the prior known-good deployment. No force-push to `main`. The offending commit stays in git history; the production deploy reverts only. Follow-up PR fixes forward from `main`.

---

## Feedback loop

**Primary channel:** direct text/email to David. At N=1–5 this is not a bottleneck; at N=10+ it will be, and §3 of this doc gets a promotion then.

**Expected issues by category:**
- **Bug** — texted to David → logged in `docs/known-issues.md` → triaged into the next session
- **Confusion / UX friction** — logged in `docs/known-issues.md` under a "🟡 Beta UX feedback" section → batched for Sprint 5+ design pass
- **Feature request** — acknowledged, deferred to Sprint 6+ backlog (resist scope creep during beta)

**Cadence:**
- V1: weekly 10-minute text check-in ("anything surprising this week?")
- V2: same, extended to all active vendors
- V3: every-other-week

**Tally.so feedback form:** deferred per CLAUDE.md pre-beta polish list. Add once N≥3 and the direct channel starts to fragment.

---

## What happens at session 54

Session 54 is the HITL half of Ladder B. See [ladder-b-design.md](ladder-b-design.md) §Task list. At the end of session 54 the `staging` branch auto-deploys to a staging URL backed by a dedicated Supabase project, the seed script can populate it with fixtures, and V0 of this plan is live.

---

## Amending this doc

Beta-plan changes ship in the same PR that causes them. If rollback criteria change because a new failure mode emerges, the doc updates in the same commit that introduces the guard. Don't split design docs from the code that enforces them.
