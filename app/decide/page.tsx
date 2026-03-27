"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Camera } from "lucide-react";
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
type FetchState = "idle" | "analyzing" | "searching" | "calculating" | "recommending" | "done";

interface SoldSummary {
  recommendedPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  marketVelocity: string;
  demandLevel: string;
  quickTake: string;
  confidence: string;
  avgDaysToSell: number;
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

function getVerdict(recommendation: string, profit: number) {
  if (recommendation === "strong-buy") {
    return {
      chipClass: "bg-forest-900/40 border-forest-700/40 text-forest-300",
      chipLabel: "A strong find",
      line: "Strong margin. Sells reliably. This one stands out.",
      scoutTake: `Strong margin and steady demand. After fees, the return is clear. Condition looks solid — worth picking up.`,
      buyLabel: "Pick it up",
    };
  }
  if (recommendation === "maybe") {
    return {
      chipClass: "bg-amber-900/20 border-amber-800/30 text-amber-500",
      chipLabel: "Worth considering",
      line: "Reasonable margin. Condition and timing will determine the outcome.",
      scoutTake: `Decent margin but not a lot of room. If condition is clean and the price holds, this works. Proceed with care.`,
      buyLabel: "Pick it up",
    };
  }
  return {
    chipClass: "bg-red-950/30 border-red-900/40 text-red-400",
    chipLabel: "Slim margin",
    line: "After fees, there isn't much room. A better find may be nearby.",
    scoutTake: "The numbers are too tight. After fees you'd clear very little. Move on.",
    buyLabel: "Pick it up anyway",
  };
}

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
};

