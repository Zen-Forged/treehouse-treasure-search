// app/finds/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFinds } from "@/hooks/useFinds";

export default function FindsPage() {
  const router = useRouter();
  const { finds } = useFinds();

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0" }}>My Finds</span>
        <div className="w-9" />
      </header>

      <main className="flex-1 px-4 py-5 pb-28">
        {finds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ opacity: 0.4 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#d4c9b0" }}>No finds yet</span>
            <span style={{ fontSize: 13, color: "#6a5528" }}>Start by capturing something</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {finds.map((find, i) => (
              <motion.button key={find.id} onClick={() => router.push(`/finds/${find.id}`)}
                className="relative rounded-2xl overflow-hidden aspect-square"
                style={{ border: "1px solid rgba(109,188,109,0.08)" }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.97 }}>
                <img src={find.imageEnhanced ?? find.imageOriginal} alt="Find"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.85) saturate(0.75)" }} />
                {(find.captionRefined ?? find.intentText) && (
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-2"
                    style={{ background: "linear-gradient(to top, rgba(5,15,5,0.85), transparent)" }}>
                    <p style={{ fontSize: 10, color: "#d4c9b0", lineHeight: 1.4 }} className="line-clamp-2">
                      {find.captionRefined ?? find.intentText}
                    </p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-5">
        <motion.button onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 font-semibold text-[#f5f0e8]"
          style={{ padding: "14px 32px", borderRadius: 50, fontSize: 14, background: "linear-gradient(135deg, rgba(46,110,46,0.96), rgba(33,82,33,1))", border: "1px solid rgba(109,188,109,0.2)", boxShadow: "0 4px 24px rgba(5,15,5,0.6), 0 0 40px rgba(45,125,45,0.15)" }}
          whileTap={{ scale: 0.97 }}>
          New find
        </motion.button>
      </div>
    </div>
  );
}
