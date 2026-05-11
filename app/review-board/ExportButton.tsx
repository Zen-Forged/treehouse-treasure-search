// app/review-board/ExportButton.tsx
//
// Header-mounted export affordance for the Review Board (session 150
// Arc 7). Reads all findings from localStorage (via NotesPanel's
// FINDINGS_KEY), formats them as a markdown block grouped by surface,
// and writes to the system clipboard. The user pastes the block into
// chat for Claude to act on.
//
// Output format (deterministic, parseable):
//
//   # Review Board findings — YYYY-MM-DD
//
//   ## <Label> (`<path>`) — <Category>
//   1. **<observation>**
//      → <suggestion>   ← optional
//   2. **<observation>**
//
//   ## <next surface...>
//
// Surfaces with zero findings are omitted entirely. If nothing has been
// captured, the export string contains a single _No findings yet._ line
// for parity with the empty state.

"use client";

import { useEffect, useState } from "react";
import { v2, FONT_INTER } from "@/lib/tokens";
import {
  FINDINGS_KEY,
  FINDINGS_CHANGE_EVENT,
  type AllFindings,
} from "./NotesPanel";

export interface SurfaceMeta {
  path:     string;
  label:    string;
  category: string;
}

function readAll(): AllFindings {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FINDINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function totalCount(all: AllFindings): number {
  return Object.values(all).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
}

function buildMarkdown(all: AllFindings, surfaces: SurfaceMeta[]): string {
  const dateStr = new Date().toISOString().split("T")[0];
  const lines: string[] = [`# Review Board findings — ${dateStr}`, ""];

  let any = false;
  for (const surface of surfaces) {
    const findings = all[surface.path] ?? [];
    if (findings.length === 0) continue;
    any = true;
    lines.push(`## ${surface.label} (\`${surface.path}\`) — ${surface.category}`);
    lines.push("");
    findings.forEach((f, i) => {
      lines.push(`${i + 1}. **${f.observation}**`);
      if (f.suggestion) lines.push(`   → ${f.suggestion}`);
    });
    lines.push("");
  }

  if (!any) lines.push("_No findings yet._");
  return lines.join("\n");
}

export default function ExportButton({ surfaces }: { surfaces: SurfaceMeta[] }) {
  const [count,  setCount]  = useState(0);
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    const refresh = () => setCount(totalCount(readAll()));
    refresh();
    const onChange = () => refresh();
    window.addEventListener(FINDINGS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(FINDINGS_CHANGE_EVENT, onChange);
  }, []);

  async function exportMarkdown() {
    const md = buildMarkdown(readAll(), surfaces);
    try {
      await navigator.clipboard.writeText(md);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      // Fallback for browsers/contexts without clipboard API access:
      // surface the markdown in a prompt for manual copy.
      window.prompt("Copy findings:", md);
    }
  }

  function clearAll() {
    if (!window.confirm("Clear all findings? This can't be undone.")) return;
    try {
      window.localStorage.removeItem(FINDINGS_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent(FINDINGS_CHANGE_EVENT));
  }

  const hasAny = count > 0;

  return (
    <div
      style={{
        marginTop:  20,
        display:    "flex",
        gap:        14,
        alignItems: "center",
      }}
    >
      <button
        onClick={exportMarkdown}
        disabled={!hasAny}
        style={{
          padding:      "9px 18px",
          fontSize:     13,
          fontFamily:   FONT_INTER,
          fontWeight:   500,
          border:       "none",
          borderRadius: 8,
          background:   hasAny ? v2.accent.green : v2.border.light,
          color:        hasAny ? v2.surface.card : v2.text.muted,
          cursor:       hasAny ? "pointer" : "not-allowed",
          letterSpacing: "0.02em",
        }}
      >
        {status === "copied"
          ? "✓ Copied to clipboard"
          : hasAny
            ? `Copy ${count} finding${count === 1 ? "" : "s"} as markdown`
            : "No findings yet"}
      </button>
      {hasAny && (
        <button
          onClick={clearAll}
          style={{
            all:            "unset",
            cursor:         "pointer",
            fontSize:       12,
            color:          v2.text.muted,
            textDecoration: "underline",
            fontFamily:     FONT_INTER,
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
