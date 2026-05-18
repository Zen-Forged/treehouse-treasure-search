// scripts/generate-cream-mapbox-style.ts
// One-shot generator that produces a Mapbox Studio-uploadable style JSON
// matching the warm-cream cartographic palette currently applied at runtime
// in components/TreehouseMap.tsx (applyCartographicPalette).
//
// Why this exists: Mapbox Studio v3's "New style" dialog only exposes the
// Standard style + scratch + upload (Light template was dropped). The
// upload path requires a complete Mapbox Style Spec JSON. This script
// fetches mapbox/light-v11 via the Styles API, walks every layer applying
// the same per-id logic as the runtime helper, and writes a fully-baked
// style ready for Studio upload.
//
// Once David uploads + publishes + returns the style ID, the static-image
// composer (lib/mapStaticImage.ts) and the live map (components/TreehouseMap.tsx)
// both swap to the custom style URL, and applyCartographicPalette + the
// CSS var bridge retire as ~110 LOC dead-code byproduct.
//
// Usage:
//   npx tsx scripts/generate-cream-mapbox-style.ts
//
// Output: scripts/treehouse-cream-style.v1.json (committed for reproducibility)

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── env loader (matches scripts/add-mall.ts) ────────────────────────────────

const ENV_FILE = ".env.local";

function loadEnv(): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), ENV_FILE),
    `/Users/davidbutler/Projects/treehouse-treasure-search/${ENV_FILE}`,
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[t.slice(0, i).trim()] = v;
    }
    return out;
  }
  throw new Error(`No env file found at: ${candidates.join(" or ")}`);
}

// ── palette (mirrors :root --th-v1-basemap-* literals in app/globals.css) ──

const PALETTE = {
  cream:  "#E6DECF",
  cream2: "#E6D9B8",
  water:  "#C5D6C4",
  water2: "#AAC3AA",
  park:   "#D3DCC4",
  label:  "rgba(42,26,10,0.55)",
  road:   "#FFFFFF",
  admin:  "rgba(42,26,10,0.20)",
  halo:   "rgba(245,242,235,0.85)",
} as const;

// ── style fetch ─────────────────────────────────────────────────────────────

interface MapboxLayer {
  id: string;
  type: string;
  source?: string;
  "source-layer"?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
  metadata?: Record<string, unknown>;
}

interface MapboxStyle {
  version: number;
  name?: string;
  metadata?: Record<string, unknown>;
  sources: Record<string, unknown>;
  sprite?: string;
  glyphs?: string;
  layers: MapboxLayer[];
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  light?: Record<string, unknown>;
  terrain?: Record<string, unknown>;
  fog?: Record<string, unknown>;
  projection?: Record<string, unknown>;
  // Server-managed fields (stripped before write):
  id?: string;
  created?: string;
  modified?: string;
  owner?: string;
  visibility?: string;
  protected?: boolean;
  draft?: boolean;
}

