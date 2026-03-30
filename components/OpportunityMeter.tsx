// components/OpportunityMeter.tsx
// Treehouse Decision Meter — primary decision layer on the results screen.
"use client";

import { useState, useEffect, useRef } from "react";
import { computeOpportunityScore, type ScoringInput, type Recommendation } from "@/lib/opportunityScore";

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR = {
  "Strong Buy": {
    primary: "#6dbc6d",
    dim:     "#4a9a4a",
    bg:      "rgba(109,188,109,0.07)",
    border:  "rgba(109,188,109,0.18)",
    arc:     "rgba(80,175,80,0.9)",
    glow:    "rgba(109,188,109,0.15)",
  },
  "Maybe": {
    primary: "#c8b47e",
    dim:     "#9a8050",
    bg:      "rgba(200,180,126,0.07)",
    border:  "rgba(200,180,126,0.18)",
    arc:     "rgba(190,160,80,0.9)",
    glow:    "rgba(200,180,126,0.12)",
  },
  "Pass": {
    primary: "#a07868",
    dim:     "#7a5848",
    bg:      "rgba(160,120,104,0.07)",
    border:  "rgba(160,120,104,0.18)",
    arc:     "rgba(154,100,80,0.9)",
    glow:    "rgba(160,120,104,0.1)",
  },
} as const;

const SIGNAL_COLOR = {
  high:     "#6dbc6d",
  moderate: "#c8b47e",
  low:      "#9a7a5a",
} as const;

// ─── Animated counter ─────────────────────────────────────────────────────────
// Counts up from 0 to target over ~900ms so the number and arc animate together.

function useCountUp(target: number, delay = 120, duration = 900): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf.current);
    };
  }, [target, delay, duration]);

  return value;
}

// ─── Arc gauge ────────────────────────────────────────────────────────────────

function ArcGauge({ score, rec }: { score: number; rec: Recommendation }) {
  const animScore = useCountUp(score, 120, 1000);
  const [arcFill, setArcFill]   = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setArcFill(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const W  = 140;
  const H  = 78;
  const cx = W / 2;
  const cy = H - 2;
  const R  = 60;
  const cfg = COLOR[rec];

  const fullArc  = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const halfCirc = Math.PI * R;
  const dashLen  = halfCirc * (arcFill / 100);
  const gapLen   = halfCirc - dashLen;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Track */}
        <path d={fullArc} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={8} strokeLinecap="round" />
        {/* Fill */}
        <path d={fullArc} fill="none"
          stroke={cfg.arc} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${dashLen} ${gapLen + 2}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.05,0.64,1)" }}
        />
        {/* Score number — centered in arc */}
        <text x={cx} y={cy - 8}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="24" fontWeight="700"
          fill={cfg.primary}>
          {animScore}
        </text>
        <text x={cx} y={cy + 4}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize="7"
          fill="rgba(200,180,126,0.3)"
          letterSpacing="1.5">
          /100
        </text>
      </svg>
    </div>
  );
}

// ─── Signal bar ───────────────────────────────────────────────────────────────

