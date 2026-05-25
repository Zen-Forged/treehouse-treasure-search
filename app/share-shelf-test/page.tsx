// app/share-shelf-test/page.tsx
//
// Session 196 Arc 1.6 — smoke route for Share My Shelf substrate.
// Per feedback_testbed_first_for_ai_unknowns ✅ Promoted at session 118
// (5th cumulative firing: postcard-test / search-bar-test / geolocation-
// test / vendors-test / share-shelf-test).
//
// Mounts all 4 Arc 1 components with fixture data so David can visually
// review the captured assets at scaled-down size BEFORE Arc 2 wires
// html2canvas-pro multi-card capture + native share path.
//
// Cards render at FULL 1080×1920 (or 1080×1350 for Feed) but wrap in
// transform: scale(0.3) so each fits in a viewport-reviewable slot. The
// transform doesn't affect html2canvas-pro capture in Arc 2 — wrapper
// will mount the unscaled component off-screen for capture.
//
// Visual layout: 4 Story panels side-by-side (hero + 3 finds + CTA) +
// 1 Feed panel below. Each panel labeled with its sequence position.

"use client";

import { StoryHeroCard } from "@/components/share-shelf/StoryHeroCard";
import { StoryFindCard } from "@/components/share-shelf/StoryFindCard";
import { StoryCtaCard } from "@/components/share-shelf/StoryCtaCard";
import { FeedCard } from "@/components/share-shelf/FeedCard";
import { FIXTURE_MALL, FIXTURE_POSTS } from "@/lib/fixtures";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import type { Vendor } from "@/types/treehouse";

// Pull first 3 fixture posts (all from FIXTURE_VENDORS[0] / FIXTURE_MALL).
const POSTS = FIXTURE_POSTS.slice(0, 3);

// FIXTURE_VENDORS isn't exported; derive vendor from posts[0].vendor (joined).
const VENDOR: Vendor = POSTS[0].vendor as Vendor;

const BOOTH_URL = `https://app.kentuckytreehouse.com/shelf/${VENDOR.slug}`;
const AI_HOOK   = "3 new finds on the shelf →";

// Scale factor for visual review (~30%). Cards render at full 1080×N
// then scale down via CSS transform; html2canvas capture in Arc 2 will
// target the unscaled DOM node.
const SCALE = 0.3;

export default function ShareShelfTestPage() {
  return (
    <div
      style={{
        minHeight:  "100vh",
        background: v2.bg.main,
        color:      v2.text.primary,
        padding:    "40px 32px 80px",
        fontFamily: FONT_INTER,
      }}
    >
      {/* ─── Page header ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto 40px" }}>
        <h1
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 500,
            fontSize:   36,
            margin:     "0 0 8px",
          }}
        >
          Share My Shelf — smoke route
        </h1>
        <p
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontSize:   18,
            color:      v2.text.secondary,
            margin:     "0 0 4px",
          }}
        >
          Arc 1 substrate review · Frame β multi-card Story sequence + Frame ii balanced co-brand
        </p>
        <p
          style={{
            fontSize:      12,
            color:         v2.text.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin:        "12px 0 0",
          }}
        >
          Session 196 · /share-shelf-test · cards shown at 30% of capture size
        </p>
      </div>

      {/* ─── Story sequence (5 cards) ─────────────────────────────── */}
      <Section title="Story sequence · 1080×1920 (IG/FB Story)" subtitle="Vendor posts as 5-slide Story sequence">
        <div
          style={{
            display:  "flex",
            gap:      24,
            overflowX: "auto",
            padding:  "8px 0",
          }}
        >
          <CardWrapper label="1 · Hero" width={1080 * SCALE} height={1920 * SCALE}>
            <StoryHeroCard
              vendor={VENDOR}
              mall={FIXTURE_MALL}
              findCount={3}
              aiHook={AI_HOOK}
            />
          </CardWrapper>

          <CardWrapper label="2 · Find" width={1080 * SCALE} height={1920 * SCALE}>
            <StoryFindCard post={POSTS[0]} vendor={VENDOR} index={1} />
          </CardWrapper>

          <CardWrapper label="3 · Find" width={1080 * SCALE} height={1920 * SCALE}>
            <StoryFindCard post={POSTS[1]} vendor={VENDOR} index={2} />
          </CardWrapper>

          <CardWrapper label="4 · Find" width={1080 * SCALE} height={1920 * SCALE}>
            <StoryFindCard post={POSTS[2]} vendor={VENDOR} index={3} />
          </CardWrapper>

          <CardWrapper label="5 · CTA" width={1080 * SCALE} height={1920 * SCALE}>
            <StoryCtaCard vendor={VENDOR} boothUrl={BOOTH_URL} />
          </CardWrapper>
        </div>
      </Section>

      {/* ─── Feed companion ────────────────────────────────────────── */}
      <Section title="Feed companion · 1080×1350 (FB feed / IG square)" subtitle="Single-card-repurposed from strongest find (D6)">
        <CardWrapper label="Feed · single-card-repurposed" width={1080 * SCALE} height={1350 * SCALE}>
          <FeedCard post={POSTS[0]} vendor={VENDOR} boothUrl={BOOTH_URL} />
        </CardWrapper>
      </Section>

      {/* ─── Component spec notes ──────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1400,
          margin:   "60px auto 0",
          padding:  20,
          background: v2.surface.card,
          border:   `1px solid ${v2.border.light}`,
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color:    v2.text.secondary,
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: v2.text.primary }}>
          Arc 1 substrate review notes
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Cards render at full 1080×1920 / 1080×1350 in DOM; visual scale here is CSS transform only — html2canvas capture in Arc 2 targets unscaled DOM.</li>
          <li>Fixture data: <code>FIXTURE_POSTS[0..2]</code> + joined vendor from <code>FIXTURE_VENDORS[0]</code> (Yesterday's Memories at America's Antique Mall, Bowling Green). Photos via picsum.photos seeded URLs.</li>
          <li>aiHook prop is static placeholder "3 new finds on the shelf →" — Arc 4 wires Sonnet caption-gen with format-aware prompts (Story sequence vs Feed single).</li>
          <li>boothUrl = production-shape <code>https://app.kentuckytreehouse.com/shelf/{`{slug}`}</code> — QR encodes full URL; URL-preview line in CTA strips protocol.</li>
          <li>Arc 2 next: <code>{`<ShelfImageShareScreen>`}</code> refactor — wraps these 4 components in off-screen capture mode + multi-card carousel preview + regenerate + reorder + navigator.share multi-file payload.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title:    string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ maxWidth: 1400, margin: "0 auto 48px" }}>
      <h2
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle:  "italic",
          fontWeight: 500,
          fontSize:   22,
          margin:     "0 0 4px",
          color:      v2.text.primary,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle:  "italic",
          fontSize:   14,
          color:      v2.text.muted,
          margin:     "0 0 16px",
        }}
      >
        {subtitle}
      </p>
      {children}
    </section>
  );
}

function CardWrapper({
  label,
  width,
  height,
  children,
}: {
  label:    string;
  width:    number;
  height:   number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        flexShrink:     0,
      }}
    >
      <div
        style={{
          width,
          height,
          overflow:    "hidden",
          background:  v2.bg.main,
          border:      `1px solid ${v2.border.light}`,
          borderRadius: 6,
          position:    "relative",
        }}
      >
        <div
          style={{
            transform:        `scale(${SCALE})`,
            transformOrigin:  "top left",
          }}
        >
          {children}
        </div>
      </div>
      <div
        style={{
          marginTop:     10,
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         v2.text.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}
