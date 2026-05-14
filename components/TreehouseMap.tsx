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
import { v1, v2, FONT_SYS } from "@/lib/tokens";
import PinCallout from "@/components/PinCallout";
import { milesFromUser } from "@/lib/distance";
import { useUserLocation } from "@/lib/useUserLocation";
import { computeSortedMalls } from "@/lib/mallSort";
import { track } from "@/lib/clientEvents";
import type { Mall } from "@/types/treehouse";

import type { MallStats } from "@/lib/posts";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Mapbox setPaintProperty expects literal color strings (hex/rgb/rgba) — it
// doesn't resolve CSS variables, which the v1.basemap.* tokens reference since
// the session 144 Layer 1 token refactor moved tokens from literal hex to
// CSS var references for theme-able runtime resolution. Bridge here: walk
// var() references back to their computed :root value before handing to
// Mapbox. Pass-through for any already-literal value.
function resolveCssVar(value: string): string {
  if (typeof window === "undefined") return value;
  const match = value.match(/^var\((--[^)]+)\)$/);
  if (!match) return value;
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(match[1])
      .trim() || value
  );
}

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

  // Pre-resolve CSS vars once — Mapbox setPaintProperty needs literal values.
  const palette = {
    cream:  resolveCssVar(v1.basemap.cream),
    cream2: resolveCssVar(v1.basemap.cream2),
    water:  resolveCssVar(v1.basemap.water),
    water2: resolveCssVar(v1.basemap.water2),
    park:   resolveCssVar(v1.basemap.park),
    label:  resolveCssVar(v1.basemap.label),
  };

  for (const layer of style.layers) {
    const id = layer.id;
    try {
      // Background fill = cream landmass.
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", palette.cream);
        continue;
      }

      // Land + landcover + landuse fills. Parks get the green park token,
      // everything else gets cream2 (slightly warmer landcover).
      if (layer.type === "fill") {
        if (id === "land") {
          map.setPaintProperty(id, "fill-color", palette.cream);
        } else if (
          id.includes("national-park") ||
          id.includes("park") ||
          id.includes("pitch") ||
          id.includes("golf")
        ) {
          map.setPaintProperty(id, "fill-color", palette.park);
          map.setPaintProperty(id, "fill-opacity", 0.7);
        } else if (
          id === "water" ||
          id === "water-shadow" ||
          id.startsWith("water-")
        ) {
          map.setPaintProperty(id, "fill-color", palette.water);
        } else if (id.includes("landcover") || id.includes("landuse")) {
          map.setPaintProperty(id, "fill-color", palette.cream2);
          map.setPaintProperty(id, "fill-opacity", 0.55);
        } else if (id.includes("hillshade")) {
          // Soften terrain shading so it doesn't overwhelm the cream.
          map.setPaintProperty(id, "fill-opacity", 0.15);
        }
        continue;
      }

      // Waterways (rivers, streams) — line layer in deeper sage.
      if (layer.type === "line" && (id === "waterway" || id.startsWith("waterway-"))) {
        map.setPaintProperty(id, "line-color", palette.water2);
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
        map.setPaintProperty(id, "text-color", palette.label);
        map.setPaintProperty(id, "text-halo-color", "rgba(245,242,235,0.85)");
        map.setPaintProperty(id, "text-halo-width", 1.2);
        continue;
      }
    } catch {
      // Layer doesn't have this paint property in the loaded style — skip.
    }
  }
}

// Session 158 — Map enrichment D7. Pulse animation keyframes for the user
// location pin's outer ring. Injected once at module scope (this module is
// "use client" + ssr:false dynamic-imported, so evaluation only ever runs
// in browser). The animation lives in a stylesheet rather than a per-render
// React style block because Mapbox markers mount via createRoot into a DOM
// node outside React's normal tree — global keyframes are the simplest way.
const USER_PULSE_KEYFRAMES_ID = "treehouse-user-pulse-keyframes";
if (typeof document !== "undefined" && !document.getElementById(USER_PULSE_KEYFRAMES_ID)) {
  const style = document.createElement("style");
  style.id = USER_PULSE_KEYFRAMES_ID;
  style.textContent =
    "@keyframes treehouse-user-pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 0; } }";
  document.head.appendChild(style);
}

