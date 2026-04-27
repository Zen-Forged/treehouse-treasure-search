// app/transition-test/page.tsx
// Grid view — 6 colored tiles. Each tile is a <motion.div layoutId>
// matching the detail page so framer-motion animates the morph
// across route boundaries.

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TILES } from "./tiles";

const SPRING_OUT = [0.32, 0.72, 0, 1] as const;

export default function TransitionTestGrid() {
  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 400, margin: "8px 0 4px", letterSpacing: "-0.005em" }}>
        Transition test
      </h1>
      <p style={{ fontSize: 13, color: "rgba(232,221,199,0.6)", margin: "0 0 24px", lineHeight: 1.5 }}>
        Tap any tile. Watch for: (1) photograph travels smoothly, (2) no flicker
        on arrival, (3) back gesture animates in reverse, (4)
        <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>
          prefers-reduced-motion
        </code> opts out cleanly.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {TILES.map((tile) => (
          <Link
            key={tile.id}
            href={`/transition-test/${tile.id}`}
            style={{ textDecoration: "none", color: "inherit", WebkitTapHighlightColor: "transparent" }}
          >
            <div style={{ position: "relative", aspectRatio: "3 / 4" }}>
              <motion.div
                layoutId={`tile-${tile.id}`}
                transition={{ duration: 0.34, ease: SPRING_OUT }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: tile.color,
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.2 }}>{tile.name}</div>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(232,221,199,0.12)",
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.65,
          color: "rgba(232,221,199,0.7)",
        }}
      >
        <strong style={{ color: "#c4e8c9" }}>Validation checklist:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
          <li>Forward: tap any tile, photograph morphs to detail size (340ms).</li>
          <li>Back: tap back arrow, photograph morphs back to grid slot (300ms).</li>
          <li>No flicker, no double-paint, no layout reflow on the grid during flight.</li>
          <li>iOS reduced-motion → tile snaps to detail without animation.</li>
        </ul>
      </div>
    </>
  );
}
