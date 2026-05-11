// app/review-board/NotesPanel.tsx
//
// Per-tile findings capture for the Review Board (session 150 Arc 7).
//
// Each tile gets a collapsible panel below the iframe. Click "+ Add
// finding" to expand; type an observation + optional suggested change;
// "Save finding" appends to localStorage keyed by surface path. The
// panel re-renders existing findings with a delete affordance.
//
// Persistence: single localStorage key (FINDINGS_KEY) stores all
// findings across all surfaces as a Record<surfacePath, Finding[]>.
// ExportButton reads the same key. Cross-instance sync via the
// FINDINGS_CHANGE_EVENT custom event so the header export button's
// count badge updates the moment a finding is added/removed.
//
// Read-only — never POSTs to a server. Survives page reload via
// localStorage. The "Copy as markdown" affordance lives in
// ExportButton.tsx so the user can paste findings into chat for
// Claude to act on.

"use client";

import { useEffect, useState } from "react";
import { v2, FONT_INTER } from "@/lib/tokens";

export const FINDINGS_KEY          = "treehouse_review_board_findings";
export const FINDINGS_CHANGE_EVENT = "treehouse:review_findings_changed";

export interface Finding {
  id:          string;
  observation: string;
  suggestion:  string;
  createdAt:   number;
}

export interface AllFindings {
  [surfacePath: string]: Finding[];
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

function writeAll(all: AllFindings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FINDINGS_KEY, JSON.stringify(all));
  } catch {}
}

function broadcast() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FINDINGS_CHANGE_EVENT));
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function NotesPanel({ surfacePath }: { surfacePath: string }) {
  const [findings,    setFindings]    = useState<Finding[]>([]);
  const [expanded,    setExpanded]    = useState(false);
  const [observation, setObservation] = useState("");
  const [suggestion,  setSuggestion]  = useState("");

  useEffect(() => {
    const load = () => setFindings(readAll()[surfacePath] ?? []);
    load();
    const onChange = () => load();
    window.addEventListener(FINDINGS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(FINDINGS_CHANGE_EVENT, onChange);
  }, [surfacePath]);

  function addFinding() {
    const trimmed = observation.trim();
    if (!trimmed) return;
    const finding: Finding = {
      id:          makeId(),
      observation: trimmed,
      suggestion:  suggestion.trim(),
      createdAt:   Date.now(),
    };
    const all = readAll();
    const next = [...(all[surfacePath] ?? []), finding];
    all[surfacePath] = next;
    writeAll(all);
    setFindings(next);
    setObservation("");
    setSuggestion("");
    broadcast();
  }

  function removeFinding(id: string) {
    const all      = readAll();
    const filtered = (all[surfacePath] ?? []).filter((f) => f.id !== id);
    if (filtered.length === 0) delete all[surfacePath];
    else                        all[surfacePath] = filtered;
    writeAll(all);
    setFindings(filtered);
    broadcast();
  }

  const hasFindings = findings.length > 0;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          all:            "unset",
          cursor:         "pointer",
          fontSize:       11,
          fontFamily:     FONT_INTER,
          color:          hasFindings ? v2.accent.green : v2.text.muted,
          textTransform:  "uppercase",
          letterSpacing:  "0.08em",
          display:        "inline-flex",
          alignItems:     "center",
          gap:            6,
        }}
      >
        {hasFindings
          ? `${findings.length} finding${findings.length === 1 ? "" : "s"}`
          : "+ Add finding"}
        <span style={{ color: v2.text.muted, fontSize: 10 }}>{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop:    10,
            padding:      14,
            background:   v2.surface.card,
            borderRadius: 10,
            border:       `1px solid ${v2.border.light}`,
          }}
        >
          {hasFindings && (
            <ol
              style={{
                margin:     "0 0 14px",
                paddingLeft: 22,
                color:      v2.text.primary,
                fontFamily: FONT_INTER,
              }}
            >
              {findings.map((f) => (
                <li key={f.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{f.observation}</div>
                  {f.suggestion && (
                    <div
                      style={{
                        fontSize:   12,
                        color:      v2.text.secondary,
                        marginTop:  3,
                        lineHeight: 1.4,
                      }}
                    >
                      → {f.suggestion}
                    </div>
                  )}
                  <button
                    onClick={() => removeFinding(f.id)}
                    style={{
                      all:            "unset",
                      cursor:         "pointer",
                      fontSize:       10,
                      color:          v2.text.muted,
                      marginTop:      4,
                      textDecoration: "underline",
                    }}
                  >
                    delete
                  </button>
                </li>
              ))}
            </ol>
          )}

          <textarea
            placeholder="What did you notice?"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={2}
            style={inputStyle}
          />
          <textarea
            placeholder="Suggested change (optional)"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            rows={1}
            style={{ ...inputStyle, marginTop: 6 }}
          />
          <button
            onClick={addFinding}
            disabled={!observation.trim()}
            style={{
              marginTop:  10,
              padding:    "7px 14px",
              fontSize:   12,
              fontFamily: FONT_INTER,
              fontWeight: 500,
              border:     "none",
              borderRadius: 6,
              background: observation.trim() ? v2.accent.green : v2.border.light,
              color:      observation.trim() ? v2.surface.card : v2.text.muted,
              cursor:     observation.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save finding
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:        "100%",
  padding:      "8px 10px",
  fontSize:     13,
  fontFamily:   FONT_INTER,
  border:       `1px solid ${v2.border.light}`,
  borderRadius: 6,
  background:   v2.bg.main,
  color:        v2.text.primary,
  boxSizing:    "border-box",
  resize:       "vertical",
  outline:      "none",
};
