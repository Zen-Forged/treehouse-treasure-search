// app/finds/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFinds, SavedFind } from "@/hooks/useFinds";
import { useFindSession } from "@/hooks/useSession";

export default function FindDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getFind, deleteFind } = useFinds();
  const { startSession, updateSession } = useFindSession();
  const [find, setFind] = useState<SavedFind | null>(null);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const found = getFind(id);
    if (!found) router.replace("/finds");
    else setFind(found);
  }, [params.id]);

  const handleReview = () => {
    if (!find) return;
    // Restore the session from the saved find so /decide renders
    // directly into results state — no re-analysis, no API calls.
    const session = startSession(find.imageOriginal);
    updateSession({
      ...session,
      imageEnhanced:  find.imageEnhanced,
      identification: find.title ? {
        title:       find.title,
        description: find.description ?? "",
        confidence:  "high" as const,
        searchQuery: find.title.toLowerCase(),
        attributes:  {
          brand:    find.brand    ?? undefined,
          material: find.material ?? undefined,
          era:      find.era      ?? undefined,
          origin:   find.origin   ?? undefined,
          category: find.category ?? undefined,
        },
      } : undefined,
      pricePaid:    find.pricePaid,
      // Embed the saved market data so decide page can skip fetching
      skipPriceEntry: true,
      savedFindData: {
        medianSoldPrice:  find.medianSoldPrice,
        priceRangeLow:    find.priceRangeLow,
        priceRangeHigh:   find.priceRangeHigh,
        avgDaysToSell:    find.avgDaysToSell,
        competitionCount: find.competitionCount,
        competitionLevel: find.competitionLevel,
      },
    });
    router.push("/decide?review=1");
  };

  const handleDelete = () => {
    if (!find) return;
    deleteFind(find.id);
    router.push("/finds");
  };

  if (!find) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05] pb-36">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0" }}>Find</span>
        <button onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <Trash2 size={14} style={{ color: "#7a6535" }} />
        </button>
      </header>

      <main className="flex flex-col px-4 py-4 gap-4">
        <motion.div className="w-full rounded-2xl overflow-hidden" style={{ height: 300 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img src={find.imageEnhanced ?? find.imageOriginal} alt="Find"
            className="w-full h-full object-cover" style={{ filter: "brightness(0.9) saturate(0.82)" }} />
        </motion.div>

        {find.title && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Identified as</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 600, color: "#f5f0e8" }}>{find.title}</div>
            {find.description && <p style={{ fontSize: 13, color: "#7a6535", lineHeight: 1.6, marginTop: 6, fontWeight: 300 }}>{find.description}</p>}
          </motion.div>
        )}

        {(find.captionRefined ?? find.intentText) && (
          <motion.div className="px-4 py-4 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{find.captionRefined ?? find.intentText}"
            </p>
          </motion.div>
        )}

        <motion.div className="flex flex-col gap-1" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px" }}>
            {new Date(find.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          {find.pricePaid != null && <div style={{ fontSize: 13, color: "#7a6535" }}>Paid ${find.pricePaid.toFixed(2)}</div>}
          {find.estimatedProfitHigh != null && <div style={{ fontSize: 13, color: "#6dbc6d" }}>Est. profit +${find.estimatedProfitHigh.toFixed(2)}</div>}
        </motion.div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200,180,126,0.05)", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}>
        <motion.button onClick={handleReview}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden"
          style={{ padding: "16px", borderRadius: 16, fontSize: 15, background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55)" }}
          whileTap={{ scale: 0.97 }}>
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          View results
        </motion.button>
      </div>
    </div>
  );
}
