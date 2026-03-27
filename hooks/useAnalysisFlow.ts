// hooks/useAnalysisFlow.ts
"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, AnalysisMessage, AnalysisStepId } from "@/types/analysis";
import { normalizeQuery } from "@/utils/normalizeQuery";
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
  imageDataUrl: string;
  costStr: string;
  onCompsReady: (comps: MockComp[], summary: any) => void;
  onComplete: () => void;
  generateMockEvaluation: (cost: number, imageDataUrl: string) => any;
  setUsingMock: (v: boolean) => void;
}

export function useAnalysisFlow() {
  const [state, setState] = useState<AnalysisState>(initialState);
  const aborted = useRef(false);

  const push = useCallback(
    (
      stepId: AnalysisStepId,
      title: string,
      detail?: string,
      status: AnalysisMessage["status"] = "complete"
    ) => {
      if (aborted.current) return;
      setState((prev) => {
        const existing = prev.messages.findIndex(
          (m) => m.stepId === stepId && m.status === "active"
        );
        const msg = makeMessage(stepId, title, detail, status);
        const messages =
          existing >= 0
            ? [...prev.messages.slice(0, existing), msg, ...prev.messages.slice(existing + 1)]
            : [...prev.messages, msg];
        return { ...prev, messages, currentStep: stepId };
      });
    },
    []
  );

  const updateState = useCallback((patch: Partial<AnalysisState>) => {
    if (aborted.current) return;
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const run = useCallback(
    async ({
      imageDataUrl,
      costStr,
      onCompsReady,
      onComplete,
      generateMockEvaluation,
      setUsingMock,
    }: RunAnalysisOptions) => {
      aborted.current = false;
      setState(initialState);

      // ── Step 1: Uploading ──────────────────────────────
      push("uploading", "Looking at your item...", undefined, "active");
      await tick(300);

      // ── Step 2: Identifying via Claude ─────────────────
      push("identifying", "Identifying the item...", undefined, "active");

      let rawQuery = "thrift store item";
      let confidence: AnalysisState["confidence"] = "low";
      let identifiedItem: string | undefined;

      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.suggestion) {
            rawQuery = data.suggestion;
            identifiedItem = data.itemData ? buildItemLabel(data.itemData) : rawQuery;
            confidence = inferConfidence(data.itemData);
          }
        }
      } catch {}

      push(
        "uploading",
        identifiedItem ? `This looks like: ${identifiedItem}` : "Item photo received",
        confidenceLabel(confidence),
        "complete"
      );
      updateState({ identifiedItem, confidence, searchQuery: rawQuery });
      await tick(200);

      // ── Step 3: Refining (normalize query) ─────────────
      const normalizedQuery = normalizeQuery(rawQuery);
      push("refining", "Refining the search...", `Searching for: ${normalizedQuery}`, "active");
      await tick(400);
      push("refining", "Search terms ready", normalizedQuery, "complete");

      // ── Step 4: Fetch comps (cache-aware) ──────────────
      push("searching_comps", "Checking recent sales...", undefined, "active");

      let fetchedComps: MockComp[] = [];
      let fetchedSummary: any = null;
      let dataSource: "cache" | "live" | "mock" = "mock";

      try {
        const res = await fetch(
          `/api/sold-comps?q=${encodeURIComponent(rawQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.comps?.length > 0) {
            fetchedComps = data.comps;
            fetchedSummary = data.summary ?? null;
            dataSource = data.source ?? "live"; // "cache" | "live"
          }
        }
      } catch {}

      if (fetchedComps.length === 0) {
        const mock = generateMockEvaluation(parseFloat(costStr) || 0, imageDataUrl);
        fetchedComps = mock.mockComps;
        setUsingMock(true);
        dataSource = "mock";
        push(
          "searching_comps",
          "Using estimated market data",
          "Live data unavailable",
          "complete"
        );
      } else {
        const prices = fetchedComps.map((c) => c.price).sort((a, b) => a - b);
        const low  = prices[0];
        const high = prices[prices.length - 1];
        updateState({ compCount: fetchedComps.length, priceRange: { low, high } });

        // Key UI distinction: cache vs live
        push(
          "searching_comps",
          dataSource === "cache"
            ? `Using recent market data`
            : `Found ${fetchedComps.length} recent sales`,
          dataSource === "cache"
            ? `${fetchedComps.length} sales · $${low.toFixed(0)}–$${high.toFixed(0)}`
            : `Prices ranging from $${low.toFixed(0)} to $${high.toFixed(0)}`,
          "complete"
        );
      }

      await tick(300);

      // ── Step 5: Analyzing market ───────────────────────
      push("analyzing_market", "Analyzing market value...", undefined, "active");
      await tick(700);

      const prices = fetchedComps.map((c) => c.price).sort((a, b) => a - b);
      const median = computeMedian(prices);
      updateState({ medianPrice: median });

      push(
        "analyzing_market",
        `Most items are selling around $${median.toFixed(0)}`,
        fetchedSummary?.quickTake ?? undefined,
        "complete"
      );

      onCompsReady(fetchedComps, fetchedSummary);
      await tick(400);

      // ── Step 6: Finalizing ─────────────────────────────
      push("finalizing", "Calculating profit...", undefined, "active");
      await tick(600);
      push("finalizing", "Your result is ready", undefined, "complete");

      updateState({ isComplete: true });
      await tick(300);
      onComplete();
    },
    [push, updateState]
  );

  const reset = useCallback(() => {
    aborted.current = true;
    setState(initialState);
    msgCounter = 0;
  }, []);

  return { state, run, reset };
}

// ── Helpers ──────────────────────────────────────────────

function tick(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function computeMedian(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildItemLabel(itemData: any): string {
  const parts: string[] = [];
  if (itemData.brand)    parts.push(itemData.brand);
  if (itemData.model)    parts.push(itemData.model);
  if (itemData.category && parts.length === 0) parts.push(capitalize(itemData.category));
  return parts.join(" ") || "Unknown item";
}

function inferConfidence(itemData: any): AnalysisState["confidence"] {
  if (!itemData) return "low";
  const score =
    (itemData.brand ? 2 : 0) +
    (itemData.model ? 2 : 0) +
    (itemData.category && itemData.category !== "other" ? 1 : 0);
  if (score >= 4) return "strong";
  if (score >= 2) return "likely";
  return "low";
}

function confidenceLabel(c: AnalysisState["confidence"]): string {
  if (c === "strong") return "Strong match found";
  if (c === "likely") return "Likely match";
  return "Low confidence — results may vary";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
