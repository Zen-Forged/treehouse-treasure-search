"use client";

import { Recommendation } from "@/types";
import {
  getRecommendationLabel,
  getRecommendationCopy,
} from "@/lib/mockIntelligence";
import clsx from "clsx";

const CONFIG: Record<
  Recommendation,
  {
    color: string;
    bgColor: string;
    barColor: string;
    borderColor: string;
    width: string;
    icon: string;
    dots: number[];
  }
> = {
  "strong-buy": {
    color: "text-forest-300",
    bgColor: "bg-forest-900/60",
    barColor: "bg-forest-400",
    borderColor: "border-forest-600/50",
    width: "90%",
    icon: "🌿",
    dots: [1, 1, 1, 1, 1],
  },
  maybe: {
    color: "text-amber-400",
    bgColor: "bg-bark-900/50",
    barColor: "bg-amber-500",
    borderColor: "border-bark-600/50",
    width: "55%",
    icon: "🍂",
    dots: [1, 1, 1, 0, 0],
  },
  pass: {
    color: "text-red-400",
    bgColor: "bg-red-950/40",
    barColor: "bg-red-600",
    borderColor: "border-red-800/50",
    width: "20%",
    icon: "🪵",
    dots: [1, 0, 0, 0, 0],
  },
};

interface RecommendationMeterProps {
  recommendation: Recommendation;
  compact?: boolean;
}

export function RecommendationMeter({
  recommendation,
  compact = false,
}: RecommendationMeterProps) {
  const cfg = CONFIG[recommendation];
  const label = getRecommendationLabel(recommendation);
  const copy = getRecommendationCopy(recommendation);

  if (compact) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
          cfg.color,
          cfg.bgColor,
          cfg.borderColor
        )}
      >
        <span>{cfg.icon}</span>
        {label}
      </span>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 space-y-3",
        cfg.bgColor,
        cfg.borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <div className={clsx("font-display text-lg font-bold", cfg.color)}>
              {label}
            </div>
            <div className="text-xs text-bark-400">{copy}</div>
          </div>
        </div>
        <div className="flex gap-1">
          {cfg.dots.map((active, i) => (
            <div
              key={i}
              className={clsx(
                "w-2 h-2 rounded-full transition-all",
                active ? cfg.barColor : "bg-forest-800"
              )}
            />
          ))}
        </div>
      </div>

      {/* Bar */}
      <div className="h-2 bg-forest-900 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-700", cfg.barColor)}
          style={{ width: cfg.width }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-bark-600 uppercase tracking-widest">
        <span>Pass</span>
        <span>Maybe</span>
        <span>Strong Buy</span>
      </div>
    </div>
  );
}
