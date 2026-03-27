// hooks/useFinds.ts
// Single storage system for all saved finds (replaces both useFinds + useSavedItems)
"use client";

import { useState, useEffect, useCallback } from "react";
import { FindSession } from "@/hooks/useSession";

const STORAGE_KEY = "tts_finds_v2";

export interface SavedFind {
  id: string;
  createdAt: string;
  imageOriginal: string;
  imageEnhanced?: string;
  title?: string;
  description?: string;
  captionRefined?: string;
  intentText?: string;
  intentChips?: string[];
  pricePaid?: number;
  decision?: "purchased" | "passed" | "shared";
  medianSoldPrice?: number;
  estimatedProfitHigh?: number;
  recommendation?: string;
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
  return {
    id:                  session.id,
    createdAt:           session.createdAt,
    imageOriginal:       session.imageOriginal,
    imageEnhanced:       session.imageEnhanced,
    title:               session.identification?.title,
    description:         session.identification?.description,
    captionRefined:      session.captionRefined,
    intentText:          session.intentText,
    intentChips:         session.intentChips,
    pricePaid:           session.pricePaid,
    decision,
    medianSoldPrice:     session.pricing?.medianSoldPrice,
    estimatedProfitHigh: session.pricing?.estimatedProfitHigh,
    recommendation:      session.pricing?.recommendation,
  };
}

export function useFinds() {
  const [finds, setFinds] = useState<SavedFind[]>([]);

  useEffect(() => {
    setFinds(load());
  }, []);

  const saveFind = useCallback(
    (find: SavedFind) => {
      setFinds(prev => {
        const next = [find, ...prev.filter(f => f.id !== find.id)];
        persist(next);
        return next;
      });
    },
    []
  );

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
