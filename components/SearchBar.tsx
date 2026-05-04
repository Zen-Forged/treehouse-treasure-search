// components/SearchBar.tsx
// R16 discovery primitive — glass-morphism search bar.
//
// Slotted between StickyMasthead and the mall scope block on Home.
// Backed (in a future commit) by an enriched /api/post-caption that
// writes posts.tags text[] at publish time + a Postgres tsvector + GIN
// index for sub-50ms full-text search.
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
//
// State semantics: parent owns the query string (kept in URL ?q=). This
// primitive is a controlled input that debounces changes 200ms before
// firing onChange — caller wires that to a router.replace + searchPosts
// query. Local `value` mirror avoids losing keystrokes during the debounce
// window.
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
    // Caret centering — round 4, backed by overlay measurement. iOS WebKit
    // renders the empty-input caret at the font's cap height (~11px for
    // Lora 15) anchored to the line-box top. With lineHeight equal to the
    // input height (22px = 22px), there's no vertical slack so "line-box
    // top" = "input top" and the caret renders in the top half of the box.
    // Shrinking lineHeight to 1 (= font-size = 15px) gives a 15px line-box
    // that auto-centers in the 22px input via WebKit's default vertical
    // centering of input content; caret follows the line-box and lands
    // centered (y=11 in a 22px box). verticalAlign:middle is belt +
    // suspenders for any inline-block fallback path.
    height:      22,
    lineHeight:  1,
    verticalAlign: "middle",
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
      <PiBinocularsFill
        size={20}
        color={v1.inkMid}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
      {/* TEMP DEBUG (R16 caret-shift round 4) — three reference lines drawn
          inside the input's bounding box so we can see where the caret renders
          relative to top/center/bottom. Red = input top edge, green = input
          vertical center, blue = input bottom edge. Lines extend leftward 8px
          from the input's left edge so they're visible next to the caret.
          REMOVE this wrapper + the three abs-positioned divs once the caret
          fix lands. */}
      <div style={{ position: "relative", flex: 1, display: "flex", minWidth: 0 }}>
        <div aria-hidden style={{ position: "absolute", left: -8, right: 0, top:    0, height: 1, background: "red"  , pointerEvents: "none", zIndex: 2 }} />
        <div aria-hidden style={{ position: "absolute", left: -8, right: 0, top:   11, height: 1, background: "green", pointerEvents: "none", zIndex: 2 }} />
        <div aria-hidden style={{ position: "absolute", left: -8, right: 0, top:   21, height: 1, background: "blue" , pointerEvents: "none", zIndex: 2 }} />
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
