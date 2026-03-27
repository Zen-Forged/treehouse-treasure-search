"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFinds } from "@/hooks/useFinds";
import { useScanSession } from "@/hooks/useScanSession";
import { FindRecord } from "@/types/find";

export default function FindDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getFind, deleteFind } = useFinds();
  const { setSessionData } = useScanSession();
  const [find, setFind] = useState<FindRecord | null>(null);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const found = getFind(id);
    if (!found) router.replace("/finds");
    else setFind(found);
  }, [params.id]);

  const handleAnalyze = () => {
    if (!find) return;
    // Bridge into existing analysis flow
    setSessionData({ imageDataUrl: find.imageOriginal, enteredCost: find.pricePaid ?? 0 });
    router.push("/decide");
  };

  const handleDelete = () => {
    if (!find) return;
    deleteFind(find.id);
    router.push("/finds");
  };

  if (!find) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05] pb-36">
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0" }}>Find</span>
        <button onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <Trash2 size={14} style={{ color: "#7a6535" }} />
        </button>
      </header>

      <main className="flex flex-col px-4 py-4 gap-4">

        <motion.div className="w-full rounded-2xl overflow-hidden" style={{ height: 300 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img src={find.imageEnhanced ?? find.imageOriginal} alt="Find"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.9) saturate(0.82)" }} />
        </motion.div>

        {find.caption && (
          <motion.div className="px-4 py-4 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{find.caption}"
            </p>
          </motion.div>
        )}

        <motion.div className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px" }}>
            {new Date(find.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          {find.pricePaid != null && (
            <div style={{ fontSize: 13, color: "#7a6535" }}>Paid ${find.pricePaid.toFixed(2)}</div>
          )}
        </motion.div>

      </main>

      {/* Analyze CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200,180,126,0.05)" }}>
        <motion.button onClick={handleAnalyze}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8]"
          style={{
            padding: "16px", borderRadius: 16, fontSize: 15,
            background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border: "1px solid rgba(109,188,109,0.16)",
            boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
          }}
          whileTap={{ scale: 0.97 }}>
          Analyze worth
        </motion.button>
      </div>
    </div>
  );
}