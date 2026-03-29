// hooks/useAnalysisFlow.ts
// Phase 1: removed /api/suggest call — uses findSession.identification directly
"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, AnalysisMessage, AnalysisStepId } from "@/types/analysis";
import { Comp } from "@/types";

let msgCounter = 0;
const uid = () => `msg_${++msgCounter}`;

function makeMessage(
  stepId: AnalysisStepId,
  title: string,
  detail?: string,
  status: AnalysisMessage["status"] = "active"
): AnalysisMessage {
  return { id: uid(), stepId, title, detail, status };
}

const initialState: AnalysisState = {
  messages: [],
  currentStep: "uploading",
  isComplete: false,
};

interface RunAnalysisOptions {
  imageDataUrl:     string;
  costStr:          string;
  searchQuery:      string;
  identifiedTitle?: string;
  onCompsReady:     (soldComps: Comp[], activeComps: Comp[], summary: any) => void;
  onComplete:       () => void;
  generateMockEvaluation: (cost: number, imageDataUrl: string) => any;
  setUsingMock:     (v: boolean) => void;
}

export function useAnalysisFlow() {
  const [state, setState] = useState<AnalysisState>(initialState);
  const aborted = useRef(false);

  const push = useCallback((
    stepId: AnalysisStepId,
    title: string,
    detail?: string,
    status: AnalysisMessage["status"] = "complete"
  ) => {
    if (aborted.current) return;
    setState(prev => {
      const existing = prev.messages.findIndex(
        m => m.stepId === stepId && m.status === "active"
      );
      const msg = makeMessage(stepId, title, detail, status);
      const messages = existing >= 0
        ? [...prev.messages.slice(0, existing), msg, ...prev.messages.slice(existing + 1)]
        : [...prev.messages, msg];
      return { ...prev, messages, currentStep: stepId };
    });
  }, []);

  const updateState = useCallback((patch: Partial<AnalysisState>) => {
    if (aborted.current) return;
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const run = useCallback(async ({
    imageDataUrl,
    costStr,
    searchQuery,
    identifiedTitle,
    onCompsReady,
    onComplete,
    generateMockEvaluation,
    setUsingMock,
  }: RunAnalysisOptions) => {
    aborted.current = false;
    setState(initialState);

    // ── Step 1: Show what we already identified ──────────
    push("uploading", "Item already identified", identifiedTitle ?? searchQuery, "complete");
    await tick(300);

    // ── Step 2: Search comps ─────────────────────────────
    push("searching_comps", "Checking recent sales...", undefined, "active");

    let soldComps:   Comp[] = [];
    let activeComps: Comp[] = [];
    let fetchedSummary: any = null;
    let dataSource: "cache" | "live" | "mock" = "mock";

    try {
      const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if ((data.soldComps?.length ?? 0) > 0 || (data.activeComps?.length ?? 0) > 0) {
          soldComps      = data.soldComps   ?? [];
          activeComps    = data.activeComps ?? [];
          fetchedSummary = data.summary     ?? null;
          dataSource     = data.source      ?? "live";
        }
      }
    } catch {}

    const hasSoldData = soldComps.length > 0;

    if (!hasSoldData && activeComps.length === 0) {
      // Full fallback to mock
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, imageDataUrl);
      soldComps = (mock.mockComps ?? []).map((c: any) => ({ ...c, listingType: "sold" as const }));
      setUsingMock(true);
      dataSource = "mock";
      push("searching_comps", "Using estimated market data", "Live data unavailable", "complete");
    } else {
      const pricingComps = hasSoldData ? soldComps : activeComps;
      const prices = pricingComps.map(c => c.price).sort((a, b) => a - b);
      const low    = prices[0];
      const high   = prices[prices.length - 1];

      updateState({ compCount: soldComps.length, priceRange: { low, high } });

      const soldLabel  = hasSoldData ? `${soldComps.length} sold` : "no sold data";
      const activeLabel = `${activeComps.length} active`;
      const sourceNote  = dataSource === "cache" ? "cached" : "live";

      push(
        "searching_comps",
        hasSoldData
          ? `Found ${soldComps.length} recent sales`
          : `No sold listings — ${activeComps.length} active listings found`,
        `${soldLabel} · ${activeLabel} · $${low.toFixed(0)}–$${high.toFixed(0)} (${sourceNote})`,
        "complete"
      );
    }

    await tick(300);

    // ── Step 3: Calculate value ──────────────────────────
    push("analyzing_market", "Calculating value...", undefined, "active");
    await tick(800);

    const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
    const prices       = pricingComps.map(c => c.price).sort((a, b) => a - b);
    const median       = computeMedian(prices);
    updateState({ medianPrice: median });

    const compLevel = fetchedSummary?.competitionLevel;
    const compCount = fetchedSummary?.competitionCount ?? activeComps.length;
    const competitionNote = compLevel === "high"
      ? `High competition — ${compCount} active listings`
      : compLevel === "moderate"
        ? `Moderate competition — ${compCount} active listings`
        : compCount > 0
          ? `Low competition — ${compCount} active listings`
          : undefined;

    push(
      "analyzing_market",
      `Most items are selling around $${median.toFixed(0)}`,
      competitionNote ?? fetchedSummary?.quickTake ?? undefined,
      "complete"
    );

    onCompsReady(soldComps, activeComps, fetchedSummary);
    await tick(400);

    // ── Step 4: Finalizing ───────────────────────────────
    push("finalizing", "Calculating profit...", undefined, "active");
    await tick(600);
    push("finalizing", "Your result is ready", undefined, "complete");

    updateState({ isComplete: true });
    await tick(300);
    onComplete();
  }, [push, updateState]);

  const reset = useCallback(() => {
    aborted.current = true;
    setState(initialState);
    msgCounter = 0;
  }, []);

  return { state, run, reset };
}

function tick(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function computeMedian(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
