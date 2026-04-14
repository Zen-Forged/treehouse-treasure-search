// components/TabSwitcher.tsx
// Reusable On Display / Found tab switcher used on My Booth and Public Shelf pages.
// Item 8: "Available" → "On Display"

"use client";

import { colors } from "@/lib/tokens";

interface TabSwitcherProps {
  tab: "available" | "found";
  availableCount: number;
  foundCount: number;
  onChange: (t: "available" | "found") => void;
}

export default function TabSwitcher({ tab, availableCount, foundCount, onChange }: TabSwitcherProps) {
  return (
    <div style={{
      display: "flex", margin: "12px 10px 8px",
      background: colors.surface, borderRadius: 22, padding: 3, gap: 2,
    }}>
      {(["available", "found"] as const).map(t => {
        const active = tab === t;
        const count  = t === "available" ? availableCount : foundCount;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 19, border: "none",
              cursor: "pointer",
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              transition: "background 0.18s",
              WebkitTapHighlightColor: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <span style={{
              fontFamily: "Georgia, serif", fontSize: 13,
              fontWeight: active ? 700 : 400,
              color: active ? colors.textPrimary : colors.textMuted,
            }}>
              {t === "available" ? "On Display" : "Found a home"}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: active ? colors.green : colors.textFaint,
            }}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
