"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Download, Check } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";
import { useFinds } from "@/hooks/useFinds";
import { FindRecord } from "@/types/find";

export default function SharePage() {
  const router   = useRouter();
  const { draft, clearDraft } = useFindDraft();
  const { saveFind } = useFinds();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (!draft.imageOriginal) router.replace("/capture");
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft.caption ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const src = draft.imageEnhanced ?? draft.imageOriginal;
    if (!src) return;
    const a   = document.createElement("a");
    a.href    = src;
    a.download = `treehouse-find-${Date.now()}.jpg`;
    a.click();
  };

  const handleSave = () => {
    const record: FindRecord = {
      id:            `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt:     new Date().toISOString(),
      imageOriginal: draft.imageOriginal!,
      imageEnhanced: draft.imageEnhanced,
      caption:       draft.caption,
      pricePaid:     draft.pricePaid,
      shared:        false,
    };
    saveFind(record);
    setSaved(true);
    clearDraft();
    setTimeout(() => router.push("/finds"), 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <header className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>Share</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-5">

        {/* Preview */}
        <motion.div className="w-full rounded-2xl overflow-hidden" style={{ height: 200 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img src={draft.imageEnhanced ?? draft.imageOriginal} alt="Find"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.88) saturate(0.82)" }} />
        </motion.div>

        {/* Caption preview */}
        {draft.caption && (
          <motion.div className="px-4 py-4 rounded-2xl"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.07)" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#a8904e", lineHeight: 1.65, fontStyle: "italic" }}>
              "{draft.caption}"
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="flex gap-3"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <motion.button onClick={handleCopy} whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: "14px", borderRadius: 14, fontSize: 13, fontWeight: 500,
              background: "rgba(13,31,13,0.5)", color: copied ? "#6dbc6d" : "#d4c9b0",
              border: `1px solid ${copied ? "rgba(109,188,109,0.3)" : "rgba(109,188,109,0.1)"}`,
              transition: "all 0.2s",
            }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy caption"}
          </motion.button>

          <motion.button onClick={handleDownload} whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-2"
            style={{
              padding: "14px", borderRadius: 14, fontSize: 13, fontWeight: 500,
              background: "rgba(13,31,13,0.5)", color: "#d4c9b0",
              border: "1px solid rgba(109,188,109,0.1)",
            }}>
            <Download size={14} />
            Download
          </motion.button>
        </motion.div>

        <div className="flex-1" />

        {/* Save */}
        <motion.button onClick={handleSave} disabled={saved}
          className="w-full flex items-center justify-center gap-2 font-semibold text-[#f5f0e8] disabled:opacity-60"
          style={{
            padding: "17px 22px", borderRadius: 16, fontSize: 15,
            background: saved
              ? "rgba(109,188,109,0.2)"
              : "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border: "1px solid rgba(109,188,109,0.16)",
            boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            transition: "all 0.3s",
          }}
          whileTap={{ scale: 0.97 }}>
          {saved ? "Saved to My Finds" : "Save to My Finds"}
        </motion.button>

      </main>
    </div>
  );
}