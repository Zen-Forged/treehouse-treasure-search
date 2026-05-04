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
import PinCallout from "@/components/PinCallout";
import type { Mall } from "@/types/treehouse";

import type { MallStats } from "@/lib/posts";

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
  // D26 — transient peek state. Tap a pin → parent sets peekedMallId →
  // TreehouseMap renders the highlighted pin + a <PinCallout> anchored
  // above it. Tap the callout → onCommit. Tap empty map → onMapTap.
  peekedMallId?:   string | null;
  onPinTap?:       (mallId: string) => void;
  onMapTap?:       () => void;
  onCommit?:       (mallId: string) => void;
  mallStats?:      Record<string, MallStats>;
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
  peekedMallId = null,
  onPinTap,
  onMapTap,
  onCommit,
  mallStats,
  className,
  style,
}: TreehouseMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef       = React.useRef<mapboxgl.Map | null>(null);
  const markersRef   = React.useRef<Map<string, MarkerEntry>>(new Map());
  const styleLoadedRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [peekAnchor, setPeekAnchor] = React.useState<{ x: number; y: number } | null>(null);

  // Refs for handlers passed into long-lived DOM event listeners (marker
  // click + map click). Reading via ref avoids stale-closure bugs without
  // forcing every callback change to re-run the marker-sync effect.
  const onPinTapRef = React.useRef(onPinTap);
  const onMapTapRef = React.useRef(onMapTap);
  React.useEffect(() => { onPinTapRef.current = onPinTap; }, [onPinTap]);
  React.useEffect(() => { onMapTapRef.current = onMapTap; }, [onMapTap]);

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

    // Empty-map tap dismisses peek (D26). Marker clicks stopPropagation()
    // so this handler only fires for clicks that miss every pin.
    map.on("click", () => {
      onMapTapRef.current?.();
    });

    // Surface auth / tile / style failures visibly. Without this, an
    // unauthorized token (e.g. the URL restriction rejecting a preview
    // domain) silently leaves an empty canvas. With this, the user sees
    // the actual error string so we can fix the cause, not the symptom.
    map.on("error", (ev) => {
      const msg =
        (ev as { error?: { message?: string } })?.error?.message ??
        "Map failed to load.";
      // Only surface user-relevant errors; mapbox-gl emits noisy non-fatal
      // events during normal pan/zoom (e.g. tile retries) — skip those.
      if (/unauthor|forbid|denied|invalid|not allowed|access/i.test(msg)) {
        setError(`Map error: ${msg}`);
      }
      // Always log so we have a console trail in the iOS Safari Inspector.
      console.error("[TreehouseMap]", msg, ev);
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
  // Keeps the marker collection in sync with `malls` + selected/peeked
  // state. Markers persist across renders; we only mount/unmount on
  // add/remove and re-render the React content when state changes.
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
        // Pin tap → fire onPinTap, stop the click before it bubbles to
        // the map's empty-tap handler (which would dismiss any peek).
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onPinTapRef.current?.(mall.id);
        });
        const root = createRoot(el);
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        entry = { marker, root, el };
        markersRef.current.set(mall.id, entry);
      }

      // Both committed scope and transient peek render the same selected
      // visual; the difference is that peek doesn't trigger the flyTo.
      const isSelected = selectedMallId === mall.id || peekedMallId === mall.id;
      entry.root.render(<LeafBubblePin selected={isSelected} />);
    }

    // Remove markers no longer in the malls list.
    Array.from(markersRef.current.entries()).forEach(([id, entry]) => {
      if (!live.has(id)) {
        try { entry.root.unmount(); } catch {}
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [malls, selectedMallId, peekedMallId]);

  // ── Peek anchor projection ────────────────────────────────────────────
  // Resolves the screen-space coordinates for the peeked pin and keeps
  // them in sync with map pan/zoom. Cleared when peekedMallId is null.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !peekedMallId) {
      setPeekAnchor(null);
      return;
    }
    const mall = malls.find((m) => m.id === peekedMallId);
    if (!mall || mall.latitude == null || mall.longitude == null) {
      setPeekAnchor(null);
      return;
    }
    const lngLat: [number, number] = [Number(mall.longitude), Number(mall.latitude)];

    const update = () => {
      const point = map.project(lngLat);
      setPeekAnchor({ x: point.x, y: point.y });
    };

    update();
    map.on("move",  update);
    map.on("zoom",  update);
    map.on("rotate", update);
    return () => {
      map.off("move",  update);
      map.off("zoom",  update);
      map.off("rotate", update);
    };
  }, [peekedMallId, malls]);

  // ── Scope-driven view ─────────────────────────────────────────────────
  // selectedMallId === null → fit a bounding box around the active malls
  //                           (NOT the whole KY rectangle). With pins
  //                           clustered near a single metro, the all-
  //                           locations view should zoom in tight enough
  //                           that pins read as places, not specks. Falls
  //                           back to KY_BOUNDS only if no malls have
  //                           coordinates (degenerate case).
  // selectedMallId === id   → flyTo that mall at street-zoom.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!selectedMallId) {
        const coords = malls
          .filter((m) => m.latitude != null && m.longitude != null)
          .map((m) => [Number(m.longitude), Number(m.latitude)] as [number, number]);
        if (coords.length === 0) {
          map.fitBounds(KY_BOUNDS, { padding: 32, duration: 600 });
          return;
        }
        const bounds = coords.reduce(
          (acc, c) => acc.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0]),
        );
        // maxZoom 11 stops over-zoom when malls are tightly clustered or
        // there's only one — a single point would otherwise zoom to the
        // map's maxZoom (14) and look like the specific-mall scope.
        map.fitBounds(bounds, { padding: 56, duration: 600, maxZoom: 11 });
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
        // position:absolute + inset:0 eliminates the flex-item-percent-
        // height ambiguity. The parent <main> on /map is `flex: 1` inside
        // a column flexbox; some Safari layouts compute children's
        // percent height as auto in that arrangement, leaving mapbox-gl
        // with a 0px container and refusing to render. Absolute pinning
        // makes the container fill the parent's actual rendered box.
        position: "absolute",
        inset:    0,
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
      {/* D26 — peek callout. Anchored in the map container's coordinate
          space using map.project(lngLat) so it tracks pan + zoom. */}
      {peekedMallId && peekAnchor && (() => {
        const mall = malls.find((m) => m.id === peekedMallId);
        if (!mall) return null;
        const stats = mallStats?.[peekedMallId];
        return (
          <PinCallout
            mall={mall}
            boothCount={stats?.boothCount ?? 0}
            findCount={stats?.findCount ?? 0}
            anchor={peekAnchor}
            onCommit={() => onCommit?.(peekedMallId)}
          />
        );
      })()}
    </div>
  );
}
