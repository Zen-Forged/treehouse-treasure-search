// app/intent/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";
import { IntentChip } from "@/types/find";

const CHIPS: { id: IntentChip; label: string }[] = [
  { id: "curious",  label: "Curious about it"   },
  { id: "selling",  label: "Thinking of selling" },
  { id: "sharing",  label: "Just sharing"        },
  { id: "offers",   label: "Open to offers"      },
];

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function IntentPage() {
  const router = useRouter();
  const { draft, setDraft } = useFindDraft();

  const [text, setText]           = useState(draft.intentText ?? "");
  const [selected, setSelected]   = useState<IntentChip[]>(draft.intentChips ?? []);

  useEffect(() => {
    if (!draft.imageOriginal) router.replace("/");
  }, []);

  const toggleChip = (chip: IntentChip) => {
    setSelected(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleContinue = () => {
    setDraft({ intentText: text, intentChips: selected });
    router.push("/enhance-text");
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
          Your thoughts
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-6 pb-36 overflow-y-auto">

        {/* Thumbnail */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden flex-shrink-0"
          style={{ height: 160, border: "1px solid rgba(109,188,109,0.08)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={draft.imageEnhanced ?? draft.imageOriginal}
            alt="Your find"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(0.78)" }}
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: 26, fontWeight: 700,
            color: "#f5f0e8", lineHeight: 1.25,
            marginBottom: 6,
          }}>
            What caught your eye?
          </h1>
          <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.6, fontWeight: 300 }}>
            Say as much or as little as you like.
          </p>
        </motion.div>

        {/* Chips */}
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease }}
        >
          {CHIPS.map(chip => {
            const active = selected.includes(chip.id);
            return (
              <motion.button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  letterSpacing: "0.2px",
                  background: active ? "rgba(168,144,78,0.12)" : "rgba(13,31,13,0.5)",
                  color: active ? "#c8b47e" : "rgba(212,201,176,0.45)",
                  border: active
                    ? "1px solid rgba(200,180,126,0.3)"
                    : "1px solid rgba(109,188,109,0.08)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {chip.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Textarea */}
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease }}
        >
          <div style={{
            fontSize: 9, color: "#7a6535",
            textTransform: "uppercase", letterSpacing: "2.5px",
          }}>
            In your own words
            <span style={{ color: "#3d3018", marginLeft: 6 }}>optional</span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Found this today. Not sure what it is yet, but something about it stood out…"
            className="w-full resize-none focus:outline-none"
            style={{
              background: "rgba(13,31,13,0.5)",
              border: "1px solid rgba(109,188,109,0.12)",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 15,
              fontFamily: "Georgia, serif",
              color: "#d4c9b0",
              lineHeight: 1.65,
            }}
          />
          <div style={{ fontSize: 11, color: "#2e2410", textAlign: "right" }}>
            {text.length > 0 ? `${text.length} characters` : ""}
          </div>
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
        transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <motion.button
          onClick={handleContinue}
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
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
