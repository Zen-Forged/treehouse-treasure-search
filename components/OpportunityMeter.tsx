// components/OpportunityMeter.tsx
// Decision-support layer — refactored from "verdict first" to "value first".
//
// PRESENTATION ONLY — all 4 underlying signals (profit, speed, confidence, effort)
// are preserved and still power every label on this screen. Nothing in
// opportunityScore.ts was changed.
//
// New information hierarchy:
//   1. Estimated Value   (medianSoldPrice + range)
//   2. Sellability       (derived: Demand + Velocity → speed signal)
//   3. Market Pressure   (derived: Competition → effort signal)
//   4. Confidence badge  (trust indicator, not main verdict)
//   5. Buy Under         (hero decision output — replaces Strong Buy / Maybe / Pass)
//   6. Why this score?   (expandable breakdown — unchanged)
"use client";

import { useState, useEffect, useRef } from "react";
import { computeOpportunityScore, type ScoringInput } from "@/lib/opportunityScore";

// ─── Derived presentation labels ─────────────────────────────────────────────
// Pure functions of existing signal values — no scoring logic changed.

function sellabilityLabel(speed: number): { label: string; level: "high" | "mid" | "low" } {
  if (speed >= 65) return { label: "Sells Quickly",    level: "high" };
  if (speed >= 38) return { label: "Moves Steadily",   level: "mid"  };
  return              { label: "Slow Mover",            level: "low"  };
}

function marketPressureLabel(effort: number): { label: string; level: "low" | "mid" | "high" } {
  if (effort <= 30) return { label: "Low Competition",  level: "low"  };
  if (effort <= 62) return { label: "Some Competition", level: "mid"  };
  return               { label: "Crowded Market",       level: "high" };
}

function confidenceCopy(confidence: number, compCount: number): string {
  const n = compCount > 0 ? ` · ${compCount} sale${compCount !== 1 ? "s" : ""}` : "";
  if (confidence >= 65) return `Strong data${n}`;
  if (confidence >= 38) return `Moderate data${n}`;
  return `Thin data — review comps`;
}

// "Buy Under" threshold — the main decision output.
// Derived from score + medianSoldPrice, no new inputs required.
function buyUnderThreshold(
  score:           number,
  medianSoldPrice: number,
  priceRangeLow:   number,
): { copy: string; price: number | null } {
  if (medianSoldPrice <= 0) return { copy: "Not enough data", price: null };

  if (score >= 75) {
    // Strong signal: buy under the low end of the range
    const threshold = priceRangeLow > 0
      ? Math.round(priceRangeLow * 0.95)
      : Math.round(medianSoldPrice * 0.55);
    return { copy: `Worth it under`, price: threshold };
  }
  if (score >= 55) {
    const threshold = Math.round(medianSoldPrice * 0.62);
    return { copy: `Good buy under`, price: threshold };
  }
  if (score >= 38) {
    const threshold = Math.round(medianSoldPrice * 0.45);
    return { copy: `Maybe at`, price: threshold };
  }
  return { copy: "Hard to make this work", price: null };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  high: { text: "#6dbc6d", bg: "rgba(109,188,109,0.1)", border: "rgba(109,188,109,0.2)" },
  mid:  { text: "#c8b47e", bg: "rgba(200,180,126,0.1)", border: "rgba(200,180,126,0.2)" },
  low:  { text: "#a07868", bg: "rgba(160,120,104,0.1)", border: "rgba(160,120,104,0.2)" },
} as const;

// Pressure level color is inverted — low competition is good
const PRESSURE_COLOR = {
  low:  LEVEL_COLOR.high,
  mid:  LEVEL_COLOR.mid,
  high: LEVEL_COLOR.low,
} as const;

// ─── Signal bar (unchanged from before) ──────────────────────────────────────

