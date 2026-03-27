"use client";

import { useState, useEffect, useCallback } from "react";
import { FindRecord } from "@/types/find";

const STORAGE_KEY = "tts_finds_v1";

function load(): FindRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(finds: FindRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(finds));
}

export function useFinds() {
  const [finds, setFinds] = useState<FindRecord[]>([]);

  useEffect(() => {
    setFinds(load());
  }, []);

  const saveFind = useCallback((find: FindRecord) => {
    setFinds(prev => {
      const next = [find, ...prev.filter(f => f.id !== find.id)];
      save(next);
      return next;
    });
  }, []);

  const deleteFind = useCallback((id: string) => {
    setFinds(prev => {
      const next = prev.filter(f => f.id !== id);
      save(next);
      return next;
    });
  }, []);

  const getFind = useCallback(
    (id: string) => finds.find(f => f.id === id) ?? null,
    [finds]
  );

  return { finds, saveFind, deleteFind, getFind };
}
