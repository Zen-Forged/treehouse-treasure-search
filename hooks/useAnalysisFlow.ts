// hooks/useAnalysisFlow.ts
// Phase 1: removed /api/suggest call — uses findSession.identification directly
"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, AnalysisMessage, AnalysisStepId } from "@/types/analysis";
import { MockComp } from "@/types";

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
  imageDataUrl:    string;
  costStr:         string;
  searchQuery:     string;          // Phase 1: passed in from session, no re-identification
  identifiedTitle?: string;         // for display in the feed
  onCompsReady:    (comps: MockComp[], summary: any) => void;
  onComplete:      () => void;
  generateMockEvaluation: (cost: number, imageDataUrl: string) => any;
  setUsingMock:    (v: boolean) => void;
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
    // Phase 1: no API call needed — identification already happened at /discover
    push("uploading", "Item already identified", identifiedTitle ?? searchQuery, "complete");
    await tick(300);

    // ── Step 2: Search comps ─────────────────────────────
    push("searching_comps", "Checking recent sales...", undefined, "active");

    let fetchedComps: MockComp[] = [];
    let fetchedSummary: any = null;
    let dataSource: "cache" | "live" | "mock" = "mock";

    try {
      const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.comps?.length > 0) {
          fetchedComps   = data.comps;
          fetchedSummary = data.summary ?? null;
          dataSource     = data.source ?? "live";
        }
      }
    } catch {}

    if (fetchedComps.length === 0) {
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, imageDataUrl);
      fetchedComps = mock.mockComps;
      setUsingMock(true);
      dataSource = "mock";
      push("searching_comps", "Using estimated market data", "Live data unavailable", "complete");
    } else {
      const prices = fetchedComps.map((c: MockComp) => c.price).sort((a: number, b: number) => a - b);
      const low    = prices[0];
      const high   = prices[prices.length - 1];
      updateState({ compCount: fetchedComps.length, priceRange: { low, high } });
      push(
        "searching_comps",
        dataSource === "cache" ? "Using recent market data" : `Found ${fetchedComps.length} recent sales`,
        dataSource === "cache"
          ? `${fetchedComps.length} sales · $${low.toFixed(0)}–$${high.toFixed(0)}`
          : `Prices ranging from $${low.toFixed(0)} to $${high.toFixed(0)}`,
        "complete"
      );
    }

    await tick(300);

    // ── Step 3: Calculate value ──────────────────────────
    push("analyzing_market", "Calculating value...", undefined, "active");
    await tick(800);

    const prices  = fetchedComps.map((c: MockComp) => c.price).sort((a: number, b: number) => a - b);
    const median  = computeMedian(prices);
    updateState({ medianPrice: median });

    push(
      "analyzing_market",
      `Most items are selling around $${median.toFixed(0)}`,
      fetchedSummary?.quickTake ?? undefined,
      "complete"
    );

    onCompsReady(fetchedComps, fetchedSummary);
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