function SignalBar({
  label, value, valueLabel, inverted = false, delay = 0,
}: {
  label: string; value: number; valueLabel: string;
  inverted?: boolean; delay?: number;
}) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const level = inverted
    ? (value <= 30 ? "high" : value <= 60 ? "moderate" : "low")
    : (value >= 70 ? "high" : value >= 40 ? "moderate" : "low");

  const barColor =
    level === "high"     ? "#6dbc6d" :
    level === "moderate" ? "#c8b47e" : "#9a7a5a";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 72, flexShrink: 0, fontSize: 10, color: "#5a4828", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${animVal}%`, borderRadius: 1,
          background: barColor, opacity: 0.7,
          transition: `width 0.85s cubic-bezier(0.34,1.05,0.64,1) ${delay}ms`,
        }} />
      </div>
      <div style={{ width: 54, flexShrink: 0, textAlign: "right", fontSize: 11, fontWeight: 500, color: barColor, textTransform: "capitalize" }}>
        {valueLabel}
      </div>
    </div>
  );
}

// ─── Pill badge ───────────────────────────────────────────────────────────────

function Pill({ label, colors, delay = 0 }: {
  label:  string;
  colors: { text: string; bg: string; border: string };
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      padding: "5px 11px", borderRadius: 20,
      fontSize: 12, fontWeight: 500, letterSpacing: "0.1px",
      color:      colors.text,
      background: colors.bg,
      border:     `1px solid ${colors.border}`,
      opacity:    visible ? 1 : 0,
      transform:  visible ? "translateY(0)" : "translateY(4px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      {label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OpportunityMeter({
  input,
  onScrollToComps,
}: {
  input: ScoringInput;
  onScrollToComps?: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  const result = computeOpportunityScore(input);
  const { score, signals, detail } = result;

  // Derived presentation labels — all from existing signal values
  const sellability = sellabilityLabel(signals.speed);
  const pressure    = marketPressureLabel(signals.effort);
  const confCopy    = confidenceCopy(signals.confidence, input.compCount);
  const buyUnder    = buyUnderThreshold(score, input.medianSoldPrice, input.priceRangeLow);

  // Buy Under color mirrors the overall score health
  const buyUnderColor =
    score >= 75 ? "#6dbc6d" :
    score >= 55 ? "#c8b47e" :
    score >= 38 ? "#a8904e" : "#9a7a5a";

  return (
    <div style={{
      borderRadius: 18,
      background: "rgba(11,26,11,0.55)",
      border: "1px solid rgba(200,180,126,0.1)",
      overflow: "hidden",
    }}>

      {/* ── Block 1: Sellability + Market Pressure pills ── */}
      <div style={{
        padding: "16px 18px 14px",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        borderBottom: "1px solid rgba(200,180,126,0.06)",
      }}>
        <Pill label={sellability.label}  colors={LEVEL_COLOR[sellability.level]}    delay={0}   />
        <Pill label={pressure.label}     colors={PRESSURE_COLOR[pressure.level]}    delay={80}  />
      </div>

      {/* ── Block 2: Confidence badge + comp count ── */}
      <div style={{
        padding: "10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(200,180,126,0.04)",
      }}>
        <span style={{ fontSize: 11, color: "#6a5528", letterSpacing: "0.2px" }}>
          {confCopy}
        </span>
        {onScrollToComps && input.compCount > 0 && (
          <button
            onClick={onScrollToComps}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "#4a3a1e",
              padding: 0, display: "flex", alignItems: "center", gap: 3,
            }}>
            See comps
            <span style={{ fontSize: 10, opacity: 0.5 }}>↓</span>
          </button>
        )}
      </div>

      {/* ── Block 3: Buy Under — hero decision output ── */}
      <div style={{
        padding: "18px 18px 16px",
        borderBottom: "1px solid rgba(200,180,126,0.06)",
      }}>
        <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>
          Decision
        </div>
        {buyUnder.price != null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#7a6535", fontWeight: 400, letterSpacing: "0.1px" }}>
              {buyUnder.copy}
            </span>
            <span style={{
              fontFamily: "Georgia, serif",
              fontSize: 32, fontWeight: 700, lineHeight: 1,
              color: buyUnderColor,
              letterSpacing: -0.5,
            }}>
              ${buyUnder.price}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 15, color: "#7a6535", fontStyle: "italic" }}>
            {buyUnder.copy}
          </div>
        )}
      </div>

      {/* ── Block 4: Signal bars (unchanged data, relabelled) ── */}
      <div style={{ padding: "14px 18px 12px", display: "flex", flexDirection: "column", gap: 11 }}>
        {/* Demand + Velocity power "Sellability" — shown as Profit + Speed */}
        <SignalBar label="Profit"    value={signals.profit}     valueLabel={detail.profitLabel}     delay={0}   />
        <SignalBar label="Speed"     value={signals.speed}      valueLabel={detail.speedLabel}      delay={50}  />
        <SignalBar label="Data"      value={signals.confidence} valueLabel={detail.confidenceLabel} delay={100} />
        <SignalBar label="Market"    value={signals.effort}     valueLabel={detail.effortLabel}     inverted delay={150} />
      </div>

      {/* ── Footer: Why this score ── */}
      <div style={{
        borderTop: "1px solid rgba(200,180,126,0.05)",
        padding: "10px 18px",
      }}>
        <button
          onClick={() => setShowDetail(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: "#4a3a1e",
            letterSpacing: "0.6px", textTransform: "uppercase",
            padding: 0, display: "flex", alignItems: "center", gap: 5,
          }}>
          <span style={{ fontSize: 8, opacity: 0.7 }}>{showDetail ? "▴" : "▾"}</span>
          How this was scored
        </button>
      </div>

      {/* ── Expandable breakdown (unchanged) ── */}
      {showDetail && (
        <div style={{
          margin: "0 14px 14px",
          padding: "11px 13px",
          borderRadius: 10,
          background: "rgba(5,12,5,0.5)",
          border: "1px solid rgba(200,180,126,0.04)",
          fontSize: 11, color: "#6a5528", lineHeight: 1.85,
        }}>
          <div style={{ color: "#7a6535", fontWeight: 500, marginBottom: 3 }}>Signal breakdown</div>
          <div>Profit ({Math.round(signals.profit)}) — {detail.profitLabel.toLowerCase()} earning potential</div>
          <div>Speed ({Math.round(signals.speed)}) — {detail.speedLabel.toLowerCase()} market velocity</div>
          <div>Data ({Math.round(signals.confidence)}) — {detail.confidenceLabel.toLowerCase()} confidence in results</div>
          <div>Market ({Math.round(signals.effort)}) — {detail.effortLabel.toLowerCase()} competition drag</div>
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid rgba(200,180,126,0.04)", color: "#3a2e16", fontSize: 10 }}>
            Overall score: {score}/100 · Weights: Profit 35% · Speed 25% · Data 25% · Market −15%
          </div>
        </div>
      )}

    </div>
  );
}
