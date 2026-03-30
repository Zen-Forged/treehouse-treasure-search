// components/DecisionDial.tsx
// Decision dial — summarizes 4 market signals into a single BUY / MAYBE / PASS verdict.
// SVG half-circle gauge, CSS-animated needle, no external dependencies.
"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DecisionDialProps {
  demandLevel:      string;   // "High" | "Moderate" | "Low"
  marketVelocity:   string;   // "fast" | "moderate" | "slow"
  confidence:       string;   // "High" | "Moderate" | "Low"
  competitionLevel: string;   // "low" | "moderate" | "high"
}

type Verdict = "BUY" | "MAYBE" | "PASS";

// ─── Score logic ──────────────────────────────────────────────────────────────
//
// Each signal maps to a 0–100 raw value.
// Weights: demand (35%) + velocity (25%) − competition penalty (25%) + baseline (15%)
// Confidence multiplier pulls score toward 50 when low (hedges uncertain data).
//
// To adjust behavior: change the score/penalty values in the lookup objects below.

function normalizeLevel(val: string): "high" | "moderate" | "low" {
  const v = val.toLowerCase();
  if (v === "high" || v === "fast") return "high";
  if (v === "moderate")             return "moderate";
  return "low";
}

function computeDecisionScore(
  demandLevel:      string,
  marketVelocity:   string,
  confidence:       string,
  competitionLevel: string,
): number {
  const demandScore:       Record<string, number> = { high: 100, moderate: 55, low: 15 };
  const velocityScore:     Record<string, number> = { high: 100, moderate: 55, low: 15 };
  const competitionPenalty:Record<string, number> = { low: 0, moderate: 30, high: 65 };
  // Confidence multiplier: pulls score toward neutral 50 when confidence is low
  const confMultiplier:    Record<string, number> = { high: 1.0, moderate: 0.82, low: 0.6 };

  const demand   = demandScore[normalizeLevel(demandLevel)]          ?? 50;
  const velocity = velocityScore[normalizeLevel(marketVelocity)]     ?? 50;
  const penalty  = competitionPenalty[normalizeLevel(competitionLevel)] ?? 30;
  const confMult = confMultiplier[normalizeLevel(confidence)]        ?? 0.8;

  // Raw weighted score (before confidence adjustment)
  const raw     = (demand * 0.35) + (velocity * 0.25) - (penalty * 0.25) + 15;
  const clamped = Math.max(0, Math.min(100, raw));

  // Confidence shrinks the distance from 50 — uncertain data = closer to neutral
  const adjusted = 50 + (clamped - 50) * confMult;
  return Math.round(Math.max(0, Math.min(100, adjusted)));
}

// ─── Verdict mapping ──────────────────────────────────────────────────────────

function scoreToVerdict(score: number): Verdict {
  if (score >= 66) return "BUY";
  if (score >= 41) return "MAYBE";
  return "PASS";
}

// ─── Needle rotation ─────────────────────────────────────────────────────────
//
// Arc spans 180°. Needle rotates from -90° (left/PASS) to +90° (right/BUY).
// score 0   → -90deg
// score 50  →   0deg (straight up)
// score 100 → +90deg

function scoreToRotation(score: number): number {
  return -90 + (score / 100) * 180;
}

// ─── Microcopy ────────────────────────────────────────────────────────────────

function buildMicrocopy(
  demandLevel:      string,
  marketVelocity:   string,
  confidence:       string,
  competitionLevel: string,
  verdict:          Verdict,
): string {
  const demand   = normalizeLevel(demandLevel);
  const velocity = normalizeLevel(marketVelocity);
  const comp     = normalizeLevel(competitionLevel);
  const conf     = normalizeLevel(confidence);

  if (verdict === "BUY") {
    if (demand === "high" && velocity === "high")
      return "High demand · moves quickly · worth grabbing";
    if (comp === "low")
      return "Low competition · solid margin potential";
    return "Good signals across the board";
  }

  if (verdict === "MAYBE") {
    if (conf === "low")
      return "Limited data · proceed with caution";
    if (comp === "high")
      return "Decent demand · heavy competition";
    if (velocity === "low")
      return "Moderate demand · slow to move";
    return "Mixed signals · look closely before deciding";
  }

  // PASS
  if (demand === "low")
    return "Low demand · hard to move";
  if (comp === "high")
    return "High competition · thin margins";
  if (velocity === "low")
    return "Slow market · ties up cash";
  return "Signals don't support buying here";
}

