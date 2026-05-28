// components/ActionCard.tsx
//
// Shared entry-surface action card. Extracted from app/login/page.tsx at
// session 200 when /welcome became the 2nd consumer (David: redesign
// /welcome to "feel more integrated and substantial ... first point of
// entry for a vendor"). Single source of truth so /login + /welcome path
// cards stay in lockstep — future dials propagate to both surfaces.
//
// Renders as an <a> when `href` is given (full navigation — matches
// /login's authed-cards) or a <button> when `onClick` is given (client
// router.push — matches /welcome's disambiguation paths).

"use client";

import * as React from "react";
import { v2, FONT_CORMORANT } from "@/lib/tokens";

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

// Box styles shared by both the <a> and <button> renderings. The button
// resets (width / textAlign / cursor / tap-highlight / font:inherit) are
// harmless on the <a>, so /login's existing href usages render identically.
const boxStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  textDecoration: "none",
  padding: "14px 14px",
  background: v2.surface.card,
  borderRadius: 14,
  border: `1px solid ${v2.border.light}`,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  font: "inherit",
};

export default function ActionCard({ title, subtitle, icon, href, onClick }: ActionCardProps) {
  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: v2.accent.greenSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: v2.accent.green,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize: 16,
            color: v2.text.primary,
            // 1.3 per feedback_lora_lineheight_minimum_for_clamp (extended to
            // Cormorant since session 143). Titles can wrap on narrow phones;
            // descender clearance matters for g/j/p/y in the action label.
            lineHeight: 1.3,
            margin: "0 0 2px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            fontSize: 14,
            color: v2.text.secondary,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </div>
      </div>
      <span
        style={{
          color: v2.text.secondary,
          flexShrink: 0,
          fontSize: 22,
          lineHeight: 1,
          fontFamily: FONT_CORMORANT,
        }}
      >
        ›
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={boxStyle}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={boxStyle}>
      {inner}
    </button>
  );
}
