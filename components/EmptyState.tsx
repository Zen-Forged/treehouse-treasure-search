// components/EmptyState.tsx
//
// Phase 2 Session C primitive (session 96). Unifies the 4 inline empty states
// audited in Phase 1 §F-3:
//   - Home (`app/page.tsx` EmptyFeed)
//   - /flagged (`app/flagged/page.tsx` EmptyState)
//   - /shelves (`app/shelves/page.tsx` line 559)
//   - /shelf/[slug] (`app/shelf/[slug]/page.tsx` line 476 + 494, ×2 callsites)
//
// Decisions D1–D6 frozen at David's mockup approval (session 96):
//   D1 — title size 22 (converge from 20/24/none)
//   D2 — title optional (preserves /shelf/[slug] subtitle-only register)
//   D3 — voice preserved per-surface (primitive owns structure not copy)
//   D4 — subtitle lineHeight 1.7 (median of 1.65/1.7/1.75)
//   D5 — subtitle maxWidth 260 (was 230/280/none)
//   D6 — clearance prop: "masthead" default = MASTHEAD_HEIGHT + 32; number
//        for nested mid-page contexts.
//
// /my-shelf is intentionally NOT a callsite — it uses AddFindTile as its
// empty affordance (interactive card), structurally different from a
// text-block empty state.
//
// See docs/empty-state-primitive-design.md for the full design record.

import type { ReactNode } from "react";
import { FONT_LORA, v1 } from "../lib/tokens";
import { MASTHEAD_HEIGHT } from "./StickyMasthead";

type EmptyStateProps = {
  title?: string;
  subtitle?: string;
  cta?: ReactNode;
  clearance?: "masthead" | number;
};

export default function EmptyState({
  title,
  subtitle,
  cta,
  clearance = "masthead",
}: EmptyStateProps) {
  const paddingTop =
    clearance === "masthead"
      ? `calc(${MASTHEAD_HEIGHT} + 32px)`
      : clearance;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop,
        paddingLeft: 32,
        paddingRight: 32,
        textAlign: "center",
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 22,
            color: v1.inkPrimary,
            lineHeight: 1.3,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      )}
      {subtitle && (
        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            lineHeight: 1.7,
            maxWidth: 260,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
      {cta && <div style={{ marginTop: 18 }}>{cta}</div>}
    </div>
  );
}
