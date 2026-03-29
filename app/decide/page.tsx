// app/decide/page.tsx
// Phase 1: uses findSession.identification.searchQuery — no re-identification
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { useFinds, sessionToFind } from "@/hooks/useFinds";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { AnalysisFeed } from "@/components/AnalysisFeed";
import { Comp } from "@/types";

type AppState = "price-entry" | "analyzing" | "done";

interface SoldSummary {
  recommendedPrice:  number;
  priceRangeLow:     number;
  priceRangeHigh:    number;
  marketVelocity:    string;
  demandLevel:       string;
  quickTake:         string;
  confidence:        string;
  avgDaysToSell:     number;
  competitionCount:  number;
  competitionLevel:  "low" | "moderate" | "high";
}

function getROI(profit: number, cost: number): string {
  if (!cost) return "—";
  return Math.round((profit / cost) * 100) + "%";
}

function getBadge(recommendation: string) {
  if (recommendation === "strong-buy")
    return { label: "Strong find",         color: "#c8b47e", border: "rgba(200,180,126,0.35)", bg: "rgba(200,180,126,0.08)" };
  if (recommendation === "maybe")
    return { label: "Worth a closer look", color: "#a0a0a8", border: "rgba(160,160,168,0.35)", bg: "rgba(160,160,168,0.08)" };
  return       { label: "Marginal",        color: "#9a7a5a", border: "rgba(154,122,90,0.35)",  bg: "rgba(154,122,90,0.08)" };
}

function getVerdict(recommendation: string) {
  if (recommendation === "strong-buy") return {
    line:      "Strong margin. Sells reliably. This one stands out.",
    scoutTake: "Strong margin and steady demand. After fees, the return is clear. Condition looks solid.",
  };
  if (recommendation === "maybe") return {
    line:      "Reasonable margin. Condition and timing will determine the outcome.",
    scoutTake: "Decent margin but not a lot of room. If condition is clean and the price holds, this works.",
  };
  return {
    line:      "After fees, there isn't much room. A better find may be nearby.",
    scoutTake: "The numbers are too tight. After fees you'd clear very little. Move on.",
  };
}

