"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
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
  icon: string;
  title: string;
  desc: string;
  state: "pending" | "active" | "done";
}

function getVelocityLabel(velocity: string, days: number): string {
  if (!velocity && !days) return "~2 wks";
  if (velocity === "fast" || days <= 7) return "~1 wk";
  if (velocity === "slow" || days >= 21) return "Slow";
  return "~2 wks";
}

function getROI(profit: number, cost: number): string {
  if (!cost) return "—";
  return Math.round((profit / cost) * 100) + "%";
}

function getVerdict(recommendation: string, profit: number) {
  if (recommendation === "strong-buy") {
    return {
      chipClass: "bg-forest-900/40 border-forest-600/40 text-forest-300",
      chipLabel: "🌿 Strong Buy",
      headline: "This one's worth the story",
      line: "Good margin, moves fast, low risk. The hunt paid off on this one.",
      scoutTake: `Grab it. The margin is solid and this category moves reliably. After fees you're looking at roughly $${profit} profit. Check condition carefully before the register.`,
      buyLabel: "I'm buying this",
    };
  }
  if (recommendation === "maybe") {
    return {
      chipClass: "bg-amber-900/20 border-amber-700/30 text-amber-400",
      chipLabel: "🍂 Worth a Closer Look",
      headline: "Could be a find — dig deeper",
      line: "The margin is there but it's tight. Condition and timing will make or break this one.",
      scoutTake: `The prices are real but there's not a lot of cushion. You're looking at maybe $${profit} profit if it sells cleanly. Only pull the trigger if it's in solid shape.`,
      buyLabel: "I'll take the chance",
    };
  }
  return {
    chipClass: "bg-red-950/30 border-red-900/40 text-red-400",
    chipLabel: "🪵 Leave It Behind",
    headline: "Not your treasure today",
    line: "The numbers don't leave enough room. There's a better find waiting on this floor.",
    scoutTake: "Pass on this one. After fees you'd clear very little. Your time and shelf space are worth more. Keep hunting.",
    buyLabel: "Save it anyway",
  };
}

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
    { id: "identify", icon: "👁", title: "Identified your find", desc: "We looked at the photo so you didn't have to type a thing.", state: "pending" },
    { id: "search", icon: "🗺", title: "Searching what treasure hunters paid", desc: "Real sold prices — not what sellers are asking, but what buyers actually paid.", state: "pending" },
    { id: "calculate", icon: "💰", title: "Running the numbers", desc: "Fees, your cost — tallying up what actually lands in your pocket.", state: "pending" },
    { id: "recommend", icon: "🎯", title: "Is this your score?", desc: "We'll tell you straight — buy it, pass on it, or dig deeper.", state: "pending" },
  ]);

  const updateStep = useCallback((index: number, state: "pending" | "active" | "done") => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, state } : s));
  }, []);

  useEffect(() => {
    if (!sessionData) router.replace("/scan");
  }, [sessionData, router]);

  // Auto-focus price input on mount
  useEffect(() => {
    if (appState === "price-entry") {
      setTimeout(() => priceInputRef.current?.focus(), 300);
    }
  }, [appState]);

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
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) query = data.suggestion;
      }
    } catch {}

    updateStep(0, "done");
    updateStep(1, "active");
    setFetchState("searching");

    let fetchedComps: MockComp[] = [];
    let fetchedSummary: SoldSummary | null = null;

    const cached = getCachedResult(query);
    if (cached) {
      fetchedComps = cached.comps;
      fetchedSummary = cached.summary;
    } else {
      try {
        const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.comps?.length > 0) {
            fetchedComps = data.comps;
            fetchedSummary = data.summary;
            setCachedResult(query, data);
          }
        }
      } catch {}
    }

    if (fetchedComps.length === 0) {
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, sessionData.imageDataUrl);
      fetchedComps = mock.mockComps;
      setUsingMock(true);
    }

    setComps(fetchedComps);
    setSoldSummary(fetchedSummary);
    updateStep(1, "done");
    updateStep(2, "active");
    setFetchState("calculating");

    await new Promise(r => setTimeout(r, 1200));
    updateStep(2, "done");
    updateStep(3, "active");
    setFetchState("recommending");

    await new Promise(r => setTimeout(r, 900));
    updateStep(3, "done");
    setFetchState("done");
    setAppState("done");
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
      createdAt: new Date().toISOString(),
      decision,
      imageDataUrl: sessionData.imageDataUrl,
      enteredCost,
      mockComps: comps,
      ...pricing,
    };
    saveItem(item);
    router.push(`/item/${item.id}`);
  }, [sessionData, deciding, comps, enteredCost, pricing, saveItem, router]);

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-bark-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Shared nav
  const NavBar = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-forest-950/90 backdrop-blur-sm border-b border-forest-800/40">
      <button
        onClick={() => router.back()}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-forest-900/50 border border-forest-800/40 text-bark-400"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Treehouse Search" width={22} height={22} className="drop-shadow-[0_0_4px_rgba(200,180,126,0.4)]" />
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold text-bark-100 leading-none">Treehouse Search</span>
          <span className="text-[8px] text-bark-600 uppercase tracking-widest leading-none mt-0.5">Embrace the search</span>
        </div>
      </div>
      <div className="w-9" />
    </header>
  );

  // ── PRICE ENTRY SCREEN ──
  if (appState === "price-entry") {
    return (
      <div className="flex flex-col min-h-screen bg-forest-950">
        <NavBar />

        <main className="flex-1 flex flex-col">

          {/* Item photo */}
          <div className="relative w-full" style={{ height: 260 }}>
            <img
              src={sessionData.imageDataUrl}
              alt="Item"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.85) saturate(0.8)" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #050f05 100%)" }} />
          </div>

          {/* Price entry card */}
          <div className="flex-1 flex flex-col px-5 pt-6 pb-8 gap-6">

            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-bark-50">What's the price tag?</h2>
              <p className="text-bark-500 text-sm leading-relaxed">
                Enter what they're asking. We'll tell you if the margin makes sense.
              </p>
            </div>

            {/* Big price input */}
            <div
              className="flex items-center gap-3 px-5 py-5 rounded-2xl"
              style={{ background: "rgba(17,37,17,0.7)", border: "1px solid rgba(109,188,109,0.2)" }}
              onClick={() => priceInputRef.current?.focus()}
            >
              <span className="font-display text-4xl font-light text-bark-500">$</span>
              <input
                ref={priceInputRef}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={costStr}
                onChange={e => setCostStr(e.target.value)}
                onKeyDown={e => e.key === "Enter" && costStr && handleStartAnalysis()}
                placeholder="0.00"
                className="flex-1 bg-transparent text-5xl font-mono font-bold text-bark-50 focus:outline-none placeholder:text-bark-800"
              />
            </div>

            {/* Quick price chips */}
            <div className="flex gap-2 flex-wrap">
              {["1", "2", "5", "10", "20", "25"].map(val => (
                <button
                  key={val}
                  onClick={() => setCostStr(val)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95",
                    costStr === val
                      ? "bg-forest-700 text-bark-50 border border-forest-500"
                      : "bg-forest-900/50 text-bark-400 border border-forest-800/40"
                  )}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* CTA */}
            <div className="space-y-2.5">
              <button
                onClick={handleStartAnalysis}
                disabled={!costStr || parseFloat(costStr) <= 0}
                className="w-full py-4 rounded-2xl text-bark-50 text-base font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, #2d7d2d, #3d9c3d)",
                  boxShadow: "0 2px 24px rgba(45,125,45,0.28)"
                }}
              >
                🔎 Find Comps
              </button>
              <button
                onClick={handleStartAnalysis}
                className="w-full py-3 text-bark-600 text-sm font-medium"
              >
                Skip — search without a price
              </button>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ── ANALYZING SCREEN ──
  if (appState === "analyzing") {
    return (
      <div className="flex flex-col min-h-screen bg-forest-950">
        <NavBar />

        <main className="flex-1 flex flex-col px-5 py-6 pb-32 gap-5">
          <div className="text-center pt-2">
            <div className="text-xs text-forest-400 uppercase tracking-widest mb-2">🔎 The Hunt Is On</div>
            <h1 className="font-display text-xl text-bark-50 font-bold leading-snug">Checking if this is your treasure</h1>
            <p className="text-bark-500 text-xs mt-2 leading-relaxed">
              Give us a moment — we're searching the market so you don't have to guess at the register.
            </p>
          </div>

          {/* Item + cost summary */}
          <div className="flex gap-3 items-center px-4 py-3 rounded-2xl bg-forest-900/40 border border-forest-800/40">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-forest-900 border border-forest-800">
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-bark-600 uppercase tracking-widest mb-0.5">You're holding it for</div>
              <div className="text-2xl font-mono font-bold text-bark-50">
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "No price entered"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse" />
                <span className="text-[11px] text-forest-400">
                  {fetchState === "analyzing" && "Identifying your find…"}
                  {fetchState === "searching" && "Searching real sold listings…"}
                  {fetchState === "calculating" && "Running the numbers…"}
                  {fetchState === "recommending" && "Almost ready…"}
                </span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2.5">
            {steps.map((step) => (
              <div key={step.id} className={clsx(
                "flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-500",
                step.state === "done" && "bg-forest-900/30 border-forest-800/40 opacity-100",
                step.state === "active" && "bg-forest-900/50 border-forest-600/40 opacity-100",
                step.state === "pending" && "bg-forest-950/30 border-forest-900/30 opacity-35"
              )}>
                <div className={clsx(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border",
                  step.state === "done" && "bg-forest-800/50 border-forest-700/40",
                  step.state === "active" && "bg-forest-700/50 border-forest-600/50",
                  step.state === "pending" && "bg-forest-950/50 border-forest-900/30"
                )}>{step.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={clsx("text-sm font-semibold mb-0.5", step.state === "pending" ? "text-bark-600" : "text-bark-100")}>{step.title}</div>
                  <div className={clsx("text-xs leading-relaxed", step.state === "active" ? "text-bark-300" : "text-bark-600")}>{step.desc}</div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {step.state === "done" && <span className="text-forest-400 text-sm">✓</span>}
                  {step.state === "active" && <RefreshCw size={14} className="text-forest-400 animate-spin" />}
                  {step.state === "pending" && <span className="text-bark-700">·</span>}
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/97 backdrop-blur-sm border-t border-forest-900/60 safe-bottom">
          <div className="h-0.5 bg-forest-900 rounded-full overflow-hidden mb-2.5">
            <div className="h-full bg-forest-500 rounded-full transition-all duration-700" style={{
              width: fetchState === "analyzing" ? "20%" : fetchState === "searching" ? "50%" : fetchState === "calculating" ? "80%" : fetchState === "recommending" ? "93%" : "100%"
            }} />
          </div>
          <div className="text-center text-[11px] text-bark-600">
            {fetchState === "searching" ? "Searching real sold listings — takes about 30 seconds" : "Your verdict is almost ready 🌲"}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  return (
    <div className="flex flex-col min-h-screen bg-forest-950">
      <NavBar />

      <main className="flex-1 overflow-y-auto pb-36">

        {/* Hero */}
        <div className="relative w-full" style={{ height: 240 }}>
          <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover" style={{ filter: "brightness(0.9) saturate(0.85)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to bottom, transparent, #050f05)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between">
            <div>
              <div className="text-[9px] text-bark-600 uppercase tracking-widest mb-0.5">You paid</div>
              <div className="text-2xl font-mono font-bold text-bark-50">
                {costStr ? `$${parseFloat(costStr).toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ background: "rgba(45,125,45,0.25)", border: "1px solid rgba(109,188,109,0.3)" }}>
              <span className="text-[10px] text-forest-300 font-medium">High confidence</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Primary value */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(160deg, rgba(17,37,17,0.9), rgba(9,21,9,0.95))", border: "1px solid rgba(109,188,109,0.14)" }}>
            <div className="absolute top-0 left-[15%] right-[15%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.3), transparent)" }} />

            <div className="text-[9px] text-bark-600 uppercase tracking-widest mb-1">Estimated Resell Price</div>
            <div className="flex items-start gap-1 mb-1" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-bark-400 text-2xl font-semibold mt-1">$</span>
              <span className="text-bark-50 font-bold leading-none" style={{ fontSize: 64, letterSpacing: -2 }}>
                {pricing.medianSoldPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-3 mt-1 border-t border-forest-900/60">
              <span className={clsx(
                "text-2xl font-bold font-mono",
                pricing.estimatedProfitHigh > 15 ? "text-forest-400" :
                pricing.estimatedProfitHigh > 5 ? "text-amber-400" : "text-bark-500"
              )}>
                {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] text-bark-600 uppercase tracking-widest">Estimated Profit</span>
                {enteredCost > 0 && <span className="text-[11px] text-forest-400 font-semibold">{roiLabel} ROI</span>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 mt-3 border-t border-forest-900/40">
              <span className={clsx("text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0", verdict.chipClass)}>
                {verdict.chipLabel}
              </span>
              <span className="text-xs text-bark-500 leading-snug">{verdict.line}</span>
            </div>
          </div>

          {/* Scout's take */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(13,31,13,0.55)", border: "1px solid rgba(200,180,126,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="" width={16} height={16} className="opacity-70" />
              <span className="text-[9px] text-bark-400 uppercase tracking-widest font-semibold">The Scout's Take</span>
            </div>
            <p className="text-bark-300 leading-relaxed italic" style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>
              "{soldSummary?.quickTake || verdict.scoutTake}"
            </p>
          </div>

          {/* Math */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(109,188,109,0.1)" }}>
            <button onClick={() => setShowMath(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: "rgba(13,31,13,0.55)" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm">💵</span>
                <span className="text-sm font-semibold text-bark-200">The Math</span>
              </div>
              {showMath ? <ChevronUp size={14} className="text-bark-600" /> : <ChevronDown size={14} className="text-bark-600" />}
            </button>
            {showMath && (
              <div>
                {[
                  { label: "Median sold price", val: `$${pricing.medianSoldPrice.toFixed(2)}`, sub: false },
                  { label: "Your cost", val: `– $${enteredCost.toFixed(2)}`, sub: true },
                  { label: "eBay fees (~13%)", val: `– $${pricing.estimatedFees.toFixed(2)}`, sub: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between px-4 py-2.5"
                    style={{ borderTop: "1px solid rgba(109,188,109,0.07)", background: "rgba(9,21,9,0.5)" }}>
                    <span className="text-xs text-bark-600">{row.label}</span>
                    <span className={clsx("text-xs font-mono font-semibold", row.sub ? "text-red-400/70" : "text-bark-200")}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3"
                  style={{ borderTop: "1px solid rgba(109,188,109,0.15)", background: "rgba(45,125,45,0.1)" }}>
                  <span className="text-sm font-semibold text-bark-100">In your pocket</span>
                  <span className={clsx("text-sm font-mono font-bold", pricing.estimatedProfitHigh >= 0 ? "text-forest-400" : "text-red-400")}>
                    {pricing.estimatedProfitHigh >= 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Comps */}
          <div>
            <button onClick={() => setShowComps(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ background: "rgba(13,31,13,0.4)", border: "1px solid rgba(109,188,109,0.09)" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-bark-200">What sold recently</span>
                <span className="text-[10px] text-forest-400 font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(45,125,45,0.16)" }}>{comps.length} sales</span>
              </div>
              {showComps ? <ChevronUp size={14} className="text-bark-600" /> : <ChevronDown size={14} className="text-bark-600" />}
            </button>
            {showComps && (
              <div className="flex flex-col gap-1.5">
                {comps.map((comp, i) => (
                  <a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl active:scale-[0.98] transition-all"
                    style={{ background: "rgba(13,31,13,0.45)", border: "1px solid rgba(109,188,109,0.09)" }}>
                    {comp.imageUrl ? (
                      <img src={comp.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                        style={{ border: "1px solid rgba(109,188,109,0.1)" }} />
                    ) : (
                      <div className="w-11 h-11 rounded-lg flex-shrink-0"
                        style={{ background: "rgba(17,37,17,0.6)", border: "1px solid rgba(109,188,109,0.1)" }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-bark-300 truncate mb-1 font-medium">{comp.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-bark-600 px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(45,125,45,0.1)" }}>{comp.condition}</span>
                        <span className="text-[10px] text-bark-700">{comp.daysAgo}d ago</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold font-mono text-bark-100">${comp.price.toFixed(2)}</span>
                      <span className="text-[10px] text-bark-700">↗</span>
                    </div>
                  </a>
                ))}
                <p className="text-center text-[10px] py-1" style={{ color: "rgba(61,48,24,0.8)" }}>
                  {usingMock ? "Mock data · Real comps coming soon" : "Real eBay sold listings · Tap to view"}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 safe-bottom"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.08)" }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.18), transparent)" }} />
        <div className="flex flex-col gap-2">
          <button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="w-full py-4 rounded-2xl text-bark-50 text-base font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #2d7d2d, #3d9c3d)", boxShadow: "0 2px 24px rgba(45,125,45,0.28)" }}>
            🛍 {verdict.buyLabel}
          </button>
          <button onClick={() => handleDecision("passed")} disabled={deciding}
            className="w-full py-3.5 rounded-xl text-bark-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40"
            style={{ border: "1px solid rgba(109,188,109,0.14)" }}>
            Leave it on the shelf
          </button>
        </div>
      </div>
    </div>
  );
}