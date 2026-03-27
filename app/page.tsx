// app/page.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useFindSession } from "@/hooks/useSession";

export default function HomePage() {
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
  };

  return (
    <div className="relative flex flex-col min-h-screen max-w-[430px] mx-auto overflow-hidden bg-[#050f05]">

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

      {/* Environment */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, rgba(200,180,126,0.07) 0%, rgba(180,160,100,0.025) 22%, transparent 48%, rgba(15,40,15,0.05) 74%, rgba(8,22,8,0.1) 100%)" }} />
        <div className="absolute" style={{ top: -100, left: -60, width: 380, height: 650, transform: "rotate(16deg)", transformOrigin: "top left", background: "linear-gradient(90deg, transparent 0%, rgba(200,180,126,0.02) 35%, rgba(200,180,126,0.042) 50%, rgba(200,180,126,0.02) 65%, transparent 100%)", filter: "blur(32px)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 68px, rgba(200,180,126,0.006) 68px, rgba(200,180,126,0.006) 69px)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 8% 0%, rgba(2,6,2,0.62) 0%, transparent 42%), radial-gradient(ellipse at 92% 0%, rgba(2,6,2,0.5) 0%, transparent 38%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 500, background: "linear-gradient(to top, rgba(5,15,5,1) 0%, rgba(5,15,5,0.98) 16%, rgba(5,15,5,0.9) 40%, rgba(5,15,5,0.52) 65%, transparent 100%)" }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6" style={{ paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))" }}>

        <motion.div className="flex items-center gap-2.5 pt-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.05 }}>
          <Image src="/logo.png" alt="Treehouse Search" width={26} height={26} style={{ filter: "drop-shadow(0 0 8px rgba(200,180,126,0.38))" }} />
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.3px", lineHeight: 1 }}>Treehouse Search</span>
            <span style={{ fontSize: 8, color: "#a8904e", textTransform: "uppercase", letterSpacing: "3px", lineHeight: 1 }}>Embrace the search</span>
          </div>
        </motion.div>

        <div className="flex-1 min-h-[56px] max-h-[110px]" />

        <motion.div className="pb-7" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            <span style={{ display: "block", marginBottom: 10 }}>That looks interesting.</span>
            <span style={{ display: "block", fontStyle: "italic", color: "#c8b47e", fontWeight: 600, fontSize: 34 }}>Let's see what<br />you've found.</span>
          </h1>
          <div style={{ width: 32, height: 1, background: "linear-gradient(90deg, rgba(200,180,126,0.55), rgba(200,180,126,0.1), transparent)", margin: "22px 0 15px" }} />
          <p style={{ fontSize: 14, color: "#6a5528", lineHeight: 1.72, maxWidth: 290, fontWeight: 300, letterSpacing: "0.05px" }}>
            Snap a photo and we'll help you understand<br />what you're looking at.
          </p>
        </motion.div>

        <motion.div className="flex flex-col gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.34 }}>

          <motion.button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{ padding: "18px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.3px", background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(40,96,40,0.98) 45%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", borderBottom: "1px solid rgba(15,45,15,0.7)", boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(5,15,5,0.5) inset, 0 5px 28px rgba(5,15,5,0.6), 0 0 48px rgba(45,125,45,0.1)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
            <Search size={16} strokeWidth={1.6} style={{ opacity: 0.85, flexShrink: 0 }} />
            Let's take a look
          </motion.button>

          <motion.button onClick={() => galleryInputRef.current?.click()} className="w-full flex items-center justify-center"
            style={{ padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 400, background: "transparent", color: "rgba(168,144,78,0.45)", border: "none" }}
            whileTap={{ scale: 0.97 }}>
            Choose a photo
          </motion.button>

          <motion.button onClick={() => router.push("/finds")} className="w-full flex items-center justify-center"
            style={{ padding: "10px", fontSize: 12, fontWeight: 400, background: "transparent", color: "rgba(106,85,40,0.32)", border: "none" }}
            whileTap={{ scale: 0.97 }}>
            Your finds
          </motion.button>

          <div className="flex items-center justify-center gap-3 mt-3 pt-4" style={{ borderTop: "1px solid rgba(200,180,126,0.04)" }}>
            {["Discovery", "Context", "Confidence"].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                <span style={{ fontSize: 8, color: "rgba(46,36,16,0.55)", textTransform: "uppercase", letterSpacing: "3px" }}>{word}</span>
                {i < 2 && <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(46,36,16,0.28)", display: "inline-block" }} />}
              </span>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
