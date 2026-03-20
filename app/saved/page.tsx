"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Package } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SavedItemCard } from "@/components/SavedItemCard";
import { PrimaryButton } from "@/components/Buttons";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Decision } from "@/types";

type FilterType = "all" | Decision;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Purchased", value: "purchased" },
  { label: "Passed", value: "passed" },
];

export default function SavedPage() {
  const { items, loaded } = useSavedItems();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all"
    ? items
    : items.filter((i) => i.decision === filter);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Saved Items" showBack backHref="/" />

      <main className="flex-1 flex flex-col px-5 py-5">
        {/* Filter tabs */}
        {items.length > 0 && (
          <div className="flex gap-2 mb-5 animate-fade-up">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? "bg-forest-700 text-bark-50 border border-forest-600"
                    : "bg-forest-900/40 text-bark-400 border border-forest-800/40 hover:border-forest-700"
                }`}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({items.filter((i) => i.decision === f.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {!loaded ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-bark-600 text-sm">Loading...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-forest-900/50 border border-forest-800 flex items-center justify-center">
              <Package size={28} className="text-forest-700" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-bark-300 font-medium">
                {filter === "all" ? "No saved items yet" : `No ${filter} items`}
              </p>
              <p className="text-bark-600 text-sm">
                {filter === "all"
                  ? "Scan your first item to get started"
                  : "Change the filter to see other items"}
              </p>
            </div>
            {filter === "all" && (
              <Link href="/scan">
                <PrimaryButton className="gap-2">
                  <Camera size={18} />
                  Scan First Item
                </PrimaryButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up">
            <div className="text-xs text-bark-600 uppercase tracking-widest mb-1">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </div>
            {filtered.map((item) => (
              <SavedItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Scan again FAB */}
      {items.length > 0 && (
        <div className="fixed bottom-6 right-4 max-w-md">
          <Link href="/scan">
            <button className="flex items-center gap-2 px-4 py-3 bg-forest-500 hover:bg-forest-400 text-white rounded-2xl shadow-lg shadow-forest-900/60 font-semibold text-sm active:scale-95 transition-all">
              <Camera size={18} />
              Scan New
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
