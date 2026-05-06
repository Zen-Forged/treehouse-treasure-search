// app/geolocation-test/page.tsx
// R17 Arc 1 — geolocation primitive smoke-test page.
//
// Mounts every R17 Arc 1 primitive in isolation against the real
// paperCream background so it can be tap-tested on Vercel preview
// before consumer wiring lands in Arc 2.
//
// Validates:
//   - useUserLocation prompt fires on first mount
//   - granted-path renders <DistancePill> + <LocationActions>
//   - denied-path renders nothing (silent failure D4)
//   - "Navigate" opens Apple Maps via maps:// scheme on iOS
//   - "View on Find Map" routes to /map?mall=americas-antique-mall
//
// Pattern mirrors /postcard-test (R10 session 107) and /search-bar-test
// (R16 session 102) — primitive-isolated validation first, consumer
// wiring after iPhone QA passes.
//
// Delete or repurpose once Arc 2 wires the primitives into the 5
// consumer surfaces.

"use client";

import * as React from "react";
import DistancePill      from "@/components/DistancePill";
import LocationActions   from "@/components/LocationActions";
import { useUserLocation } from "@/lib/useUserLocation";
import { milesFromUser } from "@/lib/distance";
import { navigateUrl }   from "@/lib/mapsDeepLink";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

const SAMPLE_MALL = {
  slug: "americas-antique-mall",
  name: "America's Antique Mall",
  lat:  38.2249,
  lng:  -85.5710,
};

