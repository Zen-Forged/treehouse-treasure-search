// app/transition-test/[id]/page.tsx
// Detail view — same <motion.div layoutId> as the grid tile, but at
// the larger 4:5 detail aspect. framer-motion animates the layout change.

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { findTile } from "../tiles";

const SPRING_OUT = [0.32, 0.72, 0, 1] as const;

export default function TransitionTestDetail() {
  const { id } = useParams<{ id: string }>();
  const tile = findTile(id);

  if (!tile) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ marginBottom: 16 }}>Tile not found.</p>
        <Link href="/transition-test" style={{ color: "#c4e8c9" }}>
          Back to grid
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/transition-test"
        aria-label="Back to grid"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          color: "#c4e8c9",
          textDecoration: "none",
          margin: "8px 0 18px",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ← Back
      </Link>

      <div style={{ position: "relative", aspectRatio: "4 / 5", marginBottom: 18 }}>
        <motion.div
          layoutId={`tile-${tile.id}`}
          transition={{ duration: 0.34, ease: SPRING_OUT }}
          style={{
            position: "absolute",
            inset: 0,
            background: tile.color,
            borderRadius: 6,
            boxShadow: "0 12px 32px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 400, margin: "0 0 6px", letterSpacing: "-0.005em" }}>
        {tile.name}
      </h1>
      <p style={{ fontSize: 13, color: "rgba(232,221,199,0.55)", margin: 0, lineHeight: 1.6 }}>
        Color <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3 }}>{tile.color}</code> ·
        layoutId <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3 }}>tile-{tile.id}</code>
      </p>

      <div
        style={{
          marginTop: 26,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(232,221,199,0.12)",
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.65,
          color: "rgba(232,221,199,0.7)",
        }}
      >
        <strong style={{ color: "#c4e8c9" }}>Detail surface.</strong>
        <p style={{ margin: "6px 0 0" }}>
          Tap “← Back” to validate reverse animation. The same{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3 }}>
            layoutId
          </code>{" "}
          on the grid tile lets framer-motion morph the rect back to its grid slot.
        </p>
      </div>
    </>
  );
}
