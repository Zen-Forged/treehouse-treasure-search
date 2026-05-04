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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

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
