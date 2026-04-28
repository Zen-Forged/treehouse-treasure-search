// components/TagBadge.tsx
//
// Inline pill that signals "this field was prefilled from the inventory tag."
// Variant α from docs/mockups/add-find-with-tag-v1.html — green-on-green pill
// with a Lucide Tag glyph and italic IM Fell "from tag" label.
//
// Used on /post/preview next to the Title and Price field labels when the
// vendor came through the tag-capture flow and Claude returned values for
// those fields. Suppressed when:
//   - the vendor skipped the tag step (no extraction happened)
//   - the tag failed to read a particular field (e.g. price === null after
//     a successful tag read — title may still wear the badge)
//
// See docs/add-find-tag-design.md §Subordinate decisions M5.

"use client";

import { Tag } from "lucide-react";
import { v1, FONT_LORA } from "@/lib/tokens";

export default function TagBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px 2px 6px",
        background: "rgba(30, 77, 43, 0.10)",
        border: "1px solid rgba(30, 77, 43, 0.22)",
        borderRadius: 999,
        fontFamily: FONT_LORA,
        fontStyle: "italic",
        fontSize: 11,
        color: v1.green,
        lineHeight: 1.3,
        letterSpacing: "0.01em",
        flexShrink: 0,
      }}
    >
      <Tag size={11} strokeWidth={2} />
      from tag
    </span>
  );
}
