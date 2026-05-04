// components/TreehouseMap.tsx
// R10 (session 108) Arc 3 — Mapbox custom-styled map for /map page.
//
// This commit (1/4 in Arc 3) ships only the shell: mapbox-gl loads, the
// map renders against KY-bounded view with the default Mapbox light style,
// and pan/zoom are constrained so the user can't scroll out of the state.
// Cartographic warm-cream palette per D25 lands in commit 2; leaf-bubble
// pins per D24 land in commit 3; peek-then-commit interaction per D26
// lands in commit 4.
//
// Browser-only — mapbox-gl touches WebGL + window, so the whole module is
// "use client" and the map is initialized in useEffect after mount. The
// CSS import is co-located here so callers don't need to remember to
// import it separately.
//
// Token: NEXT_PUBLIC_MAPBOX_TOKEN (plumbed in .env.local + Vercel env per
// session 107). URL-restricted to app.kentuckytreehouse.com + localhost.

"use client";

import * as React from "react";
import mapboxgl, { type LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { v1 } from "@/lib/tokens";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// D25 cartographic warm-cream palette. Walks the loaded light-v11 style
// layers and overrides paint properties to swap Mapbox's grayscale defaults
// for our v1.basemap.* tokens. Italic-Lora label font is deferred — custom
// font upload requires Mapbox Studio per the design record memo. For now
// we color labels in v1.basemap.label and let them fall back to Mapbox's
// default sans face. When David moves to a Studio-hosted style URL, this
// helper retires (style URL provides the palette + labels native).
function applyCartographicPalette(map: mapboxgl.Map): void {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;
    try {
      // Background fill = cream landmass.
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", v1.basemap.cream);
        continue;
      }

      // Land + landcover + landuse fills. Parks get the green park token,
      // everything else gets cream2 (slightly warmer landcover).
      if (layer.type === "fill") {
        if (id === "land") {
          map.setPaintProperty(id, "fill-color", v1.basemap.cream);
        } else if (
          id.includes("national-park") ||
          id.includes("park") ||
          id.includes("pitch") ||
          id.includes("golf")
        ) {
          map.setPaintProperty(id, "fill-color", v1.basemap.park);
          map.setPaintProperty(id, "fill-opacity", 0.7);
        } else if (
          id === "water" ||
          id === "water-shadow" ||
          id.startsWith("water-")
        ) {
          map.setPaintProperty(id, "fill-color", v1.basemap.water);
        } else if (id.includes("landcover") || id.includes("landuse")) {
          map.setPaintProperty(id, "fill-color", v1.basemap.cream2);
          map.setPaintProperty(id, "fill-opacity", 0.55);
        } else if (id.includes("hillshade")) {
          // Soften terrain shading so it doesn't overwhelm the cream.
          map.setPaintProperty(id, "fill-opacity", 0.15);
        }
        continue;
      }

      // Waterways (rivers, streams) — line layer in deeper sage.
      if (layer.type === "line" && (id === "waterway" || id.startsWith("waterway-"))) {
        map.setPaintProperty(id, "line-color", v1.basemap.water2);
        continue;
      }

      // Roads — collapse the multi-tier hierarchy to plain white lines.
      if (
        layer.type === "line" &&
        (id.startsWith("road-") || id.startsWith("bridge-") || id.startsWith("tunnel-"))
      ) {
        map.setPaintProperty(id, "line-color", "#ffffff");
        continue;
      }

      // Admin boundaries (state, county) — soften with low-opacity ink.
      if (layer.type === "line" && id.startsWith("admin-")) {
        map.setPaintProperty(id, "line-color", "rgba(42,26,10,0.20)");
        continue;
      }

      // Labels (country, state, place, settlement, road) — paint in our
      // cartographic ink with a paper-cream halo so they read against
      // both cream landmass and sage water.
      if (layer.type === "symbol") {
        map.setPaintProperty(id, "text-color", v1.basemap.label);
        map.setPaintProperty(id, "text-halo-color", "rgba(245,242,235,0.85)");
        map.setPaintProperty(id, "text-halo-width", 1.2);
        continue;
      }
    } catch {
      // Layer doesn't have this paint property in the loaded style — skip.
    }
  }
}

// Kentucky bounding box — slight padding around the actual state extents
// so pins near the borders aren't clipped at maxBounds.
const KY_BOUNDS: LngLatBoundsLike = [
  [-89.8, 36.3], // SW (Mississippi River corner)
  [-81.9, 39.3], // NE (Ashland corner)
];

// Initial view — KY centroid + zoom that fits the state on a phone-width
// container. Tuned for a 430px max-width column with ~480px map height.
const KY_CENTER: [number, number] = [-85.3, 37.8];
const KY_FIT_ZOOM = 6.4;

interface TreehouseMapProps {
  className?: string;
  style?:     React.CSSProperties;
}

export default function TreehouseMap({ className, style }: TreehouseMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef       = React.useRef<mapboxgl.Map | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    if (!MAPBOX_TOKEN) {
      setError("Map unavailable — token missing.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container:    containerRef.current,
      style:        "mapbox://styles/mapbox/light-v11",
      center:       KY_CENTER,
      zoom:         KY_FIT_ZOOM,
      minZoom:      5.5,
      maxZoom:      14,
      maxBounds:    KY_BOUNDS,
      attributionControl: true,
      cooperativeGestures: false,
    });

    mapRef.current = map;

    // D25 — apply cartographic warm-cream palette once the base style has
    // loaded. style.load fires after Mapbox finishes parsing the style JSON
    // and the layer registry is queryable.
    map.on("style.load", () => applyCartographicPalette(map));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width:    "100%",
        height:   "100%",
        position: "relative",
        ...style,
      }}
    >
      {error && (
        <div
          style={{
            position:   "absolute",
            inset:      0,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:    24,
            textAlign:  "center",
            color:      "#6b5538",
            fontStyle:  "italic",
            fontFamily: "Georgia, serif",
            fontSize:   14,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
