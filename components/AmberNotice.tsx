// components/AmberNotice.tsx
// v1.2 primitive — formalizes the amber "graceful-collapse failure visible"
// pattern first introduced inline on /post/preview in session 27.
//
// See docs/design-system-v1.2-build-spec.md §8 for the visual contract and
// docs/DECISION_GATE.md Tech Rule "Graceful-collapse observability" for the
// rationale — silent fallback to a mock without a visible signal is what
// let the session-27 caption regression hide for ~1 month.
//
// Consumers:
//   - /post/preview — AI caption returned non-Claude source
//   - /find/[id]/edit — autosave failed
//   - future: any graceful-collapse-failure visible signal

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { v1, FONT_SYS } from "@/lib/tokens";

const EASE = [0.25, 0.1, 0.25, 1] as const;

export interface AmberNoticeProps {
  /** Main notice body. Plain text or nested inline nodes. */
  children: ReactNode;
  /** Optional inline action node (e.g. a retry link). Renders after the body. */
  action?: ReactNode;
}

export default function AmberNotice({ children, action }: AmberNoticeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "10px 12px",
        borderRadius: 10,
        background: v1.amberBg,
        border: `1px solid ${v1.amberBorder}`,
      }}
    >
      <AlertCircle
        size={13}
        strokeWidth={1.8}
        style={{ color: v1.amber, flexShrink: 0, marginTop: 1 }}
        aria-hidden="true"
      />
      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 12,
          color: v1.amber,
          lineHeight: 1.55,
          flex: 1,
          minWidth: 0,
        }}
      >
        {children}
        {action && <span style={{ marginLeft: 6 }}>{action}</span>}
      </div>
    </motion.div>
  );
}
