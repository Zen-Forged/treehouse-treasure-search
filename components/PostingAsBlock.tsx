// components/PostingAsBlock.tsx
// v1.2 primitive — vendor attribution row shared by /post/preview and
// /find/[id]/edit. See docs/design-system-v1.2-build-spec.md §7.
//
// Composition (top-to-bottom, within a single flex-wrap row):
//   - 16px 22px 14px padding
//   - 14px muted pin glyph (flex-shrink: 0)
//   - IM Fell 16px inkPrimary vendor name
//   - `·` separator in inkFaint
//   - system-ui 13px inkMuted booth / mall / city (separated by `·` inkFaint)
//   - 0.5px inkHairline border-bottom
//   - flex-wrap: wrap so narrow screens break cleanly to multiple lines
//
// Contract: vendor identity must be resolved before rendering. Both consumer
// pages guard on `vendor != null` upstream — this primitive assumes
// vendor.mall is available from the join. For v1.2 beta the guarantee holds
// because /post/preview arrives only after /my-shelf resolved the vendor,
// and /find/[id]/edit guards on getVendorByUserId before mount.

"use client";

import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { Vendor, Mall } from "@/types/treehouse";

export interface PostingAsBlockProps {
  vendor: Vendor;
}

// Small muted pin — matches the pin glyph shape used across Find Detail,
// Find Map, Booth, and MallSheet. At this size (14px) we only use the muted
// stroke variant (inkMuted) so the row reads as metadata rather than the
// page-level cartographic anchor (pin = mall, locked v1.1g).
function MutedPin({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (22 / 18)}
      viewBox="0 0 18 22"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
        stroke={v1.inkMuted}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={v1.inkMuted} />
    </svg>
  );
}

export default function PostingAsBlock({ vendor }: PostingAsBlockProps) {
  const mall        = (vendor.mall ?? null) as Mall | null;
  const displayName = vendor.display_name;
  const boothNumber = vendor.booth_number ?? null;
  const mallName    = mall?.name ?? null;
  const mallCity    = mall?.city ?? null;

  // Build the system-ui metadata fragments in order. Any missing fragment is
  // silently dropped so we don't render dangling separators.
  const metaFragments: string[] = [];
  if (boothNumber) metaFragments.push(`Booth ${boothNumber}`);
  if (mallName)    metaFragments.push(mallName);
  if (mallCity)    metaFragments.push(mallCity);

  return (
    <div
      style={{
        padding: "16px 22px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: `0.5px solid ${v1.inkHairline}`,
        fontFamily: FONT_SYS,
        fontSize: 13,
        color: v1.inkMuted,
        lineHeight: 1.4,
        flexWrap: "wrap",
      }}
    >
      <MutedPin size={14} />

      <span
        style={{
          fontFamily: FONT_LORA,
          fontSize: 16,
          color: v1.inkPrimary,
          letterSpacing: "-0.005em",
        }}
      >
        {displayName}
      </span>

      {metaFragments.map((frag, i) => (
        <span
          key={`${frag}-${i}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ color: v1.inkFaint }} aria-hidden="true">·</span>
          <span>{frag}</span>
        </span>
      ))}
    </div>
  );
}
