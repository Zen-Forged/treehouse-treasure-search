"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useScanSession } from "@/hooks/useScanSession";
import { useSavedItems } from "@/hooks/useSavedItems";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { getCachedResult, setCachedResult } from "@/lib/searchCache";
import { EvaluatedItem, MockComp } from "@/types";
import clsx from "clsx";

type FetchState = "idle" | "analyzing" | "searching" | "calculating" | "recommending" | "done" | "error";

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

function getVerdict(recommendation: string, profit: number, velocity: string) {
  if (recommendation === "strong-buy") {
    return {
      cardClass: "buy",
      eyebrow: "🌿 Treasure Found",
      eyebrowColor: "text-forest-300",
      headline: "This one's worth the story",
      emoji: "🛍",
      line: `Good margin, moves fast, low risk. The hunt paid off on this one.`,
      scoutTake: profit > 0
        ? `Grab it. The margin is solid and this category moves reliably. After fees and shipping you're looking at roughly $${profit} profit. Check condition carefully before the register — that's where the money lives.`
        : `The numbers look promising. Check condition carefully and make sure it matches what's selling.`,
      buyLabel: "🛍 I'm buying this",
    };
  }
  if (recommendation === "maybe") {
    return {
      cardClass: "maybe",
      eyebrow: "🍂 Worth a Closer Look",
      eyebrowColor: "text-amber-400",
      headline: "Could be a find — dig a little deeper",
      emoji: "🔎",
      line: "The margin is there but it's tight. Condition and timing will make or break this one.",
      scoutTake: `The prices are real but there's not a lot of cushion. At your cost, you're looking at maybe $${profit} profit if it sells cleanly. Check condition carefully — only pull the trigger if it's in solid shape.`,
      buyLabel: "🛍 I'll take the chance",
    };
  }
  return {
    cardClass: "pass",
    eyebrow: "🪵 Leave It Behind",
    eyebrowColor: "text-red-400",
    headline: "Not your treasure today",
    emoji: "👋",
    line: "The numbers don't leave enough room. There's a better find waiting somewhere on this floor.",
    scoutTake: `Pass on this one. After fees and shipping you'd clear very little — and that assumes it sells right away. Your time and shelf space are worth more than this. Keep hunting.`,
    buyLabel: "Save it anyway",
  };
}

