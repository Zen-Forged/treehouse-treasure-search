"use client";

// app/review-board/StyleGuideComponents.tsx
//
// Style guide — Components section. 14 Layer 2 primitives rendered live
// against real fixtures (not screenshots — uses the actual component
// imports per D11). Per D4 the primitives are grouped by family:
//
//   1. Session 149 kickoff trio (BottomSheet / ChannelGrid / SlimHeader)
//   2. 3-tier engagement lattice (ShareBubble / BookmarkBoothBubble /
//      StarFavoriteBubble — last dormant pending Favorite Mall ★)
//   3. R17 location pair (DistancePill / LocationActions)
//   4. Masthead slot trio (Profile / Back / PaperAirplane)
//   5. Glyphs + forms (FlagGlyph / FormField / FormButton)
//
// Contract locked at docs/style-guide-on-review-board-design.md D4 + D11.
//
// Note: D4 lists "15 primitives" but the explicit name list totals 14.
// Shipping 14 cards exactly as enumerated; remaining Layer 2 primitives
// live as Tier B B3 headroom for incremental adoption.

import { useState } from "react";
import {
  v1,
  v2,
  space,
  radius,
  type,
  FONT_CORMORANT,
  FONT_INTER,
} from "@/lib/tokens";
import TokenCopyButton from "./TokenCopyButton";

import { BottomSheet }   from "@/components/ui/BottomSheet";
import { ChannelGrid }   from "@/components/ui/ChannelGrid";
import { SlimHeader }    from "@/components/ui/SlimHeader";
import ShareBubble           from "@/components/ShareBubble";
import BookmarkBoothBubble   from "@/components/BookmarkBoothBubble";
import StarFavoriteBubble    from "@/components/v2/StarFavoriteBubble";
import DistancePill          from "@/components/DistancePill";
import LocationActions       from "@/components/LocationActions";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton    from "@/components/MastheadBackButton";
import MastheadPaperAirplane from "@/components/MastheadPaperAirplane";
import FlagGlyph             from "@/components/FlagGlyph";
import FormField, { formInputStyle } from "@/components/FormField";
import FormButton            from "@/components/FormButton";
import { PiEnvelopeSimple, PiChatCircleText, PiLinkSimple } from "react-icons/pi";

const MONO_FONT = "ui-monospace, SFMono-Regular, monospace";

// ─────────────────────────────────────────────────────────────────────────────
// PrimitiveCard — shared card shell with name + props summary + status badge
// + live render slot. Used by every primitive cell.
// ─────────────────────────────────────────────────────────────────────────────

type StatusTone = "dormant" | "live" | "notice";

interface PrimitiveCardProps {
  name:        string;            // e.g. "<BottomSheet>"
  importPath:  string;            // e.g. "components/ui/BottomSheet"
  propsLine:   string;            // 2-3 most-relevant props in monospace
  status?:     { tone: StatusTone; text: string };
  children:    React.ReactNode;   // the live render
}

function statusTokens(tone: StatusTone): { bg: string; text: string } {
  if (tone === "dormant") return { bg: v1.amberBg,         text: v1.amber };
  if (tone === "notice")  return { bg: v2.accent.greenSoft, text: v2.accent.greenDark };
  return { bg: v2.surface.warm, text: v2.text.secondary };
}

