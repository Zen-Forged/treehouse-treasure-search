// app/review-board/StyleGuideFoundations.tsx
//
// Style guide — Foundations section. 5 sub-sections ordered by visual
// weight + feedback-criticality per D3:
//   1. Color   (load-bearing — surfaces the green-drift call-out)
//   2. Type    (feedback-vocabulary critical)
//   3. Space   (reference)
//   4. Radius  (reference)
//   5. Shadow  (reference + Tier B headroom call-out for v2.shadow.*)
//
// Pure composition over live token imports — flipping a value in
// :root ripples through the rendered swatches instantly per D13.
// Each section carries its own DOM id for StickyAnchorNav to observe.
//
// Contract locked at docs/style-guide-on-review-board-design.md
// D3 + D7 + D8 + D9 + D10.

import {
  v1,
  v2,
  colors,
  space,
  radius,
  type,
  FONT_CORMORANT,
  FONT_INTER,
} from "@/lib/tokens";
import TokenCopyButton from "./TokenCopyButton";

const MONO_FONT = "ui-monospace, SFMono-Regular, monospace";

// ─────────────────────────────────────────────────────────────────────────────
// Shared section + row primitives — keep visual rhythm consistent.
// ─────────────────────────────────────────────────────────────────────────────

interface SectionShellProps {
  id:        string;
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}

function SectionShell({ id, title, subtitle, children }: SectionShellProps) {
  return (
    <section id={id} style={{ marginBottom: 64, scrollMarginTop: 96 }}>
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
      {subtitle && (
        <p
          style={{
            fontFamily: FONT_INTER,
            fontSize:   type.size.sm,
            color:      v2.text.secondary,
            lineHeight: 1.5,
            margin:     "6px 0 24px",
            maxWidth:   720,
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background:    v2.surface.card,
        border:        `1px solid ${v2.border.light}`,
        borderRadius:  radius.md,
        padding:       space.s16,
      }}
    >
      {children}
    </div>
  );
}

function MonoLabel({ text }: { text: string }) {
  return (
    <code
      style={{
        fontFamily: MONO_FONT,
        fontSize:   type.size.xs,
        color:      v2.text.muted,
        lineHeight: 1.4,
      }}
    >
      {text}
    </code>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Color — 5 groupings per D7. Greens lead because that's the drift David
// flagged in session 162.
// ─────────────────────────────────────────────────────────────────────────────

interface ColorSwatchProps {
  token:    string;   // canonical token path
  value:    string;   // resolved CSS-var ref or raw value to paint
  hex:      string;   // human-readable hex (shown in monospace under swatch)
  notes?:   string;   // optional in-cell usage guidance
}

function ColorSwatch({ token, value, hex, notes }: ColorSwatchProps) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           space.s8,
        minWidth:      160,
      }}
    >
      <div
        style={{
          width:         "100%",
          height:        64,
          background:    value,
          borderRadius:  radius.sm,
          border:        `1px solid ${v2.border.light}`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <TokenCopyButton tokenName={token} />
        <MonoLabel text={hex} />
        {notes && (
          <div
            style={{
              fontFamily: FONT_INTER,
              fontSize:   type.size.xs,
              color:      v2.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {notes}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display:     "flex",
        gap:         space.s16,
        flexWrap:    "wrap",
        marginBottom: space.s16,
      }}
    >
      {children}
    </div>
  );
}

function ColorGroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        fontFamily: FONT_INTER,
        fontSize:   type.size.sm,
        fontWeight: 600,
        color:      v2.text.primary,
        margin:     "0 0 12px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h4>
  );
}

function GreenDriftCallout() {
  return (
    <div
      style={{
        background:   v2.accent.greenSoft,
        border:       `1px solid ${v2.border.light}`,
        borderRadius: radius.md,
        padding:      space.s16,
        marginBottom: space.s16,
      }}
    >
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.sm,
          fontWeight: 600,
          color:      v2.accent.greenDark,
          marginBottom: 6,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Drift resolved · Session 168
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.sm,
          color:      v2.text.primary,
          lineHeight: 1.55,
        }}
      >
        All three primary greens (v1.green / v2.accent.green / colors.green)
        now resolve to the single canonical hex <strong>#1F4A31</strong> at
        the :root layer. Token names preserved for backwards-compat;
        v2.accent.greenDark is the preferred name for new work. Intentional
        variants kept distinct: greenMid for &quot;saved/active toggle&quot; bg,
        greenSoft for soft accent surfaces.
      </div>
    </div>
  );
}

