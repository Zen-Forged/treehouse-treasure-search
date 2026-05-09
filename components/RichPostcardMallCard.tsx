// components/RichPostcardMallCard.tsx
// Session 120 — rich variant of <PostcardMallCard> used on Home.
// Folds the mall hero photo + search bar primitives INTO the postcard
// card so the top of each surface reads as one card-stock unit instead
// of three stacked rectangles.
//
// Session 121 — DISPLAY-ONLY. The change-location pill ("X Locations ›")
// retires; the outer wrapper drops from <button> to <div>; onTap is no
// longer wired. The Map BottomNav tab (reinstated in R18) is now the
// canonical change-scope path, so the in-card pill became redundant
// chrome. Eyebrow copy reverses session-120 V3.1 trim back to "Finds
// from:" per David's call.
//
// Session 134 — eyebrow copy "Finds from:" → "Explore local finds from".
// The verb pairs with the BottomNav rename ("Home" → "Explore", same
// session) and sharpens the digital-to-physical thesis: shoppers
// explore a network of local finds, they don't browse a database. "local"
// also doubles as a soft promise about the network's character — every
// find on the platform is from a physical mall the shopper can visit.
//
// Slim <PostcardMallCard> stays alive in app/(tabs)/layout.tsx for /map
// only. Saved (app/(tabs)/flagged/page.tsx) no longer mounts this rich
// card — R18 restructures Saved to a per-mall card stack with Frame C
// split-header-strip layout (see docs/mockups/saved-per-mall-card-v1.html).
// This primitive's only consumer post-R18 is Home.
//
// Design intent (final state, post-session-134):
//   - Eyebrow "Explore local finds from" (FONT_LORA italic) above mall
//     name + address.
//   - Mall name in Lora 22px with measure-and-shrink to 16px (same primitive
//     as slim card) so any current mall name fits one row.
//   - Photo banner below chrome; collapses to no-photo when all-kentucky
//     scope OR mall lacks hero_image_url.
//   - Search bar embedded at the bottom. R16 SearchBar primitive untouched.
//
// Empty state: when `mall === "all-kentucky"` OR a specific mall has no
// hero_image_url, drop the photo region entirely. Eyebrow + name + address
// + search bar all stay.
//
// Why no tap target on the card itself: the card identifies "where you're
// shopping." The Map BottomNav tab is the change-scope path. One canonical
// path is clearer than two.
//
// Pre-R18 history (kept for traceability):
//   - V1 mockup (docs/mockups/postcard-rich-card-v1.html) locked the
//     structural shape: photo banner above text+affordance row, search bar
//     pill at the bottom.
//   - V2 mockup (docs/mockups/postcard-rich-card-v2.html) explored a
//     "select location" Dancing Script label + hand-drawn arrow + dashed-
//     border green stamp. iPhone QA: "just isn't landing." Retired in V3.
//   - V3 mockup (docs/mockups/postcard-rich-card-v3.html, Frame β picked):
//     compact pill "X Locations ›" in upper-right. Retired in R18 session
//     121 — Map tab makes the pill redundant.

"use client";

import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import SearchBar from "./SearchBar";
import type { Mall } from "@/types/treehouse";

type MallScope =
  | Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip_code" | "hero_image_url">
  | "all-kentucky";

interface RichPostcardMallCardProps {
  mall:                 MallScope;
  /** Override for the all-kentucky subtitle. Defaults to a generic count. */
  allKentuckySubtitle?: string;
  /** Search bar passthrough — wired by Home to its R16 ?q= URL state. */
  searchInitialQuery?:  string;
  onSearchChange:       (q: string) => void;
  searchPlaceholder?:   string;
}

const ALL_KENTUCKY_DEFAULT = "Kentucky";

// Fluid font-size bounds for the mall name — same primitive as the slim card.
// Long names step down 1px at a time until they fit on a single line.
const NAME_FONT_MAX = 22;
const NAME_FONT_MIN = 16;

