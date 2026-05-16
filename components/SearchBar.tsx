// components/SearchBar.tsx
// R16 discovery primitive — glass-morphism search bar.
//
// Slotted between StickyMasthead and the mall scope block on Home.
// Backed by an enriched /api/post-caption that writes posts.tags text[]
// at publish time + a Postgres tsvector + GIN index for sub-50ms full-text
// search.
//
// Design record: docs/r16-discovery-search-design.md (decisions D1–D15
// frozen session 102). Picked mockup:
// docs/mockups/discovery-search-bar-v2.html.
//
// Visual:
//   - Lucide Search (left) — magnifying glass. Session 107 reversal of the
//     session-102 PiBinocularsFill pick. Original framing: binoculars =
//     "scout the landscape" matches the digital-to-physical thesis +
//     pairs with the leaf brand mark. iPhone-QA-time call from David:
//     "i still like the concept but rather it be clear than too clever."
//     Universal-recognition wins over thesis cleverness here. R16 design
//     record D-icon updated to reflect the reversal.
//   - Right-side filter glyph (PiSlidersHorizontal) RETIRED session 105
//     after iPhone QA — design record D5 had it as a phase-2 hook for
//     axis-narrowing chips, but inert iconography read as visual noise
//     against the minimalistic-magic rule. Add it back when there's a
//     real interactive purpose to wire to.
//   - Form-input bg (session 107 reversal of glass-morphism). Now uses
//     v1.postit + inkHairline border to match /vendor-request and other
//     FormField inputs. Focused state: green-tinted border + 3px green
//     ring shadow. Pill shape (radius 999) preserved so search vocabulary
//     stays distinct from rectangular form fields.
//   - Caret is brand green (v1.green). Custom-rendered when input is empty
//     + focused (see "Custom caret" below); native green caret takes over
//     once typing begins.
//
// State semantics: parent owns the query string (kept in URL ?q=). This
// primitive is a controlled input that debounces changes 200ms before
// firing onChange — caller wires that to a router.replace + searchPosts
// query. Local `value` mirror avoids losing keystrokes during the debounce
// window.
//
// Custom caret (R16 session 105, round 5 — kill-the-bug-class fix):
//   iOS WebKit renders the empty-input caret using the font's cap height
//   (~11px for Lora 15) anchored to the line-box top, regardless of CSS
//   line-height / vertical-align / appearance. Result: caret sits in the
//   top half of the input until first keystroke. Four CSS-only attempts
//   failed (rounds 1–4 — see git history bb07ff5 → 4e121c3). Verified via
//   debug-overlay measurement that line-height is NOT the lever WebKit
//   uses for empty-input caret position.
//   Structural fix: hide the native caret while empty + focused
//   (caret-color: transparent), render our own thin green vertical bar
//   positioned with flex-friendly absolute coords, animate via CSS
//   keyframes matching iOS native blink cadence (~1.06s, hard 50/50
//   on/off). Once user types, native caret takes over (caret-color:
//   v1.green so it stays brand-consistent).
//
// Phase 1 callsite: app/page.tsx (Home). Other surfaces (e.g. /flagged
// search, /shelves search) deliberately out of scope until shopper data
// flags demand.

"use client";

import * as React from "react";
import { PiX } from "react-icons/pi";
import { Search } from "lucide-react";
import { v1, v2, FONT_LORA } from "@/lib/tokens";

interface Props {
  initialQuery?: string;
  placeholder?:  string;
  onChange:      (query: string) => void;
  /**
   * R10 (session 107) — fires when the user presses Enter / "Search" on
   * the keyboard. Used by /map per D27 to redirect to Home with the query
   * (Map stays geographic-only — actual full-text search lives on Home).
   * Optional: Home itself doesn't wire this — it search-as-you-types via
   * onChange and stays on the same page.
   */
  onSubmit?:     (query: string) => void;
}

const DEBOUNCE_MS = 200;

