// hooks/useAnalysisFlow.ts
// Phase 4: identification now runs inside the flow as step 0.
// Camera → /decide directly. /discover is only used for the story path.
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
  // These are now optional — if omitted, identification runs as step 0
  searchQuery?:     string;
  identifiedTitle?: string;
  primaryColor?:    string;
  onIdentified?:    (result: import("@/app/api/identify/route").IdentifyResult) => void;
  onCompsReady:     (soldComps: Comp[], activeComps: Comp[], summary: any) => void;
  onComplete:       () => void;
  generateMockEvaluation: (cost: number, imageDataUrl: string) => any;
  setUsingMock:     (v: boolean) => void;
}

// ── Image compression before sending to identify API ────────────────────────
// Resize to max 1024px on longest edge at 0.85 JPEG quality.
// Reduces payload from ~5MB to ~80KB — saves 1-2s of network + model time.
async function compressForApi(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    try {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height, 1));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
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
    searchQuery:      preSearchQuery,
    identifiedTitle:  preTitle,
    primaryColor:     preColor,
    onIdentified,
    onCompsReady,
    onComplete,
    generateMockEvaluation,
    setUsingMock,
  }: RunAnalysisOptions) => {
    aborted.current = false;
    setState(initialState);

    let resolvedTitle:  string = preTitle  ?? "";
    let resolvedQuery:  string = preSearchQuery ?? "";
    let resolvedColor:  string | undefined = preColor;

    // ── STEP 0 — Identify (only when not pre-identified) ─────────────────────
    if (!preTitle || !preSearchQuery) {
      push("uploading", "Identifying your find…", undefined, "active");

      try {
        // Compress before sending — 1024px max, 0.85 JPEG
        const compressed = await compressForApi(imageDataUrl);

        const res = await fetch("/api/identify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ imageDataUrl: compressed }),
        });

        if (res.ok) {
          const result = await res.json() as import("@/app/api/identify/route").IdentifyResult;
          resolvedTitle = result.title;
          resolvedQuery = result.searchQuery;
          resolvedColor = result.attributes?.primaryColor ?? undefined;

          // Surface the title immediately in the AnalysisSheet header
          updateState({ identifiedTitle: result.title });

          // Notify decide page so it can store identification in session
          onIdentified?.(result);

          push(
            "uploading",
            `Found: ${result.title}`,
            result.confidence === "low" ? "Low confidence — results may vary" : undefined,
            "complete"
          );
        } else {
          throw new Error("identify returned non-ok");
        }
      } catch {
        // Graceful fallback — continue with generic query rather than blocking
        push("uploading", "Searching for comparable items", undefined, "complete");
        resolvedQuery = resolvedQuery || "thrift store vintage item";
      }
    } else {
      // Pre-identified (coming from /discover story path or review mode)
      push(
        "uploading",
        resolvedTitle ? `Found: ${resolvedTitle}` : "Item identified",
        undefined,
        "complete"
      );
    }

    await tick(200);

    // ── STEP 1 — Fetch comps ──────────────────────────────────────────────────
    push("searching_comps", "Searching recent sales…", undefined, "active");

    let soldComps:    Comp[] = [];
    let activeComps:  Comp[] = [];
    let fetchedSummary: any  = null;

    try {
      const colorParam = resolvedColor ? `&color=${encodeURIComponent(resolvedColor)}` : "";
      const res = await fetch(`/api/sold-comps?q=${encodeURIComponent(resolvedQuery)}${colorParam}`);
      if (res.ok) {
        const data = await res.json();
        if ((data.soldComps?.length ?? 0) > 0 || (data.activeComps?.length ?? 0) > 0) {
          soldComps      = data.soldComps   ?? [];
          activeComps    = data.activeComps ?? [];
          fetchedSummary = data.summary     ?? null;
        }
      }
    } catch {}

    const hasSoldData = soldComps.length > 0;

    if (!hasSoldData && activeComps.length === 0) {
      const mock = generateMockEvaluation(parseFloat(costStr) || 0, imageDataUrl);
      soldComps = (mock.mockComps ?? []).map((c: any) => ({ ...c, listingType: "sold" as const }));
      setUsingMock(true);
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

    await tick(250);

    // ── STEP 2 — Market analysis ──────────────────────────────────────────────
    push("analyzing_market", "Estimating resell value…", undefined, "active");
    await tick(600);

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
    await tick(300);

    // ── STEP 3 — Finalise ─────────────────────────────────────────────────────
    push("finalizing", "Running the numbers…", undefined, "active");
    await tick(500);
    push("finalizing", "Your result is ready", undefined, "complete");

    updateState({ isComplete: true });
    await tick(250);
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
