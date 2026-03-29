// hooks/useFinds.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { FindSession } from "@/hooks/useSession";
import { Recommendation } from "@/types";

const STORAGE_KEY = "tts_finds_v2";

export interface SavedFind {
  id:                  string;
  createdAt:           string;
  imageOriginal:       string;
  imageEnhanced?:      string;

  // Identity
  title?:              string;
  description?:        string;

  // Item attributes from Claude Vision
  brand?:              string | null;
  material?:           string | null;
  era?:                string | null;
  origin?:             string | null;
  category?:           string | null;

  // Social / sharing
  captionRefined?:     string;
  intentText?:         string;
  intentChips?:        string[];

  // Transaction
  pricePaid?:          number;
  decision?:           "purchased" | "passed" | "shared";

  // Market data
  medianSoldPrice?:    number;
  priceRangeLow?:      number;
  priceRangeHigh?:     number;
  avgDaysToSell?:      number;
  competitionCount?:   number;
  competitionLevel?:   "low" | "moderate" | "high";
  estimatedProfitHigh?: number;
  recommendation?:     Recommendation;
}

function load(): SavedFind[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(finds: SavedFind[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finds));
  } catch {}
}

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

    // Identity
    title:         session.identification?.title,
    description:   session.identification?.description,

    // Attributes
    brand:         attrs?.brand    ?? null,
    material:      attrs?.material ?? null,
    era:           attrs?.era      ?? null,
    origin:        attrs?.origin   ?? null,
    category:      attrs?.category ?? null,

    // Social
    captionRefined: session.captionRefined,
    intentText:     session.intentText,
    intentChips:    session.intentChips,

    // Transaction
    pricePaid:     session.pricePaid,
    decision,

    // Market data — patched in by decide page before calling saveFind
    medianSoldPrice:     session.pricing?.medianSoldPrice,
    estimatedProfitHigh: session.pricing?.estimatedProfitHigh,
    recommendation:      session.pricing?.recommendation,
  };
}

export function useFinds() {
  const [finds, setFinds] = useState<SavedFind[]>(() => load());

  // Reload from localStorage whenever the page becomes visible
  // Handles Next.js App Router keeping pages mounted across navigation
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setFinds(load());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    // Also reload on focus in case visibilitychange didn't fire
    window.addEventListener("focus", () => setFinds(load()));
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const saveFind = useCallback((find: SavedFind) => {
    setFinds(prev => {
      const next = [find, ...prev.filter(f => f.id !== find.id)];
      persist(next);
      return next;
    });
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

  return { finds, saveFind, deleteFind, getFind };
}
