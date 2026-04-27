// app/transition-test/layout.tsx
// Phase 4 testbed for marketplace shared-element transitions
// (docs/marketplace-transitions-design.md). Validates framer-motion `layoutId`
// works cross-route in Next.js 14 App Router before we touch real surfaces.
//
// This layout persists across /transition-test (grid) and /transition-test/[id]
// (detail). MotionConfig with reducedMotion="user" wraps both — a11y opt-out
// per D5 / D13.

"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export default function TransitionTestLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{
          minHeight: "100vh",
          background: "#0e1116",
          color: "#e8ddc7",
          maxWidth: 430,
          margin: "0 auto",
          padding: "max(20px, env(safe-area-inset-top, 20px)) 20px max(40px, env(safe-area-inset-bottom, 40px))",
          fontFamily: "-apple-system, system-ui, sans-serif",
        }}
      >
        {children}
      </div>
    </MotionConfig>
  );
}
