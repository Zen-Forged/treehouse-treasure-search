// app/review-board/page.tsx
//
// Review Board — internal visual-system audit surface (session 150
// Shape S, frozen at session 149 close).
//
// Loads 8 production surfaces inside 375×812 iframes with ?reviewMode=1
// activated. Each iframe substitutes lib/fixtures.ts data for live
// Supabase reads + bypasses auth-gate page-level redirects. Read-only
// — interactions inside an iframe never persist to real shopper state.
//
// Categorized grid (Browse / Auth / Vendor / System). The System
// category is reserved for future surfaces (admin tooling, vendor
// flows) that don't fit Browse + Auth.
//
// Security posture: unlinked URL + obscure query flag (per frozen plan
// session 149 close). robots noindex below prevents Google from
// surfacing it. The flag itself never reads or writes real data; every
// reviewMode short-circuit is read-only.
//
// Layout: desktop-first. On narrower viewports the grid wraps to fewer
// tiles per row via grid-template-columns: repeat(auto-fit, minmax).
// Tile width is locked at the iPhone 13 / Safari mobile viewport so
// each preview matches the actual on-device frame shoppers experience.

import type { Metadata } from "next";
import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import NotesPanel             from "./NotesPanel";
import ExportButton, { type SurfaceMeta } from "./ExportButton";
import StickyAnchorNav        from "./StickyAnchorNav";
import StyleGuideFoundations  from "./StyleGuideFoundations";
import StyleGuideComponents   from "./StyleGuideComponents";

export const metadata: Metadata = {
  title:   "Review Board — Treehouse Finds",
  robots:  { index: false, follow: false },
};

interface ReviewTile {
  label:       string;
  description: string;
  path:        string;
}

interface Category {
  name:  string;
  hint:  string;
  tiles: ReviewTile[];
}

const CATEGORIES: Category[] = [
  {
    name: "Browse",
    hint: "Shopper-facing discovery surfaces",
    tiles: [
      { label: "Home",         description: "Discovery feed with mall scope",  path: "/" },
      { label: "Saved",        description: "♥ Save + ✓ Found per-mall stack", path: "/flagged" },
      { label: "Map",          description: "Mall map + peek-then-commit",     path: "/map" },
      { label: "Find detail",  description: "Cartographic + carousel",         path: "/find/fixture-post-1" },
      { label: "Booth",        description: "BoothHero + grid",                path: "/shelf/ellas-finds" },
    ],
  },
  {
    name: "Auth",
    hint: "Identity + sign-in chrome",
    tiles: [
      { label: "Login",        description: "Email-entry triage",              path: "/login" },
      { label: "Profile",      description: "Authed shopper destination",      path: "/me" },
    ],
  },
  {
    name: "Vendor",
    hint: "Vendor flow surfaces",
    tiles: [
      { label: "My Shelf",     description: "Vendor's own inventory + edit",   path: "/my-shelf" },
      { label: "Setup",        description: "Vendor onboarding success state", path: "/setup" },
      { label: "Vendor request", description: "Request booth form",            path: "/vendor-request" },
      { label: "Post tag",     description: "Tag photo capture",               path: "/post/tag" },
      { label: "Post preview", description: "Draft preview + publish",         path: "/post/preview" },
      { label: "Post edit",    description: "Edit existing find",              path: "/post/edit/fixture-post-1" },
    ],
  },
  {
    name: "System",
    hint: "Auth-bridge + first-run disambiguation",
    tiles: [
      { label: "Welcome",      description: "First-sign-in role disambiguation", path: "/welcome" },
      { label: "Handle pick",  description: "Shopper claim — handle form",       path: "/login/email/handle" },
    ],
  },
];

const TILE_WIDTH  = 375;
const TILE_HEIGHT = 812;

