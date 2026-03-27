"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";

// Applies warm + contrast treatment via canvas
function applyEnhancement(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Warmth: boost red slightly, reduce blue slightly
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, d[i]     * 1.06); // R +warmth
        d[i + 2] = Math.max(0,   d[i + 2] * 0.92); // B -warmth
        // Slight contrast
        d[i]     = Math.min(255, (d[i]     - 128) * 1.08 + 128);
        d[i + 1] = Math.min(255, (d[i + 1] - 128) * 1.08 + 128);
        d[i + 2] = Math.min(255, (d[i + 2] - 128) * 1.08 + 128);
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = src;
  });
}

export default function EnhancePage() {
  const router = useRouter();
  const { draft, setDraft } = useFindDraft();
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!draft.imageOriginal) { router.replace("/capture"); return; }
    applyEnhancement(draft.imageOriginal).then(result => {
      setEnhanced(result);
      setProcessing(false);
    });
  }, [draft.imageOriginal]);

  const handleContinue = () => {
    if (enhanced) setDraft({ imageEnhanced: enhanced });
    router.push("/story");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <header className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>Enhance</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-5">

        {/* Image preview */}
        <motion.div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 340 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {processing ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(13,31,13,0.5)" }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: 13, color: "#7a6535", letterSpacing: "0.3px" }}>
                Applying enhancement...
              </motion.div>
            </div>
          ) : (
            <img src={enhanced ?? draft.imageOriginal} alt="Enhanced"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.95)" }} />
          )}
        </motion.div>

        {!processing && (
          <motion.div className="flex gap-2 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Before</div>
              <div className="rounded-xl overflow-hidden" style={{ height: 72 }}>
                <img src={draft.imageOriginal} alt="Original" className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.8) saturate(0.7)" }} />
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>After</div>
              <div className="rounded-xl overflow-hidden" style={{ height: 72 }}>
                <img src={enhanced ?? ""} alt="Enhanced" className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1" />

        <motion.button
          onClick={handleContinue}
          disabled={processing}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
          style={{
            padding: "17px 22px", borderRadius: 16, fontSize: 15,
            background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border: "1px solid rgba(109,188,109,0.16)",
            boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
          }}
          whileTap={{ scale: 0.97 }}>
          Continue
        </motion.button>

      </main>
    </div>
  );
}