// ─── Verdict styling ──────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  BUY:   { color: "#6dbc6d", glow: "rgba(109,188,109,0.25)", trackColor: "rgba(70,160,70,0.75)" },
  MAYBE: { color: "#c8b47e", glow: "rgba(200,180,126,0.25)", trackColor: "rgba(190,160,80,0.75)" },
  PASS:  { color: "#a07060", glow: "rgba(160,112,96,0.25)",  trackColor: "rgba(154,100,80,0.75)" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DecisionDial({
  demandLevel,
  marketVelocity,
  confidence,
  competitionLevel,
}: DecisionDialProps) {
  const score     = computeDecisionScore(demandLevel, marketVelocity, confidence, competitionLevel);
  const verdict   = scoreToVerdict(score);
  const config    = VERDICT_CONFIG[verdict];
  const microcopy = buildMicrocopy(demandLevel, marketVelocity, confidence, competitionLevel, verdict);

  // Animate needle from far-left to actual position after mount
  const [rotation, setRotation] = useState(-90);
  useEffect(() => {
    const t = setTimeout(() => setRotation(scoreToRotation(score)), 150);
    return () => clearTimeout(t);
  }, [score]);

  // SVG layout
  const W  = 220;
  const H  = 118;
  const cx = W / 2;    // 110 — horizontal center
  const cy = H - 8;    // 110 — axle sits near the bottom of the viewBox
  const R  = 88;       // arc radius

  // Draws a semicircle arc at radius r (left to right, arching up)
  function arcPath(r: number) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  }

  // Draws an arc segment from startDeg to endDeg (in standard math angles, 0=right, 180=left)
  function zonePath(startDeg: number, endDeg: number, r: number) {
    const rad  = (d: number) => (d * Math.PI) / 180;
    const sx   = cx + r * Math.cos(rad(startDeg));
    const sy   = cy - r * Math.sin(rad(startDeg));
    const ex   = cx + r * Math.cos(rad(endDeg));
    const ey   = cy - r * Math.sin(rad(endDeg));
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = endDeg > startDeg ? 0 : 1;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 4px" }}>

      {/* ── SVG gauge ── */}
      <div style={{ position: "relative", width: W, height: H + 24 }}>
        <svg width={W} height={H + 24} viewBox={`0 0 ${W} ${H + 24}`} style={{ overflow: "visible" }}>

          {/* Track — full arc background */}
          <path d={arcPath(R)} fill="none"
            stroke="rgba(255,255,255,0.04)" strokeWidth={13} strokeLinecap="round" />

          {/* Zone: PASS (left third, 180°→120°) */}
          <path d={zonePath(180, 120, R)} fill="none"
            stroke="rgba(154,100,80,0.3)" strokeWidth={11} strokeLinecap="round" />

          {/* Zone: MAYBE (middle third, 120°→60°) */}
          <path d={zonePath(120, 60, R)} fill="none"
            stroke="rgba(190,160,80,0.3)" strokeWidth={11} strokeLinecap="round" />

          {/* Zone: BUY (right third, 60°→0°) */}
          <path d={zonePath(60, 0, R)} fill="none"
            stroke="rgba(60,140,60,0.3)" strokeWidth={11} strokeLinecap="round" />

          {/* Active zone — brighter highlight on whichever zone the verdict lands in */}
          {verdict === "PASS"  && <path d={zonePath(180, 120, R)} fill="none" stroke="rgba(154,100,80,0.7)"  strokeWidth={11} strokeLinecap="round" />}
          {verdict === "MAYBE" && <path d={zonePath(120,  60, R)} fill="none" stroke="rgba(190,160,80,0.7)"  strokeWidth={11} strokeLinecap="round" />}
          {verdict === "BUY"   && <path d={zonePath( 60,   0, R)} fill="none" stroke="rgba(60,150,60,0.7)"   strokeWidth={11} strokeLinecap="round" />}

          {/* Zone labels */}
          <text x={cx - R + 2} y={cy + 15} fontSize="8" fill="rgba(154,100,80,0.45)"
            textAnchor="start" fontFamily="system-ui, sans-serif">Pass</text>
          <text x={cx}         y={cy - R - 6} fontSize="8" fill="rgba(190,160,80,0.45)"
            textAnchor="middle" fontFamily="system-ui, sans-serif">Maybe</text>
          <text x={cx + R - 2} y={cy + 15} fontSize="8" fill="rgba(60,140,60,0.45)"
            textAnchor="end" fontFamily="system-ui, sans-serif">Buy</text>

          {/* Needle group — rotates around the axle point (cx, cy) */}
          <g
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            style={{ transition: "transform 1s cubic-bezier(0.34, 1.15, 0.64, 1)" }}>
            {/* Needle shaft */}
            <line
              x1={cx} y1={cy + 4}
              x2={cx} y2={cy - R + 12}
              stroke={config.color}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.92}
            />
            {/* Needle tip */}
            <circle cx={cx} cy={cy - R + 12} r={2.5} fill={config.color} opacity={0.92} />
          </g>

          {/* Axle center dot */}
          <circle cx={cx} cy={cy} r={4.5}
            fill="rgba(8,20,8,1)"
            stroke={config.color}
            strokeWidth={1.5}
            opacity={0.85}
          />

          {/* Verdict label — centered below axle */}
          <text
            x={cx} y={cy + 22}
            fontSize="20"
            fontWeight="700"
            fontFamily="Georgia, serif"
            fill={config.color}
            textAnchor="middle"
            letterSpacing="4"
            style={{ filter: `drop-shadow(0 0 8px ${config.glow})` }}>
            {verdict}
          </text>

        </svg>
      </div>

      {/* ── Microcopy ── */}
      <p style={{
        margin: "2px 0 0",
        fontSize: 12,
        color: "#7a6535",
        textAlign: "center",
        letterSpacing: "0.15px",
        lineHeight: 1.5,
        maxWidth: 220,
        fontStyle: "italic",
      }}>
        {microcopy}
      </p>

    </div>
  );
}
