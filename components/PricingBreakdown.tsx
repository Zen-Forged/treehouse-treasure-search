"use client";

import { EvaluatedItem } from "@/types";
import { formatCurrency } from "@/lib/mockIntelligence";
import clsx from "clsx";

interface PricingBreakdownProps {
  item: Pick<
    EvaluatedItem,
    | "enteredCost"
    | "mockCompLow"
    | "mockCompHigh"
    | "suggestedListPrice"
    | "estimatedFees"
    | "estimatedShipping"
    | "estimatedProfitLow"
    | "estimatedProfitHigh"
  >;
}

function Row({
  label,
  value,
  accent = false,
  negative = false,
  large = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  negative?: boolean;
  large?: boolean;
}) {
  return (
    <div className={clsx("flex justify-between items-center", large && "pt-2")}>
      <span
        className={clsx(
          "text-bark-400",
          large ? "text-sm font-medium" : "text-xs"
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "font-mono font-semibold",
          large ? "text-base" : "text-sm",
          accent && !negative && "text-forest-400",
          negative && "text-red-400",
          !accent && !negative && "text-bark-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PricingBreakdown({ item }: PricingBreakdownProps) {
  const profitPositive = item.estimatedProfitHigh > 0;
  const compLow        = item.mockCompLow  ?? 0;
  const compHigh       = item.mockCompHigh ?? 0;

  return (
    <div className="rounded-2xl bg-forest-900/40 border border-forest-800/40 p-4 space-y-2.5">
      <div className="text-xs font-medium text-bark-500 uppercase tracking-widest mb-3">
        The Math
      </div>

      <Row
        label="Comp Range"
        value={`${formatCurrency(compLow)} – ${formatCurrency(compHigh)}`}
      />
      <Row
        label="Suggested List Price"
        value={formatCurrency(item.suggestedListPrice)}
        accent
      />
      <Row label="Your Cost"                value={`– ${formatCurrency(item.enteredCost)}`} />
      <Row label="Marketplace Fees (~13%)"  value={`– ${formatCurrency(item.estimatedFees)}`} />
      <Row label="Shipping (est.)"          value={`– ${formatCurrency(item.estimatedShipping)}`} />

      <div className="border-t border-forest-800/60 pt-2.5">
        <Row
          label="In your pocket"
          value={`${item.estimatedProfitLow < 0 ? "-" : "+"}${formatCurrency(item.estimatedProfitLow)} to +${formatCurrency(item.estimatedProfitHigh)}`}
          accent={profitPositive}
          negative={!profitPositive}
          large
        />
      </div>
    </div>
  );
}
