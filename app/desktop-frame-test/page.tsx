// app/desktop-frame-test/page.tsx
//
// Session 199 Arc 2.1 — smoke route for <DesktopFrame> primitive.
//
// Per feedback_testbed_first_for_ai_unknowns ✅ Promoted at session 118
// — 6th cumulative firing (postcard-test → search-bar-test →
// geolocation-test → vendors-test → share-shelf-test → desktop-frame-test).
//
// Mounts <DesktopFrame> with a placeholder inner content visible at
// mobile viewport. At desktop viewport (≥1024px), the frame chrome
// activates and loads "/" inside the phone-stage iframe so David can
// preview the chrome with the real PWA inside.
//
// Resize the browser to ~800px to see the mobile-side passthrough.
// Resize to ≥1024px to see the desktop chrome activate.

"use client";

import DesktopFrame from "@/components/DesktopFrame";

export default function DesktopFrameTest() {
  return (
    <DesktopFrame>
      <div style={{
        padding: 24,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "#2a1a0a",
        maxWidth: 430,
        margin: "0 auto",
        background: "#E6DECF",
        minHeight: "100vh",
      }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: 28,
          fontWeight: 500,
          marginBottom: 12,
        }}>
          Desktop Frame smoke route
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          This is the mobile-side passthrough content. It renders at
          viewport &lt; 1024px.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          At viewport ≥ 1024px, <code>&lt;DesktopFrame&gt;</code> activates
          chrome: branded paper-texture bg (placeholder; final Midjourney
          photo lands at Arc 3.1) + brand chrome left (wordmark + tagline +
          ornament + subtext) + phone bezel right containing an iframe
          loading <code>/</code> — the real live PWA renders inside the
          phone.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          Resize the browser window to toggle between mobile and desktop
          modes.
        </p>
        <p style={{
          fontSize: 12,
          fontStyle: "italic",
          color: "#5c4d3a",
          marginTop: 32,
        }}>
          See <code>docs/desktop-frame-design.md</code> for the design
          record + frozen decisions D1–D12.
        </p>
      </div>
    </DesktopFrame>
  );
}
