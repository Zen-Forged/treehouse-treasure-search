// app/discover/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";
import { mockIdentifyItem } from "@/lib/mockAI";
import { useScanSession } from "@/hooks/useScanSession";

const ease = [0.25, 0.1, 0.25, 1] as const;

// Enhancement runs silently in the background
function applyEnhancement(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
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

export default function DiscoverPage() {
  const router = useRouter();
  const { draft, setDraft } = useFindDraft();
  const { setSessionData } = useScanSession();

  useEffect(() => {
    if (!draft.imageOriginal) { router.replace("/"); return; }

    // Identify item if not already done
    if (!draft.titleGuess) {
      const result = mockIdentifyItem(draft.imageOriginal);
      setDraft(result);
    }

    // Enhance silently in background — ready for share flow later
    if (!draft.imageEnhanced) {
      applyEnhancement(draft.imageOriginal).then(enhanced => {
        setDraft({ imageEnhanced: enhanced });
      });
    }
  }, []);

  const handleWhatIsItWorth = () => {
    if (draft.imageOriginal) {
      setSessionData({ imageDataUrl: draft.imageOriginal, enteredCost: draft.pricePaid ?? 0 });
    }
    router.push("/decide");
  };

  const handleShare = () => {
    router.push("/intent");
  };

  const image       = draft.imageOriginal; // show original — enhanced is being processed
  const title       = draft.titleGuess ?? "Something interesting";
  const description = draft.description ?? "We're still working this one out.";

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      <header
        className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{
          borderBottom: "1px solid rgba(200,180,126,0.06)",
          background: "rgba(5,15,5,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}
        >
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          What you found
        </span>
      </header>

      <main className="flex-1 flex flex-col pb-40 overflow-y-auto">

        {/* Full image */}
        <motion.div
          className="relative w-full flex-shrink-0"
          style={{ height: 340 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {image && (
            <img
              src={image}
              alt="Your find"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.88) saturate(0.82)" }}
            />
          )}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,15,5,0.35) 100%)"
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-28"
            style={{ background: "linear-gradient(to bottom, transparent, #050f05)" }} />
        </motion.div>

        <div className="px-5 flex flex-col gap-5 pt-2">

          {/* Title + description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
          >
            <h1 style={{
              fontFamily: "Georgia, serif",
              fontSize: 28, fontWeight: 700,
              color: "#f5f0e8", lineHeight: 1.2,
              marginBottom: 10,
            }}>
              {title}
            </h1>
            <p style={{
              fontSize: 14, color: "#7a6535",
              lineHeight: 1.7, fontWeight: 300,
            }}>
              {description}
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ height: 1, background: "rgba(200,180,126,0.06)" }}
          />

          {/* Intent prompt */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease }}
          >
            <div style={{
              fontSize: 9, color: "#a8904e",
              textTransform: "uppercase", letterSpacing: "2.5px",
              marginBottom: 8,
            }}>
              What's on your mind?
            </div>
            <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.65, fontWeight: 300 }}>
              You can look into what it might be worth, or share it and see what others think.
            </p>
          </motion.div>

        </div>
      </main>

      {/* Bottom actions */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{
          background: "rgba(5,15,5,0.97)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(200,180,126,0.06)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />

        <div className="flex flex-col gap-2">
          {/* Primary — share path */}
          <motion.button
            onClick={handleShare}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{
              padding: "17px 22px", borderRadius: 16, fontSize: 15,
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.16)",
              boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <span style={{
              position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
            }} />
            Share with others
          </motion.button>

          {/* Secondary — pricing path */}
          <motion.button
            onClick={handleWhatIsItWorth}
            className="w-full flex items-center justify-center"
            style={{
              padding: "14px 22px", borderRadius: 14, fontSize: 14,
              background: "rgba(13,31,13,0.5)",
              color: "#d4c9b0",
              border: "1px solid rgba(109,188,109,0.1)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            What's it worth
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