function getCompetitionColor(level: string): string {
  if (level === "high")     return "#c0392b";
  if (level === "moderate") return "#a8904e";
  return "#6dbc6d";
}

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function DecidePage() {
  const router = useRouter();
  const { session: findSession } = useFindSession();
  const { saveFind } = useFinds();

  const sessionData = findSession
    ? { imageDataUrl: findSession.imageOriginal, enteredCost: findSession.pricePaid ?? 0 }
    : null;

  const searchQuery = findSession?.refinedQuery
    ?? findSession?.identification?.searchQuery
    ?? "thrift store item";

  const identifiedTitle = findSession?.identification?.title;
  const attributes      = findSession?.identification?.attributes;

  const [appState, setAppState]         = useState<AppState>("price-entry");
  const [costStr, setCostStr]           = useState("5");
  const [soldComps, setSoldComps]       = useState<Comp[]>([]);
  const [activeComps, setActiveComps]   = useState<Comp[]>([]);
  const [soldSummary, setSoldSummary]   = useState<SoldSummary | null>(null);
  const [usingMock, setUsingMock]       = useState(false);
  const [showSoldComps, setShowSoldComps]     = useState(false);
  const [showActiveComps, setShowActiveComps] = useState(false);
  const [showBreakdown, setShowBreakdown]     = useState(false);
  const [deciding, setDeciding]         = useState(false);
  const analysisStarted                 = useRef(false);

  const { state: analysisState, run: runAnalysis, reset } = useAnalysisFlow();

  useEffect(() => {
    if (!sessionData) router.replace("/");
  }, []);

  useEffect(() => () => reset(), [reset]);

  const handleStartAnalysis = useCallback(() => {
    if (analysisStarted.current || !sessionData) return;
    analysisStarted.current = true;
    setAppState("analyzing");
    runAnalysis({
      imageDataUrl:    sessionData.imageDataUrl,
      costStr,
      searchQuery,
      identifiedTitle,
      onCompsReady: (fetchedSold, fetchedActive, fetchedSummary) => {
        setSoldComps(fetchedSold);
        setActiveComps(fetchedActive);
        setSoldSummary(fetchedSummary);
      },
      onComplete:      () => setAppState("done"),
      generateMockEvaluation,
      setUsingMock,
    });
  }, [sessionData, costStr, searchQuery, identifiedTitle, runAnalysis]);

  const enteredCost = parseFloat(costStr) || 0;

  // Pricing always uses sold comps; fall back to active if none
  const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
  const pricing      = calculatePricing(pricingComps, enteredCost);
  const verdict      = getVerdict(pricing.recommendation);
  const badge        = getBadge(pricing.recommendation);
  const roiLabel     = getROI(pricing.estimatedProfitHigh, enteredCost);

  const handleDecision = useCallback(async (decision: "purchased" | "passed") => {
    if (!sessionData || !findSession || deciding) return;
    setDeciding(true);
    const patch = {
      ...findSession,
      pricePaid: enteredCost,
      pricing: {
        medianSoldPrice:     pricing.medianSoldPrice,
        estimatedFees:       pricing.estimatedFees,
        estimatedProfitHigh: pricing.estimatedProfitHigh,
        recommendation:      pricing.recommendation,
      },
    };
    saveFind(sessionToFind(patch, decision));
    router.push("/finds");
  }, [sessionData, findSession, deciding, enteredCost, pricing, saveFind, router]);

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050f05]">
        <div style={{ color: "#3d3018", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  const NavBar = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{ background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
      <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
        style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
        <ArrowLeft size={15} style={{ color: "#7a6535" }} />
      </button>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={18} height={18}
          style={{ opacity: 0.8, filter: "drop-shadow(0 0 4px rgba(200,180,126,0.3))" }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: "#d4c9b0", letterSpacing: "0.3px" }}>
          Treehouse Search
        </span>
      </div>
      <div className="w-9" />
    </header>
  );

  // ── PRICE ENTRY ──────────────────────────────────────
  if (appState === "price-entry") {
    const sliderVal = Math.min(Math.max(parseFloat(costStr) || 0, 0), 100);
    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col">
          <motion.div className="relative w-full" style={{ height: 240 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.78) saturate(0.7) sepia(0.1)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(5,15,5,0.4) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 35%, #050f05 100%)" }} />
          </motion.div>
          <div className="flex-1 flex flex-col px-6 pt-5 pb-8 gap-5">
            <motion.div className="space-y-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2 }}>
                What's the asking price?
              </h2>
              <p style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.5, fontWeight: 300 }}>Set the price you see.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease }}>
              <div className="flex items-center gap-2 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.14)" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#7a6535" }}>$</span>
                <input type="number" inputMode="decimal" min="0" max="9999" step="1"
                  value={costStr} onChange={e => setCostStr(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStartAnalysis()}
                  placeholder="0"
                  className="flex-1 bg-transparent font-mono font-bold text-[#f5f0e8] focus:outline-none placeholder:text-[#2e2410]"
                  style={{ fontSize: 48, lineHeight: 1 }} />
              </div>
            </motion.div>
            <motion.div className="px-1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease }}>
              <div className="relative flex items-center" style={{ height: 28 }}>
                <div className="absolute left-0 right-0 h-0.5 rounded-full" style={{ background: "rgba(109,188,109,0.1)" }} />
                <div className="absolute left-0 h-0.5 rounded-full" style={{ width: `${sliderVal}%`, background: "linear-gradient(90deg, rgba(168,144,78,0.4), rgba(109,188,109,0.4))" }} />
                <input type="range" min="0" max="100" step="1" value={sliderVal}
                  onChange={e => setCostStr(e.target.value)}
                  className="absolute left-0 right-0 w-full opacity-0 cursor-pointer" style={{ height: 28, margin: 0 }} />
                <div className="absolute pointer-events-none" style={{
                  left: `calc(${sliderVal}% - 9px)`, width: 18, height: 18, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(200,180,126,0.9), rgba(168,144,78,0.95))",
                  boxShadow: "0 2px 8px rgba(5,15,5,0.6), 0 0 0 1px rgba(200,180,126,0.3)",
                }} />
              </div>
              <div className="flex justify-between mt-2" style={{ fontSize: 9, color: "rgba(106,85,40,0.4)", letterSpacing: "0.5px" }}>
                <span>$0</span><span>$100</span>
              </div>
            </motion.div>
            <div className="flex-1" />
            <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease }}>
              <motion.button onClick={handleStartAnalysis}
                className="w-full flex items-center justify-center gap-2.5 font-semibold text-[#f5f0e8] relative overflow-hidden"
                style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.2px", background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
                whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
                <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
                Look it up
              </motion.button>
              <button onClick={handleStartAnalysis}
                style={{ width: "100%", padding: "10px", fontSize: 12, color: "rgba(106,85,40,0.4)", letterSpacing: "0.3px", background: "none", border: "none", cursor: "pointer" }}>
                Continue without a price
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ── ANALYZING ────────────────────────────────────────
  if (appState === "analyzing") {
    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col px-5 py-6 pb-8 gap-6 overflow-y-auto">
          <motion.div className="flex gap-3 items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 52, height: 52, border: "1px solid rgba(109,188,109,0.1)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover" style={{ filter: "brightness(0.8) saturate(0.65)" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Price noted</div>
              <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: "#f5f0e8" }}>
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "Not entered"}
              </div>
            </div>
          </motion.div>
          <div style={{ height: 1, background: "rgba(200,180,126,0.05)" }} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <AnalysisFeed state={analysisState} />
          </motion.div>
          <AnimatePresence>
            {analysisState.priceRange && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(13,31,13,0.45)", border: "1px solid rgba(109,188,109,0.1)" }}>
                <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>Price range found</div>
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#d4c9b0" }}>${analysisState.priceRange.low.toFixed(0)}</span>
                  <span style={{ fontSize: 11, color: "#6a5528" }}>to</span>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#f5f0e8" }}>${analysisState.priceRange.high.toFixed(0)}</span>
                </div>
                {analysisState.compCount != null && (
                  <div style={{ fontSize: 11, color: "#6a5528", marginTop: 4 }}>Based on {analysisState.compCount} recent sales</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <NavBar />
      <main className="flex-1 overflow-y-auto pb-36">

        {/* ── Hero profit section ── */}
        <motion.div className="relative px-5 pt-7 pb-6"
          style={{ background: "linear-gradient(160deg, rgba(17,37,17,0.85) 0%, rgba(9,21,9,0.95) 100%)", borderBottom: "1px solid rgba(109,188,109,0.08)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.18), transparent)" }} />
          <div className="absolute top-5 right-5">
            <div style={{ padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 500, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
              {badge.label}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Estimated profit</div>
            <div className="flex items-start gap-1" style={{ fontFamily: "Georgia, serif" }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#a8904e", paddingTop: 8, lineHeight: 1 }}>+$</span>
              <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: -3, color: pricing.estimatedProfitHigh > 15 ? "#f5f0e8" : pricing.estimatedProfitHigh > 5 ? "#d4c9b0" : "#7a6535" }}>
                {Math.max(0, pricing.estimatedProfitHigh).toFixed(2)}
              </span>
            </div>
          </motion.div>
          <motion.div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: "1px solid rgba(109,188,109,0.08)" }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Resell price</div>
              <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "#d4c9b0" }}>${pricing.medianSoldPrice.toFixed(0)}</div>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(109,188,109,0.1)" }} />
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Your cost</div>
              <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "#6a5528" }}>${enteredCost.toFixed(0)}</div>
            </div>
            {enteredCost > 0 && (
              <>
                <div style={{ width: 1, height: 28, background: "rgba(109,188,109,0.1)" }} />
                <div>
                  <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Return</div>
                  <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "#7a6535" }}>{roiLabel}</div>
                </div>
              </>
            )}
          </motion.div>
          <motion.p style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.5, marginTop: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            {verdict.line}
          </motion.p>
        </motion.div>

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* ── Item thumbnail + confidence ── */}
          <motion.div className="flex gap-3 items-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }}>
            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 60, height: 60, border: "1px solid rgba(109,188,109,0.08)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover" style={{ filter: "brightness(0.82) saturate(0.72) sepia(0.08)" }} />
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 20, opacity: 0.65, background: "rgba(45,125,45,0.14)", border: "1px solid rgba(109,188,109,0.14)" }}>
              <span style={{ fontSize: 10, color: "#9fd49f", letterSpacing: "0.3px" }}>High confidence</span>
            </div>
          </motion.div>

          {/* ── Item attributes (brand, material, era, origin, category) ── */}
          {attributes && Object.values(attributes).some(v => v !== null) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 10 }}>Item details</div>
              <div className="flex flex-col gap-2">
                {([
                  attributes.brand    ? { label: "Brand",    val: attributes.brand    } : null,
                  attributes.material ? { label: "Material", val: attributes.material } : null,
                  attributes.era      ? { label: "Era",      val: attributes.era      } : null,
                  attributes.origin   ? { label: "Origin",   val: attributes.origin   } : null,
                  attributes.category ? { label: "Category", val: attributes.category } : null,
                ].filter(Boolean) as { label: string; val: string }[]).map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: "#d4c9b0", fontWeight: 500 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Market intelligence ── */}
          {soldSummary && (soldSummary.demandLevel || soldSummary.avgDaysToSell) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
              style={{ paddingTop: 12, borderTop: "1px solid rgba(200,180,126,0.06)" }}>
              <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 10 }}>Market intelligence</div>
              <div className="flex flex-col gap-2">
                {([
                  soldSummary.demandLevel   ? { label: "Demand",           val: soldSummary.demandLevel }                             : null,
                  soldSummary.avgDaysToSell ? { label: "Avg days to sell", val: `${soldSummary.avgDaysToSell} days` }                  : null,
                  soldSummary.marketVelocity ? { label: "Market velocity",  val: soldSummary.marketVelocity }                         : null,
                  soldSummary.confidence    ? { label: "Data confidence",   val: soldSummary.confidence }                             : null,
                  soldSummary.competitionCount != null ? {
                    label: "Competition",
                    val: `${soldSummary.competitionLevel} (${soldSummary.competitionCount} active)`,
                    color: getCompetitionColor(soldSummary.competitionLevel),
                  } : null,
                ].filter(Boolean) as { label: string; val: string; color?: string }[]).map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.color ?? "#d4c9b0", fontWeight: 500, textTransform: "capitalize" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Quick take ── */}
          {soldSummary?.quickTake && (
            <motion.div style={{ paddingTop: 12, borderTop: "1px solid rgba(200,180,126,0.06)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.65, fontStyle: "italic" }}>
                "{soldSummary.quickTake}"
              </p>
            </motion.div>
          )}

          {/* ── Scout assessment ── */}
          <motion.div className="rounded-2xl p-4" style={{ background: "rgba(13,31,13,0.45)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.36 }}>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="" width={12} height={12} style={{ opacity: 0.45 }} />
              <span style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2.5px" }}>Assessment</span>
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{verdict.scoutTake}"
            </p>
          </motion.div>

          {/* ── Breakdown ── */}
          <motion.div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(109,188,109,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <button onClick={() => setShowBreakdown(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: "rgba(13,31,13,0.45)" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0" }}>Breakdown</span>
              {showBreakdown ? <ChevronUp size={12} style={{ color: "#3d3018" }} /> : <ChevronDown size={12} style={{ color: "#3d3018" }} />}
            </button>
            <AnimatePresence>
              {showBreakdown && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                  {[
                    { label: "Median sold price", val: `$${pricing.medianSoldPrice.toFixed(2)}`, sub: false },
                    { label: "Your cost",         val: `– $${enteredCost.toFixed(2)}`,           sub: true  },
                    { label: "Fees",              val: `– $${pricing.estimatedFees.toFixed(2)}`, sub: true  },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between px-4 py-2.5" style={{ borderTop: "1px solid rgba(109,188,109,0.05)", background: "rgba(9,21,9,0.45)" }}>
                      <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: row.sub ? "rgba(180,60,50,0.55)" : "#d4c9b0" }}>{row.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(109,188,109,0.08)", background: "rgba(45,125,45,0.07)" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e8" }}>In your pocket</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: pricing.estimatedProfitHigh >= 0 ? "#6dbc6d" : "#c0392b" }}>
                      {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Sold comps ── */}
          {soldComps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.44 }}>
              <button onClick={() => setShowSoldComps(v => !v)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
                style={{ background: "rgba(13,31,13,0.35)", border: "1px solid rgba(109,188,109,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0" }}>Sold listings</span>
                  <span style={{ fontSize: 10, color: "#6dbc6d", background: "rgba(45,125,45,0.12)", padding: "1px 7px", borderRadius: 8 }}>{soldComps.length}</span>
                </div>
                {showSoldComps ? <ChevronUp size={12} style={{ color: "#3d3018" }} /> : <ChevronDown size={12} style={{ color: "#3d3018" }} />}
              </button>
              <AnimatePresence>
                {showSoldComps && (
                  <motion.div className="flex flex-col gap-1.5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                    {soldComps.map((comp, i) => (
                      <CompRow key={i} comp={comp} index={i} />
                    ))}
                    <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", padding: "5px 0" }}>
                      {usingMock ? "Estimated data" : "Real eBay sold listings"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Active comps (competition) ── */}
          {activeComps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.48 }}>
              <button onClick={() => setShowActiveComps(v => !v)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
                style={{ background: "rgba(13,31,13,0.35)", border: "1px solid rgba(109,188,109,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0" }}>Active listings</span>
                  <span style={{ fontSize: 10, color: soldSummary ? getCompetitionColor(soldSummary.competitionLevel) : "#a8904e", background: "rgba(45,125,45,0.08)", padding: "1px 7px", borderRadius: 8 }}>{activeComps.length}</span>
                  <span style={{ fontSize: 10, color: "#6a5528" }}>competition</span>
                </div>
                {showActiveComps ? <ChevronUp size={12} style={{ color: "#3d3018" }} /> : <ChevronDown size={12} style={{ color: "#3d3018" }} />}
              </button>
              <AnimatePresence>
                {showActiveComps && (
                  <motion.div className="flex flex-col gap-1.5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                    {activeComps.map((comp, i) => (
                      <CompRow key={i} comp={comp} index={i} />
                    ))}
                    <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", padding: "5px 0" }}>
                      Active eBay listings — your competition
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </main>

      {/* ── Fixed decision bar ── */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 safe-bottom"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.05)" }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
            style={{ padding: "16px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.2px", background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.15)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            Pick it up
          </motion.button>
          <motion.button onClick={() => handleDecision("passed")} disabled={deciding}
            className="w-full flex items-center justify-center disabled:opacity-40"
            style={{ padding: "13px", borderRadius: 12, fontSize: 12, color: "rgba(106,85,40,0.35)", border: "none", background: "none", letterSpacing: "0.3px" }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            Leave it
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Shared comp row component ─────────────────────────────────────────────────

function CompRow({ comp, index }: { comp: Comp; index: number }) {
  return (
    <motion.a href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "rgba(13,31,13,0.35)", border: "1px solid rgba(109,188,109,0.06)" }}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }} whileTap={{ scale: 0.98 }}>
      {comp.imageUrl
        ? <img src={comp.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ filter: "brightness(0.85) saturate(0.72)", border: "1px solid rgba(109,188,109,0.07)" }} />
        : <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(17,37,17,0.5)" }} />
      }
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 12, color: "#d4c9b0" }} className="truncate mb-1">{comp.title}</div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, color: "#6a5528", background: "rgba(45,125,45,0.07)", padding: "1px 5px", borderRadius: 3 }}>{comp.condition}</span>
          {comp.daysAgo > 0 && (
            <span style={{ fontSize: 10, color: "#2e2410" }}>
              {comp.listingType === "sold" ? `sold ${comp.daysAgo}d ago` : `listed ${comp.daysAgo}d ago`}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#f5f0e8" }}>${comp.price.toFixed(2)}</span>
        <span style={{ fontSize: 10, color: "#2e2410" }}>↗</span>
      </div>
    </motion.a>
  );
}
