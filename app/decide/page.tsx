"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useScanSession } from "@/hooks/useScanSession";
import { useSavedItems } from "@/hooks/useSavedItems";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { getCachedResult, setCachedResult } from "@/lib/searchCache";
import { EvaluatedItem, MockComp } from "@/types";
import clsx from "clsx";

type AppState = "price-entry" | "analyzing" | "done" | "error";
type FetchState = "idle" | "analyzing" | "searching" | "calculating" | "done";

interface SoldSummary {
  recommendedPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  marketVelocity: string;
  demandLevel: string;
  quickTake: string;
  confidence: string;
  avgDaysToSell: number;
  meta?: { itemsAnalyzed?: number };
}

interface Step {
  id: string;
  title: string;
  state: "pending" | "active" | "done";
}

function getROI(profit: number, cost: number): string {
  if (!cost) return "—";
  return Math.round((profit / cost) * 100) + "%";
}

function getBadge(recommendation: string) {
  if (recommendation === "strong-buy") return { label: "Strong find",         color: "#c8b47e", border: "rgba(200,180,126,0.35)", bg: "rgba(200,180,126,0.08)" };
  if (recommendation === "maybe")      return { label: "Worth a closer look", color: "#a0a0a8", border: "rgba(160,160,168,0.35)", bg: "rgba(160,160,168,0.08)" };
  return                                      { label: "Marginal",            color: "#9a7a5a", border: "rgba(154,122,90,0.35)",  bg: "rgba(154,122,90,0.08)"  };
}

