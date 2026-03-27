"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useFindDraft } from "@/hooks/useFindDraft";

export default function CapturePage() {
  const router = useRouter();
  const { setDraft } = useFindDraft();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const imageOriginal = e.target?.result as string;
      setDraft({ imageOriginal });
      router.push("/enhance");
    };
    reader.readAsDataURL(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

      <header className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>Capture</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full flex flex-col gap-3">

          <motion.button
            onClick={() => cameraRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 font-semibold text-[#f5f0e8] relative overflow-hidden"
            style={{
              padding: "20px 22px", borderRadius: 18, fontSize: 16,
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.16)",
              boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            }}
            whileTap={{ scale: 0.97 }}>
            <Camera size={18} strokeWidth={1.5} />
            Take a photo
          </motion.button>

          <motion.button
            onClick={() => galleryRef.current?.click()}
            className="w-full flex items-center justify-center gap-3"
            style={{
              padding: "16px 22px", borderRadius: 14, fontSize: 14,
              background: "rgba(13,31,13,0.5)", color: "#d4c9b0",
              border: "1px solid rgba(109,188,109,0.1)",
            }}
            whileTap={{ scale: 0.97 }}>
            <ImagePlus size={16} strokeWidth={1.5} />
            Choose from gallery
          </motion.button>

        </motion.div>
      </main>
    </div>
  );
}