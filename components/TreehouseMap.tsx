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
import { createRoot, type Root } from "react-dom/client";
import mapboxgl, { type LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PiLeaf } from "react-icons/pi";
import { v1 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

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

// D24 — leaf-bubble pin. Paper-warm circle outlined green by default;
// selected = green fill, white glyph, scale +15%, soft halo. Pure
// presentation; rendered into a Mapbox marker element via createRoot.
function LeafBubblePin({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width:        selected ? 36 : 32,
        height:       selected ? 36 : 32,
        borderRadius: "50%",
        background:   selected ? v1.green : v1.paperWarm,
        border:       `2px solid ${v1.green}`,
        boxShadow:    selected
          ? "0 0 0 6px rgba(30,77,43,0.18), 0 4px 10px rgba(30,77,43,0.28)"
          : "0 2px 6px rgba(42,26,10,0.18)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        color:          selected ? v1.onGreen : v1.green,
        cursor:         "pointer",
        transition:     "width 160ms ease, height 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease",
      }}
    >
      <PiLeaf size={selected ? 20 : 18} aria-hidden="true" />
    </div>
  );
}

interface TreehouseMapProps {
  malls:           Mall[];
  selectedMallId:  string | null;
  className?:      string;
  style?:          React.CSSProperties;
}

interface MarkerEntry {
  marker:    mapboxgl.Marker;
  root:      Root;
  el:        HTMLDivElement;
}

export default function TreehouseMap({
  malls,
  selectedMallId,
  className,
  style,
}: TreehouseMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef       = React.useRef<mapboxgl.Map | null>(null);
  const markersRef   = React.useRef<Map<string, MarkerEntry>>(new Map());
  const styleLoadedRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Map init ──────────────────────────────────────────────────────────
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

    map.on("style.load", () => {
      applyCartographicPalette(map);
      styleLoadedRef.current = true;
    });

    return () => {
      // Unmount React roots before removing the map.
      Array.from(markersRef.current.values()).forEach((entry) => {
        try { entry.root.unmount(); } catch {}
      });
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []);

  // ── Marker sync ───────────────────────────────────────────────────────
  // Keeps the marker collection in sync with `malls` + `selectedMallId`.
  // Markers persist across renders; we only mount/unmount on add/remove
  // and re-render the React content when selected state changes.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const live = new Set<string>();

    for (const mall of malls) {
      if (mall.latitude == null || mall.longitude == null) continue;
      const lng = Number(mall.longitude);
      const lat = Number(mall.latitude);
      if (Number.isNaN(lng) || Number.isNaN(lat)) continue;

      live.add(mall.id);
      let entry = markersRef.current.get(mall.id);

      if (!entry) {
        const el = document.createElement("div");
        el.style.willChange = "transform";
        const root = createRoot(el);
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        entry = { marker, root, el };
        markersRef.current.set(mall.id, entry);
      }

      entry.root.render(<LeafBubblePin selected={selectedMallId === mall.id} />);
    }

    // Remove markers no longer in the malls list.
    Array.from(markersRef.current.entries()).forEach(([id, entry]) => {
      if (!live.has(id)) {
        try { entry.root.unmount(); } catch {}
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [malls, selectedMallId]);

  // ── Scope-driven view ─────────────────────────────────────────────────
  // selectedMallId === null → fit KY bounds (all-Kentucky overview).
  // selectedMallId === id   → flyTo that mall at street-zoom.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!selectedMallId) {
        map.fitBounds(KY_BOUNDS, { padding: 32, duration: 600 });
        return;
      }
      const mall = malls.find((m) => m.id === selectedMallId);
      if (!mall || mall.latitude == null || mall.longitude == null) return;
      map.flyTo({
        center:   [Number(mall.longitude), Number(mall.latitude)],
        zoom:     12.5,
        duration: 800,
      });
    };

    if (styleLoadedRef.current) apply();
    else                        map.once("style.load", apply);
  }, [selectedMallId, malls]);

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