export default function SearchBar({
  initialQuery = "",
  // Session 134 — placeholder copy "Search to discover local finds" →
  // "What are you searching for today?" Pairs with the Home eyebrow rename
  // ("Explore local finds from") + BottomNav "Home" → "Explore" — the
  // first three pieces of chrome a shopper sees on cold start now ask
  // a single question in three voices: where are you exploring, what's
  // here today, what are you looking for?
  placeholder = "What are you searching for today?",
  onChange,
  onSubmit,
}: Props) {
  const [value,   setValue]   = React.useState(initialQuery);
  const [focused, setFocused] = React.useState(false);

  // Debounced fan-out to caller. Local input stays responsive during the
  // window; URL writes / search queries fire at most once per 200ms.
  React.useEffect(() => {
    const t = setTimeout(() => onChange(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, onChange]);

  // Custom caret renders only when the native one would render misaligned —
  // i.e. focused + empty input. Once value is non-empty, native takes over
  // (already correctly positioned because WebKit re-anchors to text baseline
  // after the first keystroke).
  const showCustomCaret = focused && value === "";

  // Review Board Finding 6C (session 153) — bg migrates v1.postit →
  // v2.surface.input (#F0EBE0). Cooler recessed-well feel pairs better
  // with the lighter mall-card bg (v2.surface.card #FFFCF5) that
  // RichPostcardMallCard renders directly above. Canonical input bg
  // system-wide; sweep applies to ShareSheet email + form primitives
  // in the same commit. Border also migrates v1.inkHairline →
  // v2.border.light for v2 vocabulary consistency.
  const wrapperStyle: React.CSSProperties = {
    display:      "flex",
    alignItems:   "center",
    gap:          12,
    width:        "100%",
    padding:      "10px 18px",
    borderRadius: 999,
    background:   v2.surface.input,
    border:       `1px solid ${focused ? "rgba(30,77,43,0.30)" : v2.border.light}`,
    boxShadow:    focused ? "0 0 0 3px rgba(30,77,43,0.08)" : "none",
    transition:   "border-color 180ms ease, box-shadow 180ms ease",
  };

  // Review Board Finding 1 (session 169) — typed-text color v1.inkPrimary
  // (#2B211A) → v2.text.muted (#A39686). Pairs with the ::placeholder rule
  // below so typed + placeholder share the same muted voice; otherwise the
  // browser-default ~56% inheritance would leave the placeholder lighter
  // than the typed text once you start typing.
  const inputStyle: React.CSSProperties = {
    flex:        1,
    border:      "none",
    background:  "transparent",
    outline:     "none",
    fontFamily:  FONT_LORA,
    fontSize:    15,
    color:       v2.text.muted,
    // Native caret — green when typing, transparent (hidden) when empty +
    // focused so the custom caret takes over without visual overlap.
    caretColor:  showCustomCaret ? "transparent" : v1.green,
    height:      22,
    lineHeight:  1,
    appearance:  "none",
    WebkitAppearance: "none",
    minWidth:    0, // lets flex item shrink past content size
    padding:     0,
    margin:      0,
  };

  const clearButtonStyle: React.CSSProperties = {
    width:           20,
    height:          20,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "rgba(0,0,0,0.05)",
    border:          "none",
    borderRadius:    999,
    cursor:          "pointer",
    flexShrink:      0,
    padding:         0,
  };

  return (
    <div style={wrapperStyle} role="search">
      {/* Custom-caret blink keyframes. Inline so the primitive stays
          self-contained; `steps(2, start)` gives the hard 50/50 on/off
          cadence iOS native carets use (no opacity ramp).
          Placeholder rule pins ::placeholder color to the same v2.text.muted
          (#A39686) value as the typed-text color above. Without this rule,
          browser-default ::placeholder inheritance applies ~56% opacity to
          the input color, which would leave the placeholder muted-of-muted. */}
      <style>{`
        @keyframes th-caret-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
        input[aria-label="Search Treehouse Finds"]::placeholder { color: ${v2.text.muted}; opacity: 1; }
      `}</style>

      <Search
        size={18}
        strokeWidth={1.8}
        color={v1.inkMid}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />

      <div style={{ position: "relative", flex: 1, display: "flex", minWidth: 0 }}>
        {/* Custom caret — see file-top "Custom caret" comment block.
            position: absolute relative to the inline wrapper above. left:0
            sits at the input's content-area left edge (the input has
            padding:0). Vertical centering via top:50% + translateY(-50%) so
            it tracks the 22px input box regardless of any future height
            tweaks. height 17 + width 2 mirrors iOS native caret dimensions
            for 15px text. */}
        {showCustomCaret && (
          <div
            aria-hidden
            style={{
              position:      "absolute",
              left:          0,
              top:           "50%",
              transform:     "translateY(-50%)",
              width:         2,
              height:        17,
              background:    v1.green,
              pointerEvents: "none",
              animation:     "th-caret-blink 1.06s steps(2, start) infinite",
              zIndex:        1,
            }}
          />
        )}

        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit(value.trim());
            }
          }}
          placeholder={placeholder}
          aria-label="Search Treehouse Finds"
          style={inputStyle}
        />
      </div>

      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          style={clearButtonStyle}
        >
          <PiX size={12} color={v1.inkMid} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
