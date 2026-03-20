"use client";

import Link from "next/link";
import { Camera, Archive, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton } from "@/components/Buttons";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex-1 flex flex-col px-5 py-8">
        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center space-y-10">
          {/* Brand block */}
          <div className="space-y-4 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900/60 border border-forest-700/40 text-forest-400 text-xs font-medium">
              <TrendingUp size={12} />
              Reseller Intelligence · V1
            </div>
            <h1 className="font-display text-4xl font-bold text-bark-50 leading-tight">
              Treehouse
              <br />
              <span className="text-forest-400">Treasure</span>
              <br />
              Search
            </h1>
            <p className="text-bark-400 text-base leading-relaxed max-w-xs">
              Know if it&apos;s worth buying before you check out.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 animate-fade-up-delay-1">
            {[
              { label: "Avg Margin", value: "~62%" },
              { label: "Fees Est.", value: "~13%" },
              { label: "Quick Scan", value: "<30s" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-forest-900/40 border border-forest-800/40 p-3 text-center"
              >
                <div className="font-mono text-forest-400 font-bold text-lg">
                  {stat.value}
                </div>
                <div className="text-bark-600 text-[10px] uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3 animate-fade-up-delay-2">
            <Link href="/scan">
              <PrimaryButton fullWidth size="lg" className="gap-3">
                <Camera size={22} />
                Scan Item
              </PrimaryButton>
            </Link>

            <Link href="/saved">
              <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-forest-800/60 text-bark-300 hover:bg-forest-900/40 hover:border-forest-700 transition-all text-base font-medium active:scale-95">
                <Archive size={18} />
                View Saved Items
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-bark-700 text-xs animate-fade-up-delay-3">
          Mock intelligence · V1 · For resellers
        </div>
      </main>
    </div>
  );
}
