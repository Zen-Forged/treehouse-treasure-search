// app/refine/page.tsx
// Phase 2: confidence gate screen — shown when identification confidence is low
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { normalizeQuery } from "@/utils/normalizeQuery";

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function RefinePage() {
  const router = useRouter();
  const { session, updateSession } = useFindSession();

  const [title, setTitle]   = useState(session?.identification?.title ?? "");
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (!session?.imageOriginal) router.replace("/");
  }, []);

  const handleConfirm = () => {
    const refinedQuery = normalizeQuery(title);
    updateSession({
      refinedQuery,
      // If user edited, bump confidence so we don't loop back here
      identification: session?.identification
        ? { ...session.identification, title, confidence: "medium", searchQuery: refinedQuery }
        : undefined,
    });
    router.push("/decide");
  };

  const handleBack = () => router.push("/discover");

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      <header className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          Confirm the item
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-6 pb-36 overflow-y-auto">

        {/* Image — small reference */}
        {session?.imageOriginal && (
          <motion.div className="w-full rounded-2xl overflow-hidden flex-shrink-0"
            style={{ height: 160, border: "1px solid rgba(109,188,109,0.08)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <img src={session.imageEnhanced ?? session.imageOriginal} alt="Your find"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.85) saturate(0.78)" }} />
          </motion.div>
        )}

        {/* Explanation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.25, marginBottom: 8 }}>
            We're not fully sure what this is.
          </h1>
          <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.65, fontWeight: 300 }}>
            Our best guess is below. If it looks right, confirm it and we'll search for pricing. If not, correct it so we get accurate results.
          </p>
        </motion.div>

        {/* Editable title */}
        <motion.div className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease }}>
          <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px" }}>
            Our best guess
          </div>
          <div className="rounded-2xl px-5 py-4"
            style={{ background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.14)" }}>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setEdited(true); }}
              className="w-full bg-transparent focus:outline-none"
              style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 600, color: "#f5f0e8", lineHeight: 1.3 }}
            />
          </div>
          {edited && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 11, color: "#7a6535", letterSpacing: "0.2px" }}>
              We'll search for pricing based on what you've entered.
            </motion.p>
          )}
        </motion.div>

        {/* Description for context */}
        {session?.identification?.description && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease }}>
            <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>
              What we noticed
            </div>
            <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.65, fontWeight: 300 }}>
              {session.identification.description}
            </p>
          </motion.div>
        )}

      </main>

      {/* Bottom */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={handleConfirm}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
            whileTap={{ scale: 0.97 }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            {edited ? "Search with my correction" : "Yes, that's right"}
          </motion.button>
          <motion.button onClick={handleBack}
            className="w-full flex items-center justify-center"
            style={{ padding: "13px", fontSize: 12, color: "rgba(106,85,40,0.4)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.3px" }}
            whileTap={{ scale: 0.97 }}>
            Go back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