// Session 158 dial C — Y offset for peek-state easeTo. Negative value
// shifts the centered (lng,lat) UP on the visual map, leaving room below
// for the bottom carousel. Without this, on iPhone SE the callout-above-
// pin could sit only ~40px above the carousel; with offset -60 the gap
// grows to ~140-180px. Mapbox offset convention: target center lands at
// (container_center.x + x, container_center.y + y), so negative Y =
// upward on screen.
const MAP_PEEK_OFFSET_Y = -60;

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

// Session 161 — David's iPhone QA item #5: "Change the you are here pin to
// something more simple, no branding other than color. it can be smaller as
// well more standard ui type feel." Pre-session-161 was a 28×28 filled green
// disc with PiLeafFill glyph inside + two-tier cream-tinted halo box-shadow.
// Reverses session 158 D7 (branded leaf-in-halo variant) bounded scope —
// the brand vocabulary (green) is preserved, only the leaf glyph + halo
// retire. This brings the pin to the canonical Apple/Google Maps "you are
// here" dot vocabulary: small solid color core + white stroke ring + soft
// drop shadow. Pulse ring retained at session-158 scale; commit 5 of this
// bundle overhauls the pulse to a zoom-aware 10-mile geographic reach.
//
// Informational only — no click handler; pointerEvents set to "none" on the
// marker element so taps fall through to the map.
function UserLocationPin() {
  return (
    <div
      style={{
        position:       "relative",
        width:          16,
        height:         16,
        borderRadius:   "50%",
        background:     v2.accent.green,
        // Canonical "you are here" — solid color core inside a white ring.
        // Apple Maps + Google Maps share this vocabulary; instantly readable
        // as "the user" rather than "a place."
        border:         "2.5px solid #FFFFFF",
        boxSizing:      "border-box",
        // Soft halo + drop shadow lifts the dot off the basemap for depth
        // without competing visually with mall pins (which are 32px+ with
        // their own halo). 0.5px green-tinted ring at zero offset doubles
        // as a subtle outer stroke against very light basemap tiles.
        boxShadow:
          "0 0 0 0.5px rgba(46,86,57,0.30), 0 2px 6px rgba(42,26,10,0.30)",
        pointerEvents:  "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         -4,
          borderRadius:  "50%",
          border:        "1.5px solid rgba(46,86,57,0.32)",
          animation:     "treehouse-user-pulse 2.2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

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
        background:   selected ? v2.accent.green : v2.surface.warm,
        border:       `2px solid ${v2.accent.green}`,
        boxShadow:    selected
          ? "0 0 0 6px rgba(30,77,43,0.18), 0 4px 10px rgba(30,77,43,0.28)"
          : "0 2px 6px rgba(42,26,10,0.18)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        color:          selected ? v2.surface.card : v2.accent.green,
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
  /** Session 123 — saves grouped by mall id. PinCallout renders
   *  "X saved finds" when count > 0, falling back to total finds otherwise. */
  savedByMallId?:  Record<string, number>;
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
  savedByMallId,
  className,
  style,
}: TreehouseMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef       = React.useRef<mapboxgl.Map | null>(null);
  const markersRef   = React.useRef<Map<string, MarkerEntry>>(new Map());
  // Session 158 — separate ref for user-pin marker (D7+D8). Lives outside the
  // mall markersRef because its lifecycle is driven by useUserLocation status,
  // not the malls array, and it has no click handler / no role in selection.
  const userMarkerRef = React.useRef<{ marker: mapboxgl.Marker; root: Root; el: HTMLDivElement } | null>(null);
  const styleLoadedRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [peekAnchor, setPeekAnchor] = React.useState<{ x: number; y: number } | null>(null);
  // Session 156 — initKey increments on retry tap, retriggering the map-init
  // effect so it tears down the broken instance and creates a fresh one.
  // Default 0; retry handler bumps it.
  const [initKey, setInitKey] = React.useState(0);
  const retry = React.useCallback(() => {
    setError(null);
    styleLoadedRef.current = false;
    setInitKey((k) => k + 1);
  }, []);
  // R17 Arc 2 — silent first-mount geolocation prompt. Hook is idempotent
  // across surfaces (D3 + D20). When granted, PinCallout's pill + Go CTA
  // get hydrated; when not, the original whole-callout-as-button + chevron
  // path stays in place (PinCallout's own coords-fallback branch).
  const userLoc = useUserLocation();

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

    // Watchdog — if style.load doesn't fire in 7s, the load almost certainly
    // failed silently (token URL restriction rejecting tile fetches, network
    // timeout, mapbox-gl bundle issue). Surface a visible retry affordance so
    // the failure is self-diagnosing without Safari Web Inspector. 7s is the
    // cliff: real failures resolve faster (~1-3s on cell, faster on wifi); a
    // legit slow load past 7s is so degraded retry is the right reflex anyway.
    const watchdog = setTimeout(() => {
      if (!styleLoadedRef.current) {
        setError("Map didn't load. Tap to retry.");
        console.error("[TreehouseMap] style.load watchdog timeout (7s)");
      }
    }, 7000);

    map.on("style.load", () => {
      applyCartographicPalette(map);
      styleLoadedRef.current = true;
      // Resize after style.load — handles the container-size race when the
      // map was initialized inside an animating container (drawer slide-up
      // from y:100%). Without this, the canvas's gl viewport can stay sized
      // to the off-screen state and tile fetches target a stale viewport.
      map.resize();
      clearTimeout(watchdog);
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
        setError(`Map error: ${msg}. Tap to retry.`);
        clearTimeout(watchdog);
      }
      // Always log so we have a console trail in the iOS Safari Inspector.
      console.error("[TreehouseMap]", msg, ev);
    });

    // ResizeObserver — handles container size changes AFTER init. Drawer
    // geometry can shift (e.g. iOS Safari URL bar collapse/expand changing
    // viewport height), and the strip-toggle drawer animation can complete
    // after init. Without resize, Mapbox keeps its gl viewport at the init
    // size and tiles render misaligned or blank in the newly-visible area.
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      clearTimeout(watchdog);
      ro.disconnect();
      // Unmount React roots before removing the map.
      Array.from(markersRef.current.values()).forEach((entry) => {
        try { entry.root.unmount(); } catch {}
      });
      markersRef.current.clear();
      // Session 158 — clean up user-pin marker alongside mall markers.
      if (userMarkerRef.current) {
        try { userMarkerRef.current.root.unmount(); } catch {}
        userMarkerRef.current.marker.remove();
        userMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, [initKey]);

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
        // Pin tap → fire onPinTap; the peek-state useEffect (added at session
        // 158 dial C) handles the easeTo + offset for all three peek paths
        // (direct pin tap / carousel card tap / callout arrow tap). Single
        // source of truth keeps the offset behavior consistent. stopPropagation
        // prevents the click from bubbling to the map's empty-tap dismiss.
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

  // ── User-pin sync (D7+D8) ─────────────────────────────────────────────
  // Mounts the branded "you are here" pin when useUserLocation resolves to
  // "granted" + valid coords; unmounts otherwise. Marker is informational
  // only (pointerEvents:none on the wrapper el so map below receives taps).
  // initKey included in deps so the pin re-attaches to the fresh map after
  // a retry — without it, the pin marker would reference a torn-down map.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const granted =
      userLoc.status === "granted" &&
      userLoc.lat !== null &&
      userLoc.lng !== null;

    if (granted) {
      let entry = userMarkerRef.current;
      const lngLat: [number, number] = [userLoc.lng as number, userLoc.lat as number];
      if (!entry) {
        const el = document.createElement("div");
        el.style.pointerEvents = "none";
        el.style.willChange    = "transform";
        const root = createRoot(el);
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(lngLat)
          .addTo(map);
        entry = { marker, root, el };
        userMarkerRef.current = entry;
      } else {
        entry.marker.setLngLat(lngLat);
      }
      entry.root.render(<UserLocationPin />);
    } else if (userMarkerRef.current) {
      // Status changed away from granted (e.g. denied on re-prompt, or the
      // hook reset for any reason) — clean up the existing marker.
      try { userMarkerRef.current.root.unmount(); } catch {}
      userMarkerRef.current.marker.remove();
      userMarkerRef.current = null;
    }
  }, [userLoc.status, userLoc.lat, userLoc.lng, initKey]);

  // ── Peek-state easeTo with offset (session 158 dial C) ───────────────
  // Single source of truth for the fly behavior across all three peek
  // paths (direct pin tap, carousel card tap, callout arrow tap). All
  // three converge by writing to peekedMallId; this effect ease-flies the
  // map to the peeked mall with MAP_PEEK_OFFSET_Y so the pin lands in
  // the upper portion of the visible map area and the callout-above-pin
  // has breathing room above the bottom carousel.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !peekedMallId) return;
    const mall = malls.find((m) => m.id === peekedMallId);
    if (!mall || mall.latitude == null || mall.longitude == null) return;
    map.easeTo({
      center:   [Number(mall.longitude), Number(mall.latitude)],
      duration: 320,
      offset:   [0, MAP_PEEK_OFFSET_Y],
    });
  }, [peekedMallId, malls]);

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
        <button
          type="button"
          onClick={retry}
          style={{
            position:        "absolute",
            inset:           0,
            display:         "flex",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            padding:         24,
            gap:             12,
            textAlign:       "center",
            color:           v2.text.muted,
            fontStyle:       "italic",
            fontFamily:      "Georgia, serif",
            fontSize:        14,
            background:      resolveCssVar(v1.basemap.cream),
            border:          "none",
            cursor:          "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span>{error}</span>
          <span
            style={{
              display:       "inline-block",
              padding:       "8px 18px",
              borderRadius:  999,
              background:    v2.surface.card,
              border:        `1px solid ${v2.border.light}`,
              color:         v2.text.secondary,
              fontFamily:    FONT_SYS,
              fontStyle:     "normal",
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: "0.01em",
              boxShadow:     "0 1px 2px rgba(43,33,26,0.04)",
            }}
          >
            Retry
          </span>
        </button>
      )}
      {/* D26 — peek callout. Anchored in the map container's coordinate
          space using map.project(lngLat) so it tracks pan + zoom. */}
      {peekedMallId && peekAnchor && (() => {
        const mall = malls.find((m) => m.id === peekedMallId);
        if (!mall) return null;
        const stats = mallStats?.[peekedMallId];
        const miles = milesFromUser(
          { lat: userLoc.lat, lng: userLoc.lng },
          mall.latitude ?? null,
          mall.longitude ?? null,
        );

        // Session 158 Arc 3 — compute prev/next neighbors via the shared
        // lib/mallSort helper so the carousel + arrows step through the same
        // order. peekedIdx is -1 when peeked mall isn't in the sorted list
        // (degenerate case — e.g. malls array mutated between effects); both
        // hasPrev + hasNext then resolve false and the bubbles disable.
        const sorted   = computeSortedMalls(malls, selectedMallId, userLoc);
        const peekedIdx = sorted.findIndex((entry) => entry.mall.id === peekedMallId);
        const prevMall = peekedIdx > 0
          ? sorted[peekedIdx - 1].mall
          : null;
        const nextMall = peekedIdx >= 0 && peekedIdx < sorted.length - 1
          ? sorted[peekedIdx + 1].mall
          : null;

        const stepTo = (neighbor: typeof mall, direction: "prev" | "next") => {
          track("map_callout_neighbor_stepped", {
            from_mall_slug: mall.slug,
            to_mall_slug:   neighbor.slug,
            direction,
          });
          // Session 158 dial C — easeTo moves into the peek-state useEffect
          // (single source of truth across pin/carousel/arrow paths). This
          // handler just propagates the peek; the effect handles the fly +
          // offset.
          onPinTapRef.current?.(neighbor.id);
        };

        return (
          <PinCallout
            mall={mall}
            findCount={stats?.findCount ?? 0}
            savedCount={savedByMallId?.[peekedMallId] ?? null}
            anchor={peekAnchor}
            onCommit={() => onCommit?.(peekedMallId)}
            miles={miles}
            onPrev={prevMall ? () => stepTo(prevMall, "prev") : undefined}
            onNext={nextMall ? () => stepTo(nextMall, "next") : undefined}
            hasPrev={prevMall !== null}
            hasNext={nextMall !== null}
          />
        );
      })()}
    </div>
  );
}