function ColorSection() {
  return (
    <SectionShell
      id="color"
      title="Color"
      subtitle="Five canonical groupings. Greens lead because the 3-tier drift was resolved at session 168 — all primary-green tokens now resolve to a single canonical hex via :root."
    >
      <GreenDriftCallout />

      <ColorGroupTitle>Greens · canonical + variants</ColorGroupTitle>
      <ColorRow>
        <ColorSwatch
          token="v2.accent.greenDark"
          value={v2.accent.greenDark}
          hex="#1F4A31"
          notes="Canonical primary. Preferred name for new work."
        />
        <ColorSwatch
          token="v2.accent.green"
          value={v2.accent.green}
          hex="#1F4A31"
          notes="Resolves to canonical. Most-consumed name today."
        />
        <ColorSwatch
          token="v1.green"
          value={v1.green}
          hex="#1F4A31"
          notes="Resolves to canonical. Used by v1 surfaces."
        />
        <ColorSwatch
          token="colors.green"
          value={colors.green}
          hex="#1F4A31"
          notes="Resolves to canonical. Used by v0.2 admin only."
        />
        <ColorSwatch
          token="v2.accent.greenMid"
          value={v2.accent.greenMid}
          hex="#1F4A31"
          notes="Resolves to canonical. v2 CTA button-fill across all 3 lattice tiers."
        />
        <ColorSwatch
          token="v2.accent.greenSoft"
          value={v2.accent.greenSoft}
          hex="#E8EEE6"
          notes="Intentional variant — soft accent surface tint."
        />
      </ColorRow>

      <ColorGroupTitle>Reds · destructive + error</ColorGroupTitle>
      <ColorRow>
        <ColorSwatch
          token="v1.red"
          value={v1.red}
          hex="#8b2020"
          notes="v1 destructive."
        />
        <ColorSwatch
          token="v2.accent.red"
          value={v2.accent.red}
          hex="#8B2020"
          notes="v2 error text/glyph. Matches v1 hue — keep aligned during palette flips."
        />
      </ColorRow>

      <ColorGroupTitle>Ambers · notices</ColorGroupTitle>
      <ColorRow>
        <ColorSwatch
          token="v1.amber"
          value={v1.amber}
          hex="#7a5c1e"
          notes="v1 graceful-collapse notices. No v2 amber yet — gap will surface when admin status pills migrate."
        />
      </ColorRow>

      <ColorGroupTitle>Cream + paper surfaces</ColorGroupTitle>
      <ColorRow>
        <ColorSwatch
          token="v1.paperCream"
          value={v1.paperCream}
          hex="#f2ecd8"
          notes="v1 page surface."
        />
        <ColorSwatch
          token="v1.postit"
          value={v1.postit}
          hex="#fefae8"
          notes="v1 post-it stamp + cartographic card."
        />
        <ColorSwatch
          token="v2.bg.main"
          value={v2.bg.main}
          hex="#E6DECF"
          notes="Unified v2 body + page + masthead chrome. v2.bg.tabs alias resolves to the same value."
        />
        <ColorSwatch
          token="v2.surface.card"
          value={v2.surface.card}
          hex="#FFFCF5"
          notes="v2 card surface — sits on bg.main."
        />
        <ColorSwatch
          token="v2.surface.warm"
          value={v2.surface.warm}
          hex="#FBF6EA"
          notes="v2 pill/bubble warm surface."
        />
      </ColorRow>

      <ColorGroupTitle>Ink + text ramps · canonical 3-step + hairline</ColorGroupTitle>
      <ColorRow>
        <ColorSwatch
          token="v2.text.primary"
          value={v2.text.primary}
          hex="#2B211A"
          notes="Canonical body + heading. v1.inkPrimary + colors.textPrimary resolve here."
        />
        <ColorSwatch
          token="v2.text.secondary"
          value={v2.text.secondary}
          hex="#5C5246"
          notes="Canonical metadata + eyebrow. AA-contrast on bg.main. v1.inkMid + colors.textMid resolve here."
        />
        <ColorSwatch
          token="v2.text.muted"
          value={v2.text.muted}
          hex="#A39686"
          notes="Canonical placeholder + disabled. v1.inkMuted + v1.inkFaint + colors.textMuted + colors.textFaint resolve here."
        />
        <ColorSwatch
          token="v1.inkHairline"
          value={v1.inkHairline}
          hex="rgba(42,26,10,0.18)"
          notes="Divider/border only — NOT text. 64 consumers. Preserved through ink consolidation."
        />
      </ColorRow>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Type — all 9 type.size.* steps × 3 font families per D8.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_COPY = "Sample text in Treehouse rhythm";

const TYPE_STEPS: { token: string; size: string; px: number }[] = [
  { token: "type.size.xxs",  size: type.size.xxs,  px: 9  },
  { token: "type.size.xs",   size: type.size.xs,   px: 11 },
  { token: "type.size.sm",   size: type.size.sm,   px: 13 },
  { token: "type.size.base", size: type.size.base, px: 14 },
  { token: "type.size.md",   size: type.size.md,   px: 16 },
  { token: "type.size.lg",   size: type.size.lg,   px: 18 },
  { token: "type.size.xl",   size: type.size.xl,   px: 22 },
  { token: "type.size.2xl",  size: type.size["2xl"], px: 26 },
  { token: "type.size.3xl",  size: type.size["3xl"], px: 32 },
];

function TypeSection() {
  return (
    <SectionShell
      id="type"
      title="Type scale"
      subtitle="9 steps × 3 font families (Cormorant 500 · Inter 400 · Inter 600). Same sample copy at each step — visual delta is purely scale-driven."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
        {TYPE_STEPS.map((step) => (
          <CardShell key={step.token}>
            <div
              style={{
                display:        "flex",
                alignItems:     "baseline",
                justifyContent: "space-between",
                gap:            space.s16,
                marginBottom:   space.s12,
                flexWrap:       "wrap",
              }}
            >
              <TokenCopyButton tokenName={step.token} />
              <MonoLabel text={`${step.px}px`} />
            </div>
            <div
              style={{
                display:        "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap:            space.s16,
              }}
            >
              <div>
                <div style={{ fontFamily: FONT_CORMORANT, fontSize: step.size, fontWeight: 500, color: v2.text.primary, lineHeight: 1.3 }}>
                  {SAMPLE_COPY}
                </div>
                <MonoLabel text="Cormorant 500" />
              </div>
              <div>
                <div style={{ fontFamily: FONT_INTER, fontSize: step.size, fontWeight: 400, color: v2.text.primary, lineHeight: 1.3 }}>
                  {SAMPLE_COPY}
                </div>
                <MonoLabel text="Inter 400" />
              </div>
              <div>
                <div style={{ fontFamily: FONT_INTER, fontSize: step.size, fontWeight: 600, color: v2.text.primary, lineHeight: 1.3 }}>
                  {SAMPLE_COPY}
                </div>
                <MonoLabel text="Inter 600" />
              </div>
            </div>
          </CardShell>
        ))}
      </div>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Space — 9 canonical steps as horizontal rulers per D9.
// ─────────────────────────────────────────────────────────────────────────────

const SPACE_STEPS: { token: string; value: string; px: number }[] = [
  { token: "space.s2",  value: space.s2,  px: 2  },
  { token: "space.s4",  value: space.s4,  px: 4  },
  { token: "space.s8",  value: space.s8,  px: 8  },
  { token: "space.s12", value: space.s12, px: 12 },
  { token: "space.s16", value: space.s16, px: 16 },
  { token: "space.s24", value: space.s24, px: 24 },
  { token: "space.s32", value: space.s32, px: 32 },
  { token: "space.s48", value: space.s48, px: 48 },
  { token: "space.s64", value: space.s64, px: 64 },
];

function SpaceSection() {
  return (
    <SectionShell
      id="space"
      title="Space scale"
      subtitle="9 canonical steps. Bar width matches the exact value at each step — visual proof of the rhythm."
    >
      <CardShell>
        <div style={{ display: "flex", flexDirection: "column", gap: space.s12 }}>
          {SPACE_STEPS.map((step) => (
            <div
              key={step.token}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        space.s16,
              }}
            >
              <div style={{ minWidth: 110 }}>
                <TokenCopyButton tokenName={step.token} />
              </div>
              <div style={{ minWidth: 48 }}>
                <MonoLabel text={`${step.px}px`} />
              </div>
              <div
                style={{
                  height:       16,
                  width:        step.value,
                  background:   v2.accent.green,
                  borderRadius: radius.sm,
                }}
              />
            </div>
          ))}
        </div>
      </CardShell>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Radius — 5 canonical steps as 80×80 swatches per D9.
// ─────────────────────────────────────────────────────────────────────────────

const RADIUS_STEPS: { token: string; value: string; label: string }[] = [
  { token: "radius.sm",   value: radius.sm,   label: "8px"  },
  { token: "radius.md",   value: radius.md,   label: "12px" },
  { token: "radius.lg",   value: radius.lg,   label: "16px" },
  { token: "radius.xl",   value: radius.xl,   label: "20px" },
  { token: "radius.pill", value: radius.pill, label: "999px (pill)" },
];

function RadiusSection() {
  return (
    <SectionShell
      id="radius"
      title="Radius scale"
      subtitle="5 canonical steps. 80×80 swatches show the corner curvature applied at each step."
    >
      <CardShell>
        <div
          style={{
            display:   "flex",
            gap:       space.s24,
            flexWrap:  "wrap",
          }}
        >
          {RADIUS_STEPS.map((step) => (
            <div
              key={step.token}
              style={{ display: "flex", flexDirection: "column", gap: space.s8, alignItems: "center" }}
            >
              <div
                style={{
                  width:        80,
                  height:       80,
                  background:   v2.accent.green,
                  borderRadius: step.value,
                }}
              />
              <TokenCopyButton tokenName={step.token} />
              <MonoLabel text={step.label} />
            </div>
          ))}
        </div>
      </CardShell>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Shadow — 8 v1.shadow.* tokens rendered on cream-card-over-paper per D10.
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_STEPS: { token: string; key: keyof typeof v1.shadow; css: string }[] = [
  { token: "v1.shadow.polaroid",        key: "polaroid",        css: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)" },
  { token: "v1.shadow.polaroidPin",     key: "polaroidPin",     css: "0 6px 14px rgba(42,26,10,0.32), 0 0 0 0.5px rgba(42,26,10,0.16)" },
  { token: "v1.shadow.ctaGreen",        key: "ctaGreen",        css: "0 2px 12px rgba(30,77,43,0.22)" },
  { token: "v1.shadow.ctaGreenCompact", key: "ctaGreenCompact", css: "0 2px 10px rgba(30,77,43,0.18)" },
  { token: "v1.shadow.sheetRise",       key: "sheetRise",       css: "0 -8px 30px rgba(30,20,10,0.28)" },
  { token: "v1.shadow.cardSubtle",      key: "cardSubtle",      css: "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)" },
  { token: "v1.shadow.postcard",        key: "postcard",        css: "0 4px 14px rgba(42,26,10,0.16), 0 1px 2px rgba(42,26,10,0.08)" },
  { token: "v1.shadow.callout",         key: "callout",         css: "0 8px 20px rgba(42,26,10,0.22), 0 2px 6px rgba(42,26,10,0.10)" },
];

function V2ShadowGapNote() {
  return (
    <div
      style={{
        background:   v2.surface.warm,
        border:       `1px dashed ${v2.border.medium}`,
        borderRadius: radius.md,
        padding:      space.s16,
        marginBottom: space.s24,
      }}
    >
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.sm,
          fontWeight: 600,
          color:      v2.text.primary,
          marginBottom: 6,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Tier B headroom — v2.shadow.* tier not yet extracted
      </div>
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize:   type.size.sm,
          color:      v2.text.secondary,
          lineHeight: 1.55,
        }}
      >
        Session 159 inlined v1.shadow.polaroid in BottomNav (2nd consumer
        outside its named-context). A 3rd inline-shadow consumer surfacing
        triggers the v2.shadow.* design pass + extraction. Captured as
        audit G2 + design record Tier B B7.
      </div>
    </div>
  );
}

function ShadowSection() {
  return (
    <SectionShell
      id="shadow"
      title="Shadow scale"
      subtitle="8 v1.shadow.* tokens rendered on a cream card over paper bg so the shadow is visible against backing color."
    >
      <V2ShadowGapNote />
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 space.s24,
        }}
      >
        {SHADOW_STEPS.map((step) => (
          <div key={step.token}>
            <div
              style={{
                width:        "100%",
                height:       120,
                background:   v2.surface.card,
                borderRadius: radius.md,
                boxShadow:    v1.shadow[step.key],
                marginBottom: space.s12,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <TokenCopyButton tokenName={step.token} />
              <MonoLabel text={step.css} />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Foundations root — composes 5 sections under the id="foundations" wrapper.
// ─────────────────────────────────────────────────────────────────────────────

export default function StyleGuideFoundations() {
  return (
    <div id="foundations" style={{ scrollMarginTop: 96 }}>
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
        Foundations
      </h2>
      <p
        style={{
          fontFamily:  FONT_INTER,
          fontSize:    type.size.base,
          color:       v2.text.secondary,
          lineHeight:  1.5,
          margin:      `0 0 ${space.s32}`,
          maxWidth:    720,
        }}
      >
        Color, type, space, radius, and shadow. Every swatch carries a
        copy-to-clipboard button — tap to paste the canonical token path
        into NotesPanel feedback. Values resolve live from{" "}
        <code style={{ fontFamily: MONO_FONT, fontSize: type.size.sm }}>
          lib/tokens.ts
        </code>{" "}
        + <code style={{ fontFamily: MONO_FONT, fontSize: type.size.sm }}>:root</code>{" "}
        CSS variables; flipping a value ripples through every swatch instantly.
      </p>

      <ColorSection />
      <TypeSection />
      <SpaceSection />
      <RadiusSection />
      <ShadowSection />
    </div>
  );
}
