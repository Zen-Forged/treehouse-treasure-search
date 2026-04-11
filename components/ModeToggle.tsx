// components/ModeToggle.tsx
// Shown in the feed header only when the user is authenticated.
// Unauth users see nothing — no mode switching available.
// Auth users: Explorer (browse) | Curator (manage shelf).

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getMode, setMode, type AppMode } from "@/lib/mode";
import { getSession } from "@/lib/auth";

interface ModeToggleProps {
  onChange?: (mode: AppMode) => void;
}

const C = {
  surface:    "#edeae1",
  border:     "rgba(26,24,16,0.09)",
  textMuted:  "#8a8476",
  greenSolid: "rgba(30,77,43,0.90)",
};

export default function ModeToggle({ onChange }: ModeToggleProps) {
  const [mode,          setLocalMode] = useState<AppMode>("explorer");
  const [isAuthed,      setIsAuthed]  = useState(false);
  const [sessionReady,  setReady]     = useState(false);

  useEffect(() => {
    setLocalMode(getMode());
    getSession().then(s => {
      setIsAuthed(!!s?.user);
      setReady(true);
    });
  }, []);

  function handleSwitch(next: AppMode) {
    if (next === mode) return;
    setMode(next);
    setLocalMode(next);
    onChange?.(next);
  }

  // Don't render until we know auth state — avoids flash
  if (!sessionReady || !isAuthed) return null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 2, gap: 0, position: "relative" }}>
      {(["explorer", "curator"] as AppMode[]).map(m => {
        const isActive = mode === m;
        return (
          <button key={m} onClick={() => handleSwitch(m)}
            style={{ position: "relative", zIndex: 1, padding: "5px 11px", borderRadius: 18, border: "none", fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: "0.3px", color: isActive ? "#fff" : C.textMuted, background: "transparent", cursor: "pointer", transition: "color 0.18s", WebkitTapHighlightColor: "transparent", textTransform: "capitalize" }}>
            {isActive && (
              <motion.div layoutId="mode-pill"
                style={{ position: "absolute", inset: 0, borderRadius: 18, background: C.greenSolid, zIndex: -1 }}
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