function PrimitiveCard({ name, importPath, propsLine, status, children }: PrimitiveCardProps) {
  return (
    <div
      style={{
        background:    v2.surface.card,
        border:        `1px solid ${v2.border.light}`,
        borderRadius:  radius.md,
        padding:       space.s16,
        display:       "flex",
        flexDirection: "column",
        gap:           space.s12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display:        "flex",
            alignItems:     "baseline",
            justifyContent: "space-between",
            gap:            space.s8,
            flexWrap:       "wrap",
          }}
        >
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontSize:   type.size.lg,
              fontWeight: 500,
              color:      v2.text.primary,
            }}
          >
            {name}
          </div>
          {status && (
            <span
              style={{
                ...statusTokens(status.tone),
                fontFamily:     FONT_INTER,
                fontSize:       type.size.xs,
                fontWeight:     600,
                padding:        "2px 8px",
                borderRadius:   radius.pill,
                letterSpacing:  "0.04em",
                textTransform:  "uppercase",
                whiteSpace:     "nowrap",
              }}
            >
              {status.text}
            </span>
          )}
        </div>
        <TokenCopyButton tokenName={importPath} />
        <code
          style={{
            fontFamily: MONO_FONT,
            fontSize:   type.size.xs,
            color:      v2.text.muted,
            lineHeight: 1.5,
            wordBreak:  "break-all",
          }}
        >
          {propsLine}
        </code>
      </div>

      <div
        style={{
          background:    v2.bg.main,
          border:        `1px dashed ${v2.border.light}`,
          borderRadius:  radius.sm,
          padding:       space.s16,
          minHeight:     96,
          display:       "flex",
          alignItems:    "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FamilyHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginTop: space.s32, marginBottom: space.s16 }}>
      <h3
        style={{
          fontFamily:    FONT_CORMORANT,
          fontSize:      type.size.xl,
          fontWeight:    500,
          color:         v2.text.primary,
          margin:        0,
          letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.sm,
          color:      v2.text.secondary,
          margin:     "4px 0 0",
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap:                 space.s16,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Family 1 — Session 149 kickoff trio
// ─────────────────────────────────────────────────────────────────────────────

function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FormButton size="compact" onClick={() => setOpen(true)}>
        Open sheet
      </FormButton>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Style guide demo"
      >
        <div style={{ padding: space.s24 }}>
          <div style={{ fontFamily: FONT_CORMORANT, fontSize: type.size.xl, fontWeight: 500, color: v2.text.primary, marginBottom: space.s8 }}>
            Demo sheet
          </div>
          <div style={{ fontFamily: FONT_INTER, fontSize: type.size.sm, color: v2.text.secondary, lineHeight: 1.5 }}>
            BottomSheet powers ShareSheet today. Tap backdrop or the × to close.
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function ChannelGridDemo() {
  return (
    <div style={{ width: "100%" }}>
      <ChannelGrid
        tiles={[
          { kind: "channel", icon: <PiEnvelopeSimple size={22} />, label: "Email",     onClick: () => {} },
          { kind: "channel", icon: <PiChatCircleText size={22} />, label: "Text",      onClick: () => {} },
          { kind: "copy",    url: "https://example.com",            onTap: () => {}, onCopySuccess: () => {} },
        ]}
      />
    </div>
  );
}

function SlimHeaderDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <SlimHeader
        title="Ella's Finds"
        boothPill="BOOTH 12"
        contextLabel="America's Antique Mall"
        addressLine="2950 Richmond Rd, Lexington, KY 40509"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Family 2 — 3-tier engagement lattice
// ─────────────────────────────────────────────────────────────────────────────

function ShareBubbleDemo() {
  return (
    <div style={{ display: "flex", gap: space.s16, alignItems: "center" }}>
      <div style={{ position: "relative", padding: space.s8, background: "#333", borderRadius: radius.sm }}>
        <ShareBubble variant="frosted" onClick={() => {}} ariaLabel="Share (frosted demo)" />
      </div>
      <ShareBubble variant="v2" onClick={() => {}} ariaLabel="Share (v2 demo)" />
    </div>
  );
}

function BookmarkBoothBubbleDemo() {
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ display: "flex", gap: space.s16, alignItems: "center" }}>
      <BookmarkBoothBubble saved={saved} onClick={() => setSaved((s) => !s)} />
      <span style={{ fontFamily: FONT_INTER, fontSize: type.size.xs, color: v2.text.muted }}>
        tap to toggle
      </span>
    </div>
  );
}

function StarFavoriteBubbleDemo() {
  const [fav, setFav] = useState(false);
  return (
    <div style={{ display: "flex", gap: space.s16, alignItems: "center" }}>
      <StarFavoriteBubble isFavorite={fav} onToggle={() => setFav((f) => !f)} />
      <span style={{ fontFamily: FONT_INTER, fontSize: type.size.xs, color: v2.text.muted }}>
        tap to toggle
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Family 3 — R17 location pair
// ─────────────────────────────────────────────────────────────────────────────

function DistancePillDemo() {
  return (
    <div style={{ display: "flex", gap: space.s12, alignItems: "center", flexWrap: "wrap" }}>
      <DistancePill miles={0.4} />
      <DistancePill miles={12.7} />
      <DistancePill miles={null} />
    </div>
  );
}

function LocationActionsDemo() {
  // LocationActions returns null until useUserLocation reports "granted" —
  // in the gallery context (no grant), surface a one-line explainer so the
  // card doesn't read as broken. Real surface render is on /find/[id].
  return (
    <div
      style={{
        width:      "100%",
        maxWidth:   320,
        textAlign:  "center",
      }}
    >
      <LocationActions
        mallSlug="americas-antique-mall"
        mallLat={38.0214}
        mallLng={-84.4327}
        surface="find"
        postId="fixture-post-1"
      />
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.xs,
          color:      v2.text.muted,
          lineHeight: 1.5,
        }}
      >
        Render is gated on useUserLocation = &quot;granted&quot;. Open
        <code style={{ fontFamily: MONO_FONT, fontSize: type.size.xs, marginLeft: 4 }}>
          /find/fixture-post-1
        </code>{" "}
        with location granted to see the Take Trip CTA live.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Family 4 — Masthead slot trio
// ─────────────────────────────────────────────────────────────────────────────

function MastheadProfileButtonDemo() {
  // Pass authedInitials to short-circuit the hook-driven auth state read so
  // the demo renders deterministically in the Components gallery.
  return <MastheadProfileButton authedInitials="DB" />;
}

function MastheadBackButtonDemo() {
  return <MastheadBackButton onClick={() => {}} />;
}

function MastheadPaperAirplaneDemo() {
  return <MastheadPaperAirplane size={28} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Family 5 — Glyphs + forms
// ─────────────────────────────────────────────────────────────────────────────

function FlagGlyphDemo() {
  return (
    <div style={{ display: "flex", gap: space.s16, alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <FlagGlyph size={22} />
        <code style={{ fontFamily: MONO_FONT, fontSize: type.size.xs, color: v2.text.muted }}>regular</code>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <FlagGlyph size={22} weight="bold" />
        <code style={{ fontFamily: MONO_FONT, fontSize: type.size.xs, color: v2.text.muted }}>bold</code>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <FlagGlyph size={22} style={{ fill: v2.accent.green }} />
        <code style={{ fontFamily: MONO_FONT, fontSize: type.size.xs, color: v2.text.muted }}>filled</code>
      </div>
    </div>
  );
}

function FormFieldDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 280 }}>
      <FormField label="Email">
        <input type="email" placeholder="you@example.com" style={formInputStyle("page")} />
      </FormField>
    </div>
  );
}

function FormButtonDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: space.s8 }}>
      <FormButton size="compact" onClick={() => {}}>Continue</FormButton>
      <FormButton variant="link" onClick={() => {}}>Sign in instead</FormButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Components root — composes the 5 family sections under id="components".
