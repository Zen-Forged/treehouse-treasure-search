// app/scan/page.tsx
// The reseller intelligence scan tool — photo → identify → comps → decide.
// Accessible from the feed header. Not part of MVP front door.
"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowLeft } from "lucide-react";
import { useFindSession } from "@/hooks/useSession";

export default function ScanPage() {
  const router = useRouter();
  const { startSession } = useFindSession();
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const imageOriginal = e.target?.result as string;
      startSession(imageOriginal);
      router.push("/discover");
    };
    reader.readAsDataURL(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="relative flex flex-col min-h-screen max-w-[430px] mx-auto overflow-hidden bg-[#050f05]">

      <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={galleryInputRef} type="file" accept="image/*"                        className="hidden" onChange={onChange} />

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, rgba(200,180,126,0.07) 0%, rgba(180,160,100,0.025) 22%, transparent 48%, rgba(15,40,15,0.05) 74%, rgba(8,22,8,0.1) 100%)" }} />
        <div className="absolute" style={{ top: -100, left: -60, width: 380, height: 650, transform: "rotate(16deg)", transformOrigin: "top left", background: "linear-gradient(90deg, transparent 0%, rgba(200,180,126,0.02) 35%, rgba(200,180,126,0.042) 50%, rgba(200,180,126,0.02) 65%, transparent 100%)", filter: "blur(32px)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 68px, rgba(200,180,126,0.006) 68px, rgba(200,180,126,0.006) 69px)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 500, background: "linear-gradient(to top, rgba(5,15,5,1) 0%, rgba(5,15,5,0.9) 40%, transparent 100%)" }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6" style={{ paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))" }}>

        {/* Back to feed */}
        <div style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))", marginBottom: 8 }}>
          <button
            onClick={() => router.push("/")}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
          >
            <ArrowLeft size={14} style={{ color: "#4a3a1e" }} />
            <span style={{ fontSize: 12, color: "#4a3a1e" }}>Back to feed</span>
          </button>
        </div>

        {/* Logo */}
        <motion.div className="flex items-center gap-2.5 pt-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.05 }}>
          <Image src="/logo.png" alt="Treehouse" width={26} height={26}
            style={{ filter: "drop-shadow(0 0 8px rgba(200,180,126,0.38))" }} />
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.3px", lineHeight: 1 }}>
              Treehouse
            </span>
            <span style={{ fontSize: 8, color: "#a8904e", textTransform: "uppercase", letterSpacing: "3px", lineHeight: 1 }}>
              Embrace the search
            </span>
          </div>
        </motion.div>

        <div className="flex-1 min-h-[48px] max-h-[100px]" />

        {/* Hero copy */}
        <motion.div className="pb-7"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 38, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            <span style={{ display: "block", marginBottom: 10 }}>That looks interesting.</span>
            <span style={{ display: "block", fontStyle: "italic", color: "#c8b47e", fontWeight: 600, fontSize: 32 }}>
              Let's see what<br />you've found.
            </span>
          </h1>
          <div style={{ width: 32, height: 1, background: "linear-gradient(90deg, rgba(200,180,126,0.55), rgba(200,180,126,0.1), transparent)", margin: "20px 0 14px" }} />
          <p style={{ fontSize: 14, color: "#6a5528", lineHeight: 1.72, maxWidth: 290, fontWeight: 300 }}>
            Snap a photo and we'll help you understand<br />what you're looking at.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.34 }}>

          <motion.button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{
              padding: "18px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.3px",
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(40,96,40,0.98) 45%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.16)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 5px 28px rgba(5,15,5,0.6)",
            }}
            whileTap={{ scale: 0.97 }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
            <Search size={16} strokeWidth={1.6} style={{ opacity: 0.85, flexShrink: 0 }} />
            Let's take a look
          </motion.button>

          <motion.button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center justify-center"
            style={{ padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 400, background: "transparent", color: "rgba(168,144,78,0.45)", border: "none" }}
            whileTap={{ scale: 0.97 }}>
            Choose a photo
          </motion.button>

          <motion.button
            onClick={() => router.push("/finds")}
            className="w-full flex items-center justify-center"
            style={{ padding: "10px", fontSize: 12, fontWeight: 400, background: "transparent", color: "rgba(106,85,40,0.32)", border: "none" }}
            whileTap={{ scale: 0.97 }}>
            Your finds
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
