# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

---

## [v0.167.0] — 2026-05-16

### Versioning infrastructure — Shape A (annotated tags + CHANGELOG)

Mid-session David asked "how do I start controlling versioning better." Cost-shape triage surfaced 4 shapes (A tags+CHANGELOG / B + GitHub Releases / C + Vercel promotion gate / D + visual regression). David picked Shape A — lightest, fits pre-beta iteration cadence, composes cleanly with heavier shapes later. Sub-decision on naming scheme: session-aligned `v0.{session}.{patch}` so versions map directly to CLAUDE.md session blocks.

The original session-167 chrome-unification ship (BG.png hero + new wordmark + chip-overlay refinement) was archived to [`archive/chrome-unification-v1`](https://github.com/Zen-Forged/treehouse-treasure-search/tree/archive/chrome-unification-v1) per David's call — too many unknowns surfaced during the design pass; iterate from production baseline going forward. This release ships **only the versioning discipline**, not the chrome change.

#### Added
- **`CHANGELOG.md`** at repo root — this file. Each future entry will be prepended at session close per the updated protocol.
- **`package.json`** `"version"` field bumped `0.1.0` (Next.js scaffold default) → `0.167.0` aligning to session number.
- **`.claude/commands/session-close.md`** updated with new **step 4 (Versioning)** before the Git step + a **post-merge tagging step** in the Git block. At every future session close it now: bumps `package.json`, prepends a CHANGELOG.md entry, includes both in the close commit, then after the squash-merge fires `git tag -a v0.{session}.0 <merge-sha>` + pushes the tag.

#### What this unlocks
- **Named references** — "v0.167" instead of commit SHAs in design conversations + investor updates
- **Rollback targets** — `git checkout v0.X.0` restores any past production state; `git diff v0.X.0..v0.Y.0` shows what changed between any two releases
- **Public timeline** — CHANGELOG.md is a public artifact suitable for investor updates, beta sign-up pages, or just remembering "what shipped when"
- **Hotfix lane** — same-day fix after a session ship goes as `v0.{session}.1`, `v0.{session}.2`, etc., without colliding with the next session's `v0.{session+1}.0`

#### Pre-v0.167.0 history
Sessions 1-166 ran without formal version tags. Detailed narrative lives in [CLAUDE.md](CLAUDE.md) session blocks + [`docs/session-archive.md`](docs/session-archive.md). PRs #1-#46 on [Zen-Forged/treehouse-treasure-search](https://github.com/Zen-Forged/treehouse-treasure-search/pulls?q=is%3Apr+is%3Aclosed) carry per-session squash commits to `main`. Backfilling 166 retroactive tags was deliberately skipped — would inflate the timeline without adding rollback value (each commit SHA on main is already accessible via PR history).

[v0.167.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.0
