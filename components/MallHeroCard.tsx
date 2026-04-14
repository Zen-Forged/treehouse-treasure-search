// components/MallHeroCard.tsx
// Mall Identity Hero Card.
// Item 1: Mall hero eyebrow = "Treehouse Finds from", mall name is the next line.
// Item 2: No CTA button on mall-specific heroes — generic hero keeps its button.

"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { mapsUrl } from "@/lib/utils";
import type { Mall } from "@/types/treehouse";

const C = {
  greenSolid: "rgba(30,77,43,0.92)",
};

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

// ─── Generic hero (no mall selected) ─────────────────────────────────────────

export function GenericMallHero({ onExplore }: { onExplore: () => void }) {
  return (
    <HeroCard
      gradient={HERO_GRADIENTS.default}
      eyebrow="Treehouse Finds"
      title="What will you find today?"
      subtitle="Found across Kentucky's antique malls. A closer look at what's worth the trip."
      showCta
      onExplore={onExplore}
    />
  );
}

// ─── Mall-specific hero ────────────────────────────────────────────────────────

export interface MallHeroProps {
  mall: Mall & {
    hero_style?:     string | null;
    hero_image_url?: string | null;
  };
  onExplore: () => void;
}

export function MallHeroCard({ mall, onExplore }: MallHeroProps) {
  const style    = (mall.hero_style as HeroStyle) ?? pickStyle(mall.name);
  const gradient = HERO_GRADIENTS[style] ?? HERO_GRADIENTS.default;
  const address  = mall.address ?? null;
  const mapLink  = address
    ? mapsUrl(address)
    : mapsUrl(`${mall.name} ${mall.city ?? ""} ${mall.state ?? ""}`);
  const addressLine = address ?? (mall.city ? `${mall.city}${mall.state ? `, ${mall.state}` : ""}` : undefined);

  return (
    <HeroCard
      gradient={gradient}
      bgImage={mall.hero_image_url ?? undefined}
      // Item 1: eyebrow = "Treehouse Finds from", title = mall name on next line
      eyebrow="Treehouse Finds from"
      title={mall.name}
      addressLine={addressLine}
      mapLink={mapLink}
      // Item 2: no CTA button on mall heroes
      showCta={false}
      onExplore={onExplore}
    />
  );
}

// ─── Shared card renderer ──────────────────────────────────────────────────────

interface HeroCardProps {
  gradient:     string;
  bgImage?:     string;
  eyebrow:      string;
  title:        string;
  subtitle?:    string;
  addressLine?: string;
  mapLink?:     string;
  showCta:      boolean;
  onExplore:    () => void;
}

function HeroCard({ gradient, bgImage, eyebrow, title, subtitle, addressLine, mapLink, showCta, onExplore }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        borderRadius: 18, overflow: "hidden", position: "relative",
        boxShadow: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)",
        cursor: showCta ? "pointer" : "default",
        userSelect: "none",
      }}
      onClick={showCta ? onExplore : undefined}
    >
      {/* Gradient background */}
      <div style={{ position: "absolute", inset: 0, background: gradient, zIndex: 0 }} />

      {bgImage && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.35, zIndex: 1,
        }} />
      )}

      {/* Noise */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: NOISE_OVERLAY,
        backgroundRepeat: "repeat", backgroundSize: "200px 200px",
        zIndex: 2, pointerEvents: "none",
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(0,0,0,0.38) 100%)",
        zIndex: 3, pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 4, padding: "22px 20px 20px" }}>

        {/* Eyebrow — "Treehouse Finds from" or "Treehouse Finds" */}
        <div style={{
          fontSize: 10, fontWeight: 500, letterSpacing: "2.2px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.52)",
          marginBottom: 6,
          fontFamily: "system-ui, sans-serif",
        }}>
          {eyebrow}
        </div>

        {/* Title — mall name (or generic question) */}
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 24,
          fontWeight: 700,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.4px",
          lineHeight: 1.2,
          marginBottom: addressLine ? 10 : subtitle ? 12 : 0,
          textShadow: "0 1px 8px rgba(0,0,0,0.35)",
        }}>
          {title}
        </div>

        {/* Address hyperlink */}
        {addressLine && mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              marginBottom: showCta ? 16 : 4,
              textDecoration: "none",
            }}
          >
            <MapPin size={9} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0 }} />
            <span style={{
              fontSize: 11, color: "rgba(255,255,255,0.70)",
              letterSpacing: "0.3px", fontFamily: "system-ui, sans-serif",
              borderBottom: "1px solid rgba(255,255,255,0.28)",
            }}>
              {addressLine}
            </span>
          </a>
        )}

        {/* Subtitle — generic hero only */}
        {subtitle && (
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.60)",
            lineHeight: 1.6, marginBottom: 18, maxWidth: 270,
            fontFamily: "Georgia, serif", fontStyle: "italic",
          }}>
            {subtitle}
          </div>
        )}

        {/* CTA — generic hero only (item 2: hidden on mall heroes) */}
        {showCta && (
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
            }}
          >
            Explore all finds
            <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        zIndex: 5,
      }} />
    </motion.div>
  );
}
