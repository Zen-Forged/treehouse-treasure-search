"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useScanSession } from "@/hooks/useScanSession";

export default function HomePage() {
  const router = useRouter();
  const { setSessionData } = useScanSession();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSessionData({ imageDataUrl, enteredCost: 0 });
      router.push("/decide");
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

      {/* Environment */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, rgba(200,180,126,0.055) 0%, rgba(180,160,100,0.02) 30%, transparent 55%, rgba(20,55,20,0.04) 80%, rgba(10,30,10,0.08) 100%)" }} />
        <div className="absolute" style={{ top: -80, left: -40, width: 320, height: 600, transform: "rotate(18deg)", transformOrigin: "top left", background: "linear-gradient(90deg, transparent 0%, rgba(200,180,126,0.03) 30%, rgba(200,180,126,0.05) 50%, rgba(200,180,126,0.03) 70%, transparent 100%)", filter: "blur(28px)" }} />
        <div className="absolute" style={{ top: 0, left: -60, bottom: 0, width: 260, background: "radial-gradient(ellipse at left center, rgba(30,80,30,0.07) 0%, transparent 65%)" }} />
        <div className="absolute" style={{ top: 60, right: -60, width: 220, height: 320, background: "radial-gradient(ellipse, rgba(20,60,20,0.04) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(180deg, transparent 0px, transparent 78px, rgba(200,180,126,0.008) 78px, rgba(200,180,126,0.008) 79px)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 0%, rgba(3,8,3,0.55) 0%, transparent 45%), radial-gradient(ellipse at 90% 0%, rgba(3,8,3,0.45) 0%, transparent 40%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 460, background: "linear-gradient(to top, rgba(5,15,5,1) 0%, rgba(5,15,5,0.98) 20%, rgba(5,15,5,0.88) 45%, rgba(5,15,5,0.5) 70%, transparent 100%)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6" style={{ paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))" }}>

        {/* Wordmark */}
        <motion.div
          className="flex items-center gap-2.5 pt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
        >
          <Image src="/logo.png" alt="Treehouse Search" width={26} height={26} style={{ filter: "drop-shadow(0 0 7px rgba(200,180,126,0.32))" }} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[#f5f0e8] leading-none tracking-[0.3px]" style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600 }}>Treehouse Search</span>
            <span className="leading-none" style={{ fontSize: 8, color: "#7a6535", textTransform: "uppercase", letterSpacing: "3px" }}>Embrace the search</span>
          </div>
        </motion.div>

        <div className="flex-1 min-h-[56px] max-h-[110px]" />

        {/* Narrative */}
        <motion.div
          className="pb-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            <span className="block" style={{ marginBottom: 10 }}>You noticed it.</span>
            <span className="block" style={{ fontStyle: "italic", color: "#c8b47e", fontWeight: 600, fontSize: 38 }}>Let's see what<br />it's worth.</span>
          </h1>
          <div style={{ width: 26, height: 1, background: "linear-gradient(90deg, rgba(168,144,78,0.5), transparent)", margin: "20px 0 14px" }} />
          <p style={{ fontSize: 14, color: "#6a5528", lineHeight: 1.68, maxWidth: 280, fontWeight: 300, letterSpacing: "0.05px" }}>
            Some things catch your eye for a reason.<br />
            Take a closer look before you decide what it's worth.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col gap-2.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: "easeOut" }}
        >
          {/* Primary */}
          <motion.button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{
              padding: "17px 22px", borderRadius: 16, fontSize: 16, letterSpacing: "0.2px",
              background: "linear-gradient(175deg, rgba(44,106,44,0.97) 0%, rgba(38,92,38,0.99) 50%, rgba(32,80,32,1) 100%)",
              border: "1px solid rgba(109,188,109,0.18)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 -1px 0 rgba(5,15,5,0.4) inset, 0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.12)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <span style={{ position: "absolute", top: 0, left: "6%", right: "6%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" }} />
            📷&nbsp;&nbsp;Take a closer look
          </motion.button>

          <div style={{ textAlign: "center", fontSize: 10, color: "rgba(106,85,40,0.45)", letterSpacing: "0.5px", marginTop: -4 }}>
            Use your camera to begin
          </div>

          {/* Secondary */}
          <div className="flex gap-2 mt-1">
            {[
              { label: "Choose a photo", action: () => galleryInputRef.current?.click() },
              { label: "Your finds", action: () => router.push("/saved") },
            ].map(({ label, action }) => (
              <motion.button
                key={label}
                onClick={action}
                className="flex-1 flex items-center justify-center"
                style={{
                  padding: "12px 8px", borderRadius: 12, fontSize: 12, fontWeight: 400,
                  letterSpacing: "0.2px", background: "rgba(8,20,8,0.45)",
                  color: "rgba(196,185,155,0.42)", border: "1px solid rgba(109,188,109,0.07)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Values */}
          <div className="flex items-center justify-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(200,180,126,0.045)" }}>
            {["Discovery", "Context", "Confidence"].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                <span style={{ fontSize: 8, color: "rgba(46,36,16,0.65)", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 400 }}>{word}</span>
                {i < 2 && <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(46,36,16,0.35)", display: "inline-block" }} />}
              </span>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}