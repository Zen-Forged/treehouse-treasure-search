// hooks/useAnalysisFlow.ts
// Phase 4: identification now runs inside the flow as step 0.
// Camera → /decide directly. /discover is only used for the story path.
"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisState, AnalysisMessage, AnalysisStepId } from "@/types/analysis";
import { Comp, ItemAttributes } from "@/types";
import { rankComps } from "@/lib/scoring/scoreComp";
import { NormalizedMarketplaceItem } from "@/lib/search/retrievalOrchestrator";

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
  objectType?:      string;
  setType?:         string;
  onIdentified?:    (result: import("@/app/api/identify/route").IdentifyResult) => void;
  onCompsReady:     (soldComps: Comp[], activeComps: Comp[], summary: any) => void;
  onComplete:       () => void;
  generateMockEvaluation: (cost: number, imageDataUrl: string) => any;
  setUsingMock:     (v: boolean) => void;
}

// ── Image compression before sending to identify API ────────────────────────
// Resize to max 1024px on longest edge at 0.85 JPEG quality.
// Uses createImageBitmap (supported in Safari 15+) which handles EXIF orientation
// and avoids the black-canvas bug caused by drawImage on an undecoded Image element.
// Falls back to the HTMLImageElement path if createImageBitmap is unavailable.
// On any error, returns the original dataUrl unmodified.
async function compressForApi(dataUrl: string): Promise<string> {
  const MAX = 1024;

  // ── Path A: createImageBitmap (Safari 15+, Chrome, Firefox) ─────────────
  // This approach fully decodes the image (including EXIF rotation) before
  // drawing, which prevents the black-canvas issue on mobile camera photos.
  if (typeof createImageBitmap !== "undefined") {
    try {
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const bmp  = await createImageBitmap(blob);

      const scale  = Math.min(1, MAX / Math.max(bmp.width, bmp.height, 1));
      const w      = Math.round(bmp.width  * scale);
      const h      = Math.round(bmp.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { bmp.close(); return dataUrl; }
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();

      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      // Sanity check: a valid JPEG is at minimum a few KB.
      // If the result is suspiciously small, the canvas was blank — bail out.
      if (compressed.length < 5000) {
        console.warn("[compressForApi] compressed result suspiciously small — using original");
        return dataUrl;
      }
      return compressed;
    } catch (err) {
      console.warn("[compressForApi] createImageBitmap path failed, trying HTMLImageElement:", err);
      // fall through to Path B
    }
  }

  // ── Path B: HTMLImageElement (older browsers) ────────────────────────────
  return new Promise(resolve => {
    try {
      const img = new window.Image();
      img.onload = () => {
        try {
          const scale  = Math.min(1, MAX / Math.max(img.width, img.height, 1));
          const w      = Math.round(img.width  * scale);
          const h      = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          if (compressed.length < 5000) {
            console.warn("[compressForApi] HTMLImageElement result suspiciously small — using original");
            resolve(dataUrl);
            return;
          }
          resolve(compressed);
        } catch (drawErr) {
          console.warn("[compressForApi] draw failed:", drawErr);
          resolve(dataUrl);
        }
      };
      img.onerror = (e) => {
        console.warn("[compressForApi] image load failed:", e);
        resolve(dataUrl);
      };
      img.src = dataUrl;
    } catch (outerErr) {
      console.warn("[compressForApi] outer error:", outerErr);
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
    objectType:       preObjectType,
    setType:          preSetType,
    onIdentified,
    onCompsReady,
    onComplete,
    generateMockEvaluation,
    setUsingMock,
  }: RunAnalysisOptions) => {
    aborted.current = false;
    setState(initialState);

    let resolvedTitle:      string = preTitle        ?? "";
    let resolvedQuery:      string = preSearchQuery   ?? "";
    let resolvedColor:      string | undefined = preColor;
    let resolvedObjectType: string | undefined = preObjectType;
    let resolvedSetType:    string | undefined = preSetType;
    let resolvedMaterial:   string | undefined = undefined;
    let resolvedAttributes: ItemAttributes | null = null;
    let resolvedIsNamed:    boolean = false;

    // ── STEP 0 — Identify (only when not pre-identified) ─────────────────────
    if (!preTitle || !preSearchQuery) {
      push("uploading", "Identifying your find…", undefined, "active");

      try {
        // Compress before sending — 1024px max, 0.85 JPEG
        // Uses createImageBitmap to avoid black-canvas on mobile camera photos
        const compressed = await compressForApi(imageDataUrl);

        const res = await fetch("/api/identify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ imageDataUrl: compressed }),
        });

        if (res.ok) {
          const result = await res.json() as import("@/app/api/identify/route").IdentifyResult;
          resolvedTitle      = result.title;
          resolvedQuery      = result.searchQuery;
          resolvedColor      = result.attributes?.primaryColor ?? undefined;
          resolvedObjectType = result.attributes?.objectType   ?? undefined;
          resolvedSetType    = result.attributes?.setType      ?? undefined;
          resolvedMaterial   = result.attributes?.material     ?? undefined;
          resolvedAttributes = result.attributes ?? null;
          resolvedIsNamed    = result.isNamedProduct ?? false;

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
      const params = new URLSearchParams({ q: resolvedQuery });
      if (resolvedColor)      params.set("color",      resolvedColor);
      if (resolvedObjectType) params.set("objectType", resolvedObjectType);
      if (resolvedSetType)    params.set("setType",    resolvedSetType);
      if (resolvedMaterial)   params.set("material",   resolvedMaterial);
      const res = await fetch(`/api/sold-comps?${params.toString()}`);
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
      // ── Step 1 scoring: filter comps through rankComps before pricing ────
      // Converts Comp[] → NormalizedMarketplaceItem[] (same shape, different type)
      // then scores each one and keeps only usable comps (score ≥ 45).
      // Lot penalty (-60), material mismatch (-25), repro (-40) kill bad comps
      // before they contaminate the median price.
      if (resolvedAttributes) {
        const toNormalized = (c: Comp): NormalizedMarketplaceItem => ({
          id:          c.url ?? `${c.title}:${c.price}`,
          title:       c.title,
          imageUrl:    c.imageUrl,
          price:       c.price,
          totalPrice:  c.price,
          soldDate:    c.soldDate ?? null,
          condition:   c.condition ?? null,
          listingType: c.listingType,
          queryOrigin: "primary-waterfall",
          url:         c.url,
          daysAgo:     c.daysAgo,
        });

        const fromNormalized = (n: NormalizedMarketplaceItem, original: Comp): Comp => ({
          ...original,
          title:    n.title,
          price:    n.price ?? original.price,
          imageUrl: n.imageUrl,
          url:      n.url,
        });

        if (soldComps.length > 0) {
          const normalized  = soldComps.map(toNormalized);
          const { usable, excluded } = rankComps(normalized, resolvedAttributes, resolvedIsNamed);
          const usableIds  = new Set(usable.map(s => s.item.id));
          // Reorder to match scorer ranking, preserving original Comp shape
          const orderedMap = new Map(soldComps.map(c => [c.url ?? `${c.title}:${c.price}`, c]));
          soldComps = usable.map(s => orderedMap.get(s.item.id) ?? fromNormalized(s.item, soldComps[0]));
          console.log(`[scoring] sold: ${normalized.length} raw → ${soldComps.length} usable, ${excluded.length} excluded`);
        }

        if (activeComps.length > 0) {
          const normalized = activeComps.map(toNormalized);
          const { usable } = rankComps(normalized, resolvedAttributes, resolvedIsNamed);
          const keepIds    = new Set(usable.map(s => s.item.id));
          activeComps = activeComps.filter(c => keepIds.has(c.url ?? `${c.title}:${c.price}`));
          console.log(`[scoring] active: ${normalized.length} raw → ${activeComps.length} usable`);
        }
      }

      const pricingComps = (soldComps.length > 0 ? soldComps : activeComps);
      const prices = pricingComps.map(c => c.price).sort((a, b) => a - b);
      const low    = prices[0]  ?? 0;
      const high   = prices[prices.length - 1] ?? 0;

      updateState({ compCount: soldComps.length, priceRange: { low, high } });

      push(
        "searching_comps",
        hasSoldData
          ? `Found ${soldComps.length} recent sales`
          : `Checking active listings`,
        hasSoldData
          ? `Price range ${low.toFixed(0)} — ${high.toFixed(0)}`
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
