// hooks/useFinds.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { FindSession } from "@/hooks/useSession";
import { Recommendation } from "@/types";

const STORAGE_KEY = "tts_finds_v2";

// Max dimensions for the stored thumbnail
const THUMB_MAX_PX  = 380;
const THUMB_QUALITY = 0.70;

// Max character length we'll ever store for an image string.
// A 380px JPEG at 0.70 quality is typically 15–35KB as base64 (~20K–47K chars).
// Anything over 150K chars is an uncompressed original — drop it.
const MAX_IMAGE_CHARS = 150_000;

export interface SavedFind {
  id:                  string;
  createdAt:           string;
  imageOriginal:       string;
  imageEnhanced?:      string;

  title?:              string;
  description?:        string;

  brand?:              string | null;
  material?:           string | null;
  era?:                string | null;
  origin?:             string | null;
  category?:           string | null;

  captionRefined?:     string;
  intentText?:         string;
  intentChips?:        string[];

  pricePaid?:          number;
  decision?:           "purchased" | "passed" | "shared";

  medianSoldPrice?:    number;
  priceRangeLow?:      number;
  priceRangeHigh?:     number;
  avgDaysToSell?:      number;
  competitionCount?:   number;
  competitionLevel?:   "low" | "moderate" | "high";
  estimatedProfitHigh?: number;
  recommendation?:     Recommendation;
}

// ── Image compression ────────────────────────────────────────────────────────
// Returns a compressed thumbnail, or empty string on failure.
// Mobile Safari can throw or silently fail on camera images in canvas ops —
// all canvas operations are wrapped in try/catch.
async function compressImage(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return dataUrl;

  return new Promise(resolve => {
    try {
      const img = new window.Image();

      img.onerror = () => {
        // Image failed to load — return empty string so we don't store garbage
        console.warn("[useFinds] compressImage: img load failed, dropping image");
        resolve("");
      };

      img.onload = () => {
        try {
          const scale  = Math.min(1, THUMB_MAX_PX / Math.max(img.width, img.height, 1));
          const w      = Math.max(1, Math.round(img.width  * scale));
          const h      = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width  = w;
          canvas.height = h;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Canvas 2d context unavailable (can happen in some mobile WebViews)
            console.warn("[useFinds] compressImage: no 2d context, dropping image");
            resolve("");
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const result = canvas.toDataURL("image/jpeg", THUMB_QUALITY);

          // Sanity check — if the result is still huge something went wrong
          if (result.length > MAX_IMAGE_CHARS) {
            console.warn("[useFinds] compressImage: result still too large, dropping image");
            resolve("");
            return;
          }

          resolve(result);
        } catch (canvasErr) {
          console.warn("[useFinds] compressImage: canvas error, dropping image", canvasErr);
          resolve("");
        }
      };

      img.src = dataUrl;
    } catch (outerErr) {
      console.warn("[useFinds] compressImage: outer error, dropping image", outerErr);
      resolve("");
    }
  });
}

// ── Storage helpers ──────────────────────────────────────────────────────────

function load(): SavedFind[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedFind[];
    // Strip any oversized images that slipped through before the compression fix
    return raw.map(f => ({
      ...f,
      imageOriginal: (f.imageOriginal?.length ?? 0) > MAX_IMAGE_CHARS ? "" : (f.imageOriginal ?? ""),
      imageEnhanced: (f.imageEnhanced?.length  ?? 0) > MAX_IMAGE_CHARS ? undefined : f.imageEnhanced,
    }));
  } catch {
    return [];
  }
}

function persist(finds: SavedFind[]): boolean {
  // Returns true if the write succeeded, false if it failed even after pruning.
  const attempt = (data: SavedFind[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  };

  if (attempt(finds)) return true;

  console.warn("[useFinds] quota hit — pruning oldest 3 finds and retrying");
  if (finds.length > 1 && attempt(finds.slice(0, Math.max(1, finds.length - 3)))) return true;

  console.warn("[useFinds] still over quota — keeping newest find only");
  if (attempt(finds.slice(0, 1))) return true;

  console.error("[useFinds] localStorage completely unwriteable — clearing and retrying");
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return attempt(finds.slice(0, 1));
}

// ── sessionToFind ────────────────────────────────────────────────────────────

export function sessionToFind(
  session: FindSession,
  decision: SavedFind["decision"]
): SavedFind {
  const attrs = session.identification?.attributes;
  return {
    id:            session.id,
    createdAt:     session.createdAt,
    imageOriginal: session.imageOriginal,
    imageEnhanced: session.imageEnhanced,

    title:         session.identification?.title,
    description:   session.identification?.description,

    brand:         attrs?.brand    ?? null,
    material:      attrs?.material ?? null,
    era:           attrs?.era      ?? null,
    origin:        attrs?.origin   ?? null,
    category:      attrs?.category ?? null,

    captionRefined: session.captionRefined,
    intentText:     session.intentText,
    intentChips:    session.intentChips,

    pricePaid:     session.pricePaid,
    decision,

    medianSoldPrice:     session.pricing?.medianSoldPrice,
    estimatedProfitHigh: session.pricing?.estimatedProfitHigh,
    recommendation:      session.pricing?.recommendation,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFinds() {
  const [finds, setFinds] = useState<SavedFind[]>(() => load());

  // Reload from localStorage when the page becomes visible again.
  // Critical for Next.js App Router — pages stay mounted across navigation,
  // so the in-memory state can be stale when returning to /finds.
  useEffect(() => {
    const onVisible  = () => { if (document.visibilityState === "visible") setFinds(load()); };
    const onFocus    = () => setFinds(load());
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const saveFind = useCallback(async (find: SavedFind): Promise<boolean> => {
    // Compress both images concurrently. On mobile Safari, canvas ops on camera
    // images can fail — compressImage returns "" on failure so we degrade gracefully.
    const [compressedOriginal, compressedEnhanced] = await Promise.all([
      compressImage(find.imageOriginal),
      find.imageEnhanced ? compressImage(find.imageEnhanced) : Promise.resolve(undefined),
    ]);

    const toStore: SavedFind = {
      ...find,
      imageOriginal: compressedOriginal,
      imageEnhanced: compressedEnhanced,
    };

    console.log(
      "[useFinds] saving find:",
      toStore.id, toStore.title, toStore.decision,
      `| image: ${compressedOriginal.length} chars`
    );

    // CRITICAL: persist() must be called synchronously and directly — NOT inside
    // a setFinds updater. React batches state updaters and may defer them until
    // after the next render, which means localStorage.setItem wouldn't run until
    // after router.push() tears down the page on mobile Safari.
    //
    // We build the next array manually from the current value in state, call
    // persist() directly to write to disk, then call setFinds to sync React state.
    const current = load();
    const next    = [toStore, ...current.filter(f => f.id !== toStore.id)];
    const ok      = persist(next);
    setFinds(next);
    return ok;
  }, []);

  const deleteFind = useCallback((id: string) => {
    setFinds(prev => {
      const next = prev.filter(f => f.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const getFind = useCallback(
    (id: string) => finds.find(f => f.id === id) ?? null,
    [finds]
  );

  const reloadFinds = useCallback(() => setFinds(load()), []);

  return { finds, saveFind, deleteFind, getFind, reloadFinds };
}
