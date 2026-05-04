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
//   - PiBinocularsFill (left) — on-brand for the Treehouse thesis
//     (digital tool for real-world exploration); pairs with the leaf
//     brand mark, both fill weight, both field-vocabulary. Magnifying
//     glass would have read as "database query" not "scout the landscape."
//   - Right-side filter glyph (PiSlidersHorizontal) RETIRED session 105
//     after iPhone QA — design record D5 had it as a phase-2 hook for
//     axis-narrowing chips, but inert iconography read as visual noise
//     against the minimalistic-magic rule. Add it back when there's a
//     real interactive purpose to wire to.
//   - Glass-morphism bg per David's CSS (session 102):
//     65% white + backdrop blur + 1px subtle border + soft 8/24 shadow.
//     Focused state: opaque bg + 3px green ring + lifted shadow.
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
import { PiBinocularsFill, PiX } from "react-icons/pi";
import { v1, FONT_LORA } from "@/lib/tokens";

interface Props {
  initialQuery?: string;
  placeholder?:  string;
  onChange:      (query: string) => void;
}

const DEBOUNCE_MS = 200;

export default function SearchBar({
  initialQuery = "",
  placeholder = "Search finds, booths, or styles",
  onChange,
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

  const wrapperStyle: React.CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    gap:            12,
    width:          "100%",
    padding:        "10px 18px",
    borderRadius:   999,
    background:     focused ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border:         focused ? "1px solid rgba(30,77,43,0.20)" : "1px solid rgba(0, 0, 0, 0.06)",
    boxShadow:      focused
      ? "0 1px 0 rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10), 0 0 0 3px rgba(30,77,43,0.08)"
      : "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
    transition:     "all 180ms ease",
  };

  const inputStyle: React.CSSProperties = {
    flex:        1,
    border:      "none",
    background:  "transparent",
    outline:     "none",
    fontFamily:  FONT_LORA,
    fontSize:    15,
    color:       v1.inkPrimary,
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
          cadence iOS native carets use (no opacity ramp). */}
      <style>{`@keyframes th-caret-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }`}</style>

      <PiBinocularsFill
        size={20}
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
