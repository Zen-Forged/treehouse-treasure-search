// components/OpportunityMeter.tsx
// Transparent Decision Engine — Phase 2 refactor.
//
// WHAT CHANGED (presentation layer only):
//   - Abstract pills ("Sells Quickly") → literal numbers ("Avg 8 days to sell")
//   - Abstract market label ("Crowded Market") → literal counts ("42 active · 14 sold")
//   - Single "Buy Under $X" → three-tier buy range (Strong / Acceptable / Risky)
//   - New profit scenario table (3 example buy prices → estimated net)
//   - Confidence badge anchored to real comp count
//
// WHAT DID NOT CHANGE:
//   - opportunityScore.ts — scoring engine is untouched
//   - ScoringInput type — no new required fields
//   - All 4 signals: Profit, Speed, Confidence, Effort
//   - Data flow in decide/page.tsx — OpportunityMeter props are identical
//
// MODE: "resell" assumed. Fees modeled as flat 13% eBay rate.
// Future: accept pricePaid prop → live margin recalc.
"use client";

import { useState, useEffect } from "react";
import { computeOpportunityScore, type ScoringInput } from "@/lib/opportunityScore";

// ─── Constants ────────────────────────────────────────────────────────────────

const EBAY_FEE_RATE = 0.13; // 13% combined eBay + payment fees

// ─── Derived literal metrics ──────────────────────────────────────────────────
// Pure functions. No scoring logic changed. All inputs already present in ScoringInput.

/** Convert avgDaysToSell to a human display string. */
function formatDaysToSell(days: number, velocityFallback: string): string {
  if (days > 0) {
    if (days === 1) return "~1 day to sell";
    if (days < 7)  return `~${days} days to sell`;
    if (days < 30) return `~${days} days to sell`;
    return `${Math.round(days / 7)}+ weeks to sell`;
  }
  // Fall back to velocity string if no numeric data
  const map: Record<string, string> = {
    fast:     "Typically sells fast",
    moderate: "Moderate sell time",
    slow:     "Can be slow to sell",
  };
  return map[velocityFallback.toLowerCase()] ?? "Sell time unknown";
}

/** Three-tier buy range derived from median + score + fees. Presentation only. */
interface BuyRange {
  strong:     number;   // "Strong Buy" max price
  acceptable: number;   // "Acceptable" max price
  risky:      number;   // "Risky" boundary (above = not recommended)
  explanation: string;
}

function computeBuyRange(
  medianSoldPrice: number,
  priceRangeLow:   number,
  score:           number,
): BuyRange | null {
  if (medianSoldPrice <= 0) return null;

  const fees = medianSoldPrice * EBAY_FEE_RATE;
  const net  = medianSoldPrice - fees;

  // Strong buy: target at least 50% margin on net proceeds
  // → net / (1 + 0.5) = net * 0.667
  const strong = Math.round(net * 0.65);

  // Acceptable: target at least 20% margin
  // → net / (1 + 0.2) = net * 0.833
  const acceptable = Math.round(net * 0.82);

  // Risky: break-even minus a small buffer (10%)
  const risky = Math.round(net * 0.92);

  // Confidence modifier — when score is low, tighten thresholds
  const modifier = score >= 70 ? 1.0 : score >= 50 ? 0.92 : 0.80;

  return {
    strong:      Math.round(strong     * modifier),
    acceptable:  Math.round(acceptable * modifier),
    risky:       Math.round(risky      * modifier),
    explanation: `Based on ~$${Math.round(medianSoldPrice)} resale value after ~${Math.round(EBAY_FEE_RATE * 100)}% fees`,
  };
}

/** Three profit scenarios at spread-derived buy prices. */
interface ProfitScenario {
  buyPrice:   number;
  net:        number;   // after fees, positive = profit
  label:      string;   // "Low", "Mid", "High"
}

