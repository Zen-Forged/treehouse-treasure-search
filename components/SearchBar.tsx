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
    // Cursor centering on first focus (PWA + Safari + Chrome on iOS):
    // before any value/keystroke, WebKit computes the caret's vertical
    // position from the input's INTRINSIC content box rather than its
    // line-box. Without an explicit height + matching lineHeight the
    // intrinsic box collapses to the placeholder's metrics, leaving the
    // caret a few pixels above the visual baseline. Pinning both to 22px
    // gives the caret an unambiguous line to render against from frame 1.
    // appearance:none strips iOS Safari's native search-decoration chrome
    // so the input sits cleanly inside its flex slot.
    height:      22,
    lineHeight:  "22px",
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
      <input
        type="search"
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
