"use client";

// app/review-board/StickyAnchorNav.tsx
//
// Sticky horizontal pill nav for style-guide section jump. One button per
// section; active state reflects which section is currently in viewport
// via IntersectionObserver. Pill stays flush with viewport top during
// scroll so reviewers always have a section-jump affordance available.
//
// Contract locked at docs/style-guide-on-review-board-design.md D6 + D15.

import { useEffect, useRef, useState } from "react";
import { v2, radius, space, type, FONT_INTER } from "@/lib/tokens";

interface StickyAnchorNavSection {
  id:    string;            // DOM id of the target section
  label: string;            // button label
}

interface StickyAnchorNavProps {
  sections:      StickyAnchorNavSection[];
  scrollOffset?: number;    // manual offset to account for sticky pill height
}

const DEFAULT_OFFSET = 80;
const VIEWPORT_THRESHOLD = 0.5; // 50% in view = active per D6

export default function StickyAnchorNav({
  sections,
  scrollOffset = DEFAULT_OFFSET,
}: StickyAnchorNavProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track which section is most-visible. Re-create observer when sections
  // list identity changes (rare in practice — pages mount with fixed list).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sections.length === 0) return;

    // Cleanup any prior observer before re-registering.
    observerRef.current?.disconnect();

    // Map id -> intersectionRatio so we can pick the dominant one on each tick.
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        // Pick the section with the highest ratio above the threshold;
        // fallback to the first one in the list if none clear the bar.
        let bestId  = "";
        let bestVal = 0;
        ratios.forEach((val, id) => {
          if (val >= VIEWPORT_THRESHOLD && val > bestVal) {
            bestId  = id;
            bestVal = val;
          }
        });
        if (bestId) setActiveId(bestId);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [sections]);

  const onPillClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // scrollIntoView lands the section top at viewport top; we adjust for
    // sticky pill height by scrolling backwards after the smooth scroll.
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - scrollOffset;
    window.scrollTo({ top: targetY, behavior: "smooth" });
    setActiveId(id);
  };

  return (
    <nav
      aria-label="Style guide sections"
      style={{
        position:   "sticky",
        top:        0,
        zIndex:     50,
        background: v2.bg.main,
        padding:    `${space.s12} 0`,
      }}
    >
      <div
        style={{
          maxWidth:      800,
          margin:        "0 auto",
          background:    v2.surface.card,
          border:        `1px solid ${v2.border.light}`,
          borderRadius:  radius.pill,
          padding:       4,
          display:       "flex",
          gap:           4,
          justifyContent: "center",
        }}
      >
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPillClick(s.id)}
              style={{
                fontFamily:    FONT_INTER,
                fontSize:      type.size.sm,
                fontWeight:    active ? 600 : 500,
                minWidth:      110,
                padding:       `${space.s8} ${space.s16}`,
                borderRadius:  radius.pill,
                border:        "none",
                background:    active ? v2.accent.green : "transparent",
                color:         active ? v2.bg.paper : v2.text.secondary,
                cursor:        "pointer",
                transition:    "background-color 160ms ease, color 160ms ease",
                lineHeight:    1.2,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
