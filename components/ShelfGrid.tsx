// components/ShelfGrid.tsx
// Shared grid layout and tile components for vendor shelf pages.
// Used by My Shelf (/my-shelf) and Public Shelf (/shelf/[slug]).
//
// v0.2 design-system pass (session 14):
//   - Grid gap 6 → spacing.tileGap (10) — more breathing room
//   - AvailableTile: no title overlay, pure image (tap through for story)
//   - FoundTile: italic Georgia "Found a home" caption bottom-left, replacing
//     centered badge. This is the one exception to the "no text on tiles" rule.

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { colors, spacing } from "@/lib/tokens";
import type { Post } from "@/types/treehouse";

const GAP       = spacing.tileGap;
const GRID_COLS = 3;

// ─── Three-column grid wrapper ────────────────────────────────────────────────

export function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
      gap: GAP,
      padding: `0 ${GAP}px`,
    }}>
      {children}
    </div>
  );
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

export function SkeletonGrid() {
  return (
    <div style={{ padding: `${GAP}px` }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gap: GAP,
      }}>
        {Array(9).fill(null).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ borderRadius: 10, width: "100%", aspectRatio: "1" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Available tile ───────────────────────────────────────────────────────────
// v0.2: pure image — no title, no meta. Tap through for the story.

export function AvailableTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative" }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {post.image_url && !imgErr
          ? <img src={post.image_url} alt={post.title} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: colors.surface }} />
        }
      </Link>
    </motion.div>
  );
}

// ─── Found (sold) tile ────────────────────────────────────────────────────────
// v0.2: 0.5 opacity + grayscale + italic Georgia caption bottom-left on subtle
// dark gradient. One exception to the no-text rule — sold status must read.

export function FoundTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative", opacity: 0.5 }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {post.image_url && !imgErr
          ? <img src={post.image_url} alt={post.title} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: "grayscale(1) brightness(0.88)" }} />
          : <div style={{ width: "100%", height: "100%", background: colors.surface }} />
        }
        {/* Subtle dark gradient at bottom-left to carry the italic caption */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(20,18,12,0.62) 0%, transparent 100%)",
          padding: "14px 8px 6px",
        }}>
          <div style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: 10, fontWeight: 400, letterSpacing: "0.2px",
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.2,
          }}>
            Found a home
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Shimmer CSS (inject once per page that uses ShelfGrid) ──────────────────

export function ShelfGridStyles() {
  return (
    <style>{`
      @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      .skeleton-shimmer {
        background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%);
        background-size: 800px 100%;
        animation: shimmer 1.6s infinite linear;
      }
    `}</style>
  );
}
