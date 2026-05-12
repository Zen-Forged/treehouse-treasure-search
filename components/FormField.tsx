// components/FormField.tsx
//
// Phase 2 Session D primitive (session 96). Unifies form labels + input
// chrome across 9 form surfaces audited in Phase 1 / pre-flight grep.
//
// Decisions D1–D5 frozen at David's mockup approval (session 96):
//   D1 — input bg postit (#fbf3df) for both tiers
//   D2 — label register: 15 page / 13 compact upright Lora inkMid
//   D3 — input padding: 14×14 page / 11×12 compact (settled, no D-row)
//
// API shape: children-passes-input pattern. Caller renders the
// <input> / <textarea> via children + applies the canonical chrome
// via the `formInputStyle(size)` helper. This preserves ref-forwarding,
// auto-grow textarea logic, autoComplete, autoFocus, and any other
// per-input quirk the caller needs.
//
// Usage:
//   <FormField label="Email" size="page">
//     <input
//       type="email"
//       style={formInputStyle("page")}
//       placeholder="you@example.com"
//       value={email}
//       onChange={(e) => setEmail(e.target.value)}
//     />
//   </FormField>
//
// See docs/form-chrome-primitive-design.md for the full design record.

import type { CSSProperties, ReactNode } from "react";
import { FONT_LORA, fonts, v1, v2 } from "../lib/tokens";

type FormFieldSize = "page" | "compact";

type FormFieldProps = {
  label?: ReactNode;
  size?: FormFieldSize;
  htmlFor?: string;
  children: ReactNode;
};

// Review Board Finding 6C (session 153) — canonical form-input style.
// Background migrates v1.postit → v2.surface.input (#F0EBE0 cooler
// recessed-well). Border migrates v1.inkHairline → v2.border.light.
// Single-edit ripple: ALL FormField consumers (/login email + code,
// /vendor-request form, /post/edit, /post/preview, /post/tag, /setup,
// etc.) pick up the cooler bg in one shot.
export function formInputStyle(size: FormFieldSize = "page"): CSSProperties {
  const isPage = size === "page";
  return {
    width: "100%",
    boxSizing: "border-box",
    background: v2.surface.input,
    border: `1px solid ${v2.border.light}`,
    borderRadius: isPage ? v1.radius.input : 10,
    padding: isPage ? 14 : "11px 12px",
    fontFamily: fonts.sys,
    fontSize: isPage ? 16 : 14,
    lineHeight: 1.4,
    color: v1.inkPrimary,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    WebkitTapHighlightColor: "transparent",
  };
}

function labelStyle(size: FormFieldSize): CSSProperties {
  const isPage = size === "page";
  return {
    display: "block",
    fontFamily: FONT_LORA,
    fontSize: isPage ? 15 : 13,
    color: v1.inkMid,
    marginBottom: isPage ? 6 : 4,
    lineHeight: 1.25,
  };
}

export default function FormField({
  label,
  size = "page",
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div style={{ marginBottom: size === "page" ? 12 : 10 }}>
      {label && (
        <label htmlFor={htmlFor} style={labelStyle(size)}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
