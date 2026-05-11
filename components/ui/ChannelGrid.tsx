// components/ui/ChannelGrid.tsx
// Layer 2 primitive — 3-column tile row for share-channel selection.
// Extracted from ShareSheet's repeated ChannelTile + CopyLinkTile pattern
// (9+ render sites across BoothShareBody / MallShareBody / FindShareBody,
// session 137) at session 149.
//
// Discriminated tile array — primitive accepts a mix of stateless "channel"
// tiles (icon + label + onClick) and stateful "copy" tiles (url + onTap +
// onCopySuccess, internal 1600ms visual feedback). Copy state is
// encapsulated inside the primitive so consumers don't manage it.
//
// v1 → v2 token migration applied at extraction:
//   FONT_LORA               → FONT_CORMORANT   (tile label)
//   v1.inkPrimary           → v2.text.primary  (icon + label color)
//   v1.inkHairline          → v2.border.light  (tile border)
//   v1.green                → v2.accent.green  (copied-state icon + label)
//   rgba(255,255,255,0.4)   → v2.surface.card  (tile bg — frosted-glass
//                                               retire per session 132)
//
// Intrinsic sizing PRESERVED verbatim from session 135 + 137 calibration:
// borderRadius 10, padding "16px 6px 12px", boxShadow 0 1px 2px,
// gap 8 between tiles, icon size 22, label fontSize 13, gap 6 between
// icon + label.

"use client";

import { useEffect, useRef, useState } from "react";
import { PiCheck, PiLinkSimple } from "react-icons/pi";
import { FONT_CORMORANT, v2 } from "@/lib/tokens";

/** A stateless channel tile — icon + label + onClick handler. */
export type ChannelTile = {
  kind: "channel";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

/** A copy-link tile — owns its own clipboard write + 1600ms checkmark
 *  feedback. onTap fires immediately (regardless of clipboard outcome) so
 *  parent can track the channel_tapped analytics; onCopySuccess fires only
 *  on successful clipboard write. */
export type CopyTile = {
  kind: "copy";
  url: string;
  onTap: () => void;
  onCopySuccess: () => void;
};

export type ChannelGridTile = ChannelTile | CopyTile;

export interface ChannelGridProps {
  /** Tile set — typically 3 tiles. Mix of channel + copy is supported. */
  tiles: ChannelGridTile[];
}

export function ChannelGrid({ tiles }: ChannelGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
        gap: 8,
      }}
    >
      {tiles.map((tile, i) =>
        tile.kind === "copy"
          ? <CopyTileButton key={i} tile={tile} />
          : <ChannelTileButton key={i} tile={tile} />
      )}
    </div>
  );
}

// ─── ChannelTileButton ─────────────────────────────────────────────────────
function ChannelTileButton({ tile }: { tile: ChannelTile }) {
  return (
    <button type="button" onClick={tile.onClick} style={tileButtonStyle()}>
      <span style={tileIconStyle()}>{tile.icon}</span>
      <span style={tileLabelStyle(v2.text.primary)}>{tile.label}</span>
    </button>
  );
}

// ─── CopyTileButton ────────────────────────────────────────────────────────
function CopyTileButton({ tile }: { tile: CopyTile }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Clear pending timeout on unmount so a sheet-close mid-feedback doesn't
  // leave a stale setState scheduled.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleClick() {
    tile.onTap();
    try {
      await navigator.clipboard.writeText(tile.url);
      tile.onCopySuccess();
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked / unavailable — surface nothing visually for now.
      // The onCopySuccess analytics signal is success-only; clipboard errors
      // are silent at the UX layer (no error toast).
    }
  }

  return (
    <button type="button" onClick={handleClick} style={tileButtonStyle()}>
      <span style={tileIconStyle()}>
        {copied
          ? <PiCheck      size={22} color={v2.accent.green} />
          : <PiLinkSimple size={22} color={v2.text.primary} />}
      </span>
      <span style={tileLabelStyle(copied ? v2.accent.green : v2.text.primary)}>
        {copied ? "Copied" : "Copy Link"}
      </span>
    </button>
  );
}

// ─── Tile styles (shared) ──────────────────────────────────────────────────
function tileButtonStyle(): React.CSSProperties {
  return {
    background: v2.surface.card,
    border: `1px solid ${v2.border.light}`,
    borderRadius: 10,
    padding: "16px 6px 12px",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(44,36,28,0.05)",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  };
}

function tileIconStyle(): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 };
}

function tileLabelStyle(color: string): React.CSSProperties {
  return {
    fontFamily: FONT_CORMORANT,
    fontWeight: 600,
    fontSize: 13,
    color,
  };
}
