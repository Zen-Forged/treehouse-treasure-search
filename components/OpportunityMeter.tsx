// components/OpportunityMeter.tsx
// Treehouse Decision Meter — the primary decision layer on the results screen.
//
// Displays:
//   1. Recommendation label (Strong Buy / Maybe / Pass)
//   2. Opportunity Score (0–100) as a clean arc gauge
//   3. Four signal bars (Profit, Speed, Confidence, Effort)
//   4. Microcopy — one human sentence summarizing the verdict
//   5. Expandable "Why this score?" detail section
//
// All scoring logic lives in lib/opportunityScore.ts — not here.
"use client";

import { useState, useEffect } from "react";
import { computeOpportunityScore, type ScoringInput, type Recommendation } from "@/lib/opportunityScore";

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR = {
  "Strong Buy": { primary: "#6dbc6d", bg: "rgba(109,188,109,0.08)", border: "rgba(109,188,109,0.2)",  arc: "rgba(80,175,80,0.85)"  },
  "Maybe":      { primary: "#c8b47e", bg: "rgba(200,180,126,0.08)", border: "rgba(200,180,126,0.2)", arc: "rgba(190,160,80,0.85)" },
  "Pass":       { primary: "#a07868", bg: "rgba(160,120,104,0.08)", border: "rgba(160,120,104,0.2)", arc: "rgba(154,100,80,0.85)"  },
} as const;

