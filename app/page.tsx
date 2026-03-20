"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Archive, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useScanSession } from "@/hooks/useScanSession";

export default function HomePage() {
  const router = useRouter();
  const { setSessionData } = useScanSession();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSessionData({ imageDataUrl, enteredCost: 0 });
      router.push("/decide");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <main className="flex-1 flex flex-col px-5 py-8">
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
            {/* Take Photo / From Library — same style as scan page */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-forest-900/40 border border-forest-700/50 hover:bg-forest-900/60 hover:border-forest-600 transition-all active:scale-95"
              >
                <Camera size={24} className="text-forest-400" />
                <span className="text-bark-300 text-sm font-medium">Take Photo</span>
              </button>
              <button
                onClick={() => libraryInputRef.current?.click()}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-forest-900/40 border border-forest-700/50 hover:bg-forest-900/60 hover:border-forest-600 transition-all active:scale-95"
              >
                <ImagePlus size={24} className="text-forest-400" />
                <span className="text-bark-300 text-sm font-medium">From Library</span>
              </button>
            </div>

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
