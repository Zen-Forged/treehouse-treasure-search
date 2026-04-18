// components/LocationStatement.tsx
// Canonical location pattern — design-system.md v0.2.
//
// Renders a two-line address statement:
//   ⌂  Booth 369 · America's Antique Mall · Louisville
//      1555 Hurstbourne Pkwy              Directions →
//
// Variants:
//   - "compact"  → row 1 only. For dark/image backgrounds, pass tone="dark".
//   - "full"     → row 1 + row 2 (address left + Directions link right).
//
// If address is missing on "full", row 2 still renders with only the
// Directions link, right-aligned. If boothNumber is null, the "Booth N"
// segment is omitted cleanly (no dangling separator).

"use client";

import { MapPin } from "lucide-react";
import { colors } from "@/lib/tokens";
import { mapsUrl } from "@/lib/utils";

interface LocationStatementProps {
  boothNumber: string | null;
  mallName:    string;
  city?:       string;
  address?:    string | null;
  variant:     "compact" | "full";
  tone?:       "light" | "dark";  // "dark" = light text over image/hero
  /** If omitted, uses a default that opens mapsUrl(mallName, city). */
  onDirectionsClick?: () => void;
}

export default function LocationStatement({
  boothNumber, mallName, city, address,
  variant, tone = "light", onDirectionsClick,
}: LocationStatementProps) {
  const isDark = tone === "dark";

  // Palette per tone
  const iconColor  = isDark ? "rgba(255,255,255,0.65)" : colors.textMuted;
  const boothColor = isDark ? "rgba(255,255,255,0.95)" : colors.textPrimary;
  const mallColor  = isDark ? "rgba(255,255,255,0.88)" : colors.textPrimary;
  const cityColor  = isDark ? "rgba(255,255,255,0.62)" : colors.textMuted;
  const sepColor   = isDark ? "rgba(255,255,255,0.38)" : colors.textFaint;
  const addrColor  = isDark ? "rgba(255,255,255,0.62)" : colors.textMuted;
  const linkColor  = isDark ? "rgba(255,255,255,0.92)" : colors.green;

  const directionsQuery = [mallName, city].filter(Boolean).join(", ");
  const handleDirections = onDirectionsClick ?? (() => {
    window.open(mapsUrl(directionsQuery), "_blank", "noopener,noreferrer");
  });

  const Sep = () => (
    <span style={{ color: sepColor, fontSize: 13, fontWeight: 400, userSelect: "none" }}>·</span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: variant === "full" ? 5 : 0 }}>

      {/* Row 1 — icon + booth + mall + city */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <MapPin size={14} style={{ color: iconColor, flexShrink: 0 }} />

        {boothNumber && (
          <>
            <span style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13, fontWeight: 600, color: boothColor, flexShrink: 0,
            }}>
              Booth {boothNumber}
            </span>
            <Sep />
          </>
        )}

        <span style={{
          fontSize: 13, fontWeight: 500, color: mallColor,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          minWidth: 0,
        }}>
          {mallName}
        </span>

        {city && (
          <>
            <Sep />
            <span style={{
              fontSize: 13, fontWeight: 400, color: cityColor,
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {city}
            </span>
          </>
        )}
      </div>

      {/* Row 2 — address (if any) + Directions link, right-aligned */}
      {variant === "full" && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, paddingLeft: 21,  // align with row-1 text (icon + gap)
        }}>
          <span style={{
            fontSize: 12, fontWeight: 400, color: addrColor,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            minWidth: 0, flex: 1,
          }}>
            {address || ""}
          </span>
          <button
            onClick={handleDirections}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: 12, fontWeight: 500, color: linkColor,
              whiteSpace: "nowrap", flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Directions →
          </button>
        </div>
      )}
    </div>
  );
}