function computeProfitScenarios(
  medianSoldPrice: number,
  priceRangeLow:   number,
  priceRangeHigh:  number,
): ProfitScenario[] {
  if (medianSoldPrice <= 0) return [];

  const fees = medianSoldPrice * EBAY_FEE_RATE;
  const net  = medianSoldPrice - fees;

  // Three realistic buy prices: low-end, 35% of median, 55% of median
  const lo  = priceRangeLow > 0 ? Math.round(priceRangeLow * 0.7) : Math.round(medianSoldPrice * 0.25);
  const mid = Math.round(medianSoldPrice * 0.38);
  const hi  = Math.round(medianSoldPrice * 0.55);

  return [
    { buyPrice: lo,  net: Math.round(net - lo),  label: "Low buy"  },
    { buyPrice: mid, net: Math.round(net - mid), label: "Mid buy"  },
    { buyPrice: hi,  net: Math.round(net - hi),  label: "High buy" },
  ];
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  green:  { text: "#6dbc6d", bg: "rgba(109,188,109,0.08)", border: "rgba(109,188,109,0.18)" },
  gold:   { text: "#c8b47e", bg: "rgba(200,180,126,0.08)", border: "rgba(200,180,126,0.18)" },
  rust:   { text: "#a07868", bg: "rgba(160,120,104,0.08)", border: "rgba(160,120,104,0.18)" },
  dim:    "#5a4828",
  muted:  "#4a3a1e",
  faint:  "rgba(200,180,126,0.06)",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: color ?? "#d4c9b0" }}>{value}</span>
        {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.faint, margin: "2px 0" }} />;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>
      {children}
    </div>
  );
}