const SIGNAL_COLOR = {
  high:     "#6dbc6d",
  moderate: "#c8b47e",
  low:      "#9a7a5a",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

// Arc gauge — drawn as an SVG partial circle, fills from left to right
function ArcGauge({ score, rec }: { score: number; rec: Recommendation }) {
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimScore(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const W   = 160;
  const H   = 88;
  const cx  = W / 2;
  const cy  = H - 4;
  const R   = 70;
  const cfg = COLOR[rec];

  // Full arc path (180°, left to right)
  const fullArc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  // Filled arc path — uses stroke-dasharray trick for clean animation
  // Circumference of half-circle = π × R
  const halfCirc  = Math.PI * R;
  const fillRatio = animScore / 100;
  const dashLen   = halfCirc * fillRatio;
  const gapLen    = halfCirc * (1 - fillRatio);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {/* Track */}
      <path d={fullArc} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={10} strokeLinecap="round" />

      {/* Fill — animated via dasharray */}
      <path d={fullArc} fill="none"
        stroke={cfg.arc} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${dashLen} ${gapLen + 1}`}
        style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.34,1.1,0.64,1)" }}
      />

      {/* Score number */}
      <text x={cx} y={cy - 12}
        textAnchor="middle" fontFamily="Georgia, serif"
        fontSize="28" fontWeight="700" fill={cfg.primary}>
        {animScore}
      </text>
      <text x={cx} y={cy + 2}
        textAnchor="middle" fontFamily="system-ui, sans-serif"
        fontSize="8" fill="rgba(200,180,126,0.35)" letterSpacing="2">
        OPPORTUNITY
      </text>
    </svg>
  );
}

// Signal bar — label + horizontal fill bar + value label
function SignalBar({
  label,
  value,
  valueLabel,
  inverted = false,
  delay = 0,
}: {
  label:      string;
  value:      number;          // 0–100
  valueLabel: string;
  inverted?:  boolean;         // for Effort: high value = bad
  delay?:     number;
}) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  // Determine color based on value direction
  const effectiveLevel = inverted
    ? (value <= 30 ? "high" : value <= 60 ? "moderate" : "low")
    : (value >= 70 ? "high" : value >= 40 ? "moderate" : "low");

  const barColor = SIGNAL_COLOR[effectiveLevel];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Label */}
      <div style={{
        width: 72, flexShrink: 0,
        fontSize: 10, color: "#6a5528",
        textTransform: "uppercase", letterSpacing: "1px",
      }}>
        {label}
      </div>

      {/* Bar track */}
      <div style={{
        flex: 1, height: 3, borderRadius: 2,
        background: "rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${animVal}%`,
          borderRadius: 2,
          background: barColor,
          transition: `width 0.9s cubic-bezier(0.34,1.05,0.64,1) ${delay}ms`,
          opacity: 0.8,
        }} />
      </div>

      {/* Value label */}
      <div style={{
        width: 52, flexShrink: 0, textAlign: "right",
        fontSize: 11, fontWeight: 500,
        color: barColor,
        textTransform: "capitalize",
      }}>
        {valueLabel}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OpportunityMeter({ input }: { input: ScoringInput }) {
  const [showDetail, setShowDetail] = useState(false);

  const result = computeOpportunityScore(input);
  const { score, recommendation: rec, signals, microcopy, detail } = result;
  const cfg = COLOR[rec];

  return (
    <div style={{
      borderRadius: 20,
      background: "rgba(13,31,13,0.45)",
      border: `1px solid ${cfg.border}`,
      padding: "20px 20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}>

      {/* ── Row 1: Recommendation label + gauge side by side ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>

        {/* Left: label + copy */}
        <div style={{ flex: 1, paddingBottom: 8 }}>
          <div style={{
            fontSize: 9, color: "#6a5528",
            textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8,
          }}>
            Decision
          </div>

          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 20,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: "Georgia, serif",
              fontSize: 17, fontWeight: 700,
              color: cfg.primary,
              letterSpacing: "0.3px",
            }}>
              {rec}
            </span>
          </div>

          <p style={{
            fontSize: 12, color: "#a8904e",
            lineHeight: 1.55, maxWidth: 170,
            fontStyle: "italic",
            margin: 0,
          }}>
            {microcopy}
          </p>
        </div>

        {/* Right: arc gauge */}
        <div style={{ flexShrink: 0 }}>
          <ArcGauge score={score} rec={rec} />
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(200,180,126,0.06)", margin: "8px 0 14px" }} />

      {/* ── Row 2: Signal bars ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SignalBar label="Profit"     value={signals.profit}     valueLabel={detail.profitLabel}     delay={0}   />
        <SignalBar label="Speed"      value={signals.speed}      valueLabel={detail.speedLabel}      delay={60}  />
        <SignalBar label="Confidence" value={signals.confidence} valueLabel={detail.confidenceLabel} delay={120} />
        <SignalBar label="Effort"     value={signals.effort}     valueLabel={detail.effortLabel}     delay={180} inverted />
      </div>

      {/* ── Row 3: Why this score? ── */}
      <button
        onClick={() => setShowDetail(v => !v)}
        style={{
          marginTop: 14,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 10,
          color: "#4a3a1e",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          padding: "6px 0 0",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderTop: "1px solid rgba(200,180,126,0.05)",
        }}>
        <span>{showDetail ? "▴" : "▾"}</span>
        <span>Why this score?</span>
      </button>

      {showDetail && (
        <div style={{
          marginTop: 10,
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(5,15,5,0.4)",
          border: "1px solid rgba(200,180,126,0.05)",
          fontSize: 11,
          color: "#6a5528",
          lineHeight: 1.8,
        }}>
          <div style={{ marginBottom: 4, color: "#7a6535", fontWeight: 500 }}>Score breakdown</div>
          <div>Profit ({Math.round(signals.profit)}%) — {detail.profitLabel.toLowerCase()} earning potential</div>
          <div>Speed ({Math.round(signals.speed)}%) — {detail.speedLabel.toLowerCase()} market velocity</div>
          <div>Confidence ({Math.round(signals.confidence)}%) — {detail.confidenceLabel.toLowerCase()} data quality</div>
          <div>Effort ({Math.round(signals.effort)}%) — {detail.effortLabel.toLowerCase()} competition drag</div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(200,180,126,0.05)", color: "#4a3a1e" }}>
            Weights: Profit 35% · Speed 25% · Confidence 25% · Effort −15%
          </div>
        </div>
      )}

    </div>
  );
}
