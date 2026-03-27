"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useScanSession } from "@/hooks/useScanSession";
import { useFindDraft } from "@/hooks/useFindDraft";

export default function HomePage() {
  const router = useRouter();
  const { setSessionData } = useScanSession();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { setDraft } = useFindDraft();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setDraft({ imageOriginal: imageDataUrl });
      router.push("/enhance");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="relative flex flex-col min-h-screen max-w-[430px] mx-auto overflow-hidden bg-[#050f05]">

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

      {/* ── ENVIRONMENT — edge to edge, no containers ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* directional gold light top-left → deep green bottom-right */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(200,180,126,0.07) 0%, rgba(180,160,100,0.025) 25%, transparent 50%, rgba(15,45,15,0.05) 75%, rgba(8,24,8,0.1) 100%)"
        }} />
        {/* angled light beam — single storytelling element */}
        <div className="absolute" style={{
          top: -100, left: -60, width: 380, height: 650,
          transform: "rotate(16deg)", transformOrigin: "top left",
          background: "linear-gradient(90deg, transparent 0%, rgba(200,180,126,0.025) 35%, rgba(200,180,126,0.045) 50%, rgba(200,180,126,0.025) 65%, transparent 100%)",
          filter: "blur(32px)",
        }} />
        {/* subtle wood-grain horizontal texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 64px, rgba(200,180,126,0.007) 64px, rgba(200,180,126,0.007) 65px, transparent 65px, transparent 128px)",
        }} />
        {/* soft vertical leaf-shadow bands */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(98deg, transparent 0px, transparent 90px, rgba(10,30,10,0.025) 90px, rgba(10,30,10,0.025) 92px)",
        }} />
        {/* corner vignettes — pull eye inward */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 8% 0%, rgba(2,6,2,0.6) 0%, transparent 42%), radial-gradient(ellipse at 92% 0%, rgba(2,6,2,0.5) 0%, transparent 38%), radial-gradient(ellipse at 50% 105%, rgba(2,6,2,0.3) 0%, transparent 50%)"
        }} />
        {/* floor — strong base for action area */}
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: 480,
          background: "linear-gradient(to top, rgba(5,15,5,1) 0%, rgba(5,15,5,0.98) 18%, rgba(5,15,5,0.9) 42%, rgba(5,15,5,0.55) 65%, transparent 100%)"
        }} />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex flex-col flex-1 px-6" style={{ paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))" }}>

        {/* Wordmark */}
        <motion.div
          className="flex items-center gap-2.5 pt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.05, ease: "easeOut" }}
        >
          <Image
            src="/logo.png"
            alt="Treehouse Search"
            width={26}
            height={26}
            style={{ filter: "drop-shadow(0 0 8px rgba(200,180,126,0.38))" }}
          />
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.3px", lineHeight: 1 }}>
              Treehouse Search
            </span>
            <span style={{ fontSize: 8, color: "#a8904e", textTransform: "uppercase", letterSpacing: "3px", lineHeight: 1 }}>
              Embrace the search
            </span>
          </div>
        </motion.div>

        <div className="flex-1 min-h-[56px] max-h-[110px]" />

        {/* Headline */}
        <motion.div
          className="pb-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            <span style={{ display: "block", marginBottom: 10 }}>You noticed it.</span>
            <span style={{ display: "block", fontStyle: "italic", color: "#c8b47e", fontWeight: 600, fontSize: 38 }}>
              Let's see what<br />it's worth.
            </span>
          </h1>

          {/* gold rule — slightly more prominent */}
          <div style={{ width: 32, height: 1, background: "linear-gradient(90deg, rgba(200,180,126,0.6), rgba(200,180,126,0.1), transparent)", margin: "22px 0 15px" }} />

          <p style={{ fontSize: 14, color: "#6a5528", lineHeight: 1.7, maxWidth: 285, fontWeight: 300, letterSpacing: "0.05px" }}>
            Some things catch your eye for a reason.<br />
            Take a closer look before you decide what it's worth.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-2.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.34, ease: "easeOut" }}
        >
          {/* Primary CTA — material surface feel */}
          <motion.button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{
              padding: "18px 22px",
              borderRadius: 16,
              fontSize: 15,
              letterSpacing: "0.3px",
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(40,96,40,0.98) 45%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.16)",
              borderBottom: "1px solid rgba(15,45,15,0.7)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(5,15,5,0.5) inset, 0 5px 28px rgba(5,15,5,0.6), 0 0 48px rgba(45,125,45,0.1), 0 0 90px rgba(45,125,45,0.05)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {/* inner top highlight */}
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
            {/* flat camera icon — SVG, no emoji */}
            <svg width="17" height="14" viewBox="0 0 17 14" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
              <path d="M6 1L5 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-3L11 1H6Z" stroke="#f5f0e8" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
              <circle cx="8.5" cy="7" r="2.4" stroke="#f5f0e8" strokeWidth="1.3" fill="none"/>
            </svg>
            Take a closer look
          </motion.button>

          {/* Secondary */}
          <div className="flex gap-2 mt-0.5">
            {[
              { label: "Choose a photo", action: () => galleryInputRef.current?.click() },
              { label: "Your finds",     action: () => router.push("/finds") },
            ].map(({ label, action }) => (
              <motion.button
                key={label}
                onClick={() => router.push("/finds")}
                className="flex-1 flex items-center justify-center"
                style={{
                  padding: "12px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: "0.2px",
                  background: "rgba(8,20,8,0.4)",
                  color: "rgba(168,144,78,0.38)",
                  border: "1px solid rgba(109,188,109,0.06)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Values strip */}
          <div className="flex items-center justify-center gap-3 mt-5 pt-4" style={{ borderTop: "1px solid rgba(200,180,126,0.04)" }}>
            {["Discovery", "Context", "Confidence"].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                <span style={{ fontSize: 8, color: "rgba(46,36,16,0.6)", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 400 }}>{word}</span>
                {i < 2 && <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(46,36,16,0.3)", display: "inline-block" }} />}
              </span>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}