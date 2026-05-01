// components/FormButton.tsx
//
// Phase 2 Session D primitive (session 96). Replaces inline button styling
// across the form surfaces; retires components/Buttons.tsx (zero callers).
//
// Decisions D3–D5 frozen at David's mockup approval (session 96):
//   D3 — CTA padding: 15 page / 12 compact
//   D4 — Buttons.tsx retired (zero callers)
//   D5 — page-tier shadow: v1.shadow.ctaGreen (token's first adoption)
//
// Variants:
//   variant="primary" (default) — filled green CTA. Disabled state uses
//     v1.greenDisabled bg + no shadow.
//   variant="link" — italic Lora dotted-underline helper link. Used for
//     Resend / Sign in instead / Sign out / Replace photo. Size prop is
//     ignored (links are uniform across tiers).
//
// Sizes (primary only):
//   size="page" — 15px padding, radius 14, fontSize 15, ctaGreen shadow
//   size="compact" — 12px padding, radius 10, fontSize 14, ctaGreenCompact
//
// Usage:
//   <FormButton type="submit" disabled={!email}>Email me a code</FormButton>
//   <FormButton variant="link" onClick={onResend}>Resend code</FormButton>
//
// See docs/form-chrome-primitive-design.md for the full design record.

import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { FONT_LORA, fonts, v1 } from "../lib/tokens";

type FormButtonVariant = "primary" | "link";
type FormButtonSize = "page" | "compact";

type FormButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: FormButtonVariant;
  size?: FormButtonSize;
};

const LINK_STYLE: CSSProperties = {
  display: "inline-block",
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: FONT_LORA,
  fontStyle: "italic",
  fontSize: 14,
  color: v1.inkMid,
  textDecoration: "underline dotted",
  textUnderlineOffset: 4,
  cursor: "pointer",
};

function primaryStyle(size: FormButtonSize, isDisabled: boolean): CSSProperties {
  const isPage = size === "page";
  const base: CSSProperties = {
    display: "block",
    width: "100%",
    background: v1.green,
    color: v1.onGreen,
    border: "none",
    borderRadius: isPage ? v1.radius.button : 10,
    padding: isPage ? 15 : 12,
    fontFamily: fonts.sys,
    fontSize: isPage ? 15 : 14,
    fontWeight: 600,
    boxShadow: isPage ? v1.shadow.ctaGreen : v1.shadow.ctaGreenCompact,
    cursor: "pointer",
  };
  if (isDisabled) {
    return {
      ...base,
      background: v1.greenDisabled,
      boxShadow: "none",
      cursor: "not-allowed",
    };
  }
  return base;
}

export default function FormButton({
  variant = "primary",
  size = "page",
  disabled,
  style,
  children,
  type = "button",
  ...rest
}: FormButtonProps) {
  if (variant === "link") {
    return (
      <button type={type} style={{ ...LINK_STYLE, ...style }} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      style={{ ...primaryStyle(size, !!disabled), ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
