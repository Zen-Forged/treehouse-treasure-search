// components/AddBoothTile.tsx
// Admin-only "Add a booth" tile rendered after all mall sections on
// /shelves. Mirrors AddFindTile's silhouette (dashed cell + plus icon
// + IM Fell italic label) for visual rhyme. See
// docs/booth-management-design.md (D6).

"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { v1, FONT_IM_FELL } from "@/lib/tokens";

interface AddBoothTileProps {
  onTap: () => void;
}

export default function AddBoothTile({ onTap }: AddBoothTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label="Add a booth"
        style={{
          width: "100%",
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 12,
            border: `1px dashed ${v1.inkFaint}`,
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Plus size={22} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
          <span
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1,
            }}
          >
            Add a booth
          </span>
        </div>
        {/* Body slot placeholder so heights align with adjacent VendorCards
            (which carry a 9/10/11 padded body row with vendor name + booth
            lockup). The exact height is approximate; the tile is meant to
            sit alongside other booth cards without orphaning. */}
        <div style={{ height: 38 }} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