function getVerdict(recommendation: string, profit: number) {
  if (recommendation === "strong-buy") return {
    line: "Strong margin. Sells reliably. This one stands out.",
    scoutTake: `Strong margin and steady demand. After fees, the return is clear. Condition looks solid.`,
  };
  if (recommendation === "maybe") return {
    line: "Reasonable margin. Condition and timing will determine the outcome.",
    scoutTake: `Decent margin but not a lot of room. If condition is clean and the price holds, this works.`,
  };
  return {
    line: "After fees, there isn't much room. A better find may be nearby.",
    scoutTake: "The numbers are too tight. After fees you'd clear very little. Move on.",
  };
}

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function DecidePage() {
  const router = useRouter();
  const { sessionData } = useScanSession();
  const { saveItem } = useSavedItems();

  const [appState, setAppState]     = useState<AppState>("price-entry");
  const [costStr, setCostStr]       = useState("5");
  const [comps, setComps]           = useState<MockComp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [usingMock, setUsingMock]   = useState(false);
  const [showComps, setShowComps]   = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [deciding, setDeciding]     = useState(false);
  const analysisStarted             = useRef(false);

  const [steps, setSteps] = useState<Step[]>([
    { id: "identify",  title: "Identifying the item",   state: "pending" },
    { id: "search",    title: "Reviewing recent sales",  state: "pending" },
    { id: "calculate", title: "Calculating value",       state: "pending" },
  ]);

  const updateStep = useCallback((index: number, state: Step["state"]) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, state } : s));
  }, []);

  useEffect(() => { if (!sessionData) router.replace("/scan"); }, [sessionData, router]);

  const handleStartAnalysis = useCallback(() => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;
    setAppState("analyzing");
    runAnalysis();
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!sessionData) return;
    setFetchState("analyzing");
    updateStep(0, "active");

    let query = "thrift store item";
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: sessionData.imageDataUrl }),
      });
      if (res.ok) { const d = await res.json(); if (d.suggestion) query = d.suggestion; }
    } catch {}

    updateStep(0, "done"); updateStep(1, "active"); setFetchState("searching");

    let fetchedComps: MockComp[] = [];
    let fetchedSummary: SoldSummary | null = null;
    const cached = getCachedResult(query);
    if (cached) { fetchedComps = cached.comps; fetchedSummary = cached.summary; }
    else {
      try {
        const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const d = await res.json();
          if (d.comps?.length > 0) { fetchedComps = d.comps; fetchedSummary = d.summary; setCachedResult(query, d); }
        }
      } catch {}
    }

    if (fetchedComps.length === 0) {
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, sessionData.imageDataUrl);
      fetchedComps = mock.mockComps;
      setUsingMock(true);
    }

    setComps(fetchedComps); setSoldSummary(fetchedSummary);
    updateStep(1, "done"); updateStep(2, "active"); setFetchState("calculating");
    await new Promise(r => setTimeout(r, 1400));
    updateStep(2, "done"); setFetchState("done"); setAppState("done");
  }, [sessionData, costStr, updateStep]);

  const enteredCost = parseFloat(costStr) || 0;
  const pricing  = calculatePricing(comps, enteredCost);
  const verdict  = getVerdict(pricing.recommendation, pricing.estimatedProfitHigh);
  const badge    = getBadge(pricing.recommendation);
  const roiLabel = getROI(pricing.estimatedProfitHigh, enteredCost);

  const handleDecision = useCallback(async (decision: "purchased" | "passed") => {
    if (!sessionData || deciding) return;
    setDeciding(true);
    const item: EvaluatedItem = {
      id: `tts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(), decision,
      imageDataUrl: sessionData.imageDataUrl, enteredCost, mockComps: comps, ...pricing,
    };
    saveItem(item);
    router.push(`/item/${item.id}`);
  }, [sessionData, deciding, comps, enteredCost, pricing, saveItem, router]);

  if (!sessionData) return (
    <div className="flex items-center justify-center min-h-screen bg-[#050f05]">
      <div style={{ color: "#3d3018", fontSize: 13 }}>Loading...</div>
    </div>
  );

  const NavBar = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{ background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
      <button onClick={() => router.back()}
        className="w-9 h-9 flex items-center justify-center rounded-full"
        style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
        <ArrowLeft size={15} style={{ color: "#7a6535" }} />
      </button>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={18} height={18} style={{ opacity: 0.8, filter: "drop-shadow(0 0 4px rgba(200,180,126,0.3))" }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: "#d4c9b0", letterSpacing: "0.3px" }}>
          Treehouse Search
        </span>
      </div>
      <div className="w-9" />
    </header>
  );

  // ── PRICE ENTRY ──
  if (appState === "price-entry") {
    const sliderVal = Math.min(Math.max(parseFloat(costStr) || 0, 0), 100);

    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col">

          {/* Image */}
          <motion.div className="relative w-full" style={{ height: 240 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}>
            <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.78) saturate(0.7) sepia(0.1)" }} />
            <div className="absolute inset-0" style={{
              background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(5,15,5,0.4) 100%)"
            }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 35%, #050f05 100%)" }} />
          </motion.div>

          <div className="flex-1 flex flex-col px-6 pt-5 pb-8 gap-5">

            {/* Headline */}
            <motion.div className="space-y-1.5"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2 }}>
                What's the asking price?
              </h2>
              <p style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.5, fontWeight: 300 }}>
                Set the price you see.
              </p>
            </motion.div>

            {/* Price display */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease }}>
              <div className="flex items-center gap-2 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.14)" }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#7a6535" }}>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="9999"
                  step="1"
                  value={costStr}
                  onChange={e => setCostStr(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStartAnalysis()}
                  placeholder="0"
                  className="flex-1 bg-transparent font-mono font-bold text-[#f5f0e8] focus:outline-none placeholder:text-[#2e2410]"
                  style={{ fontSize: 48, lineHeight: 1 }}
                />
              </div>
            </motion.div>

            {/* Slider */}
            <motion.div className="px-1"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease }}>
              <div className="relative flex items-center" style={{ height: 28 }}>
                {/* track background */}
                <div className="absolute left-0 right-0 h-0.5 rounded-full" style={{ background: "rgba(109,188,109,0.1)" }} />
                {/* filled track */}
                <div className="absolute left-0 h-0.5 rounded-full" style={{
                  width: `${sliderVal}%`,
                  background: "linear-gradient(90deg, rgba(168,144,78,0.4), rgba(109,188,109,0.4))",
                }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={sliderVal}
                  onChange={e => setCostStr(e.target.value)}
                  className="absolute left-0 right-0 w-full opacity-0 cursor-pointer"
                  style={{ height: 28, margin: 0 }}
                />
                {/* thumb */}
                <div className="absolute pointer-events-none" style={{
                  left: `calc(${sliderVal}% - 9px)`,
                  width: 18, height: 18,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(200,180,126,0.9), rgba(168,144,78,0.95))",
                  boxShadow: "0 2px 8px rgba(5,15,5,0.6), 0 0 0 1px rgba(200,180,126,0.3)",
                }} />
              </div>
              <div className="flex justify-between mt-2" style={{ fontSize: 9, color: "rgba(106,85,40,0.4)", letterSpacing: "0.5px" }}>
                <span>$0</span>
                <span>$100</span>
              </div>
            </motion.div>

            <div className="flex-1" />

            {/* CTA */}
            <motion.div className="space-y-2"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease }}>
              <motion.button
                onClick={handleStartAnalysis}
                className="w-full flex items-center justify-center gap-2.5 font-semibold text-[#f5f0e8] relative overflow-hidden"
                style={{
                  padding: "17px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.2px",
                  background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
                  border: "1px solid rgba(109,188,109,0.16)",
                  boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
                Look it up
              </motion.button>
              <button
                onClick={handleStartAnalysis}
                style={{ width: "100%", padding: "10px", fontSize: 12, color: "rgba(106,85,40,0.4)", letterSpacing: "0.3px", background: "none", border: "none", cursor: "pointer" }}>
                Continue without a price
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ── ANALYZING ──
  if (appState === "analyzing") {
    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col px-5 py-8 pb-32 gap-6">

          <motion.div className="text-center pt-2 space-y-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}>
            <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "3px" }}>
              Taking a closer look
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.25 }}>
              Understanding what you found
            </h1>
          </motion.div>

          <motion.div className="flex gap-3 items-center px-4 py-3 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.08)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: "1px solid rgba(109,188,109,0.1)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
                style={{ filter: "brightness(0.8) saturate(0.7)" }} />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>
                Price noted
              </div>
              <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 700, color: "#f5f0e8" }}>
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "Not entered"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#6dbc6d" }} />
                <span style={{ fontSize: 11, color: "#6dbc6d" }}>
                  {fetchState === "analyzing"  && "Identifying the item…"}
                  {fetchState === "searching"  && "Reviewing recent sales…"}
                  {fetchState === "calculating" && "Calculating value…"}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <motion.div key={step.id}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-500",
                  step.state === "done"    && "border-forest-900/25",
                  step.state === "active"  && "border-forest-700/25",
                  step.state === "pending" && "border-transparent"
                )}
                style={{
                  background: step.state === "active" ? "rgba(13,31,13,0.5)" :
                              step.state === "done"   ? "rgba(9,21,9,0.35)" : "transparent",
                }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: step.state === "pending" ? 0.18 : 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
              >
                <div className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border",
                  step.state === "done"    && "border-forest-700/40",
                  step.state === "active"  && "border-forest-600/40",
                  step.state === "pending" && "border-forest-900/30"
                )}>
                  {step.state === "done"   && <span style={{ color: "#6dbc6d", fontSize: 10 }}>✓</span>}
                  {step.state === "active" && <RefreshCw size={10} className="animate-spin" style={{ color: "#6dbc6d" }} />}
                </div>
                <span style={{
                  fontSize: 13, letterSpacing: "0.1px", transition: "color 0.4s",
                  color: step.state === "pending" ? "#2e2410" : step.state === "active" ? "#d4c9b0" : "#6a5528",
                }}>
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 safe-bottom"
          style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200,180,126,0.05)" }}>
          <div className="h-px rounded-full overflow-hidden mb-2.5" style={{ background: "rgba(109,188,109,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(168,144,78,0.4), rgba(109,188,109,0.45))" }}
              initial={{ width: "0%" }}
              animate={{
                width: fetchState === "analyzing" ? "22%" : fetchState === "searching" ? "55%" :
                       fetchState === "calculating" ? "85%" : "100%"
              }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(106,85,40,0.4)", letterSpacing: "0.3px" }}>
            {fetchState === "searching" ? "Checking real sales data" : "Almost ready"}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <NavBar />

      <main className="flex-1 overflow-y-auto pb-36">

        {/* ── HERO: PROFIT FIRST ── */}
        <motion.div
          className="relative px-5 pt-7 pb-6"
          style={{
            background: "linear-gradient(160deg, rgba(17,37,17,0.85) 0%, rgba(9,21,9,0.95) 100%)",
            borderBottom: "1px solid rgba(109,188,109,0.08)",
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.18), transparent)" }} />

          {/* badge — top right */}
          <div className="absolute top-5 right-5">
            <div style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 500, letterSpacing: "0.3px",
              color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
            }}>
              {badge.label}
            </div>
          </div>

          {/* Profit — primary hero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>
              Estimated profit
            </div>
            <div className="flex items-start gap-1" style={{ fontFamily: "Georgia, serif" }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#a8904e", paddingTop: 8, lineHeight: 1 }}>+$</span>
              <span style={{
                fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: -3,
                color: pricing.estimatedProfitHigh > 15 ? "#f5f0e8" : pricing.estimatedProfitHigh > 5 ? "#d4c9b0" : "#7a6535",
              }}>
                {Math.max(0, pricing.estimatedProfitHigh).toFixed(2)}
              </span>
            </div>
          </motion.div>

          {/* Secondary: resell + cost row */}
          <motion.div className="flex items-center gap-5 mt-4 pt-4"
            style={{ borderTop: "1px solid rgba(109,188,109,0.08)" }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}>
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Resell price</div>
              <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "#d4c9b0" }}>
                ${pricing.medianSoldPrice.toFixed(0)}
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(109,188,109,0.1)" }} />
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Your cost</div>
              <div style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "#6a5528" }}>
                ${enteredCost.toFixed(0)}
              </div>
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

          {/* Verdict line */}
          <motion.p
            style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.5, marginTop: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}>
            {verdict.line}
          </motion.p>
        </motion.div>

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Image — reduced, reference only */}
          <motion.div className="flex gap-3 items-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: "easeOut" }}>
            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 60, height: 60, border: "1px solid rgba(109,188,109,0.08)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
                style={{ filter: "brightness(0.82) saturate(0.72) sepia(0.08)" }} />
            </div>
            {/* confidence tag inline with image */}
            <div style={{ padding: "4px 10px", borderRadius: 20, opacity: 0.65, background: "rgba(45,125,45,0.14)", border: "1px solid rgba(109,188,109,0.14)" }}>
              <span style={{ fontSize: 10, color: "#9fd49f", letterSpacing: "0.3px" }}>High confidence</span>
            </div>
          </motion.div>

          {/* Why it stands out */}
          {soldSummary && (soldSummary.demandLevel || soldSummary.avgDaysToSell || soldSummary.confidence) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}>
              <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 12 }}>
                Why it stands out
              </div>
              <div className="flex flex-col gap-2">
                {[
                  soldSummary.demandLevel   && { label: "Demand",          val: soldSummary.demandLevel },
                  soldSummary.avgDaysToSell && { label: "Avg days to sell", val: `${soldSummary.avgDaysToSell} days` },
                  soldSummary.marketVelocity && { label: "Market velocity",  val: soldSummary.marketVelocity },
                  soldSummary.confidence    && { label: "Confidence",        val: soldSummary.confidence },
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: "#d4c9b0", fontWeight: 500, textTransform: "capitalize" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick take */}
          {soldSummary?.quickTake && (
            <motion.div
              style={{ paddingTop: 12, borderTop: "1px solid rgba(200,180,126,0.06)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.65, fontStyle: "italic" }}>
                "{soldSummary.quickTake}"
              </p>
            </motion.div>
          )}

          {/* Assessment */}
          <motion.div className="rounded-2xl p-4"
            style={{ background: "rgba(13,31,13,0.45)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36, ease: "easeOut" }}>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="" width={12} height={12} style={{ opacity: 0.45 }} />
              <span style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2.5px" }}>Assessment</span>
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{verdict.scoutTake}"
            </p>
          </motion.div>

          {/* Breakdown */}
          <motion.div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(109,188,109,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}>
            <button onClick={() => setShowBreakdown(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: "rgba(13,31,13,0.45)" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0", letterSpacing: "0.2px" }}>Breakdown</span>
              {showBreakdown ? <ChevronUp size={12} style={{ color: "#3d3018" }} /> : <ChevronDown size={12} style={{ color: "#3d3018" }} />}
            </button>
            <AnimatePresence>
              {showBreakdown && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                  {[
                    { label: "Median sold price", val: `$${pricing.medianSoldPrice.toFixed(2)}`, sub: false },
                    { label: "Your cost",         val: `– $${enteredCost.toFixed(2)}`,           sub: true },
                    { label: "Fees",              val: `– $${pricing.estimatedFees.toFixed(2)}`, sub: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between px-4 py-2.5"
                      style={{ borderTop: "1px solid rgba(109,188,109,0.05)", background: "rgba(9,21,9,0.45)" }}>
                      <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: row.sub ? "rgba(180,60,50,0.55)" : "#d4c9b0" }}>{row.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3"
                    style={{ borderTop: "1px solid rgba(109,188,109,0.08)", background: "rgba(45,125,45,0.07)" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e8" }}>In your pocket</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: pricing.estimatedProfitHigh >= 0 ? "#6dbc6d" : "#c0392b" }}>
                      {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* What it's selling for */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44, ease: "easeOut" }}>
            <button onClick={() => setShowComps(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: "rgba(13,31,13,0.35)", border: "1px solid rgba(109,188,109,0.06)" }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0" }}>What it's selling for</span>
                <span style={{ fontSize: 10, color: "#6dbc6d", background: "rgba(45,125,45,0.12)", padding: "1px 7px", borderRadius: 8 }}>{comps.length}</span>
              </div>
              {showComps ? <ChevronUp size={12} style={{ color: "#3d3018" }} /> : <ChevronDown size={12} style={{ color: "#3d3018" }} />}
            </button>
            <AnimatePresence>
              {showComps && (
                <motion.div className="flex flex-col gap-1.5"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}>
                  {comps.map((comp, i) => (
                    <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(13,31,13,0.35)", border: "1px solid rgba(109,188,109,0.06)" }}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, delay: i * 0.04, ease: "easeOut" }}
                      whileTap={{ scale: 0.98 }}>
                      {comp.imageUrl
                        ? <img src={comp.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ filter: "brightness(0.85) saturate(0.72)", border: "1px solid rgba(109,188,109,0.07)" }} />
                        : <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(17,37,17,0.5)" }} />
                      }
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12, color: "#d4c9b0" }} className="truncate mb-1">{comp.title}</div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 10, color: "#6a5528", background: "rgba(45,125,45,0.07)", padding: "1px 5px", borderRadius: 3 }}>{comp.condition}</span>
                          <span style={{ fontSize: 10, color: "#2e2410" }}>{comp.daysAgo}d ago</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#f5f0e8" }}>${comp.price.toFixed(2)}</span>
                        <span style={{ fontSize: 10, color: "#2e2410" }}>↗</span>
                      </div>
                    </motion.a>
                  ))}
                  <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", padding: "5px 0" }}>
                    {usingMock ? "Estimated data" : "Real eBay sold listings"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>

      {/* Bottom bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 safe-bottom"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.05)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
            style={{
              padding: "16px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.2px",
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.15)",
              boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            Pick it up
          </motion.button>
          <motion.button onClick={() => handleDecision("passed")} disabled={deciding}
            className="w-full flex items-center justify-center disabled:opacity-40"
            style={{ padding: "13px", borderRadius: 12, fontSize: 12, color: "rgba(106,85,40,0.35)", border: "none", background: "none", letterSpacing: "0.3px" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}>
            Leave it
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}