export default function DecidePage() {
  const router = useRouter();
  const { sessionData } = useScanSession();
  const { saveItem } = useSavedItems();

  const [appState, setAppState] = useState<AppState>("price-entry");
  const [costStr, setCostStr] = useState("");
  const [comps, setComps] = useState<MockComp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [usingMock, setUsingMock] = useState(false);
  const [showComps, setShowComps] = useState(false);
  const [showMath, setShowMath] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const analysisStarted = useRef(false);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const [steps, setSteps] = useState<Step[]>([
    { id: "identify",  title: "Identifying the item",    state: "pending" },
    { id: "search",    title: "Reviewing recent sales",  state: "pending" },
    { id: "calculate", title: "Calculating value",       state: "pending" },
    { id: "recommend", title: "Preparing your result",   state: "pending" },
  ]);

  const updateStep = useCallback((index: number, state: "pending" | "active" | "done") => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, state } : s));
  }, []);

  useEffect(() => { if (!sessionData) router.replace("/scan"); }, [sessionData, router]);
  useEffect(() => { if (appState === "price-entry") setTimeout(() => priceInputRef.current?.focus(), 300); }, [appState]);

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
      const res = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageDataUrl: sessionData.imageDataUrl }) });
      if (res.ok) { const data = await res.json(); if (data.suggestion) query = data.suggestion; }
    } catch {}

    updateStep(0, "done"); updateStep(1, "active"); setFetchState("searching");

    let fetchedComps: MockComp[] = [];
    let fetchedSummary: SoldSummary | null = null;
    const cached = getCachedResult(query);
    if (cached) { fetchedComps = cached.comps; fetchedSummary = cached.summary; }
    else {
      try {
        const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(query)}`);
        if (res.ok) { const data = await res.json(); if (data.comps?.length > 0) { fetchedComps = data.comps; fetchedSummary = data.summary; setCachedResult(query, data); } }
      } catch {}
    }

    if (fetchedComps.length === 0) { const mock = generateMockEvaluation(parseFloat(costStr) || 0, sessionData.imageDataUrl); fetchedComps = mock.mockComps; setUsingMock(true); }

    setComps(fetchedComps); setSoldSummary(fetchedSummary);
    updateStep(1, "done"); updateStep(2, "active"); setFetchState("calculating");
    await new Promise(r => setTimeout(r, 1200));
    updateStep(2, "done"); updateStep(3, "active"); setFetchState("recommending");
    await new Promise(r => setTimeout(r, 900));
    updateStep(3, "done"); setFetchState("done"); setAppState("done");
  }, [sessionData, costStr, updateStep]);

  const enteredCost = parseFloat(costStr) || 0;
  const pricing = calculatePricing(comps, enteredCost);
  const verdict = getVerdict(pricing.recommendation, pricing.estimatedProfitHigh);
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

  if (!sessionData) return <div className="flex items-center justify-center min-h-screen bg-[#050f05]"><div className="text-bark-700 text-sm">Loading...</div></div>;

  const NavBar = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-forest-900/60"
      style={{ background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
      <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full border border-forest-900/50 text-bark-500" style={{ background: "rgba(13,31,13,0.5)" }}>
        <ArrowLeft size={16} />
      </button>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Treehouse Search" width={20} height={20} style={{ filter: "drop-shadow(0 0 4px rgba(200,180,126,0.35))", opacity: 0.9 }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.3px" }}>Treehouse Search</span>
      </div>
      <div className="w-9" />
    </header>
  );

  // ── PRICE ENTRY ──
  if (appState === "price-entry") {
    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col">

          {/* Image — fades in */}
          <motion.div
            className="relative w-full"
            style={{ height: 260 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.8) saturate(0.75) sepia(0.08)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #050f05 100%)" }} />
          </motion.div>

          <div className="flex-1 flex flex-col px-6 pt-6 pb-8 gap-6">

            {/* Headline */}
            <motion.div className="space-y-2" variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.1, ease }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2 }}>What are they asking?</h2>
              <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.6, fontWeight: 300 }}>Enter the price you see. We'll help you understand the value.</p>
            </motion.div>

            {/* Input */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.18, ease }}>
              <div className="flex items-center gap-3 px-5 py-5 rounded-2xl cursor-text"
                style={{ background: "rgba(17,37,17,0.7)", border: "1px solid rgba(109,188,109,0.18)" }}
                onClick={() => priceInputRef.current?.focus()}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300, color: "#7a6535" }}>$</span>
                <input ref={priceInputRef} type="number" inputMode="decimal" min="0" step="0.01"
                  value={costStr} onChange={e => setCostStr(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStartAnalysis()}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-5xl font-mono font-bold text-[#f5f0e8] focus:outline-none placeholder:text-[#2e2410]" />
              </div>
            </motion.div>

            {/* Quick chips */}
            <motion.div className="flex gap-2 flex-wrap" variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.24, ease }}>
              {["1", "2", "5", "10", "20", "25"].map(val => (
                <motion.button key={val} onClick={() => setCostStr(val)} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: costStr === val ? "rgba(44,106,44,0.6)" : "rgba(13,31,13,0.5)",
                    color: costStr === val ? "#d4c9b0" : "#6a5528",
                    border: costStr === val ? "1px solid rgba(109,188,109,0.25)" : "1px solid rgba(109,188,109,0.08)",
                    transition: "background 0.2s, color 0.2s",
                  }}>
                  ${val}
                </motion.button>
              ))}
            </motion.div>

            <div className="flex-1" />

            {/* CTA */}
            <motion.div className="space-y-2" variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.32, ease }}>
              <motion.button onClick={handleStartAnalysis}
                disabled={!costStr || parseFloat(costStr) <= 0}
                className="w-full flex items-center justify-center gap-2.5 font-semibold disabled:opacity-30"
                style={{
                  padding: "17px 22px", borderRadius: 16, fontSize: 15, color: "#f5f0e8", letterSpacing: "0.2px",
                  background: "linear-gradient(175deg, rgba(44,106,44,0.97) 0%, rgba(38,92,38,0.99) 50%, rgba(32,80,32,1) 100%)",
                  border: "1px solid rgba(109,188,109,0.18)",
                  boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.12)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Camera size={16} strokeWidth={1.5} />
                Look it up
              </motion.button>
              <button onClick={handleStartAnalysis}
                className="w-full py-3 text-center"
                style={{ fontSize: 12, color: "rgba(106,85,40,0.5)", letterSpacing: "0.3px" }}>
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
            <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "3px" }}>Taking a closer look</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.25 }}>Understanding what you found</h1>
            <p style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>We're identifying the item and checking recent sales.</p>
          </motion.div>

          {/* Item summary */}
          <motion.div className="flex gap-3 items-center px-4 py-3 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(109,188,109,0.12)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
                style={{ filter: "brightness(0.85) saturate(0.8)" }} />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>Price noted</div>
              <div style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 700, color: "#f5f0e8" }}>
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "Not entered"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
                <span style={{ fontSize: 11, color: "#6dbc6d" }}>
                  {fetchState === "analyzing" && "Identifying the item…"}
                  {fetchState === "searching" && "Checking recent sales…"}
                  {fetchState === "calculating" && "Calculating value…"}
                  {fetchState === "recommending" && "Preparing your result…"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Steps — staggered reveal */}
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <AnimatePresence key={step.id}>
                <motion.div
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-500",
                    step.state === "done"    && "border-forest-900/30",
                    step.state === "active"  && "border-forest-700/30",
                    step.state === "pending" && "border-transparent"
                  )}
                  style={{
                    background: step.state === "active" ? "rgba(13,31,13,0.55)" :
                                step.state === "done"   ? "rgba(9,21,9,0.4)" : "transparent",
                  }}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: step.state === "pending" ? 0.2 : 1,
                    x: 0,
                  }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                >
                  <div className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border",
                    step.state === "done"    && "border-forest-700/50 bg-forest-900/50",
                    step.state === "active"  && "border-forest-600/50 bg-forest-800/50",
                    step.state === "pending" && "border-forest-900/30 bg-transparent"
                  )}>
                    {step.state === "done"   && <span style={{ color: "#6dbc6d", fontSize: 10 }}>✓</span>}
                    {step.state === "active" && <RefreshCw size={10} className="text-forest-400 animate-spin" />}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 400, letterSpacing: "0.1px",
                    color: step.state === "pending" ? "#3d3018" : step.state === "active" ? "#d4c9b0" : "#7a6535",
                    transition: "color 0.4s",
                  }}>
                    {step.title}
                  </span>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        </main>

        {/* Progress bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 safe-bottom"
          style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200,180,126,0.06)" }}>
          <div className="h-px bg-forest-950 rounded-full overflow-hidden mb-2.5">
            <motion.div className="h-full rounded-full"
              style={{ background: "rgba(109,188,109,0.5)" }}
              initial={{ width: "0%" }}
              animate={{
                width: fetchState === "analyzing" ? "20%" : fetchState === "searching" ? "50%" :
                       fetchState === "calculating" ? "80%" : fetchState === "recommending" ? "93%" : "100%"
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(106,85,40,0.5)", letterSpacing: "0.3px" }}>
            {fetchState === "searching" ? "Checking real sales data — a moment more" : "Almost ready"}
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

        {/* Hero image */}
        <motion.div className="relative w-full" style={{ height: 240 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>
          <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(0.75) sepia(0.06)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,15,5,0.45) 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-28" style={{ background: "linear-gradient(to bottom, transparent, #050f05)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between">
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>Your cost</div>
              <div style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 700, color: "#f5f0e8" }}>
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "—"}
              </div>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 20, opacity: 0.75, background: "rgba(45,125,45,0.2)", border: "1px solid rgba(109,188,109,0.2)" }}>
              <span style={{ fontSize: 10, color: "#9fd49f", letterSpacing: "0.3px" }}>High confidence</span>
            </div>
          </div>
        </motion.div>

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Primary value — staggered reveal */}
          <motion.div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(160deg, rgba(17,37,17,0.9), rgba(9,21,9,0.95))", border: "1px solid rgba(109,188,109,0.12)" }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
            <div className="absolute top-0 left-[15%] right-[15%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.25), transparent)" }} />

            {/* Resell price */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4, fontWeight: 400 }}>Resell price</div>
              <div className="flex items-start gap-1 mb-1" style={{ fontFamily: "Georgia, serif" }}>
                <span style={{ fontSize: 24, fontWeight: 500, color: "#a8904e", paddingTop: 6 }}>$</span>
                <span style={{ fontSize: 62, fontWeight: 700, color: "#f5f0e8", lineHeight: 1, letterSpacing: -2 }}>
                  {pricing.medianSoldPrice.toFixed(2)}
                </span>
              </div>
            </motion.div>

            {/* Profit */}
            <motion.div className="flex items-center gap-3 pt-3 mt-1 border-t border-forest-950/80"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}>
              <span style={{
                fontSize: 24, fontWeight: 700, fontFamily: "monospace",
                color: pricing.estimatedProfitHigh > 15 ? "#6dbc6d" : pricing.estimatedProfitHigh > 5 ? "#d4920a" : "#6a5528"
              }}>
                {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
              </span>
              <div className="flex flex-col gap-0.5">
                <span style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px" }}>Profit</span>
                {enteredCost > 0 && <span style={{ fontSize: 10, color: "#7a6535", fontWeight: 400 }}>{roiLabel} return</span>}
              </div>
            </motion.div>

            {/* Verdict */}
            <motion.div className="flex items-center gap-3 pt-3 mt-3 border-t border-forest-950/60"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}>
              <span className={clsx("text-xs font-medium px-3 py-1.5 rounded-full border flex-shrink-0", verdict.chipClass)} style={{ fontSize: 11, letterSpacing: "0.2px" }}>
                {verdict.chipLabel}
              </span>
              <span style={{ fontSize: 12, color: "#6a5528", lineHeight: 1.45 }}>{verdict.line}</span>
            </motion.div>
          </motion.div>

          {/* Assessment */}
          <motion.div className="rounded-2xl p-4"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.08)" }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="" width={14} height={14} style={{ opacity: 0.55 }} />
              <span style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2.5px", fontWeight: 500 }}>Assessment</span>
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{soldSummary?.quickTake || verdict.scoutTake}"
            </p>
          </motion.div>

          {/* Math */}
          <motion.div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(109,188,109,0.08)" }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36, ease: "easeOut" }}>
            <button onClick={() => setShowMath(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5" style={{ background: "rgba(13,31,13,0.5)" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0", letterSpacing: "0.2px" }}>The numbers</span>
              {showMath ? <ChevronUp size={13} className="text-bark-700" /> : <ChevronDown size={13} className="text-bark-700" />}
            </button>
            <AnimatePresence>
              {showMath && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                  {[
                    { label: "Median sold price", val: `$${pricing.medianSoldPrice.toFixed(2)}`, sub: false },
                    { label: "Your cost", val: `– $${enteredCost.toFixed(2)}`, sub: true },
                    { label: "eBay fees (~13%)", val: `– $${pricing.estimatedFees.toFixed(2)}`, sub: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between px-4 py-2.5" style={{ borderTop: "1px solid rgba(109,188,109,0.06)", background: "rgba(9,21,9,0.5)" }}>
                      <span style={{ fontSize: 12, color: "#6a5528" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: row.sub ? "rgba(180,60,50,0.6)" : "#d4c9b0" }}>{row.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(109,188,109,0.1)", background: "rgba(45,125,45,0.08)" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#f5f0e8" }}>In your pocket</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: pricing.estimatedProfitHigh >= 0 ? "#6dbc6d" : "#c0392b" }}>
                      {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Comps */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.42, ease: "easeOut" }}>
            <button onClick={() => setShowComps(v => !v)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: "rgba(13,31,13,0.4)", border: "1px solid rgba(109,188,109,0.07)" }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 500, color: "#d4c9b0" }}>Recent sales</span>
                <span style={{ fontSize: 10, color: "#6dbc6d", background: "rgba(45,125,45,0.14)", padding: "2px 8px", borderRadius: 8 }}>{comps.length}</span>
              </div>
              {showComps ? <ChevronUp size={13} className="text-bark-700" /> : <ChevronDown size={13} className="text-bark-700" />}
            </button>
            <AnimatePresence>
              {showComps && (
                <motion.div className="flex flex-col gap-1.5"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}>
                  {comps.map((comp, i) => (
                    <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(13,31,13,0.4)", border: "1px solid rgba(109,188,109,0.07)" }}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                      whileTap={{ scale: 0.98 }}>
                      {comp.imageUrl
                        ? <img src={comp.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ border: "1px solid rgba(109,188,109,0.08)", filter: "brightness(0.9) saturate(0.8)" }} />
                        : <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(17,37,17,0.6)", border: "1px solid rgba(109,188,109,0.08)" }} />
                      }
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 12, color: "#d4c9b0", fontWeight: 400 }} className="truncate mb-1">{comp.title}</div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 10, color: "#6a5528", background: "rgba(45,125,45,0.08)", padding: "1px 6px", borderRadius: 4 }}>{comp.condition}</span>
                          <span style={{ fontSize: 10, color: "#3d3018" }}>{comp.daysAgo}d ago</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#f5f0e8" }}>${comp.price.toFixed(2)}</span>
                        <span style={{ fontSize: 10, color: "#3d3018" }}>↗</span>
                      </div>
                    </motion.a>
                  ))}
                  <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", padding: "6px 0" }}>
                    {usingMock ? "Estimated data" : "Real eBay sold listings"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>

      {/* Bottom bar — slides up */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 safe-bottom"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.14), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="w-full flex items-center justify-center gap-2 font-semibold disabled:opacity-40"
            style={{
              padding: "16px 22px", borderRadius: 16, fontSize: 15, color: "#f5f0e8",
              background: "linear-gradient(175deg, rgba(44,106,44,0.97) 0%, rgba(32,80,32,1) 100%)",
              border: "1px solid rgba(109,188,109,0.18)",
              boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}>
            Pick it up
          </motion.button>
          <motion.button onClick={() => handleDecision("passed")} disabled={deciding}
            className="w-full flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ padding: "13px", borderRadius: 12, fontSize: 13, color: "rgba(106,85,40,0.5)", border: "1px solid rgba(109,188,109,0.08)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}>
            Leave it
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}