export default function DecidePage() {
  const router = useRouter();
  const { sessionData } = useScanSession();
  const { saveItem } = useSavedItems();

  const [costStr, setCostStr] = useState("0");
  const [comps, setComps] = useState<MockComp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [usingMock, setUsingMock] = useState(false);
  const [showComps, setShowComps] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const didInit = useRef(false);

  const [steps, setSteps] = useState<Step[]>([
    { id: "identify", icon: "👁", title: "Identified your find", desc: "We looked at the photo so you didn't have to type a thing.", state: "pending" },
    { id: "search", icon: "🗺", title: "Searching what treasure hunters paid", desc: "Real sold prices — not what sellers are asking, but what buyers actually paid.", state: "pending" },
    { id: "calculate", icon: "💰", title: "Running the numbers", desc: "Fees, shipping, your cost — tallying up what actually lands in your pocket.", state: "pending" },
    { id: "recommend", icon: "🎯", title: "Is this your score?", desc: "We'll tell you straight — buy it, pass on it, or dig deeper.", state: "pending" },
  ]);

  const updateStep = useCallback((index: number, state: "pending" | "active" | "done") => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, state } : s));
  }, []);

  useEffect(() => {
    if (!sessionData) router.replace("/scan");
  }, [sessionData, router]);

  useEffect(() => {
    if (!sessionData || didInit.current) return;
    didInit.current = true;
    runFullAnalysis();
  }, [sessionData]);

  const runFullAnalysis = useCallback(async () => {
    if (!sessionData) return;
    setFetchState("analyzing");

    // Step 1 — identify
    updateStep(0, "active");
    let query = "thrift store item";
    let category: string | undefined;

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: sessionData.imageDataUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) query = data.suggestion;
        if (data.itemData?.category) category = data.itemData.category;
      }
    } catch {}

    setSearchQuery(query);
    updateStep(0, "done");
    updateStep(1, "active");
    setFetchState("searching");

    // Step 2 — search sold comps
    let fetchedComps: MockComp[] = [];
    let fetchedSummary: SoldSummary | null = null;

    // Check cache first
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

    // Fallback to mock
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

    // Brief pause for UX
    await new Promise(r => setTimeout(r, 1200));
    updateStep(2, "done");
    updateStep(3, "active");
    setFetchState("recommending");

    await new Promise(r => setTimeout(r, 900));
    updateStep(3, "done");
    setFetchState("done");
  }, [sessionData, costStr, updateStep]);

  const enteredCost = parseFloat(costStr) || 0;
  const pricing = calculatePricing(comps, enteredCost);
  const verdict = getVerdict(pricing.recommendation, pricing.estimatedProfitHigh, soldSummary?.marketVelocity ?? "");
  const velocityLabel = getVelocityLabel(soldSummary?.marketVelocity ?? "", soldSummary?.avgDaysToSell ?? 0);
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

  const isAnalyzing = fetchState !== "done" && fetchState !== "error";

  // ── ANALYZING SCREEN ──
  if (isAnalyzing) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="🌲 Treehouse" showBack onBack={() => router.back()} />

        <main className="flex-1 flex flex-col px-5 py-6 pb-32 gap-5">

          {/* Hunt header */}
          <div className="text-center pt-2">
            <div className="text-xs text-forest-400 uppercase tracking-widest mb-2">
              🔎 The Hunt Is On
            </div>
            <h1 className="font-display text-xl text-bark-50 font-bold leading-snug">
              Checking if this is your treasure
            </h1>
            <p className="text-bark-500 text-xs mt-2 leading-relaxed">
              Give us a moment — we're searching the market so you don't have to guess at the register.
            </p>
          </div>

          {/* Item + cost */}
          <div className="flex gap-3 items-center px-4 py-3 rounded-2xl bg-forest-900/40 border border-forest-800/40">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-forest-900 border border-forest-800">
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-bark-600 uppercase tracking-widest mb-1">You're holding it for</div>
              <div className="flex items-center gap-2">
                <span className="text-bark-500 text-lg font-light">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={costStr}
                  onChange={e => setCostStr(e.target.value)}
                  className="bg-transparent text-2xl font-mono font-bold text-bark-50 w-24 focus:outline-none"
                  placeholder="0.00"
                />
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
              <div
                key={step.id}
                className={clsx(
                  "flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-500",
                  step.state === "done" && "bg-forest-900/30 border-forest-800/40 opacity-100",
                  step.state === "active" && "bg-forest-900/50 border-forest-600/40 opacity-100",
                  step.state === "pending" && "bg-forest-950/30 border-forest-900/30 opacity-35"
                )}
              >
                <div className={clsx(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border",
                  step.state === "done" && "bg-forest-800/50 border-forest-700/40",
                  step.state === "active" && "bg-forest-700/50 border-forest-600/50",
                  step.state === "pending" && "bg-forest-950/50 border-forest-900/30"
                )}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={clsx(
                    "text-sm font-semibold mb-0.5",
                    step.state === "pending" ? "text-bark-600" : "text-bark-100"
                  )}>
                    {step.title}
                  </div>
                  <div className={clsx(
                    "text-xs leading-relaxed",
                    step.state === "active" ? "text-bark-300" : "text-bark-600"
                  )}>
                    {step.desc}
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {step.state === "done" && <span className="text-forest-400 text-sm">✓</span>}
                  {step.state === "active" && <RefreshCw size={14} className="text-forest-400 animate-spin" />}
                  {step.state === "pending" && <span className="text-bark-700 text-sm">·</span>}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Progress bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/97 backdrop-blur-sm border-t border-forest-900/60 safe-bottom">
          <div className="h-0.5 bg-forest-900 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-forest-500 rounded-full transition-all duration-700"
              style={{
                width:
                  fetchState === "analyzing" ? "20%" :
                  fetchState === "searching" ? "50%" :
                  fetchState === "calculating" ? "80%" :
                  fetchState === "recommending" ? "93%" : "100%"
              }}
            />
          </div>
          <div className="text-center text-[11px] text-bark-600">
            {fetchState === "searching"
              ? "Searching real sold listings — takes about 30 seconds"
              : "Your verdict is almost ready 🌲"}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="🌲 Treehouse" showBack onBack={() => router.back()} />

      <main className="flex-1 overflow-y-auto pb-36">
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Verdict card */}
          <div className={clsx(
            "rounded-2xl p-5 border",
            verdict.cardClass === "buy" && "bg-forest-900/30 border-forest-700/40",
            verdict.cardClass === "maybe" && "bg-bark-900/20 border-bark-700/30",
            verdict.cardClass === "pass" && "bg-red-950/20 border-red-900/30",
          )}>
            <div className={clsx("text-[10px] uppercase tracking-widest mb-3 font-medium", verdict.eyebrowColor)}>
              {verdict.eyebrow}
            </div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-display text-xl text-bark-50 font-bold leading-snug flex-1">
                {verdict.headline}
              </h2>
              <span className="text-3xl flex-shrink-0">{verdict.emoji}</span>
            </div>
            <p className="text-bark-400 text-sm leading-relaxed border-t border-forest-900/60 pt-3">
              {verdict.line}
            </p>
          </div>

          {/* Numbers row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-forest-900/40 border border-forest-800/30 p-3 text-center">
              <div className={clsx(
                "font-mono text-xl font-bold mb-1",
                pricing.estimatedProfitHigh > 15 ? "text-forest-400" :
                pricing.estimatedProfitHigh > 5 ? "text-amber-400" : "text-bark-500"
              )}>
                {pricing.estimatedProfitHigh > 0 ? "+" : ""}${pricing.estimatedProfitHigh}
              </div>
              <div className="text-[9px] text-bark-600 uppercase tracking-wider">Est. Profit</div>
            </div>
            <div className="rounded-xl bg-forest-900/40 border border-forest-800/30 p-3 text-center">
              <div className="font-mono text-xl font-bold mb-1 text-amber-400">{roiLabel}</div>
              <div className="text-[9px] text-bark-600 uppercase tracking-wider">ROI</div>
            </div>
            <div className="rounded-xl bg-forest-900/40 border border-forest-800/30 p-3 text-center">
              <div className="font-mono text-lg font-bold mb-1 text-bark-200">{velocityLabel}</div>
              <div className="text-[9px] text-bark-600 uppercase tracking-wider">Sell Speed</div>
            </div>
          </div>

          {/* Scout's take */}
          <div className="rounded-2xl bg-forest-900/30 border border-forest-800/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs">🌲</span>
              <span className="text-[10px] text-forest-400 uppercase tracking-widest font-medium">The Scout's Take</span>
            </div>
            <p className="text-bark-300 text-sm leading-relaxed italic">
              "{soldSummary?.quickTake || verdict.scoutTake}"
            </p>
          </div>

          {/* The math */}
          <div className="rounded-2xl bg-forest-900/30 border border-forest-800/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-forest-900/60">
              <span className="text-[10px] text-bark-600 uppercase tracking-widest">💵 The math</span>
            </div>
            {[
              { label: "Median sold price", val: `$${pricing.medianSoldPrice.toFixed(2)}`, color: "" },
              { label: "Your cost", val: `– $${enteredCost.toFixed(2)}`, color: "text-red-400/70" },
              { label: "eBay fees (~13%)", val: `– $${pricing.estimatedFees.toFixed(2)}`, color: "text-red-400/70" },
              { label: "Shipping (est.)", val: `– $${pricing.estimatedShipping.toFixed(2)}`, color: "text-red-400/70" },
            ].map(row => (
              <div key={row.label} className="flex justify-between px-4 py-2.5 border-b border-forest-900/40">
                <span className="text-xs text-bark-500">{row.label}</span>
                <span className={clsx("text-xs font-mono font-semibold text-bark-200", row.color)}>{row.val}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-forest-900/30">
              <span className="text-sm text-bark-200 font-semibold">In your pocket</span>
              <span className={clsx(
                "text-sm font-mono font-bold",
                pricing.estimatedProfitHigh > 0 ? "text-forest-400" : "text-red-400"
              )}>
                {pricing.estimatedProfitHigh > 0 ? "+" : ""}${pricing.estimatedProfitHigh.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Comps */}
          <div>
            <button
              onClick={() => setShowComps(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-forest-900/30 border border-forest-800/30 text-bark-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <span className="text-sm font-medium">What sold recently</span>
                <span className="text-[10px] text-forest-400 bg-forest-900/60 px-2 py-0.5 rounded-full">
                  {comps.length} sales
                </span>
              </div>
              {showComps ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showComps && (
              <div className="mt-2 flex flex-col gap-1.5">
                {comps.map((comp, i) => (
                  <a
                    key={i}
                    href={comp.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-forest-900/30 border border-forest-800/20 active:scale-98 transition-all"
                  >
                    {comp.imageUrl ? (
                      <img src={comp.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-forest-800/30" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-forest-900 flex-shrink-0 border border-forest-800/30" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-bark-300 truncate mb-0.5">{comp.title}</div>
                      <div className="text-[10px] text-bark-600">{comp.condition} · {comp.daysAgo}d ago</div>
                    </div>
                    <div className="font-mono text-sm font-bold text-bark-100 flex-shrink-0">${comp.price.toFixed(2)}</div>
                    <span className="text-bark-700 text-xs flex-shrink-0">↗</span>
                  </a>
                ))}
                <p className="text-center text-bark-700 text-[10px] py-1">
                  {usingMock ? "Mock data · Real comps coming soon" : "Real eBay sold listings · Tap to view"}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/97 backdrop-blur-sm border-t border-forest-800/40 safe-bottom flex flex-col gap-2.5">
        <button
          onClick={() => handleDecision("purchased")}
          disabled={deciding}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-base active:scale-97 transition-all disabled:opacity-40"
        >
          <ShoppingBag size={18} />
          {verdict.buyLabel}
        </button>
        <button
          onClick={() => handleDecision("passed")}
          disabled={deciding}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-forest-800/50 text-bark-400 font-medium text-sm active:scale-97 transition-all disabled:opacity-40"
        >
          <X size={15} />
          Leave it on the shelf
        </button>
      </div>
    </div>
  );
}