export default function RichPostcardMallCard({
  mall,
  allKentuckySubtitle,
  searchInitialQuery,
  onSearchChange,
  searchPlaceholder,
}: RichPostcardMallCardProps) {
  const isAllKentucky = mall === "all-kentucky";
  const name      = isAllKentucky ? "All Kentucky Locations" : mall.name;
  const photoUrl  = isAllKentucky ? null : (mall.hero_image_url ?? null);
  const showPhoto = photoUrl !== null;

  // Subtitle: full street + city + state + zip from mall.address (the seed
  // pipeline pre-composes these). Falls back to component join only if a
  // mall row was created before that pipeline. All-kentucky uses caller-
  // provided subtitle (typically "X active locations · Kentucky") or a
  // minimal default.
  const subtitle = isAllKentucky
    ? (allKentuckySubtitle ?? ALL_KENTUCKY_DEFAULT)
    : (mall.address ?? [mall.city, mall.state, mall.zip_code].filter(Boolean).join(", "));

  // Mall name fluid font-size — measure-and-shrink. Same pattern as the
  // slim PostcardMallCard.tsx; locks the name to a single line for any
  // current mall in the active set.
  const nameRef = useRef<HTMLDivElement>(null);
  const [nameFontSize, setNameFontSize] = useState(NAME_FONT_MAX);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let size = NAME_FONT_MAX;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > NAME_FONT_MIN) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setNameFontSize(size);
  }, [name]);

  return (
    <div
      style={{
        position:        "relative",
        background:      v1.postcardBg,
        border:          `1px solid ${v1.postcardBorder}`,
        borderRadius:    12,
        boxShadow:       v1.shadow.postcard,
        overflow:        "hidden",
      }}
    >
      {/* Subtle paper texture overlay — composed of two radial gradients.
          Mirrors the slim card's texture so the visual vocabulary stays
          consistent across surfaces. */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse at 18% 25%, rgba(255,255,255,0.18) 0%, transparent 40%)",
            "radial-gradient(ellipse at 82% 75%, rgba(42,26,10,0.05) 0%, transparent 50%)",
          ].join(", "),
          borderRadius: 12,
        }}
      />

      {/* DISPLAY-ONLY block — covers eyebrow + mall name + address + photo
          banner. Card identifies "where you're shopping"; the Map BottomNav
          tab (R18) is the canonical change-scope path. Wrapper is <div>,
          not <button> — no tap handler, no cursor, no nested-button risk. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ padding: "14px 14px 0" }}>
          {/* Eyebrow row. The pill that previously occupied the right side
              of this row retired in R18 (session 121); the eyebrow now
              stretches full-width on its own. */}
          <div
            style={{
              fontFamily:   FONT_LORA,
              fontStyle:    "italic",
              fontSize:     17,
              color:        v1.inkMuted,
              lineHeight:   1,
              marginBottom: 4,
            }}
          >
            Explore local finds from
          </div>

          {/* Mall name — full card content width. Fluid font measure-and-
              shrink stays as the safety net for unusually-long names. */}
          <div
            ref={nameRef}
            style={{
              fontFamily:    FONT_LORA,
              fontWeight:    500,
              fontSize:      nameFontSize,
              color:         v1.inkPrimary,
              lineHeight:    1.25,
              letterSpacing: "-0.005em",
              margin:        0,
              whiteSpace:    "nowrap",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              paddingBottom: 2,
            }}
          >
            {name}
          </div>

          {/* Address — full card content width. Pin icon + truncate. */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              color:      v1.inkMid,
              fontFamily: FONT_SYS,
              fontSize:   12,
              lineHeight: 1.3,
              minWidth:   0,
            }}
          >
            <MapPin size={12} strokeWidth={2.0} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
                minWidth:     0,
              }}
            >
              {subtitle}
            </span>
          </div>
        </div>

        {/* PHOTO BANNER — only when we have a real mall hero. All-kentucky
            scope and malls without hero_image_url drop this region; the
            card collapses to text + search. */}
        {showPhoto && (
          <div
            style={{
              position:     "relative",
              height:       180,
              margin:       "14px 14px 0",
              borderRadius: 8,
              overflow:     "hidden",
              background:   v1.postit,
              boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={photoUrl}
              alt=""
              style={{
                position:       "absolute",
                inset:          0,
                width:          "100%",
                height:         "100%",
                objectFit:      "cover",
                objectPosition: "center",
              }}
            />
          </div>
        )}
      </div>

      {/* SEARCH BAR — sibling of the tap-target button so input clicks
          don't bubble to the change-location handler. R16 primitive
          (R16 D-locked behavior preserved: debounced 200ms onChange,
          custom green caret on empty+focused, etc.) is fully untouched
          here. */}
      <div style={{ padding: "12px 14px 14px", position: "relative", zIndex: 1 }}>
        <SearchBar
          initialQuery={searchInitialQuery}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}
