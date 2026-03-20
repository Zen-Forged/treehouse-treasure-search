"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { useScanSession } from "@/hooks/useScanSession";

export default function ScanPage() {
  const router = useRouter();
  const { setSessionData } = useScanSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleContinue = () => {
    if (!preview) return;
    setSessionData({ imageDataUrl: preview, enteredCost: 0 });
    router.push("/decide");
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Scan Item" showBack backHref="/" />

      <main className="flex-1 flex flex-col px-5 py-6 space-y-6">
        <div className="animate-fade-up">
          <h2 className="font-display text-xl text-bark-100 font-semibold">
            Capture the item
          </h2>
          <p className="text-bark-500 text-sm mt-1">
            Take a photo or upload from your library
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Preview or Upload Zone */}
        <div className="animate-fade-up-delay-1 flex-1 flex flex-col">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-forest-900 border border-forest-700/60">
              <img
                src={preview}
                alt="Selected item"
                className="w-full object-cover"
                style={{ maxHeight: "55vh" }}
              />
              <button
                onClick={clearPreview}
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-forest-950/80 border border-forest-700 text-bark-300 hover:text-bark-100 transition-colors"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-forest-950/80 border border-forest-700/60 text-forest-400 text-xs font-medium">
                ✓ Image ready
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex-1 min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${
                dragging
                  ? "border-forest-400 bg-forest-900/60"
                  : "border-forest-800/60 bg-forest-900/20"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-forest-900/60 border border-forest-800 flex items-center justify-center">
                <Camera size={26} className="text-forest-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-bark-300 text-sm font-medium">No image selected</p>
                <p className="text-bark-600 text-xs">
                  Use the buttons below or drag &amp; drop
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!preview && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up-delay-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-forest-900/40 border border-forest-700/50 hover:bg-forest-900/60 hover:border-forest-600 transition-all active:scale-95"
            >
              <Camera size={24} className="text-forest-400" />
              <span className="text-bark-300 text-sm font-medium">Take Photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-forest-900/40 border border-forest-700/50 hover:bg-forest-900/60 hover:border-forest-600 transition-all active:scale-95"
            >
              <ImagePlus size={24} className="text-forest-400" />
              <span className="text-bark-300 text-sm font-medium">From Library</span>
            </button>
          </div>
        )}

        {/* Continue */}
        <div className="animate-fade-up-delay-3 space-y-3 safe-bottom">
          <PrimaryButton
            fullWidth
            size="lg"
            disabled={!preview}
            onClick={handleContinue}
          >
            Continue
          </PrimaryButton>
          {preview && (
            <SecondaryButton fullWidth onClick={() => fileInputRef.current?.click()}>
              Change Photo
            </SecondaryButton>
          )}
        </div>
      </main>
    </div>
  );
}