function buildSrc(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}reviewMode=1`;
}

// Flatten categorized tile config into the SurfaceMeta list ExportButton
// uses to order findings in the markdown dump.
function flatten(): SurfaceMeta[] {
  return CATEGORIES.flatMap((cat) =>
    cat.tiles.map((t) => ({ path: t.path, label: t.label, category: cat.name })),
  );
}

export default function ReviewBoardPage() {
  return (
    <div
      data-review-board
      style={{
        minHeight:  "100vh",
        background: v2.bg.main,
        padding:    "40px 24px 80px",
        fontFamily: FONT_INTER,
        color:      v2.text.primary,
      }}
    >
      <header style={{ maxWidth: 1600, margin: "0 auto 40px" }}>
        <h1
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize:   40,
            fontWeight: 500,
            margin:     0,
            color:      v2.text.primary,
            letterSpacing: "-0.01em",
          }}
        >
          Review Board
        </h1>
        <p
          style={{
            fontSize:  14,
            lineHeight: 1.5,
            color:     v2.text.secondary,
            margin:    "10px 0 0",
            maxWidth:  720,
          }}
        >
          Style Guide above; surfaces below. Foundations + Components
          render against live token imports + real component code so the
          reference + the visual state share one source of truth. Each
          surface tile renders inside a 375×812 iframe with{" "}
          <code style={{ fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
            ?reviewMode=1
          </code>{" "}
          activated — reads short-circuit to{" "}
          <code style={{ fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
            lib/fixtures.ts
          </code>
          ; auth gates skip; toggles never persist. Per-tile findings panel
          captures observations + suggested changes; the export button below
          dumps everything as a markdown block ready to paste into chat.
        </p>
        <ExportButton surfaces={flatten()} />
      </header>

      <StickyAnchorNav
        sections={[
          { id: "foundations", label: "Foundations" },
          { id: "components",  label: "Components"  },
          { id: "surfaces",    label: "Surfaces ↓"  },
        ]}
      />

      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <StyleGuideFoundations />
        <StyleGuideComponents />
      </div>

      <div id="surfaces" style={{ maxWidth: 1600, margin: "64px auto 0", scrollMarginTop: 96 }}>
        <h2
          style={{
            fontFamily:    FONT_CORMORANT,
            fontSize:      32,
            fontWeight:    500,
            color:         v2.text.primary,
            margin:        "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Surfaces
        </h2>
        <p
          style={{
            fontFamily: FONT_INTER,
            fontSize:   14,
            color:      v2.text.secondary,
            margin:     "0 0 32px",
            lineHeight: 1.5,
            maxWidth:   720,
          }}
        >
          Production surfaces in 375×812 iframes. Tap any{" "}
          <code style={{ fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>Open ↗</code>{" "}
          to launch the surface full-screen.
        </p>
        {CATEGORIES.map((cat) => (
          <section key={cat.name} style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: FONT_CORMORANT,
                fontSize:   24,
                fontWeight: 500,
                margin:     "0 0 4px",
                color:      v2.text.primary,
              }}
            >
              {cat.name}
            </h2>
            <p
              style={{
                fontSize:       11,
                color:          v2.text.muted,
                margin:         "0 0 24px",
                letterSpacing:  "0.08em",
                textTransform:  "uppercase",
              }}
            >
              {cat.hint}
            </p>

            {cat.tiles.length === 0 ? (
              <p
                style={{
                  fontSize:   14,
                  color:      v2.text.muted,
                  fontStyle:  "italic",
                  margin:     "8px 0 0",
                }}
              >
                Reserved for future surfaces.
              </p>
            ) : (
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: `repeat(auto-fit, minmax(${TILE_WIDTH}px, max-content))`,
                  gap:                 32,
                }}
              >
                {cat.tiles.map((tile) => (
                  <ReviewTileFrame key={tile.path} tile={tile} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function ReviewTileFrame({ tile }: { tile: ReviewTile }) {
  const src = buildSrc(tile.path);
  return (
    <div style={{ width: TILE_WIDTH }}>
      <div
        style={{
          display:        "flex",
          alignItems:     "baseline",
          justifyContent: "space-between",
          gap:            12,
          marginBottom:   12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontSize:   20,
              fontWeight: 500,
              color:      v2.text.primary,
              lineHeight: 1.2,
            }}
          >
            {tile.label}
          </div>
          <div
            style={{
              fontSize: 12,
              color:    v2.text.muted,
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {tile.description}
          </div>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize:       11,
            color:          v2.accent.green,
            textDecoration: "none",
            whiteSpace:     "nowrap",
            letterSpacing:  "0.08em",
            textTransform:  "uppercase",
            flexShrink:     0,
          }}
        >
          Open&nbsp;↗
        </a>
      </div>

      <iframe
        src={src}
        title={tile.label}
        width={TILE_WIDTH}
        height={TILE_HEIGHT}
        loading="lazy"
        style={{
          border:       `1px solid ${v2.border.light}`,
          borderRadius: 16,
          background:   v2.surface.warm,
          boxShadow:    "0 4px 16px rgba(30, 20, 10, 0.08)",
          display:      "block",
        }}
      />

      <div
        style={{
          marginTop:  10,
          fontSize:   11,
          color:      v2.text.muted,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          wordBreak:  "break-all",
        }}
      >
        {tile.path}
      </div>

      <NotesPanel surfacePath={tile.path} />
    </div>
  );
}
