// app/share/page.tsx
// Updated to display structured StoryOutput from the story generator.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { useFinds, sessionToFind } from "@/hooks/useFinds";

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function SharePage() {
  const router = useRouter();
  const { session, clearSession } = useFindSession();
  const { saveFind } = useFinds();

  const [copied,     setCopied]     = useState(false);
  const [copiedAlt,  setCopiedAlt]  = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    if (!session?.imageOriginal) router.replace("/");
  }, []);

  const story  = session?.story;
  const image  = session?.imageEnhanced ?? session?.imageOriginal;
  const title  = session?.identification?.title;
  const caption    = story?.caption    ?? session?.captionRefined ?? session?.intentText ?? "";
  const altCaption = story?.altCaption ?? "";

  const handleCopy = async (text: string, which: "primary" | "alt") => {
    await navigator.clipboard.writeText(text);
    if (which === "primary") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2200);
    }
  };

  const handleSave = async () => {
    if (!session) return;
    await saveFind(sessionToFind(session, "shared"));
    setSaved(true);
    clearSession();
    setTimeout(() => router.push("/finds"), 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      {/* ── Header ── */}
      <header className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>Ready to share</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-5 pb-40 overflow-y-auto">

        {/* ── Photo ── */}
        <motion.div className="w-full rounded-2xl overflow-hidden flex-shrink-0"
          style={{ height: 220, border: "1px solid rgba(109,188,109,0.08)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
          {image && (
            <img src={image} alt="Your find" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.88) saturate(0.82) sepia(0.06)" }} />
          )}
        </motion.div>

        {/* ── Post type + item name ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease }}>
          {story?.postType && (
            <div style={{
              display: "inline-block", marginBottom: 8,
              padding: "3px 10px", borderRadius: 20,
              fontSize: 9, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase",
              color: "#a8904e", background: "rgba(168,144,78,0.1)", border: "1px solid rgba(200,180,126,0.2)",
            }}>
              {story.postType}
            </div>
          )}
          {title && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 600, color: "#f5f0e8" }}>
              {title}
            </div>
          )}
          {story?.scene && (
            <div style={{ fontSize: 11, color: "#4a3a1e", marginTop: 3 }}>
              Scene: {story.scene}
            </div>
          )}
        </motion.div>

        {/* ── Primary caption ── */}
        {caption && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14, ease }}>
            <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 8 }}>
              Caption
            </div>
            <div className="px-4 py-4 rounded-2xl"
              style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.07)", position: "relative" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", lineHeight: 1.7, paddingRight: 32 }}>
                {caption}
              </p>
              <button onClick={() => handleCopy(caption, "primary")}
                style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                {copied ? <Check size={14} color="#6dbc6d" /> : <Copy size={14} color="#4a3a1e" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Alt caption ── */}
        {altCaption && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease }}>
            <div style={{ fontSize: 9, color: "#3d3018", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 8 }}>
              Alternate
            </div>
            <div className="px-4 py-3 rounded-xl"
              style={{ background: "rgba(9,21,9,0.4)", border: "1px solid rgba(109,188,109,0.07)", position: "relative" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#8a7a5a", lineHeight: 1.65, fontStyle: "italic", paddingRight: 32 }}>
                {altCaption}
              </p>
              <button onClick={() => handleCopy(altCaption, "alt")}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                {copiedAlt ? <Check size={13} color="#6dbc6d" /> : <Copy size={13} color="#3d3018" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Image prompt ── */}
        {story?.imagePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26, ease }}>
            <div style={{ fontSize: 9, color: "#2e2410", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 8 }}>
              Image prompt
            </div>
            <div className="px-4 py-3 rounded-xl"
              style={{ background: "rgba(5,10,5,0.5)", border: "1px solid rgba(200,180,126,0.04)" }}>
              <p style={{ fontSize: 12, color: "#3d3018", lineHeight: 1.65 }}>
                {story.imagePrompt}
              </p>
            </div>
          </motion.div>
        )}

      </main>

      {/* ── Save CTA ── */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <motion.button onClick={handleSave} disabled={saved}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-60"
          style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, background: saved ? "rgba(109,188,109,0.18)" : "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: saved ? "none" : "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)", transition: "all 0.3s" }}
          whileTap={saved ? {} : { scale: 0.97 }}>
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          {saved ? "Saved to My Picks" : "Save to My Picks"}
        </motion.button>
      </motion.div>
    </div>
  );
}
