# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

---

## [v0.167.0] — 2026-05-15

### Chrome unification — universal hero-photo masthead strip

David articulated the larger structural vision at session 166 close: non-Explore pages adopt StickyMasthead WITH the hero photo as background. This session shipped the architecture end-to-end.

#### Added
- **`lib/chromeTokens.ts`** — shared geometry constants for the chrome stack (`MASTHEAD_HEIGHT`, `LOGO_TOP`, `CHIP_TOP`, `STRIP_Z`, `CHIP_Z`, `stripBackgroundImage()` helper). Single source of truth replacing ad-hoc inline calcs that drifted across sessions 154-166.
- **`public/BG.png`** (475×268 reference, wordmark-less vintage flatlay — higher-res asset coming).
- **`public/treehouse_transparent.png`** (815×399 RGBA — new wordmark, same visual family as `wordmark.png` with refined leaf glyph + transparent bg for photographic layering).
- **`docs/chrome-unification-design.md`** — design record with locked decisions D1-D15.
- **`docs/mockups/chrome-unification-v1.html` + `v2.html`** — V1 (first interpretation) + V2 (canonical record with chip-overlay refinement per David's "scroll over the top of the bottom portion of the hero image to trim the bottom of the photo").
- **Sibling sticky logo on Home** — `treehouse_transparent.png` overlays the hero photo at hero center at rest; sticky-pins at masthead vertical center on scroll. Lives at TabsChrome level (not inside HomeHero) so CSS sticky extends beyond hero bounds.

#### Changed
- **`StickyMasthead`** — chrome aesthetic swaps from solid `v2.bg.main` cream to `BG.png` cropped to strip height + cream-fade gradient. Default wordmark swaps `wordmark.png` → `treehouse_transparent.png`. `MASTHEAD_HEIGHT` bumps from `safe-area+84` to `safe-area+116`. Adaptive logo width (`LOGO_WIDTH_DEFAULT_PX` 150 when slots empty, `LOGO_WIDTH_WITH_SLOTS_PX` 130 when filled). Inherits across all 7 consumers (/find, /shelf, /me, /my-shelf, /post/tag, /vendor-request, /contact).
- **`HomeHero`** — rewrite. Drops embedded SearchBar (per D14). Drops baked-wordmark assumption. Hero asset `home-hero.png` → `BG.png`. Sticky-stop math migrated to `MASTHEAD_HEIGHT` constant. File LOC reduced ~120 → ~50.
- **`MallPickerChip`** — sticky-top changes from `STICKY_THIN_HEIGHT` (masthead bottom) to `CHIP_TOP` (30px above masthead bottom). z-index bumped 11 → `CHIP_Z` (38) — chip now sits ABOVE hero strip, visually trimming the photo by occluding bottom 30px. Adds upward `box-shadow: 0 -2px 8px` per D15 — shadow casts UP onto photo it's covering.
- **`MallMapDrawer`** — drawer-top recalc from `STICKY_THIN_HEIGHT + CHIP_VISIBLE_HEIGHT_PX` to `CHIP_TOP + CHIP_VISIBLE_HEIGHT_PX`. Same numeric end-position, but reference shifts to chrome-unification chip-top.
- **`TabsChrome`** — Saved now mounts `<StickyMasthead fadeTarget={v2.bg.tabs} />` (was nothing post session-166 chrome retirement). Home keeps `<HomeHero />` + adds sibling sticky logo. Search props dropped from HomeHero call. Auto-scroll-on-drawer-open recalc for new MASTHEAD_HEIGHT.
- **`app/login/page.tsx`** — direct wordmark img swap `/wordmark.png` → `/treehouse_transparent.png`.

#### Removed
- **`app/home-hero-test/`** — smoke route from session 164/166 tested OLD HomeHero contract (`searchQuery`/`onSearchChange`/wordmark-baked). Mission complete; new chrome is system-wide change validated via production iPhone QA.
- **Embedded SearchBar in HomeHero** — D14 retirement. R16 query plumbing preserved at TabsChrome layer (`?q=` URL param + MallMatchChip in drawer); UI input gone for now. Easy follow-on commit relocates if iPhone QA flags.
- **`docs/mockups/home-wordmark-lock-v1.html`** + **`public/treehouse.png`** — aborted V1 mockup ("too many variables") + redundant cream-bg wordmark variant. Never tracked in git history; retired before this session's first commit.

#### Versioning infrastructure
- **`CHANGELOG.md`** (this file) created — first formal release tracking.
- **`package.json`** version bumped `0.1.0` → `0.167.0` aligning to session number.
- **`.claude/commands/session-close.md`** updated to wire CHANGELOG entry generation + annotated git tag creation into the close protocol.

#### iPhone QA watch-items (post-Vercel-preview ship)
- iOS Safari sticky-overlap z-index reliability (3 sticky elements converge — hero z=30, chip z=38, logo z=42; watch for chip "above" status flickering during fast scroll)
- Icon-bubble contrast on photographic masthead (back/share/flag bubbles use `v1.iconBubble` which may disappear on dark photo bg; surface-by-surface call after walk)
- Status-bar text color (currently dark; with hero photo bg masthead may need to flip to light)
- BG.png resolution (475×268 reference-only; higher-res asset coming from David)
- SearchBar removal — if you reach for search and it's not there, follow-on commit relocates to page-body or dedicated affordance
- Logo `LOGO_HEIGHT_PX_HALF = 36.5` is hardcoded for `LOGO_WIDTH_DEFAULT_PX=150` + `815/399` aspect; if width changes, recompute

[v0.167.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.0

---

> **Pre-v0.167.0 history:** Sessions 1-166 ran without formal version tags. Detailed narrative for each session lives in [CLAUDE.md](CLAUDE.md)'s session blocks + [`docs/session-archive.md`](docs/session-archive.md) (rotated tombstones). PRs #1-#46 on [Zen-Forged/treehouse-treasure-search](https://github.com/Zen-Forged/treehouse-treasure-search/pulls?q=is%3Apr+is%3Aclosed) carry per-session squash commits to `main`.