// Signal bar — unchanged visually, used in expandable breakdown
function SignalBar({ label, value, valueLabel, inverted = false, delay = 0 }: {
  label: string; value: number; valueLabel: string; inverted?: boolean; delay?: number;
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
      <div style={{ width: 72, flexShrink: 0, fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.8px" }}>
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

// ─── Main component ───────────────────────────────────────────────────────────

export function OpportunityMeter({
  input,
  onScrollToComps,
}: {
  input: ScoringInput;
  onScrollToComps?: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  // Scoring engine — completely unchanged
  const result = computeOpportunityScore(input);
  const { score, signals, detail } = result;

  // ── Derived literal metrics (presentation only) ───────────────────────────
  const daysLabel    = formatDaysToSell(input.avgDaysToSell, input.marketVelocity);
  const buyRange     = computeBuyRange(input.medianSoldPrice, input.priceRangeLow, score);
  const scenarios    = computeProfitScenarios(input.medianSoldPrice, input.priceRangeLow, input.priceRangeHigh);
  const soldCount    = input.compCount;
  const activeCount  = input.competitionCount;

  // Confidence text anchored to real numbers
  const confText =
    soldCount >= 10 ? `High confidence · ${soldCount} sold` :
    soldCount >= 5  ? `Moderate confidence · ${soldCount} sold` :
    soldCount > 0   ? `Low confidence · ${soldCount} sold` :
    "Not enough data";

  return (
    <div style={{
      borderRadius: 18,
      background: "rgba(10,24,10,0.6)",
      border: "1px solid rgba(200,180,126,0.1)",
      overflow: "hidden",
    }}>

      {/* ── Block 1: Sell Speed + Market Activity ── */}
      <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.faint}` }}>
        <SectionLabel>Market snapshot</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {/* Sell speed — literal number, not an abstract label */}
          <Row
            label="Avg sell time"
            value={daysLabel}
            sub={input.avgDaysToSell > 0 ? `From ${soldCount} recent sales` : "Estimated from velocity"}
            color={signals.speed >= 65 ? C.green.text : signals.speed >= 38 ? C.gold.text : C.rust.text}
          />

          <Divider />

          {/* Market activity — real counts */}
          <Row
            label="Active listings"
            value={activeCount > 0 ? `${activeCount}` : "—"}
            sub="Currently competing on eBay"
            color={signals.effort <= 30 ? C.green.text : signals.effort <= 60 ? C.gold.text : C.rust.text}
          />
          <Row
            label="Recently sold"
            value={soldCount > 0 ? `${soldCount}` : "—"}
            sub="Used for this estimate"
            color="#9a8878"
          />
        </div>
      </div>

      {/* ── Block 2: Confidence ── */}
      <div style={{
        padding: "10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.faint}`,
      }}>
        <span style={{ fontSize: 11, color: C.dim }}>
          {confText}
        </span>
        {onScrollToComps && soldCount > 0 && (
          <button onClick={onScrollToComps} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, color: C.muted, padding: 0,
            display: "flex", alignItems: "center", gap: 3,
          }}>
            See comps <span style={{ fontSize: 10, opacity: 0.5 }}>↓</span>
          </button>
        )}
      </div>

      {/* ── Block 3: Buy Range — three tiers, not a single number ── */}
      {buyRange && (
        <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.faint}` }}>
          <SectionLabel>Resale buy range</SectionLabel>

          {/* Visual tier bar */}
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 28, marginBottom: 12 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(109,188,109,0.15)", borderRight: "1px solid rgba(109,188,109,0.2)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.green.text }}>
                Under ${buyRange.strong}
              </span>
            </div>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(200,180,126,0.1)", borderRight: "1px solid rgba(200,180,126,0.15)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.gold.text }}>
                ${buyRange.strong}–${buyRange.acceptable}
              </span>
            </div>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(160,120,104,0.08)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 400, color: C.rust.text }}>
                ${buyRange.acceptable}+
              </span>
            </div>
          </div>

          {/* Tier labels */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 8 }}>
            {[
              { label: "Strong",     color: C.green.text },
              { label: "Acceptable", color: C.gold.text  },
              { label: "Risky",      color: C.rust.text  },
            ].map(t => (
              <span key={t.label} style={{ fontSize: 9, color: t.color, textTransform: "uppercase", letterSpacing: "1px" }}>
                {t.label}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>
            {buyRange.explanation}
          </div>
        </div>
      )}

      {/* ── Block 4: Profit scenarios ── */}
      {scenarios.length > 0 && (
        <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.faint}` }}>
          <SectionLabel>Profit estimate · Resale mode</SectionLabel>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scenarios.map((s, i) => {
              const isPositive = s.net > 0;
              const netColor   = isPositive ? C.green.text : C.rust.text;
              const netStr     = isPositive ? `+$${s.net}` : `-$${Math.abs(s.net)}`;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  padding: "8px 12px", borderRadius: 10,
                  background: "rgba(5,14,5,0.4)",
                  border: "1px solid rgba(200,180,126,0.05)",
                }}>
                  {/* Buy price */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#d4c9b0" }}>
                      ${s.buyPrice}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ color: "rgba(200,180,126,0.2)", fontSize: 14, padding: "0 10px" }}>→</div>

                  {/* Net profit */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>
                      Est. net
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: netColor }}>
                      {netStr}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 10, color: C.muted, marginTop: 10, textAlign: "center" }}>
            After ~{Math.round(EBAY_FEE_RATE * 100)}% eBay fees · Resale mode
          </div>
        </div>
      )}

      {/* ── Footer: How this was scored (expandable) ── */}
      <div style={{ padding: "10px 18px" }}>
        <button
          onClick={() => setShowDetail(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: C.muted,
            letterSpacing: "0.6px", textTransform: "uppercase",
            padding: 0, display: "flex", alignItems: "center", gap: 5,
          }}>
          <span style={{ fontSize: 8, opacity: 0.7 }}>{showDetail ? "▴" : "▾"}</span>
          How this was scored
        </button>
      </div>

      {/* ── Expandable signal breakdown — all 4 metrics, unchanged ── */}
      {showDetail && (
        <div style={{ margin: "0 14px 14px", padding: "12px 14px", borderRadius: 12, background: "rgba(5,12,5,0.5)", border: "1px solid rgba(200,180,126,0.04)" }}>
          <div style={{ fontSize: 11, color: "#7a6535", fontWeight: 500, marginBottom: 10 }}>Signal breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SignalBar label="Profit"    value={signals.profit}     valueLabel={detail.profitLabel}     delay={0}   />
            <SignalBar label="Speed"     value={signals.speed}      valueLabel={detail.speedLabel}      delay={50}  />
            <SignalBar label="Data"      value={signals.confidence} valueLabel={detail.confidenceLabel} delay={100} />
            <SignalBar label="Market"    value={signals.effort}     valueLabel={detail.effortLabel}     inverted delay={150} />
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(200,180,126,0.04)", fontSize: 10, color: "rgba(74,58,30,0.7)", lineHeight: 1.6 }}>
            <div>Score: {score}/100 · Profit 35% · Speed 25% · Data 25% · Market −15%</div>
            <div style={{ marginTop: 4 }}>Sell time from {soldCount > 0 ? `${soldCount} sold listings` : "velocity estimate"} · {activeCount} active listings tracked</div>
          </div>
        </div>
      )}

    </div>
  );
}
