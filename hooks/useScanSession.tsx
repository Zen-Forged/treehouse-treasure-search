"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { ScanSessionData, EvaluatedItem } from "@/types";

interface ScanContextType {
  sessionData: ScanSessionData | null;
  setSessionData: (data: ScanSessionData | null) => void;
  pendingItem: EvaluatedItem | null;
  setPendingItem: (item: EvaluatedItem | null) => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [sessionData, setSessionData] = useState<ScanSessionData | null>(null);
  const [pendingItem, setPendingItem] = useState<EvaluatedItem | null>(null);

  return (
    <ScanContext.Provider
      value={{ sessionData, setSessionData, pendingItem, setPendingItem }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanSession() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanSession must be within ScanProvider");
  return ctx;
}
