// components/v2/FoundCheckCircle.tsx
//
// v2 Arc 1.2 — ✓ Found Find-tier engagement affordance (NEW lattice axis
// session 138). Per Q5: "filled in spot works for now" — empty circle (saved
// but not yet found in store) → filled green circle with white inner dot
// (marked found in physical store). Composes onto the find-to-found north
// star (David's session-121 articulation).
//
// localStorage-only persistence (Q5a (i)) — wiring lands in Arc 1.3 via
// useShopperFindsFound hook. This component is presentational only.
//
// e.stopPropagation() on click prevents the parent <SavedFindRow>'s row-tap
// navigation per design record contract.
"use client";

import { v2 } from "@/lib/tokens";

interface FoundCheckCircleProps {
  isFound: boolean;
  onToggle: () => void;
}

export default function FoundCheckCircle({
  isFound,
  onToggle,
}: FoundCheckCircleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={isFound}
      aria-label={isFound ? "Mark as not yet found" : "Mark as found in store"}
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        background: isFound ? v2.accent.green : "transparent",
        border: `1.5px solid ${isFound ? v2.accent.green : v2.border.medium}`,
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 140ms ease, border-color 140ms ease",
      }}
    >
      {isFound && (
        <span
          aria-hidden
          style={{
            display: "block",
            width: 10,
            height: 10,
            borderRadius: 5,
            background: "#fff",
          }}
        />
      )}
    </button>
  );
}