function SignalBar({
  label, value, valueLabel, inverted = false, delay = 0,
}: {
  label: string; value: number; valueLabel: string;
  inverted?: boolean; delay?: number;
}) {
  const [animVal, setAnimVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimVal(value), 250 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  const level = inverted
    ? (value <= 30 ? "high" : value <= 60 ? "moderate" : "low")
    : (value >= 70 ? "high" : value >= 40 ? "moderate" : "low");

  const barColor = SIGNAL_COLOR[level];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 68, flexShrink: 0, fontSize: 10, color: "#5a4828", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${animVal}%`, borderRadius: 1,
          background: barColor, opacity: 0.75,
          transition: `width 0.85s cubic-bezier(0.34,1.05,0.64,1) ${delay}ms`,
        }} />
      </div>
      <div style={{ width: 54, flexShrink: 0, textAlign: "right", fontSize: 11, fontWeight: 500, color: barColor, textTransform: "capitalize" }}>
        {valueLabel}
      </div>
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
  const { score, recommendation: rec, signals, microcopy, detail } = result;
  const cfg = COLOR[rec];

  return (
    <div style={{
      borderRadius: 18,
      background: "rgba(11,26,11,0.6)",
      border: `1px solid ${cfg.border}`,
      overflow: "hidden",
    }}>

      {/* ── Header band — recommendation + score ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px 14px",
        background: cfg.glow,
        borderBottom: `1px solid ${cfg.border}`,
      }}>
        {/* Left: verdict */}
        <div>
          <div style={{ fontSize: 8, color: "#5a4828", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 6 }}>
            Treehouse verdict
          </div>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: 22, fontWeight: 700,
            color: cfg.primary,
            letterSpacing: "0.2px",
            lineHeight: 1,
            marginBottom: 8,
          }}>
            {rec}
          </div>
          <p style={{
            fontSize: 12, color: "#9a8060",
            lineHeight: 1.5, maxWidth: 180,
            fontStyle: "italic", margin: 0,
          }}>
            {microcopy}
          </p>
        </div>

        {/* Right: arc gauge */}
        <div style={{ flexShrink: 0, marginLeft: 12 }}>
          <ArcGauge score={score} rec={rec} />
        </div>
      </div>

      {/* ── Signal bars ── */}
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 11 }}>
        <SignalBar label="Profit"     value={signals.profit}     valueLabel={detail.profitLabel}     delay={0}   />
        <SignalBar label="Speed"      value={signals.speed}      valueLabel={detail.speedLabel}      delay={50}  />
        <SignalBar label="Confidence" value={signals.confidence} valueLabel={detail.confidenceLabel} delay={100} />
        <SignalBar label="Effort"     value={signals.effort}     valueLabel={detail.effortLabel}     inverted    delay={150} />
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid rgba(200,180,126,0.05)",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Why this score */}
        <button
          onClick={() => setShowDetail(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: "#4a3a1e",
            letterSpacing: "0.6px", textTransform: "uppercase",
            padding: 0, display: "flex", alignItems: "center", gap: 5,
          }}>
          <span style={{ fontSize: 8, opacity: 0.7 }}>{showDetail ? "▴" : "▾"}</span>
          Why this score?
        </button>

        {/* Comp count link */}
        {onScrollToComps && input.compCount > 0 && (
          <button
            onClick={onScrollToComps}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 10, color: "#4a3a1e",
              letterSpacing: "0.6px",
              padding: 0, display: "flex", alignItems: "center", gap: 4,
            }}>
            {input.compCount} comps
            <span style={{ fontSize: 9, opacity: 0.5 }}>↓</span>
          </button>
        )}
      </div>

      {/* ── Expandable detail ── */}
      {showDetail && (
        <div style={{
          margin: "0 14px 14px",
          padding: "11px 13px",
          borderRadius: 10,
          background: "rgba(5,12,5,0.5)",
          border: "1px solid rgba(200,180,126,0.04)",
          fontSize: 11, color: "#6a5528", lineHeight: 1.85,
        }}>
          <div style={{ color: "#7a6535", fontWeight: 500, marginBottom: 3 }}>Score breakdown</div>
          <div>Profit ({Math.round(signals.profit)}) — {detail.profitLabel.toLowerCase()} earning potential</div>
          <div>Speed ({Math.round(signals.speed)}) — {detail.speedLabel.toLowerCase()} market velocity</div>
          <div>Confidence ({Math.round(signals.confidence)}) — {detail.confidenceLabel.toLowerCase()} data quality</div>
          <div>Effort ({Math.round(signals.effort)}) — {detail.effortLabel.toLowerCase()} competition drag</div>
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid rgba(200,180,126,0.04)", color: "#3a2e16", fontSize: 10 }}>
            Weights: Profit 35% · Speed 25% · Confidence 25% · Effort −15%
          </div>
        </div>
      )}

    </div>
  );
}
