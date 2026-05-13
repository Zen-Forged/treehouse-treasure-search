// components/MapCarousel.tsx
// Session 158 — Map enrichment (design record: docs/map-enrichment-design.md).
//
// Horizontal-scroll thumbnail carousel of active malls, sorted nearest first.
// Visible only when MallMapDrawer is open (Q6=a). Sits as a fixed-positioned
// chrome layer between drawer (z-30) and BottomNav (z-50), not inside the
// drawer's bounding box (Q5=B — drawer geometry unchanged).
//
// Pure presentation primitive — consumer owns peekedMallId state. Card tap
// fires `onCardTap(mallId)` per D6 (peek, not commit); the existing Explore
// CTA in PinCallout remains the explicit scope-commit affordance.
//
// Sort logic per D3 (and clarified in this commit):
//   granted + all-Kentucky scope → sort distance asc from user; show distance label
//   granted + specific mall      → selected mall at index 0; rest sorted asc from
//                                  SELECTED MALL's coords (spatial neighbors).
//                                  Distance label remains FROM USER for every card
//                                  so the user-centric measurement stays consistent
//                                  with PinCallout's DistancePill.
//   denied / unavailable         → alphabetical by mall.name; no distance label.
//   prompting / idle             → alphabetical (transient until resolved).
//
// Auto-scroll-to-selected on peekedMallId change per D5; first-mount scroll
// is non-smooth to avoid a startup animation. Cards tracked via ref-map by
// mall.id; scrollIntoView with inline:"center" centers the selected card.

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  v2,
  FONT_CORMORANT,
  FONT_INTER,
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";
import { useUserLocation } from "@/lib/useUserLocation";
import { computeSortedMalls, type SortedMallEntry } from "@/lib/mallSort";
import { track } from "@/lib/clientEvents";
import type { Mall } from "@/types/treehouse";

export interface MapCarouselProps {
  open:           boolean;
  malls:          Mall[];
  /** Scoped mall — when set + granted, anchors this mall at index 0 (D3). */
  selectedMallId: string | null;
  /** Currently peeked mall — drives the selected-state visual + auto-scroll. */
  peekedMallId:   string | null;
  /** Fires on card tap. Per D6: this is a peek signal, not a commit. */
  onCardTap:      (mallId: string) => void;
}

export default function MapCarousel({
  open,
  malls,
  selectedMallId,
  peekedMallId,
  onCardTap,
}: MapCarouselProps) {
  const userLoc = useUserLocation();

  // D3 sort computation via shared lib/mallSort helper (extracted so the
  // PinCallout arrows step through the same order — single source of truth).
  const sorted = React.useMemo<SortedMallEntry[]>(() => {
    return computeSortedMalls(malls, selectedMallId, userLoc);
  }, [malls, selectedMallId, userLoc]);

  // Refs to each card DOM node, keyed by mall.id, for auto-scroll-to-selected.
  const cardRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // First-paint guard so initial scroll-to-selected doesn't animate.
  const hasMountedRef = React.useRef(false);

  // D5 — auto-scroll the selected card into center view on peekedMallId change.
  React.useEffect(() => {
    if (!peekedMallId) return;
    const node = cardRefs.current[peekedMallId];
    if (!node) return;
    node.scrollIntoView({
      behavior: hasMountedRef.current ? "smooth" : "auto",
      inline:   "center",
      block:    "nearest",
    });
    hasMountedRef.current = true;
  }, [peekedMallId]);

  // Show distance label only when location is granted + has coords.
  const showDistance =
    userLoc.status === "granted" &&
    userLoc.lat !== null &&
    userLoc.lng !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Wrapper passes through pointer events so taps on the 12px padding
          // strips at either side fall through to the map below. The inner
          // scroll container re-enables pointerEvents for the actual cards.
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0,   opacity: 1, x: "-50%" }}
          exit={{    y: 100, opacity: 0, x: "-50%" }}
          transition={{
            duration: MOTION_BOTTOM_SHEET_SHEET_DURATION,
            ease:     MOTION_BOTTOM_SHEET_EASE,
          }}
          style={{
            position:      "fixed",
            bottom:        100,
            left:          "50%",
            width:         "100%",
            maxWidth:      430,
            padding:       "0 12px",
            zIndex:        35,
            pointerEvents: "none",
          }}
        >
          <div
            role="region"
            aria-label="Nearby locations"
            className="map-carousel-scroll"
            style={{
              display:                 "flex",
              gap:                     8,
              overflowX:               "auto",
              padding:                 "4px 4px 6px",
              pointerEvents:           "auto",
              scrollbarWidth:          "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {sorted.map(({ mall, milesFromMe, position }) => {
              const isPeeked = peekedMallId === mall.id;
              return (
                <button
                  key={mall.id}
                  ref={(el) => { cardRefs.current[mall.id] = el; }}
                  type="button"
                  onClick={() => {
                    track("map_carousel_card_tapped", {
                      mall_slug:     mall.slug,
                      sort_position: position,
                    });
                    onCardTap(mall.id);
                  }}
                  style={{
                    flexShrink:    0,
                    width:         142,
                    height:        108,
                    padding:       0,
                    background:    v2.surface.card,
                    border:        isPeeked
                      ? `1.5px solid ${v2.accent.green}`
                      : `1px solid ${v2.border.light}`,
                    borderRadius:  10,
                    boxShadow:     "0 1px 2px rgba(43,33,26,0.06), 0 6px 18px rgba(43,33,26,0.06)",
                    overflow:      "hidden",
                    display:       "flex",
                    flexDirection: "column",
                    cursor:        "pointer",
                    transform:     isPeeked ? "translateY(-3px)" : "translateY(0)",
                    transition:    "transform 200ms ease, border-color 200ms ease",
                    textAlign:     "left",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {/* Photo banner — falls back to cream2 when hero_image_url is null. */}
                  <div
                    style={{
                      height:     56,
                      flexShrink: 0,
                      background: mall.hero_image_url
                        ? `url(${mall.hero_image_url}) center / cover no-repeat`
                        : "var(--th-v1-basemap-cream2, #EFE6D2)",
                    }}
                  />
                  {/* Body — name + optional distance label. */}
                  <div
                    style={{
                      padding:       "5px 10px 8px",
                      display:       "flex",
                      flexDirection: "column",
                      gap:           2,
                      minHeight:     0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily:   FONT_CORMORANT,
                        fontSize:     13,
                        fontWeight:   600,
                        color:        v2.text.primary,
                        lineHeight:   1.3,
                        whiteSpace:   "nowrap",
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {mall.name}
                    </div>
                    {showDistance && milesFromMe !== null && (
                      <div
                        style={{
                          fontFamily:    FONT_INTER,
                          fontSize:      10,
                          fontWeight:    700,
                          letterSpacing: "0.03em",
                          color:         v2.accent.green,
                          textTransform: "uppercase",
                        }}
                      >
                        {milesFromMe} MI
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Hide WebKit scrollbar — scrollbar-width:none covers Firefox. */}
          <style>{`.map-carousel-scroll::-webkit-scrollbar { display: none; }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sort helper extracted to lib/mallSort.ts (Arc 3.1) — shared with TreehouseMap's
// neighbor-stepping arrows so the carousel order and arrow order stay in lockstep.
