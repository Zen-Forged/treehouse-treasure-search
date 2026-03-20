"use client";

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function PriceInput({
  value,
  onChange,
  label = "Item Cost",
  placeholder = "0.00",
}: PriceInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-bark-400 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-400 text-lg font-light">
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-4 py-3.5 bg-forest-900/60 border border-forest-700/60 rounded-xl text-bark-100 text-lg font-mono placeholder:text-bark-700 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500/40 transition-all"
        />
      </div>
    </div>
  );
}