export default function GeolocationTestPage() {
  const loc        = useUserLocation();
  const liveMiles  = milesFromUser({ lat: loc.lat, lng: loc.lng }, SAMPLE_MALL.lat, SAMPLE_MALL.lng);
  const deepLinkUA = typeof navigator !== "undefined" ? navigator.userAgent : "(SSR)";

  const onClearCache = () => {
    try {
      localStorage.removeItem("geo_user_loc");
      sessionStorage.removeItem("geo_user_loc");
      // Hard reload so the hook re-runs from a clean slate.
      window.location.reload();
    } catch {}
  };

  return (
    <main
      style={{
        minHeight:  "100vh",
        background: v1.paperCream,
        padding:    "60px 18px 40px",
        fontFamily: FONT_SYS,
      }}
    >
      <h1
        style={{
          fontFamily:    FONT_LORA,
          fontSize:      22,
          fontWeight:    500,
          color:         v1.inkPrimary,
          margin:        "0 0 6px",
          letterSpacing: "-0.005em",
        }}
      >
        Geolocation smoke-test
      </h1>
      <p
        style={{
          fontFamily: FONT_LORA,
          fontStyle:  "italic",
          fontSize:   13,
          color:      v1.inkMuted,
          margin:     "0 0 28px",
          lineHeight: 1.5,
        }}
      >
        R17 Arc 1 primitives in isolation. Tap should trigger the iOS prompt on
        first mount; subsequent mounts read from cache. Deny once and verify CTAs
        + pill hide silently.
      </p>

      {/* ── Section 1: live status ────────────────────────────────────── */}
      <Section title="useUserLocation status">
        <Row label="status">
          <code>{loc.status}</code>
        </Row>
        <Row label="lat / lng">
          <code>{loc.lat == null ? "null" : loc.lat.toFixed(5)} / {loc.lng == null ? "null" : loc.lng.toFixed(5)}</code>
        </Row>
        <Row label="capturedAt">
          <code>{loc.capturedAt == null ? "null" : new Date(loc.capturedAt).toLocaleTimeString()}</code>
        </Row>
        <Row label="live miles">
          <code>{liveMiles == null ? "null" : `${liveMiles.toFixed(1)} MI to ${SAMPLE_MALL.name}`}</code>
        </Row>
        <button
          type="button"
          onClick={onClearCache}
          style={{
            marginTop:    12,
            height:       36,
            padding:      "0 14px",
            border:       `1px solid ${v1.inkHairline}`,
            background:   "transparent",
            borderRadius: 8,
            fontFamily:   FONT_SYS,
            fontSize:     12,
            color:        v1.inkMid,
            cursor:       "pointer",
          }}
        >
          Clear cache + re-prompt
        </button>
      </Section>

      {/* ── Section 2: DistancePill at various distances ──────────────── */}
      <Section title="<DistancePill> across distances">
        <p style={{ fontSize: 12, color: v1.inkMuted, margin: "0 0 12px" }}>
          Pure presentational. Renders nothing on null.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DistancePill miles={0.3} />
          <DistancePill miles={2.7} />
          <DistancePill miles={14.2} />
          <DistancePill miles={86.5} />
          <DistancePill miles={200.0} />
          <DistancePill miles={null} />
        </div>
        <p style={{ fontSize: 11, color: v1.inkFaint, margin: "8px 0 0", fontStyle: "italic" }}>
          (last slot is null — should render nothing)
        </p>
      </Section>

      {/* ── Section 3: LocationActions (twin-button CTAs) ─────────────── */}
      <Section title="<LocationActions> for America's Antique Mall">
        <p style={{ fontSize: 12, color: v1.inkMuted, margin: "0 0 12px" }}>
          Hides entirely when mall coords missing OR status !== granted.
        </p>
        <LocationActions
          mallSlug={SAMPLE_MALL.slug}
          mallLat={SAMPLE_MALL.lat}
          mallLng={SAMPLE_MALL.lng}
          surface="find"
          postId="smoke-test-post-id"
          vendorId="smoke-test-vendor-id"
        />
        <p style={{ fontSize: 11, color: v1.inkFaint, margin: "10px 0 0", fontStyle: "italic" }}>
          Navigate URL preview: <br />
          <code style={{ wordBreak: "break-all" }}>
            {navigateUrl(SAMPLE_MALL.lat, SAMPLE_MALL.lng)}
          </code>
        </p>
      </Section>

      {/* ── Section 4: integrated card preview ────────────────────────── */}
      <Section title="Integrated preview — find card eyebrow row">
        <p style={{ fontSize: 12, color: v1.inkMuted, margin: "0 0 12px" }}>
          Mock of the Arc 2 cartographic-card eyebrow row.
        </p>
        <div
          style={{
            background:   v1.postit,
            border:       `1px solid ${v1.inkHairline}`,
            borderRadius: 10,
            padding:      14,
          }}
        >
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              gap:            10,
              marginBottom:   10,
            }}
          >
            <span
              style={{
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   12,
                color:      v1.inkMid,
              }}
            >
              Find this item at
            </span>
            <DistancePill miles={liveMiles} />
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontSize:   17,
              color:      v1.inkPrimary,
              lineHeight: 1.4,
            }}
          >
            {SAMPLE_MALL.name}
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle:  "italic",
              fontSize:   13,
              color:      v1.inkMuted,
              marginTop:  2,
            }}
          >
            Booth 47
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <LocationActions
            mallSlug={SAMPLE_MALL.slug}
            mallLat={SAMPLE_MALL.lat}
            mallLng={SAMPLE_MALL.lng}
            surface="find"
          />
        </div>
      </Section>

      {/* ── Section 5: env diagnostics ────────────────────────────────── */}
      <Section title="Environment">
        <Row label="UA">
          <code style={{ wordBreak: "break-all" }}>{deepLinkUA}</code>
        </Row>
        <Row label="geolocation">
          <code>
            {typeof navigator !== "undefined" && navigator.geolocation
              ? "available"
              : "unavailable"}
          </code>
        </Row>
      </Section>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Layout primitives — local to the smoke page so the file stays self-
// contained.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 24,
        padding:      "14px 14px 16px",
        background:   v1.postit,
        border:       `1px solid ${v1.inkHairline}`,
        borderRadius: 10,
      }}
    >
      <h2
        style={{
          fontFamily:    FONT_SYS,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          fontSize:      11,
          fontWeight:    700,
          color:         v1.inkMid,
          margin:        "0 0 10px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display:    "flex",
        gap:        10,
        alignItems: "baseline",
        fontSize:   12,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          fontFamily:    FONT_SYS,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize:      10,
          fontWeight:    600,
          color:         v1.inkMuted,
          minWidth:      80,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, color: v1.inkPrimary, fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 11 }}>
        {children}
      </span>
    </div>
  );
}
