// components/MallHeroCard.tsx
// Mall Identity Hero Card — full-width, place-based, no custom image required.
// Item 2: MallHeroCard title reads "Treehouse Finds from [mall name]"
//         Address shown underneath as hyperlink to maps.

"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { mapsUrl } from "@/lib/utils";
import type { Mall } from "@/types/treehouse";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  green:       "#1e4d2b",
  greenSolid:  "rgba(30,77,43,0.92)",
  greenLight:  "rgba(30,77,43,0.13)",
  greenBorder: "rgba(30,77,43,0.26)",
  textPrimary: "#1a1a18",
  textMuted:   "#8a8478",
  border:      "rgba(26,26,24,0.10)",
  surface:     "#e8e4db",
  bg:          "#f0ede6",
};

// ─── Background style variants ────────────────────────────────────────────────

type HeroStyle = "default" | "golden" | "forest" | "terracotta" | "slate";

const HERO_GRADIENTS: Record<HeroStyle, string> = {
  default:    "linear-gradient(135deg, #3d2b1a 0%, #5c3d20 35%, #2a3d1e 100%)",
  golden:     "linear-gradient(140deg, #2e1f0a 0%, #6b4a1a 40%, #3d2a08 100%)",
  forest:     "linear-gradient(135deg, #0d1f0e 0%, #1e4d2b 45%, #0a2a10 100%)",
  terracotta: "linear-gradient(135deg, #2d1208 0%, #6b2c12 40%, #3d1e0e 100%)",
  slate:      "linear-gradient(140deg, #0e1520 0%, #243344 40%, #0a1018 100%)",
};

const HERO_STYLES: HeroStyle[] = ["default", "golden", "forest", "terracotta", "slate"];

function pickStyle(mallName: string): HeroStyle {
  let hash = 0;
  for (let i = 0; i < mallName.length; i++) hash = (hash * 31 + mallName.charCodeAt(i)) | 0;
  return HERO_STYLES[Math.abs(hash) % HERO_STYLES.length];
}

const NOISE_OVERLAY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")";

// ─── Generic hero (all malls / no mall selected) ───────────────────────────────

interface GenericHeroProps {
  onExplore: () => void;
}

export function GenericMallHero({ onExplore }: GenericHeroProps) {
  return (
    <MallHeroCardInner
      gradient={HERO_GRADIENTS.default}
      eyebrow="Treehouse Finds"
      title="What will you find today?"
      subtitle={"Found across Kentucky's antique malls. A closer look at what's worth the trip."}
      ctaLabel="Explore all finds"
      onExplore={onExplore}
    />
  );
}

// ─── Mall-specific hero ────────────────────────────────────────────────────────

export interface MallHeroProps {
  mall: Mall & {
    hero_title?:     string | null;
    hero_subtitle?:  string | null;
    hero_style?:     string | null;
    hero_image_url?: string | null;
  };
  onExplore: () => void;
}

export function MallHeroCard({ mall, onExplore }: MallHeroProps) {
  const style    = (mall.hero_style as HeroStyle) ?? pickStyle(mall.name);
  const gradient = HERO_GRADIENTS[style] ?? HERO_GRADIENTS.default;
  // Item 2: title reads "Treehouse Finds from [mall name]"
  const title    = `Treehouse Finds from ${mall.name}`;
  const address  = mall.address ?? null;
  const mapLink  = address
    ? mapsUrl(address)
    : mapsUrl(`${mall.name} ${mall.city ?? ""} ${mall.state ?? ""}`);

  return (
    <MallHeroCardInner
      gradient={gradient}
      bgImage={mall.hero_image_url ?? undefined}
      eyebrow="Now showing"
      title={title}
      subtitle={undefined}
      addressLine={address ?? (mall.city ? `${mall.city}${mall.state ? `, ${mall.state}` : ""}` : undefined)}
      mapLink={mapLink}
      ctaLabel="Explore this spot →"
      onExplore={onExplore}
    />
  );
}

// ─── Shared inner renderer ─────────────────────────────────────────────────────

interface InnerProps {
  gradient:     string;
  bgImage?:     string;
  eyebrow:      string;
  title:        string;
  subtitle?:    string;
  addressLine?: string;
  mapLink?:     string;
  ctaLabel:     string;
  onExplore:    () => void;
}

function MallHeroCardInner({ gradient, bgImage, eyebrow, title, subtitle, addressLine, mapLink, ctaLabel, onExplore }: InnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={onExplore}
    >
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, background: gradient, zIndex: 0 }} />

      {bgImage && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.35, zIndex: 1,
        }} />
      )}

      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: NOISE_OVERLAY,
        backgroundRepeat: "repeat", backgroundSize: "200px 200px",
        zIndex: 2, pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(0,0,0,0.38) 100%)",
        zIndex: 3, pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 4, padding: "22px 20px 20px" }}>

        <div style={{
          fontSize: 10, fontWeight: 500, letterSpacing: "2.4px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.52)",
          marginBottom: 8,
          fontFamily: "system-ui, sans-serif",
        }}>
          {eyebrow}
        </div>

        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.3px",
          lineHeight: 1.25,
          marginBottom: addressLine ? 8 : 12,
          textShadow: "0 1px 8px rgba(0,0,0,0.35)",
        }}>
          {title}
        </div>

        {/* Address — hyperlink to maps */}
        {addressLine && mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              marginBottom: 14, textDecoration: "none",
            }}
          >
            <MapPin size={9} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0 }} />
            <span style={{
              fontSize: 11, color: "rgba(255,255,255,0.70)",
              letterSpacing: "0.3px", fontFamily: "system-ui, sans-serif",
              borderBottom: "1px solid rgba(255,255,255,0.30)",
            }}>
              {addressLine}
            </span>
          </a>
        )}

        {/* Subtitle — generic hero only */}
        {subtitle && (
          <div style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.60)",
            lineHeight: 1.6,
            marginBottom: 18,
            maxWidth: 270,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}>
            {subtitle}
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); onExplore(); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 22,
            fontSize: 12, fontWeight: 600, letterSpacing: "0.2px",
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.96)",
            background: C.greenSolid,
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(30,77,43,0.45), 0 1px 3px rgba(0,0,0,0.2)",
            marginTop: subtitle ? 0 : 6,
          }}
        >
          {ctaLabel}
          <ArrowRight size={12} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        zIndex: 5,
      }} />
    </motion.div>
  );
}
