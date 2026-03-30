// hooks/useAnalysisFlow.ts
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
  primaryColor?:    string;
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
    primaryColor,
    onCompsReady,
    onComplete,
    generateMockEvaluation,
    setUsingMock,
  }: RunAnalysisOptions) => {
    aborted.current = false;
    setState(initialState);

    // Step 1 — identity confirmed
    push(
      "uploading",
      identifiedTitle ? `Identified as ${identifiedTitle}` : "Item identified",
      undefined,
      "complete"
    );
    await tick(350);

    // Step 2 — fetch comp data
    push("searching_comps", "Searching recent sales…", undefined, "active");

    let soldComps:    Comp[] = [];
    let activeComps:  Comp[] = [];
    let fetchedSummary: any  = null;
    let dataSource: "cache" | "live" | "mock" = "mock";

    try {
      const colorParam = primaryColor ? `&color=${encodeURIComponent(primaryColor)}` : "";
      const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(searchQuery)}${colorParam}`);
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
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, imageDataUrl);
      soldComps = (mock.mockComps ?? []).map((c: any) => ({ ...c, listingType: "sold" as const }));
      setUsingMock(true);
      dataSource = "mock";
      push("searching_comps", "Using estimated market data", undefined, "complete");
    } else {
      const pricingComps = hasSoldData ? soldComps : activeComps;
      const prices = pricingComps.map(c => c.price).sort((a, b) => a - b);
      const low    = prices[0];
      const high   = prices[prices.length - 1];

      updateState({ compCount: soldComps.length, priceRange: { low, high } });

      push(
        "searching_comps",
        hasSoldData
          ? `Found ${soldComps.length} recent sales`
          : `Checking active listings`,
        hasSoldData
          ? `Price range $${low.toFixed(0)} — $${high.toFixed(0)}`
          : `${activeComps.length} active listings found`,
        "complete"
      );
    }

    await tick(300);

    // Step 3 — market analysis
    push("analyzing_market", "Estimating resell value…", undefined, "active");
    await tick(800);

    const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
    const prices       = pricingComps.map(c => c.price).sort((a, b) => a - b);
    const median       = computeMedian(prices);
    updateState({ medianPrice: median });

    const compLevel = fetchedSummary?.competitionLevel;
    const compCount = fetchedSummary?.competitionCount ?? activeComps.length;
    const competitionNote =
      compLevel === "high"     ? `${compCount} active listings — competitive market` :
      compLevel === "moderate" ? `${compCount} active listings — moderate competition` :
      compCount > 0            ? `${compCount} competing listings` : undefined;

    push(
      "analyzing_market",
      `Similar items sell around $${median.toFixed(0)}`,
      competitionNote,
      "complete"
    );

    onCompsReady(soldComps, activeComps, fetchedSummary);
    await tick(400);

    // Step 4 — finalizing
    push("finalizing", "Running the numbers…", undefined, "active");
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
