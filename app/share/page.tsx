// app/share/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Download, Check } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";
import { useFinds } from "@/hooks/useFinds";
import { FindRecord } from "@/types/find";

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function SharePage() {
  const router = useRouter();
  const { draft, clearDraft } = useFindDraft();
  const { saveFind } = useFinds();

  const [copied, setCopied]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [posted, setPosted]   = useState(false);

  useEffect(() => {
    if (!draft.imageOriginal) router.replace("/");
  }, []);

  const caption = draft.captionRefined ?? draft.intentText ?? draft.caption ?? "";
  const image   = draft.imageEnhanced ?? draft.imageOriginal;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    if (!image) return;
    const a    = document.createElement("a");
    a.href     = image;
    a.download = `treehouse-find-${Date.now()}.jpg`;
    a.click();
  };

  const handleFacebook = () => {
    // Mock handler — real implementation would use FB share API
    setPosted(true);
    setTimeout(() => setPosted(false), 2200);
  };

  const handleSave = () => {
    const record: FindRecord = {
      id:             `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt:      new Date().toISOString(),
      imageOriginal:  draft.imageOriginal!,
      imageEnhanced:  draft.imageEnhanced,
      caption:        draft.intentText,
      captionRefined: draft.captionRefined,
      intentText:     draft.intentText,
      intentChips:    draft.intentChips,
      pricePaid:      draft.pricePaid,
      shared:         true,
      analysis: {
        titleGuess:  draft.titleGuess,
        description: draft.description,
      },
    };
    saveFind(record);
    setSaved(true);
    clearDraft();
    setTimeout(() => router.push("/finds"), 1200);
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
          Ready to share?
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-5 pb-40 overflow-y-auto">

        {/* Image preview */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden flex-shrink-0"
          style={{ height: 220, border: "1px solid rgba(109,188,109,0.08)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          {image && (
            <img src={image} alt="Your find"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.9) saturate(0.85)" }} />
          )}
        </motion.div>

        {/* Title */}
        {draft.titleGuess && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease }}
          >
            <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>
              Identified as
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: "#f5f0e8" }}>
              {draft.titleGuess}
            </div>
          </motion.div>
        )}

        {/* Caption */}
        {caption && (
          <motion.div
            className="px-4 py-4 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease }}
          >
            <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
              "{caption}"
            </p>
          </motion.div>
        )}

        {/* Share actions */}
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 2 }}>
            Share
          </div>

          {/* Facebook */}
          <motion.button
            onClick={handleFacebook}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: "14px 18px", borderRadius: 14, fontSize: 13, fontWeight: 500,
              background: posted ? "rgba(45,125,45,0.12)" : "rgba(13,31,13,0.5)",
              color: posted ? "#6dbc6d" : "#d4c9b0",
              border: posted ? "1px solid rgba(109,188,109,0.25)" : "1px solid rgba(109,188,109,0.1)",
              transition: "all 0.2s",
              cursor: "pointer", fontFamily: "inherit",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {posted ? <Check size={14} /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            {posted ? "Posted" : "Post to Facebook"}
          </motion.button>

          {/* Copy + Download row */}
          <div className="flex gap-2">
            <motion.button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2"
              style={{
                padding: "13px 8px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: "rgba(13,31,13,0.5)",
                color: copied ? "#6dbc6d" : "#d4c9b0",
                border: copied ? "1px solid rgba(109,188,109,0.3)" : "1px solid rgba(109,188,109,0.1)",
                transition: "all 0.2s", cursor: "pointer", fontFamily: "inherit",
              }}
              whileTap={{ scale: 0.97 }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy caption"}
            </motion.button>

            <motion.button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2"
              style={{
                padding: "13px 8px", borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: "rgba(13,31,13,0.5)", color: "#d4c9b0",
                border: "1px solid rgba(109,188,109,0.1)",
                cursor: "pointer", fontFamily: "inherit",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Download size={13} />
              Download
            </motion.button>
          </div>
        </motion.div>

      </main>

      {/* Bottom — save */}
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
          onClick={handleSave}
          disabled={saved}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-60"
          style={{
            padding: "17px 22px", borderRadius: 16, fontSize: 15,
            background: saved
              ? "rgba(109,188,109,0.18)"
              : "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border: "1px solid rgba(109,188,109,0.16)",
            boxShadow: saved ? "none" : "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            transition: "all 0.3s",
            cursor: saved ? "default" : "pointer",
          }}
          whileTap={saved ? {} : { scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          {saved ? "Saved to My Finds" : "Save to My Finds"}
        </motion.button>
      </motion.div>
    </div>
  );
}