// ─────────────────────────────────────────────────────────────────────────────

export default function StyleGuideComponents() {
  return (
    <div id="components" style={{ scrollMarginTop: 96, marginTop: space.s64 }}>
      <h2
        style={{
          fontFamily:    FONT_CORMORANT,
          fontSize:      type.size["3xl"],
          fontWeight:    500,
          color:         v2.text.primary,
          margin:        "0 0 8px",
          letterSpacing: "-0.01em",
        }}
      >
        Components
      </h2>
      <p
        style={{
          fontFamily:  FONT_INTER,
          fontSize:    type.size.base,
          color:       v2.text.secondary,
          lineHeight:  1.5,
          margin:      `0 0 ${space.s24}`,
          maxWidth:    720,
        }}
      >
        14 Layer 2 primitives rendered live against real fixtures. Tap any
        primitive name pill to copy the import path. Status badges flag
        dormancy + lattice completeness where relevant. Remaining Layer 2
        primitives ship into this gallery incrementally as they mature
        (Tier B B3).
      </p>

      <FamilyHeader
        title="Session 149 kickoff trio"
        subtitle="Layer 2 primitive library kickoff — ShareSheet was the first consumer."
      />
      <CardGrid>
        <PrimitiveCard
          name="<BottomSheet>"
          importPath="components/ui/BottomSheet"
          propsLine="open · onClose · ariaLabel · children"
        >
          <BottomSheetDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<ChannelGrid>"
          importPath="components/ui/ChannelGrid"
          propsLine="tiles: (ChannelTile | CopyTile)[]"
        >
          <ChannelGridDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<SlimHeader>"
          importPath="components/ui/SlimHeader"
          propsLine="title · boothPill? · contextLabel? · addressLine?"
          status={{ tone: "notice", text: "3 consumers" }}
        >
          <SlimHeaderDemo />
        </PrimitiveCard>
      </CardGrid>

      <FamilyHeader
        title="3-tier engagement lattice"
        subtitle="Mall ★ favorite · Booth 🔖 bookmark · Find ♥ save. Outbound siblings in the share lattice. See project_layered_engagement_share_hierarchy memory."
      />
      <CardGrid>
        <PrimitiveCard
          name="<ShareBubble>"
          importPath="components/ShareBubble"
          propsLine='onClick · variant: "frosted" | "v2" · ariaLabel?'
        >
          <ShareBubbleDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<BookmarkBoothBubble>"
          importPath="components/BookmarkBoothBubble"
          propsLine="saved · onClick"
        >
          <BookmarkBoothBubbleDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<StarFavoriteBubble>"
          importPath="components/v2/StarFavoriteBubble"
          propsLine="isFavorite · onToggle · size?"
          status={{ tone: "dormant", text: "Dormant — awaits Favorite Mall ★" }}
        >
          <StarFavoriteBubbleDemo />
        </PrimitiveCard>
      </CardGrid>

      <FamilyHeader
        title="R17 location pair"
        subtitle="Distance + native-maps deep-link. Surfaces digital-to-physical bridge as live chrome."
      />
      <CardGrid>
        <PrimitiveCard
          name="<DistancePill>"
          importPath="components/DistancePill"
          propsLine="miles: number | null"
        >
          <DistancePillDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<LocationActions>"
          importPath="components/LocationActions"
          propsLine='mallSlug · mallLat · mallLng · surface: "find" | "booth" · postId? · vendorId?'
        >
          <LocationActionsDemo />
        </PrimitiveCard>
      </CardGrid>

      <FamilyHeader
        title="Masthead slot trio"
        subtitle="The three chrome bubbles that occupy masthead slots — Back / Profile / Share airplane."
      />
      <CardGrid>
        <PrimitiveCard
          name="<MastheadProfileButton>"
          importPath="components/MastheadProfileButton"
          propsLine="authedInitials? (explicit prop short-circuits hook-driven auth)"
        >
          <MastheadProfileButtonDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<MastheadBackButton>"
          importPath="components/MastheadBackButton"
          propsLine="fallback? · onClick?"
        >
          <MastheadBackButtonDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<MastheadPaperAirplane>"
          importPath="components/MastheadPaperAirplane"
          propsLine="size? · strokeWidth?"
        >
          <MastheadPaperAirplaneDemo />
        </PrimitiveCard>
      </CardGrid>

      <FamilyHeader
        title="Glyphs + forms"
        subtitle="FlagGlyph showcases the Phosphor weight-variant pattern (session 160). Form primitives anchor the post + auth flows."
      />
      <CardGrid>
        <PrimitiveCard
          name="<FlagGlyph>"
          importPath="components/FlagGlyph"
          propsLine='size? · weight?: "regular" | "bold" · filled? · strokeWidth?'
        >
          <FlagGlyphDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<FormField>"
          importPath="components/FormField"
          propsLine='label? · size?: "page" | "compact" · htmlFor? · children'
        >
          <FormFieldDemo />
        </PrimitiveCard>
        <PrimitiveCard
          name="<FormButton>"
          importPath="components/FormButton"
          propsLine='variant?: "primary" | "link" · size?: "page" | "compact"'
        >
          <FormButtonDemo />
        </PrimitiveCard>
      </CardGrid>
    </div>
  );
}
