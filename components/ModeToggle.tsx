// components/ModeToggle.tsx
// Explorer / Curator mode pill — shown in the home header.
// Explorer = buyer browsing finds (Your Finds tab visible).
// Curator  = vendor managing posts (My Shelf tab visible).

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getMode, setMode, type AppMode } from "@/lib/mode";

interface ModeToggleProps {
  onChange?: (mode: AppMode) => void;
}

const C = {
  surface:     "#edeae1",
  border:      "rgba(26,24,16,0.09)",
  textMuted:   "#8a8476",
  textPrimary: "#1c1a14",
  green:       "#1e4d2b",
  greenSolid:  "rgba(30,77,43,0.90)",
};

export default function ModeToggle({ onChange }: ModeToggleProps) {
  const [mode, setLocalMode] = useState<AppMode>("explorer");

  useEffect(() => {
    setLocalMode(getMode());
  }, []);

  function handleSwitch(next: AppMode) {
    if (next === mode) return;
    setMode(next);
    setLocalMode(next);
    onChange?.(next);
  }

  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: 2,
      gap: 0,
      position: "relative",
    }}>
      {(["explorer", "curator"] as AppMode[]).map(m => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            onClick={() => handleSwitch(m)}
            style={{
              position: "relative", zIndex: 1,
              padding: "5px 11px", borderRadius: 18, border: "none",
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              letterSpacing: "0.3px",
              color: isActive ? "#fff" : C.textMuted,
              background: "transparent",
              cursor: "pointer",
              transition: "color 0.18s",
              WebkitTapHighlightColor: "transparent",
              textTransform: "capitalize",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="mode-pill"
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: 18,
                  background: C.greenSolid,
                  zIndex: -1,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {m === "explorer" ? "Explorer" : "Curator"}
          </button>
        );
      })}
    </div>
  );
}
