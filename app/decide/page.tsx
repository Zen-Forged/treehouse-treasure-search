"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, X, ChevronDown, ChevronUp,
  Search, RefreshCw, Sparkles, TrendingUp
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { PriceInput } from "@/components/PriceInput";
import { RecommendationMeter } from "@/components/RecommendationMeter";
import { CompCard } from "@/components/CompCard";
import { PricingBreakdown } from "@/components/PricingBreakdown";
import { useScanSession } from "@/hooks/useScanSession";
import { useSavedItems } from "@/hooks/useSavedItems";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { getCachedResult, setCachedResult } from "@/lib/searchCache";
import { EvaluatedItem, MockComp } from "@/types";

type FetchState = "idle" | "loading" | "success" | "error" | "cached";

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

export default function DecidePage() {
  const router = useRouter();
  const { sessionData } = useScanSession();
  const { saveItem } = useSavedItems();

  const [costStr, setCostStr] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemCategory, setItemCategory] = useState<string | null>(null);
  const [comps, setComps] = useState<MockComp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [usingMock, setUsingMock] = useState(false);
  const [showComps, setShowComps] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (!sessionData) router.replace("/scan");
  }, [sessionData, router]);

  useEffect(() => {
    if (!sessionData || didInit.current) return;
    didInit.current = true;
    suggestSearchTerm();
  }, [sessionData]);

  const suggestSearchTerm = useCallback(async () => {
    if (!sessionData) return;
    setSuggesting(true);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: sessionData.imageDataUrl }),
      });

      if (!res.ok) throw new Error("Suggest API error");
      const data = await res.json();

      if (data.suggestion) {
        setSearchQuery(data.suggestion);
      } else {
        setSearchQuery("thrift store item");
      }

      if (data.itemData?.category) {
        setItemCategory(data.itemData.category);
      }
    } catch {
      setSearchQuery("thrift store item");
    } finally {
      setSuggesting(false);
    }
  }, [sessionData]);

  const fetchComps = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setFetchState("loading");
      setUsingMock(false);

      // Check cache first
      const cached = getCachedResult(query.trim());
      if (cached) {
        setComps(cached.comps);
        setSoldSummary(cached.summary);
        setFetchState("cached");
        setShowComps(true);
        return;
      }

      try {
        const res = await fetch(
          `/api/sold-comps?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (!data.comps || data.comps.length === 0) {
          throw new Error("No results");
        }

        // Cache the result
        setCachedResult(query.trim(), data);

        setComps(data.comps);
        setSoldSummary(data.summary);
        setFetchState("success");
        setShowComps(true);
      } catch {
        // Fallback to mock
        if (sessionData) {
          const mock = generateMockEvaluation(
            parseFloat(costStr) || 0,
            sessionData.imageDataUrl
          );
          setComps(mock.mockComps);
        }
        setUsingMock(true);
        setFetchState("error");
      }
    },
    [sessionData, costStr]
  );

  const enteredCost = parseFloat(costStr) || 0;
  const pricing = calculatePricing(comps, enteredCost);

  const handleDecision = useCallback(
    async (decision: "purchased" | "passed") => {
      if (!sessionData || deciding || comps.length === 0) return;
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
    },
    [sessionData, deciding, comps, enteredCost, pricing, saveItem, router]
  );

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-bark-600 text-sm">Loading...</div>
      </div>
    );
  }

  const isLoading = fetchState === "loading";
  const canDecide = comps.length > 0 && !isLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Decision" showBack onBack={() => router.back()} />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-5 py-5 space-y-5">

          {/* Image + cost row */}
          <div className="flex gap-3 animate-fade-up">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-forest-900 border border-forest-800">
              <img
                src={sessionData.imageDataUrl}
                alt="Item"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <PriceInput
                value={costStr}
                onChange={setCostStr}
                label="What did you pay?"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Search input */}
          <div className="animate-fade-up-delay-1 space-y-1.5">
            <label className="block text-xs font-medium text-bark-400 uppercase tracking-widest">
              Search Sold Comps
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {suggesting ? (
                  <RefreshCw size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500 animate-spin" />
                ) : (
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-600" />
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fetchComps(searchQuery)
                  }
                  placeholder="Analyzing image..."
                  className="w-full pl-9 pr-3 py-3 bg-forest-900/60 border border-forest-700/60 rounded-xl text-bark-100 text-sm placeholder:text-bark-700 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500/40 transition-all"
                />
              </div>
              <button
                onClick={() => fetchComps(searchQuery)}
                disabled={isLoading || !searchQuery.trim() || suggesting}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-forest-700 hover:bg-forest-600 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
              >
                {isLoading
                  ? <RefreshCw size={16} className="text-white animate-spin" />
                  : <Search size={16} className="text-white" />
                }
              </button>
            </div>

            {/* Status messages */}
            {suggesting && (
              <p className="text-forest-500/80 text-xs pt-0.5 flex items-center gap-1">
                <Sparkles size={11} />
                Analyzing image…
              </p>
            )}
            {!suggesting && fetchState === "idle" && searchQuery && (
              <p className="text-bark-600 text-xs pt-0.5">
                ✦ AI suggested — edit if needed, then tap search
              </p>
            )}
            {!suggesting && fetchState === "idle" && !searchQuery && (
              <p className="text-bark-600 text-xs pt-0.5">
                Type what the item is, then tap search
              </p>
            )}
            {isLoading && (
              <p className="text-bark-600 text-xs pt-0.5">
                Searching eBay sold listings — this takes ~30 seconds…
              </p>
            )}
            {fetchState === "cached" && (
              <p className="text-forest-500 text-xs pt-0.5">
                ✓ Loaded from cache — saved you a search
              </p>
            )}
            {fetchState === "success" && (
              <p className="text-forest-500 text-xs pt-0.5">
                ✓ Live eBay sold comps loaded
              </p>
            )}
            {usingMock && fetchState === "error" && (
              <p className="text-amber-500/80 text-xs pt-0.5">
                Search unavailable — showing mock comps
              </p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-forest-900/40 border border-forest-800/40 animate-pulse" />
              <div className="h-32 rounded-2xl bg-forest-900/40 border border-forest-800/40 animate-pulse" />
              <div className="text-center text-bark-600 text-xs py-2">
                Fetching real sold listings…
              </div>
            </div>
          )}

          {/* Quick take from Apify */}
          {!isLoading && soldSummary?.quickTake && (
            <div className="rounded-xl bg-forest-900/40 border border-forest-700/40 px-4 py-3 flex gap-2 animate-fade-up-delay-1">
              <TrendingUp size={14} className="text-forest-400 flex-shrink-0 mt-0.5" />
              <p className="text-bark-300 text-xs leading-relaxed">
                {soldSummary.quickTake}
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && comps.length > 0 && (
            <>
              <div className="animate-fade-up-delay-2">
                <RecommendationMeter recommendation={pricing.recommendation} />
              </div>
              <div className="animate-fade-up-delay-3">
                <PricingBreakdown item={{ ...pricing, enteredCost }} />
              </div>
              <div className="animate-fade-up-delay-4">
                <button
                  onClick={() => setShowComps((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-forest-900/30 border border-forest-800/40 text-bark-300 hover:border-forest-700 transition-all"
                >
                  <span className="text-sm font-medium">
                    Sold Comps ({comps.length})
                  </span>
                  {showComps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showComps && (
                  <div className="mt-2 space-y-2">
                    {comps.map((comp, i) => (
                      <CompCard key={i} comp={comp} />
                    ))}
                    <p className="text-center text-bark-700 text-[10px] py-1">
                      {usingMock ? "Mock data" : "Real eBay sold listings"}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* No results */}
          {!isLoading && fetchState === "error" && comps.length === 0 && (
            <div className="rounded-2xl bg-forest-900/30 border border-forest-800/40 p-6 text-center space-y-2">
              <p className="text-bark-400 text-sm">No comps found</p>
              <p className="text-bark-600 text-xs">Try a different search term</p>
            </div>
          )}

        </div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/95 backdrop-blur-sm border-t border-forest-800/50 safe-bottom space-y-2.5">
        <PrimaryButton
          fullWidth
          size="lg"
          onClick={() => handleDecision("purchased")}
          disabled={deciding || !canDecide}
          className="gap-3"
        >
          <ShoppingBag size={20} />
          Purchase
        </PrimaryButton>
        <SecondaryButton
          fullWidth
          onClick={() => handleDecision("passed")}
          disabled={deciding || !canDecide}
          className="gap-2"
        >
          <X size={18} />
          Pass on This
        </SecondaryButton>
      </div>
    </div>
  );
}