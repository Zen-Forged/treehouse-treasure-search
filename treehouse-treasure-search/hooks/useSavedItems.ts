"use client";

import { useState, useEffect, useCallback } from "react";
import { EvaluatedItem, Decision } from "@/types";

const STORAGE_KEY = "tts_saved_items";

export function useSavedItems() {
  const [items, setItems] = useState<EvaluatedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((updated: EvaluatedItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      console.error("Failed to persist items");
    }
  }, []);

  const saveItem = useCallback(
    (item: EvaluatedItem) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        const updated = existing
          ? prev.map((i) => (i.id === item.id ? item : i))
          : [item, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const updateDecision = useCallback(
    (id: string, decision: Decision) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, decision } : item
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  return { items, loaded, saveItem, updateDecision, deleteItem };
}