async function fetchLightStyle(token: string): Promise<MapboxStyle> {
  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mapbox API ${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as MapboxStyle;
}

// ── per-layer paint rewrite (mirrors applyCartographicPalette 1:1) ─────────
//
// Counters track which branches fired so the run summary can confirm we
// touched every category the runtime helper touches.
interface RewriteCounts {
  background: number;
  land: number;
  park: number;
  water: number;
  landcover: number;
  hillshade: number;
  waterway: number;
  road: number;
  admin: number;
  label: number;
}

function rewriteLayers(style: MapboxStyle): RewriteCounts {
  const counts: RewriteCounts = {
    background: 0, land: 0, park: 0, water: 0, landcover: 0, hillshade: 0,
    waterway: 0, road: 0, admin: 0, label: 0,
  };

  for (const layer of style.layers) {
    const id = layer.id;
    const paint = (layer.paint ??= {});

    // Background fill = cream landmass.
    if (layer.type === "background") {
      paint["background-color"] = PALETTE.cream;
      counts.background++;
      continue;
    }

    // Land + landcover + landuse + park fills.
    if (layer.type === "fill") {
      if (id === "land") {
        paint["fill-color"] = PALETTE.cream;
        counts.land++;
      } else if (
        id.includes("national-park") ||
        id.includes("park") ||
        id.includes("pitch") ||
        id.includes("golf")
      ) {
        paint["fill-color"] = PALETTE.park;
        paint["fill-opacity"] = 0.7;
        counts.park++;
      } else if (
        id === "water" ||
        id === "water-shadow" ||
        id.startsWith("water-")
      ) {
        paint["fill-color"] = PALETTE.water;
        counts.water++;
      } else if (id.includes("landcover") || id.includes("landuse")) {
        paint["fill-color"] = PALETTE.cream2;
        paint["fill-opacity"] = 0.55;
        counts.landcover++;
      } else if (id.includes("hillshade")) {
        paint["fill-opacity"] = 0.15;
        counts.hillshade++;
      }
      continue;
    }

    // Waterways (rivers, streams).
    if (
      layer.type === "line" &&
      (id === "waterway" || id.startsWith("waterway-"))
    ) {
      paint["line-color"] = PALETTE.water2;
      counts.waterway++;
      continue;
    }

    // Roads — collapse multi-tier hierarchy to plain white.
    if (
      layer.type === "line" &&
      (id.startsWith("road-") || id.startsWith("bridge-") || id.startsWith("tunnel-"))
    ) {
      paint["line-color"] = PALETTE.road;
      counts.road++;
      continue;
    }

    // Admin boundaries.
    if (layer.type === "line" && id.startsWith("admin-")) {
      paint["line-color"] = PALETTE.admin;
      counts.admin++;
      continue;
    }

    // Labels — cartographic ink + paper-cream halo.
    if (layer.type === "symbol") {
      paint["text-color"] = PALETTE.label;
      paint["text-halo-color"] = PALETTE.halo;
      paint["text-halo-width"] = 1.2;
      counts.label++;
      continue;
    }
  }

  return counts;
}

// ── strip server-managed fields ─────────────────────────────────────────────
// Studio's upload endpoint expects a fresh style payload — server-assigned
// fields like `id`, `created`, `owner` are rejected or cause confusion.

function stripServerFields(style: MapboxStyle): MapboxStyle {
  const {
    id: _id,
    created: _created,
    modified: _modified,
    owner: _owner,
    visibility: _visibility,
    protected: _protected,
    draft: _draft,
    ...rest
  } = style;
  return rest;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const env = loadEnv();
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN missing from .env.local");
  }

  console.log("Fetching mapbox/light-v11 style JSON…");
  const source = await fetchLightStyle(token);
  console.log(`  → ${source.layers.length} layers loaded`);

  console.log("Rewriting layer paint properties to cream cartography…");
  const counts = rewriteLayers(source);

  const stripped = stripServerFields(source);
  stripped.name = "Treehouse Cream v1";

  const outPath = resolve(process.cwd(), "scripts/treehouse-cream-style.v1.json");
  writeFileSync(outPath, JSON.stringify(stripped, null, 2));

  console.log("\n── Rewrite summary ──");
  console.log(`  background : ${counts.background}`);
  console.log(`  land       : ${counts.land}`);
  console.log(`  park       : ${counts.park}`);
  console.log(`  water      : ${counts.water}`);
  console.log(`  landcover  : ${counts.landcover}`);
  console.log(`  hillshade  : ${counts.hillshade}`);
  console.log(`  waterway   : ${counts.waterway}`);
  console.log(`  road       : ${counts.road}`);
  console.log(`  admin      : ${counts.admin}`);
  console.log(`  label      : ${counts.label}`);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`  TOTAL      : ${total} layers mutated\n`);

  console.log(`✓ Wrote: ${outPath}`);
  console.log("\nNext steps:");
  console.log("  1. Mapbox Studio → New style → Upload → choose the JSON above");
  console.log("  2. Name it 'Treehouse Cream' (or anything you prefer)");
  console.log("  3. Publish → Share & develop → copy Style URL");
  console.log("  4. Paste back everything after 'styles/' (e.g. davidbutler80020/clxxxx)");
}

main().catch((err) => {
  console.error("ERROR:", err.message ?? err);
  process.exit(1);
});
