"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Camera, Trash2, Calendar } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { RecommendationMeter } from "@/components/RecommendationMeter";
import { CompCard } from "@/components/CompCard";
import { PricingBreakdown } from "@/components/PricingBreakdown";
import { DangerButton, SecondaryButton } from "@/components/Buttons";
import { useSavedItems } from "@/hooks/useSavedItems";
import { EvaluatedItem } from "@/types";
import clsx from "clsx";

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { items, loaded, deleteItem } = useSavedItems();
  const [item, setItem] = useState<EvaluatedItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const found = items.find((i) => i.id === params.id);
    if (!found) {
      router.replace("/saved");
    } else {
      setItem(found);
    }
  }, [items, loaded, params.id, router]);

  const handleDelete = () => {
    if (!item) return;
    deleteItem(item.id);
    router.replace("/saved");
  };

  if (!loaded || !item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-bark-600 text-sm">Loading...</div>
      </div>
    );
  }

  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Item Detail"
        showBack
        backHref="/saved"
      />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Hero image */}
        <div className="relative w-full bg-forest-900" style={{ maxHeight: "45vw", minHeight: 180, overflow: "hidden" }}>
          <img
            src={item.imageDataUrl}
            alt="Evaluated item"
            className="w-full object-cover"
            style={{ maxHeight: "45vw", minHeight: 180 }}
          />
          {/* Decision badge */}
          <div className="absolute top-3 left-3">
            <span
              className={clsx(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm",
                item.decision === "purchased"
                  ? "bg-forest-900/80 border-forest-600 text-forest-300"
                  : "bg-forest-950/80 border-forest-800 text-bark-400"
              )}
            >
              {item.decision === "purchased" ? "✓ Purchased" : "✗ Passed"}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Meta */}
          <div className="flex items-center gap-2 text-bark-600 text-xs animate-fade-up">
            <Calendar size={12} />
            <span>{dateStr} · {timeStr}</span>
          </div>

          {/* Recommendation */}
          <div className="animate-fade-up-delay-1">
            <RecommendationMeter recommendation={item.recommendation} />
          </div>

          {/* Pricing */}
          <div className="animate-fade-up-delay-2">
            <PricingBreakdown item={item} />
          </div>

          {/* Comps */}
          <div className="space-y-2 animate-fade-up-delay-3">
            <div className="text-xs font-medium text-bark-500 uppercase tracking-widest">
              Comparable Sales
            </div>
            {item.mockComps.map((comp, i) => (
              <CompCard key={i} comp={comp} />
            ))}
            <p className="text-center text-bark-700 text-[10px] py-1">
              Mock data · V1 · Real comps coming soon
            </p>
          </div>
        </div>
      </main>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4 bg-forest-950/95 backdrop-blur-sm border-t border-forest-800/50 safe-bottom">
        {showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-bark-400 text-sm text-center mb-2">
              Delete this item permanently?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={handleDelete}>
                Yes, Delete
              </DangerButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton
              onClick={() => router.push("/scan")}
              className="gap-2"
            >
              <Camera size={16} />
              Scan New
            </SecondaryButton>
            <DangerButton
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <Trash2 size={16} />
              Delete
            </DangerButton>
          </div>
        )}
      </div>
    </div>
  );
}
