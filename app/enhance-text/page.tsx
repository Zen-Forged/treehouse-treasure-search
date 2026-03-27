// app/enhance-text/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";
import { mockRefineCaption } from "@/lib/mockAI";

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function EnhanceTextPage() {
  const router = useRouter();
  const { draft, setDraft } = useFindDraft();

  const [refined, setRefined]         = useState<string | null>(draft.captionRefined ?? null);
  const [processing, setProcessing]   = useState(!draft.captionRefined);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sliderX, setSliderX]         = useState(50);

  // Generate refined caption on mount
  useEffect(() => {
    if (!draft.imageOriginal) { router.replace("/"); return; }
    if (draft.captionRefined) { setProcessing(false); return; }

    // Simulate async AI call
    const t = setTimeout(() => {
      const result = mockRefineCaption(
        draft.intentText ?? "",
        draft.intentChips ?? []
      );
      setRefined(result);
      setDraft({ captionRefined: result });
      setProcessing(false);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = () => {
    if (refined) setDraft({ captionRefined: refined });
    router.push("/share");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      <header
        className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}
        >
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          Brought to light
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-5 pb-36 overflow-y-auto">

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.65, fontWeight: 300 }}
        >
          We've refined the photo and your words — closer to how it feels.
        </motion.p>

        {/* Image slider — reuse same comparison UI */}
        <motion.div
          className="relative w-full rounded-2xl overflow-hidden select-none flex-shrink-0"
          style={{
            height: 260,
            border: "1px solid rgba(109,188,109,0.1)",
            cursor: "ew-resize",
            touchAction: "none",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease }}
          onMouseMove={e => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setSliderX(Math.min(98, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100)));
          }}
          onTouchMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setSliderX(Math.min(98, Math.max(2, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
          }}
        >
          <img src={draft.imageEnhanced ?? draft.imageOriginal} alt="Enhanced"
            className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderX}%` }}>
            <img src={draft.imageOriginal} alt="Original"
              className="absolute inset-0 h-full object-cover"
              style={{ width: `${100 / (sliderX / 100)}%`, maxWidth: "none", filter: "brightness(0.82) saturate(0.72)" }}
              draggable={false} />
          </div>
          <div className="absolute top-0 bottom-0 w-px"
            style={{ left: `${sliderX}%`, background: "rgba(255,255,255,0.65)", boxShadow: "0 0 8px rgba(0,0,0,0.4)", pointerEvents: "none" }} />
          <div className="absolute top-1/2 flex items-center justify-center"
            style={{ left: `${sliderX}%`, transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(5,15,5,0.85)", border: "1.5px solid rgba(200,180,126,0.5)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)", pointerEvents: "none" }}>
            <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
              <path d="M5 6H1M1 6L4 3M1 6L4 9" stroke="#c8b47e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 6H17M17 6L14 3M17 6L14 9" stroke="#c8b47e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md"
            style={{ background: "rgba(5,15,5,0.58)", backdropFilter: "blur(8px)", fontSize: 9, color: "rgba(212,201,176,0.6)" }}>
            As found
          </div>
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md"
            style={{ background: "rgba(5,15,5,0.58)", backdropFilter: "blur(8px)", fontSize: 9, color: "#a8904e" }}>
            Brought to light
          </div>
        </motion.div>

        {/* Caption refined */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease }}
        >
          <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px" }}>
            Your caption
          </div>

          {processing ? (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="px-4 py-4 rounded-2xl"
              style={{ background: "rgba(13,31,13,0.45)", border: "1px solid rgba(109,188,109,0.08)", minHeight: 80 }}
            >
              <span style={{ fontSize: 13, color: "#6a5528", letterSpacing: "0.3px" }}>
                Refining your words...
              </span>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="refined"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="px-4 py-4 rounded-2xl"
                style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.08)" }}
              >
                <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{refined}"
                </p>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Original text — collapsible */}
          {draft.intentText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button
                onClick={() => setShowOriginal(v => !v)}
                className="flex items-center gap-1.5"
                style={{ fontSize: 11, color: "rgba(106,85,40,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.3px" }}
              >
                {showOriginal ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {showOriginal ? "Hide original" : "See your original words"}
              </button>
              <AnimatePresence>
                {showOriginal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="mt-2 px-4 py-3 rounded-xl overflow-hidden"
                    style={{ background: "rgba(9,21,9,0.4)", border: "1px solid rgba(109,188,109,0.07)" }}
                  >
                    <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.65, fontStyle: "italic" }}>
                      "{draft.intentText}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

      </main>

      {/* Bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{
          background: "rgba(5,15,5,0.97)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(200,180,126,0.06)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
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
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          Ready to share
        </motion.button>
      </motion.div>
    </div>
  );
}
