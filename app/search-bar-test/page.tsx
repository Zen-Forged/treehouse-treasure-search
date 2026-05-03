// app/search-bar-test/page.tsx
// R16 SearchBar primitive smoke-test — visual-only.
//
// Renders <SearchBar> against the real paperCream background so the
// glass-morphism + binoculars + Lora placeholder can be tap-tested on
// Vercel preview before the primitive is wired into the Home feed.
//
// No data layer, no router push — just a local debug echo of the
// debounced query value below the bar.
//
// Delete or repurpose once R16 implementation lands and the bar is
// integrated into app/page.tsx.

"use client";

import * as React from "react";
import SearchBar from "@/components/SearchBar";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

export default function SearchBarTestPage() {
  const [query, setQuery] = React.useState("");

  return (
    <main
      style={{
        minHeight:  "100vh",
        background: v1.paperCream,
        padding:    "60px 18px 40px",
        fontFamily: FONT_SYS,
      }}
    >
      <h1
        style={{
          fontFamily:    FONT_LORA,
          fontSize:      22,
          fontWeight:    500,
          color:         v1.inkPrimary,
          margin:        "0 0 6px",
          letterSpacing: "-0.005em",
        }}
      >
        SearchBar smoke-test
      </h1>
      <p
        style={{
          fontFamily: FONT_LORA,
          fontStyle:  "italic",
          fontSize:   13,
          color:      v1.inkMuted,
          margin:     "0 0 28px",
          lineHeight: 1.5,
        }}
      >
        R16 primitive against the real paperCream background. Tap the bar, type, clear, blur. Debounced echo below.
      </p>

      <SearchBar onChange={setQuery} />

      <div
        style={{
          marginTop:    24,
          padding:      "12px 14px",
          background:   v1.postit,
          border:       `1px solid ${v1.inkHairline}`,
          borderRadius: 10,
          fontFamily:   FONT_SYS,
          fontSize:     12,
          color:        v1.inkMuted,
        }}
      >
        <div style={{ textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 600, marginBottom: 4 }}>
          Debounced query (200ms)
        </div>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize:   15,
            color:      v1.inkPrimary,
            minHeight:  20,
          }}
        >
          {query || <span style={{ color: v1.inkFaint, fontStyle: "italic" }}>(empty)</span>}
        </div>
      </div>
    </main>
  );
}
