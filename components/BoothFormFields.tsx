// components/BoothFormFields.tsx
// Shared 3-field form markup for AddBoothSheet + EditBoothSheet on /shelves.
// Field shape mirrors AddBoothInline (mall select · booth_number · display_name).
// See docs/booth-management-design.md (D7).

"use client";

import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export interface BoothFormFieldsProps {
  malls:           Mall[];
  mallId:          string;
  setMallId:       (v: string) => void;
  boothNumber:     string;
  setBoothNumber:  (v: string) => void;
  displayName:     string;
  setDisplayName:  (v: string) => void;
  /**
   * When provided, fields whose value differs from their initial value
   * (the third tuple element) tint yellow to surface "this is changed."
   * Used by EditBoothSheet only; AddBoothSheet leaves it undefined.
   */
  initialValues?: {
    mallId:       string;
    boothNumber:  string;
    displayName:  string;
  };
  disabled?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 10,
  background: v1.inkWash,
  border: `1px solid ${v1.inkHairline}`,
  color: v1.inkPrimary,
  fontSize: 14,
  outline: "none",
  fontFamily: FONT_SYS,
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

const changedStyle: React.CSSProperties = {
  background: "#fff9e8",
  borderColor: "#c8a55a",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 12,
  color: v1.inkMuted,
  lineHeight: 1.3,
  marginBottom: 6,
};

const optionalStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: v1.inkFaint,
  marginLeft: 3,
};

export default function BoothFormFields({
  malls,
  mallId,
  setMallId,
  boothNumber,
  setBoothNumber,
  displayName,
  setDisplayName,
  initialValues,
  disabled = false,
}: BoothFormFieldsProps) {
  const mallChanged   = !!initialValues && initialValues.mallId      !== mallId;
  const boothChanged  = !!initialValues && initialValues.boothNumber !== boothNumber;
  const nameChanged   = !!initialValues && initialValues.displayName !== displayName;

  return (
    <>
      {/* Mall */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Mall</label>
        <select
          value={mallId}
          onChange={e => setMallId(e.target.value)}
          disabled={disabled}
          style={{
            ...inputStyle,
            ...(mallChanged ? changedStyle : null),
            paddingRight: 36,
            cursor: disabled ? "default" : "pointer",
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5538' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "12px 12px",
          }}
        >
          <option value="">Select a location…</option>
          {malls.map(m => {
            const statusSuffix =
              m.status === "active"
                ? ""
                : ` · ${m.status === "coming_soon" ? "Coming soon" : "Draft"}`;
            return (
              <option key={m.id} value={m.id}>
                {m.name}{m.city ? ` — ${m.city}` : ""}{statusSuffix}
              </option>
            );
          })}
        </select>
      </div>

      {/* Booth number */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          Booth number <span style={optionalStyle}>(optional)</span>
        </label>
        <input
          value={boothNumber}
          onChange={e => setBoothNumber(e.target.value)}
          placeholder="e.g. 369 or D19"
          disabled={disabled}
          autoCapitalize="characters"
          style={{
            ...inputStyle,
            ...(boothChanged ? changedStyle : null),
          }}
        />
      </div>

      {/* Booth name */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Booth name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. ZenForged Finds"
          disabled={disabled}
          style={{
            ...inputStyle,
            ...(nameChanged ? changedStyle : null),
          }}
        />
      </div>
    </>
  );
}
