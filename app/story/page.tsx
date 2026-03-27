"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";

const DEFAULT_CAPTION =
  "Found this today. Not sure what it is yet, but something about it stood out. Anyone know more about this piece?";

export default function StoryPage() {
  const router = useRouter();
  const { draft, setDraft } = useFindDraft();
  const [caption, setCaption] = useState(draft.caption ?? DEFAULT_CAPTION);

  useEffect(() => {
    if (!draft.imageOriginal) router.replace("/capture");
  }, []);

  const handleContinue = () => {
    setDraft({ caption });
    router.push("/share");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <header className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>The Story</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-5">

        {/* Image thumbnail */}
        <motion.div className="w-full rounded-2xl overflow-hidden" style={{ height: 220 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <img
            src={draft.imageEnhanced ?? draft.imageOriginal}
            alt="Find"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.88) saturate(0.82)" }}
          />
        </motion.div>

        {/* Caption editor */}
        <motion.div className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px" }}>
            Your caption
          </div>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={5}
            className="w-full resize-none focus:outline-none"
            style={{
              background: "rgba(13,31,13,0.5)",
              border: "1px solid rgba(109,188,109,0.12)",
              borderRadius: 16,
              padding: "16px",
              fontSize: 15,
              fontFamily: "Georgia, serif",
              color: "#d4c9b0",
              lineHeight: 1.65,
            }}
          />
          <div style={{ fontSize: 11, color: "#3d3018", textAlign: "right" }}>
            {caption.length} characters
          </div>
        </motion.div>

        <div className="flex-1" />

        <motion.button onClick={handleContinue}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8]"
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