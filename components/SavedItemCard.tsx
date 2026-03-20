"use client";

import Link from "next/link";
import { EvaluatedItem } from "@/types";
import {
  formatCurrency,
  getRecommendationLabel,
} from "@/lib/mockIntelligence";
import { RecommendationMeter } from "./RecommendationMeter";
import clsx from "clsx";

interface SavedItemCardProps {
  item: EvaluatedItem;
}

export function SavedItemCard({ item }: SavedItemCardProps) {
  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const profitPositive = item.estimatedProfitHigh > 0;

  return (
    <Link href={`/item/${item.id}`}>
      <div className="flex gap-3 p-3 rounded-2xl bg-forest-900/40 border border-forest-800/40 hover:border-forest-700/60 active:scale-[0.98] transition-all duration-150">
        {/* Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-forest-800">
          <img
            src={item.imageDataUrl}
            alt="Item"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <RecommendationMeter
              recommendation={item.recommendation}
              compact
            />
            <span
              className={clsx(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                item.decision === "purchased"
                  ? "text-forest-300 bg-forest-900/80 border border-forest-700"
                  : "text-bark-400 bg-forest-950/60 border border-forest-800"
              )}
            >
              {item.decision === "purchased" ? "Purchased" : "Passed"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-bark-400">
              Cost:{" "}
              <span className="text-bark-200 font-medium">
                {formatCurrency(item.enteredCost)}
              </span>
            </span>
            <span className="text-bark-600">·</span>
            <span className="text-bark-400">
              Est. profit:{" "}
              <span
                className={clsx(
                  "font-semibold",
                  profitPositive ? "text-forest-400" : "text-red-400"
                )}
              >
                {profitPositive ? "+" : "-"}
                {formatCurrency(item.estimatedProfitHigh)}
              </span>
            </span>
          </div>

          <div className="text-[11px] text-bark-600">
            {dateStr} · {timeStr}
          </div>
        </div>
      </div>
    </Link>
  );
}
