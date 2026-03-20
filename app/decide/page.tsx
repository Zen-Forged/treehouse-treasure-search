"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, X, ChevronDown, ChevronUp } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { PriceInput } from "@/components/PriceInput";
import { RecommendationMeter } from "@/components/RecommendationMeter";
import { CompCard } from "@/components/CompCard";
import { PricingBreakdown } from "@/components/PricingBreakdown";
import { useScanSession } from "@/hooks/useScanSession";
import { useSavedItems } from "@/hooks/useSavedItems";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { EvaluatedItem } from "@/types";

export default function DecidePage() {
  const router = useRouter();
  const { sessionData, setSessionData } = useScanSession();
  const { saveItem } = useSavedItems();

  const [costStr, setCostStr] = useState("0");
  const [evaluation, setEvaluation] = useState<Omit<EvaluatedItem, "id" | "createdAt" | "decision"> | null>(null);
  const [showComps, setShowComps] = useState(false);
  const [deciding, setDeciding] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!sessionData) {
      router.replace("/scan");
    }
  }, [sessionData, router]);

  // Regenerate evaluation when cost changes
  useEffect(() => {
    if (!sessionData) return;
    const cost = parseFloat(costStr) || 0;
    const eval_ = generateMockEvaluation(cost, sessionData.imageDataUrl);
    setEvaluation(eval_);
    setSessionData({ ...sessionData, enteredCost: cost });
  }, [costStr, sessionData?.imageDataUrl]); // eslint-disable-line

  const handleDecision = useCallback(
    async (decision: "purchased" | "passed") => {
      if (!sessionData || !evaluation || deciding) return;
      setDeciding(true);

      const item: EvaluatedItem = {
        id: `tts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        decision,
        ...evaluation,
      };

      saveItem(item);
      router.push(`/item/${item.id}`);
    },
    [sessionData, evaluation, deciding, saveItem, router]
  );

  if (!sessionData || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-bark-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Decision"
        showBack
        onBack={() => router.back()}
      />

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

          {/* Recommendation Meter */}
          <div className="animate-fade-up-delay-1">
            <RecommendationMeter recommendation={evaluation.recommendation} />
          </div>

          {/* Pricing Breakdown */}
          <div className="animate-fade-up-delay-2">
            <PricingBreakdown item={evaluation} />
          </div>

          {/* Comps toggle */}
          <div className="animate-fade-up-delay-3">
            <button
              onClick={() => setShowComps((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-forest-900/30 border border-forest-800/40 text-bark-300 hover:border-forest-700 transition-all"
            >
              <span className="text-sm font-medium">
                Comparable Sales ({evaluation.mockComps.length})
              </span>
              {showComps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showComps && (
              <div className="mt-2 space-y-2">
                {evaluation.mockComps.map((comp, i) => (
                  <CompCard key={i} comp={comp} />
                ))}
                <p className="text-center text-bark-700 text-[10px] py-1">
                  Mock data · V1 · Real comps coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/95 backdrop-blur-sm border-t border-forest-800/50 safe-bottom space-y-2.5">
        <PrimaryButton
          fullWidth
          size="lg"
          onClick={() => handleDecision("purchased")}
          disabled={deciding}
          className="gap-3"
        >
          <ShoppingBag size={20} />
          Purchase
        </PrimaryButton>
        <SecondaryButton
          fullWidth
          onClick={() => handleDecision("passed")}
          disabled={deciding}
          className="gap-2"
        >
          <X size={18} />
          Pass on This
        </SecondaryButton>
      </div>
    </div>
  );
}
