// hooks/useSession.tsx
// Phase 2: added refinedQuery to FindSession
// Phase 3: added skipPriceEntry to bypass price-entry screen
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { IntentChip } from "@/types/find";
import { Comp, ItemAttributes } from "@/types";

export interface FindIdentification {
  title:       string;
  description: string;
  confidence:  "high" | "medium" | "low";
  searchQuery: string;
  attributes?: ItemAttributes;
}

export interface FindPricing {
  medianSoldPrice:     number;
  estimatedFees:       number;
  estimatedProfitHigh: number;
  recommendation:      "strong-buy" | "maybe" | "pass";
}

export interface FindSession {
  id:              string;
  createdAt:       string;
  imageOriginal:   string;
  imageEnhanced?:  string;
  identification?: FindIdentification;
  refinedQuery?:   string;
  skipPriceEntry?: boolean;       // Phase 3: skip price-entry, go straight to analyzing
  intentText?:     string;
  intentChips?:    IntentChip[];
  captionRefined?: string;
  pricePaid?:      number;
  comps?:          Comp[];        // legacy
  soldComps?:      Comp[];
  activeComps?:    Comp[];
  pricing?:        FindPricing;
  decision?:       "purchased" | "passed" | "shared";
  // Populated when reviewing a saved find — lets decide page skip re-analysis
  savedFindData?: {
    medianSoldPrice?:  number;
    priceRangeLow?:    number;
    priceRangeHigh?:   number;
    avgDaysToSell?:    number;
    competitionCount?: number;
    competitionLevel?: "low" | "moderate" | "high";
  };
}

interface FindSessionContextType {
  session:       FindSession | null;
  startSession:  (imageOriginal: string) => FindSession;
  updateSession: (patch: Partial<FindSession>) => void;
  clearSession:  () => void;
}

const STORAGE_KEY = "tts_active_session";

function saveToStorage(session: FindSession) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
}
function loadFromStorage(): FindSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as FindSession : null;
  } catch { return null; }
}
function clearStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}
function generateId(): string {
  return `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const FindSessionContext = createContext<FindSessionContextType | null>(null);

export function FindSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<FindSession | null>(
    () => loadFromStorage()
  );

  const startSession = useCallback((imageOriginal: string): FindSession => {
    const next: FindSession = {
      id:            generateId(),
      createdAt:     new Date().toISOString(),
      imageOriginal,
    };
    setSessionState(next);
    saveToStorage(next);
    return next;
  }, []);

  const updateSession = useCallback((patch: Partial<FindSession>) => {
    setSessionState(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    clearStorage();
  }, []);

  return (
    <FindSessionContext.Provider value={{ session, startSession, updateSession, clearSession }}>
      {children}
    </FindSessionContext.Provider>
  );
}

export function useFindSession() {
  const ctx = useContext(FindSessionContext);
  if (!ctx) throw new Error("useFindSession must be used within FindSessionProvider");
  return ctx;
}
