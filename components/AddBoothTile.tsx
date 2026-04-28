// components/AddBoothTile.tsx
// Admin-only "Add a booth" affordance rendered after all mall sections on
// /shelves. Session 80 — converted from a 1:1 dashed square (the old grid-
// tile shape) to a full-width dashed row to match the new Booths row pattern
// (docs/booths-row-pattern-design.md D9). File name preserved for callsite
// stability — visual is now a row, not a tile.

"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { v1, FONT_LORA } from "@/lib/tokens";

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
          padding: "14px 16px",
          background: "transparent",
          border: `1px dashed ${v1.inkFaint}`,
          borderRadius: 10,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Plus size={18} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
        <span
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            lineHeight: 1,
          }}
        >
          Add a booth
        </span>
      </button>
    </motion.div>
  );
}
