"use client";

import { MockComp } from "@/types";
import { formatCurrency } from "@/lib/mockIntelligence";

interface CompCardProps {
  comp: MockComp;
}

export function CompCard({ comp }: CompCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl bg-forest-900/50 border border-forest-800/40">
      <div className="flex-1 min-w-0">
        <div className="text-bark-200 text-sm font-medium truncate">
          {comp.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-forest-500 text-xs">{comp.platform}</span>
          <span className="text-bark-600 text-xs">·</span>
          <span className="text-bark-500 text-xs">{comp.condition}</span>
          <span className="text-bark-600 text-xs">·</span>
          <span className="text-bark-500 text-xs">{comp.daysAgo}d ago</span>
        </div>
      </div>
      <div className="ml-3 text-bark-100 font-semibold font-mono text-sm">
        {formatCurrency(comp.price)}
      </div>
    </div>
  );
}
