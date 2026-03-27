"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { FindDraft } from "@/types/find";

interface FindDraftContextType {
  draft: FindDraft;
  setDraft: (patch: Partial<FindDraft>) => void;
  clearDraft: () => void;
}

const FindDraftContext = createContext<FindDraftContextType | null>(null);

export function FindDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<FindDraft>({});

  const setDraft = (patch: Partial<FindDraft>) =>
    setDraftState(prev => ({ ...prev, ...patch }));

  const clearDraft = () => setDraftState({});

  return (
    <FindDraftContext.Provider value={{ draft, setDraft, clearDraft }}>
      {children}
    </FindDraftContext.Provider>
  );
}

export function useFindDraft() {
  const ctx = useContext(FindDraftContext);
  if (!ctx) throw new Error("useFindDraft must be used within FindDraftProvider");
  return ctx;
}
