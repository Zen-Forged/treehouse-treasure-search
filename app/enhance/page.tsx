// app/enhance/page.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";

function applyEnhancement(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        px[i]     = Math.min(255, px[i]     * 1.06);
        px[i + 2] = Math.max(0,   px[i + 2] * 0.92);
        px[i]     = Math.min(255, (px[i]     - 128) * 1.08 + 128);
        px[i + 1] = Math.min(255, (px[i + 1] - 128) * 1.08 + 128);
        px[i + 2] = Math.min(255, (px[i + 2] - 128) * 1.08 + 128);
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = src;
  });
}

export default function EnhancePage() {
  const router = useRouter();
  const { session, updateSession } = useFindSession();
  const [enhanced, setEnhanced]     = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [sliderX, setSliderX]       = useState(50);
  const containerRef                = useRef<HTMLDivElement>(null);
  const dragging                    = useRef(false);

  useEffect(() => {
    if (!session?.imageOriginal) { router.replace("/"); return; }
    if (session.imageEnhanced) {
      setEnhanced(session.imageEnhanced);
      setProcessing(false);
      return;
    }
    applyEnhancement(session.imageOriginal).then(result => {
      setEnhanced(result);
      updateSession({ imageEnhanced: result });
      setProcessing(false);
    });
  }, [session?.imageOriginal]);

  const getPercent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return 50;
    const rect = el.getBoundingClientRect();
    return Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseDown  = (e: React.MouseEvent)  => { dragging.current = true;  setSliderX(getPercent(e.clientX)); };
  const onMouseMove  = (e: React.MouseEvent)  => { if (dragging.current) setSliderX(getPercent(e.clientX)); };
  const onMouseUp    = ()                     => { dragging.current = false; };
  const onTouchStart = (e: React.TouchEvent) => { dragging.current = true;  setSliderX(getPercent(e.touches[0].clientX)); };
  const onTouchMove  = (e: React.TouchEvent) => { if (dragging.current) setSliderX(getPercent(e.touches[0].clientX)); };
  const onTouchEnd   = ()                    => { dragging.current = false; };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <header className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          As it appears in your hand
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-5">
        {processing ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: 13, color: "#7a6535", letterSpacing: "0.3px" }}>
              One moment...
            </motion.div>
          </div>
        ) : (
          <>
            <motion.div ref={containerRef}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="relative w-full rounded-2xl overflow-hidden select-none"
              style={{ height: 420, border: "1px solid rgba(109,188,109,0.1)", cursor: "ew-resize", touchAction: "none" }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <img src={enhanced!} alt="Enhanced" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderX}%` }}>
                <img src={session?.imageOriginal} alt="Original" className="absolute inset-0 h-full object-cover"
                  style={{ width: `${100 / (sliderX / 100)}%`, maxWidth: "none", filter: "brightness(0.82) saturate(0.72)" }} draggable={false} />
              </div>
              <div className="absolute top-0 bottom-0 w-px"
                style={{ left: `${sliderX}%`, background: "rgba(255,255,255,0.65)", boxShadow: "0 0 8px rgba(0,0,0,0.4)", pointerEvents: "none" }} />
              <div className="absolute top-1/2 flex items-center justify-center"
                style={{ left: `${sliderX}%`, transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(5,15,5,0.85)", border: "1.5px solid rgba(200,180,126,0.5)", pointerEvents: "none" }}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                  <path d="M5 6H1M1 6L4 3M1 6L4 9" stroke="#c8b47e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 6H17M17 6L14 3M17 6L14 9" stroke="#c8b47e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.div>

            <div className="flex-1" />

            <motion.div className="flex flex-col gap-2"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <motion.button onClick={() => router.push("/discover")}
                className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden"
                style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55)" }}
                whileTap={{ scale: 0.97 }}>
                <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
                Continue
              </motion.button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
