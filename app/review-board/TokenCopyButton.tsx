"use client";

// app/review-board/TokenCopyButton.tsx
//
// Style guide primitive — copy a canonical token path to clipboard so
// reviewers can paste it into NotesPanel feedback instead of describing
// tokens by visual property ("the medium green"). Closes David's session-162
// articulation: "I'm picking based on a gut feeling which then may break the
// standardization."
//
// Contract locked at docs/style-guide-on-review-board-design.md D5.
// Tokens per D5 + canonical scales (radius.pill / type.size.xs / space.*).

import { useState } from "react";
import { v2, radius, type, FONT_INTER } from "@/lib/tokens";

interface TokenCopyButtonProps {
  tokenName: string;          // canonical token path, e.g. "v2.accent.green"
  label?:    string;          // optional display label; defaults to tokenName
}

const FEEDBACK_MS = 1500;

export default function TokenCopyButton({ tokenName, label }: TokenCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = () => {
    if (copied) return; // double-click guard during feedback window
    navigator.clipboard.writeText(tokenName).catch(() => { /* clipboard unavailable — no-op */ });
    setCopied(true);
    window.setTimeout(() => setCopied(false), FEEDBACK_MS);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={copied}
      style={{
        fontFamily:     FONT_INTER,
        fontSize:       type.size.xs,
        padding:        "2px 8px",
        borderRadius:   radius.pill,
        border:         `1px solid ${v2.border.light}`,
        background:     copied ? v2.accent.greenSoft : v2.surface.warm,
        color:          copied ? v2.accent.green : v2.text.muted,
        cursor:         copied ? "default" : "pointer",
        whiteSpace:     "nowrap",
        transition:     "background-color 120ms ease, color 120ms ease",
        lineHeight:     1.4,
      }}
    >
      {copied ? "copied!" : (label ?? tokenName)}
    </button>
  );
}
