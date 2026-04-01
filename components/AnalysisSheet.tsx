// components/AnalysisSheet.tsx
// Bottom sheet analysis overlay — replaces the AnalysisFeed list.
//
// The item photo is visible above the sheet (the "previous screen" context).
// Steps appear sequentially with fade + upward motion.
// When complete, the sheet animates out and the result screen takes over.
"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisState, AnalysisMessage } from "@/types/analysis";

interface AnalysisSheetProps {
  state:        AnalysisState;
  imageDataUrl: string;
  itemTitle?:   string;
  isComplete:   boolean;
}

// ─── Step copy — human language, not technical ────────────────────────────────
// Maps the raw step title from useAnalysisFlow into calmer UI copy.
// Falls back to the raw title if no match.
function humanizeTitle(raw: string): string {
  if (raw.includes("already identified"))     return "Got it";
  if (raw.includes("Checking recent sales"))  return "Searching recent sales…";
  if (raw.includes("recent sales") && raw.includes("Found")) {
    const match = raw.match(/Found (\d+)/);
    return match ? `Found ${match[1]} recent sales` : "Sales data found";
  }
  if (raw.includes("No sold listings"))       return "Checking active listings";
  if (raw.includes("estimated market data"))  return "Using estimated market data";
  if (raw.includes("selling around"))         return raw; // already good — shows price
  if (raw.includes("Calculating value"))      return "Estimating resell value…";
  if (raw.includes("Calculating profit"))     return "Running the numbers…";
  if (raw.includes("result is ready"))        return "Your result is ready";
  return raw;
}

function humanizeDetail(raw: string | undefined, title: string): string | undefined {
  if (!raw) return undefined;
  // Strip technical debug strings like "14 sold · 12 active · $22–$89 (live)"
  // and replace with cleaner copy when possible
  if (raw.includes("sold") && raw.includes("active") && raw.includes("$")) {
    const priceMatch = raw.match(/\$(\d+)–\$(\d+)/);
    if (priceMatch) return `Price range $${priceMatch[1]} — $${priceMatch[2]}`;
  }
  if (raw.includes("Live data unavailable")) return "Using estimated pricing data";
  return raw;
}

// ─── Individual step ──────────────────────────────────────────────────────────

function Step({ msg, isLast }: { msg: AnalysisMessage; isLast: boolean }) {
  const isActive   = msg.status === "active";
  const isComplete = msg.status === "complete";
  const isDim      = isComplete && !isLast;

  const title  = humanizeTitle(msg.title);
  const detail = humanizeDetail(msg.detail, msg.title);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDim ? 0.38 : 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: isLast ? 0 : 18 }}>

      {/* Indicator column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3, flexShrink: 0 }}>
        {/* Dot */}
        {isActive ? (
          <motion.div
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgba(109,188,109,0.85)",
              flexShrink: 0,
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : isComplete ? (
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: "rgba(168,144,78,0.5)",
          }} />
        ) : (
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: "rgba(60,60,60,0.4)",
          }} />
        )}

        {/* Connector line */}
        {!isLast && (
          <div style={{
            width: 1, flex: 1, marginTop: 5,
            background: "linear-gradient(to bottom, rgba(200,180,126,0.08), transparent)",
            minHeight: 12,
          }} />
        )}
      </div>

      {/* Text column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "#e8e0cc" : isComplete && isLast ? "#d4c9b0" : "#a89878",
          lineHeight: 1.35,
          letterSpacing: "0.01px",
        }}>
          {title}
          {isActive && (
            <span style={{ display: "inline-flex", gap: 3, marginLeft: 5, verticalAlign: "middle" }}>
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  style={{ width: 3, height: 3, borderRadius: "50%", display: "inline-block", background: "#6a5528" }}
                  animate={{ opacity: [0.2, 0.9, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </span>
          )}
        </div>

        {detail && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.12 }}
            style={{
              fontSize: 12, color: "#6a5528",
              marginTop: 3, lineHeight: 1.5,
              letterSpacing: "0.02px",
            }}>
            {detail}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export function AnalysisSheet({ state, imageDataUrl, itemTitle, isComplete }: AnalysisSheetProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom as new steps arrive
  useEffect(() => {
    const t = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => clearTimeout(t);
  }, [state.messages.length]);

  return (
    // Full-screen overlay wrapper
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Background — item photo + scrim ── */}
      <motion.div
        style={{ position: "absolute", inset: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}>
        <img
          src={imageDataUrl}
          alt=""
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.35) saturate(0.5) blur(2px)",
          }}
        />
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(5,10,5,0.55) 0%, rgba(5,10,5,0.75) 100%)",
        }} />
      </motion.div>

      {/* ── Item thumbnail + title — floats above sheet ── */}
      <motion.div
        style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", gap: 14,
          padding: "60px 24px 0",
          flex: "0 0 auto",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0,
          border: "1px solid rgba(200,180,126,0.15)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          <img src={imageDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: "rgba(168,144,78,0.7)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 3 }}>
            Analyzing
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "#d4c9b0", lineHeight: 1.2 }}>
            {state.identifiedTitle ?? itemTitle ?? "Identifying your find…"}
          </div>
        </div>
      </motion.div>

      {/* ── Spacer that pushes sheet down ── */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom sheet ── */}
      <motion.div
        style={{
          position: "relative", zIndex: 1,
          borderRadius: "22px 22px 0 0",
          background: "rgba(8,18,8,0.97)",
          backdropFilter: "blur(32px)",
          borderTop: "1px solid rgba(200,180,126,0.08)",
          // Sheet takes ~65% of screen height — enough to show all steps comfortably
          maxHeight: "68vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>

        {/* Handle pill */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(200,180,126,0.12)" }} />
        </div>

        {/* Sheet header */}
        <div style={{ padding: "4px 24px 16px", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "rgba(106,85,40,0.5)", textTransform: "uppercase", letterSpacing: "2.5px" }}>
            Treehouse Search
          </div>
        </div>

        {/* Steps — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 28px" }}>
          <AnimatePresence initial={false}>
            {state.messages.map((msg, i) => (
              <Step
                key={msg.id}
                msg={msg}
                isLast={i === state.messages.length - 1}
              />
            ))}
          </AnimatePresence>

          {/* Price reveal — appears when we have range data */}
          <AnimatePresence>
            {state.priceRange && !isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginTop: 20,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(13,28,13,0.7)",
                  border: "1px solid rgba(109,188,109,0.1)",
                }}>
                <div style={{ fontSize: 8, color: "rgba(106,85,40,0.6)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>
                  Price range
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#d4c9b0" }}>
                    ${state.priceRange.low.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 12, color: "#4a3a1e" }}>—</span>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#f5f0e8" }}>
                    ${state.priceRange.high.toFixed(0)}
                  </span>
                </div>
                {state.compCount != null && state.compCount > 0 && (
                  <div style={{ fontSize: 11, color: "#4a3a1e", marginTop: 5 }}>
                    Based on {state.compCount} recent sales
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Bottom safe area padding */}
        <div style={{ height: "max(16px, env(safe-area-inset-bottom, 16px))", flexShrink: 0 }} />
      </motion.div>
    </div>
  );
}
