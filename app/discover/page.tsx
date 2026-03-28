// app/discover/page.tsx
// Phase 2: routes "What's it worth" through confidence gate
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";

const ease = [0.25, 0.1, 0.25, 1] as const;

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

// Phase 2: confidence gate logic
function getWorthRoute(confidence: string | undefined): string {
  if (confidence === "low") return "/refine";
  return "/decide";
}

export default function DiscoverPage() {
  const router = useRouter();
  const { session, updateSession } = useFindSession();
  const [identifying, setIdentifying] = useState(!session?.identification);

  useEffect(() => {
    if (!session?.imageOriginal) { router.replace("/"); return; }

    if (!session.identification) {
      fetch("/api/identify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ imageDataUrl: session.imageOriginal }),
      })
        .then(r => r.json())
        .then(result => {
          updateSession({ identification: result });
          setIdentifying(false);
        })
        .catch(() => {
          updateSession({
            identification: {
              title:       "Something interesting",
              description: "We weren't able to identify this one. You can still share or research it.",
              confidence:  "low",
              searchQuery: "vintage item",
            },
          });
          setIdentifying(false);
        });
    } else {
      setIdentifying(false);
    }

    if (!session.imageEnhanced) {
      applyEnhancement(session.imageOriginal).then(imageEnhanced => {
        updateSession({ imageEnhanced });
      });
    }
  }, []);

  const handleShare = () => router.push("/intent");

  // Phase 2: route through confidence gate
  const handleWhatIsItWorth = () => {
    const route = getWorthRoute(session?.identification?.confidence);
    router.push(route);
  };

  const title       = session?.identification?.title       ?? "Something interesting";
  const description = session?.identification?.description ?? "";
  const confidence  = session?.identification?.confidence;
  const image       = session?.imageOriginal;

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      <header className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          What you found
        </span>
      </header>

      <main className="flex-1 flex flex-col pb-40 overflow-y-auto">

        {/* Image — smaller, information is the hero */}
        <motion.div className="relative w-full flex-shrink-0" style={{ height: 220 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {image && (
            <img src={image} alt="Your find" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.88) saturate(0.82)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,15,5,0.35) 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: "linear-gradient(to bottom, transparent, #050f05)" }} />
        </motion.div>

        <div className="px-5 flex flex-col gap-5 pt-3">

          {identifying ? (
            /* ── Loading animation ── */
            <motion.div className="flex flex-col items-center gap-4 py-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MagnifyingGlass />
              <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ fontSize: 13, color: "#7a6535", letterSpacing: "0.3px" }}>
                Researching your find...
              </motion.p>
            </motion.div>
          ) : (
            <>
              {/* Title */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease }}>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2, marginBottom: 8 }}>
                  {title}
                </h1>
                <p style={{ fontSize: 14, color: "#7a6535", lineHeight: 1.7, fontWeight: 300 }}>
                  {description}
                </p>
              </motion.div>

              {/* Confidence indicator — only show if not high */}
              {confidence && confidence !== "high" && (
                <motion.div className="flex items-center gap-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <div style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 10,
                    color: confidence === "medium" ? "#a8904e" : "#9a7a5a",
                    background: confidence === "medium" ? "rgba(168,144,78,0.1)" : "rgba(154,122,90,0.1)",
                    border: `1px solid ${confidence === "medium" ? "rgba(168,144,78,0.25)" : "rgba(154,122,90,0.25)"}`,
                  }}>
                    {confidence === "medium" ? "Likely match" : "Uncertain — we'll confirm before valuation"}
                  </div>
                </motion.div>
              )}

              <motion.div style={{ height: 1, background: "rgba(200,180,126,0.06)" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} />
            </>
          )}
        </div>
      </main>

      {/* Bottom actions */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={handleShare}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
            whileTap={{ scale: 0.97 }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            Share the story
          </motion.button>
          <motion.button onClick={handleWhatIsItWorth}
            className="w-full flex items-center justify-center"
            style={{ padding: "14px 22px", borderRadius: 14, fontSize: 14, background: "rgba(13,31,13,0.5)", color: "#d4c9b0", border: "1px solid rgba(109,188,109,0.1)" }}
            whileTap={{ scale: 0.97 }}>
            What's it worth
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Magnifying glass loading animation ──────────────────
function MagnifyingGlass() {
  return (
    <div style={{ position: "relative", width: 56, height: 56 }}>
      {/* Rotating orbit ring */}
      <motion.div
        style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid transparent",
          borderTopColor: "rgba(200,180,126,0.5)",
          borderRightColor: "rgba(200,180,126,0.2)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
      {/* Static magnifying glass icon */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="10" cy="10" r="6.5" stroke="rgba(200,180,126,0.6)" strokeWidth="1.5" fill="none" />
          <path d="M15 15L20 20" stroke="rgba(200,180,126,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Subtle inner glint */}
          <circle cx="8" cy="8" r="2" stroke="rgba(200,180,126,0.2)" strokeWidth="1" fill="none" />
        </svg>
      </div>
      {/* Pulsing background glow */}
      <motion.div
        style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(200,180,126,0.06), transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
