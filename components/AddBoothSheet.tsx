// components/AddBoothSheet.tsx
// Bottom sheet for creating a new booth on /shelves (admin-only).
// "Add a booth" tile at the end of the grid opens this sheet.
//
// Mirrors EditBoothSheet's shell (backdrop + grabber + motion-y entry +
// body-overflow lock). Field shape from BoothFormFields + optional hero
// photo. Submit reuses createVendor + /api/vendor-hero (same path
// AddBoothInline already exercises). See docs/booth-management-design.md
// (D6, D7).

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader as LoaderIcon, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { createVendor, slugify } from "@/lib/posts";
import { compressImage } from "@/lib/imageUpload";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import BoothFormFields from "@/components/BoothFormFields";
import type { Vendor, Mall } from "@/types/treehouse";

interface AddBoothSheetProps {
  malls:           Mall[];
  /** When set, the form pre-selects this mall on open. */
  initialMallId?:  string | null;
  onClose:         () => void;
  onCreated:       (vendor: Vendor, note?: string) => void;
}

export default function AddBoothSheet({
  malls,
  initialMallId,
  onClose,
  onCreated,
}: AddBoothSheetProps) {
  // Pre-select the active mall filter (savedMallId) when present;
  // fall back to the first available mall so the form is never empty.
  const defaultMall =
    (initialMallId && malls.some(m => m.id === initialMallId)) ? initialMallId
    : (malls[0]?.id ?? "");

  const [mallId,      setMallId]      = useState(defaultMall);
  const [boothNumber, setBoothNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [heroFile,    setHeroFile]    = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const heroInputRef = useRef<HTMLInputElement | null>(null);

  // Lock body overflow + clean up object URL on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    return () => {
      if (heroPreview) URL.revokeObjectURL(heroPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroPreview]);

  function handleHeroFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Hero photo must be an image.");
      return;
    }
    if (file.size > 12_000_000) {
      setError("Hero photo too large. Please choose one under 12MB.");
      return;
    }
    setError(null);
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  }

  function clearHero() {
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroFile(null);
    setHeroPreview(null);
  }

  async function uploadHero(vendorId: string, file: File): Promise<{ ok: boolean; error?: string }> {
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      const res = await authFetch("/api/vendor-hero", {
        method: "POST",
        body: JSON.stringify({ base64DataUrl: compressed, vendorId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return { ok: false, error: json.error ?? `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const trimmedName = displayName.trim();
  const canAdd = !submitting && trimmedName.length > 0 && mallId.length > 0;

  async function handleAdd() {
    if (!canAdd) return;
    setSubmitting(true);
    setError(null);

    const slug = slugify(trimmedName);
    const { data: vendor, error: createErr } = await createVendor({
      mall_id:      mallId,
      display_name: trimmedName,
      booth_number: boothNumber.trim() || undefined,
      slug,
    });

    if (createErr || !vendor) {
      setError(createErr ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    let heroNote: string | undefined;
    if (heroFile) {
      const heroResult = await uploadHero(vendor.id, heroFile);
      if (!heroResult.ok) {
        heroNote = `Booth saved, but hero photo upload failed: ${heroResult.error}. You can add one later from My Booth.`;
      }
    }

    onCreated(vendor, heroNote);
  }

  const sheetBg = v1.paperCream;
  const borderC = v1.inkHairline;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={submitting ? undefined : onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(20,14,6,0.52)", zIndex: 200,
          cursor: submitting ? "default" : "pointer",
        }}
      />
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: "100%", maxWidth: 430,
            background: sheetBg,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "20px 22px calc(24px + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -10px 40px rgba(20,14,6,0.25)",
            pointerEvents: "auto",
            maxHeight: "85vh", overflowY: "auto",
          }}
        >
          <div style={{ width: 44, height: 4, borderRadius: 4, background: "rgba(42,26,10,0.22)", margin: "0 auto 18px" }} />

          {/* Head */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(42,26,10,0.04)",
                border: `1px solid ${borderC}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Plus size={14} style={{ color: v1.green }} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_LORA, fontSize: 16, color: v1.inkPrimary, lineHeight: 1.3 }}>
                Add a booth
              </div>
              <div
                style={{
                  fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 11,
                  color: v1.inkMuted, lineHeight: 1.4, marginTop: 1,
                }}
              >
                Pre-seed for later vendor claim
              </div>
            </div>
            <button
              onClick={submitting ? undefined : onClose}
              aria-label="Close"
              disabled={submitting}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(42,26,10,0.04)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: submitting ? "default" : "pointer", flexShrink: 0,
              }}
            >
              <X size={14} style={{ color: v1.inkMuted }} />
            </button>
          </div>

          {/* Form */}
          <BoothFormFields
            malls={malls}
            mallId={mallId} setMallId={setMallId}
            boothNumber={boothNumber} setBoothNumber={setBoothNumber}
            displayName={displayName} setDisplayName={setDisplayName}
            disabled={submitting}
          />

          {/* Hero photo (Add only — see D5/D7) */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 12,
                color: v1.inkMuted, lineHeight: 1.3, marginBottom: 6,
              }}
            >
              Hero photo <span style={{ fontStyle: "italic", color: v1.inkFaint, marginLeft: 3 }}>(optional)</span>
            </label>

            {heroPreview ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${borderC}`,
                  background: v1.paperCream,
                }}
              >
                <img
                  src={heroPreview}
                  alt="Hero preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <button
                  onClick={clearHero}
                  aria-label="Remove hero photo"
                  disabled={submitting}
                  style={{
                    position: "absolute", top: 8, right: 8,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(20,18,12,0.62)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: submitting ? "default" : "pointer",
                  }}
                >
                  <X size={13} style={{ color: "rgba(255,255,255,0.95)" }} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => heroInputRef.current?.click()}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "22px 14px",
                  borderRadius: 10,
                  background: "rgba(42,26,10,0.02)",
                  border: `1px dashed ${borderC}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8,
                  cursor: submitting ? "default" : "pointer",
                  fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 13,
                  color: v1.inkMuted,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <ImageIcon size={14} style={{ color: v1.inkMuted }} />
                Choose a photo
              </button>
            )}

            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeroFileChange}
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 9,
                background: v1.redBg,
                border: `1px solid ${v1.redBorder}`,
                fontFamily: FONT_SYS,
                fontSize: 12,
                color: v1.red,
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: v1.red }} />
              <span>{error}</span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              fontFamily: FONT_SYS,
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              background: canAdd ? v1.green : "rgba(30,77,43,0.30)",
              border: "none",
              cursor: canAdd ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7,
              boxShadow: canAdd ? "0 2px 10px rgba(30,77,43,0.18)" : "none",
            }}
          >
            {submitting
              ? <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> {heroFile ? "Adding + uploading photo…" : "Adding…"}</>
              : "Add booth"}
          </button>
          <button
            onClick={submitting ? undefined : onClose}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 12,
              color: v1.inkMuted,
              background: "transparent",
              border: "none",
              marginTop: 6,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            Cancel
          </button>
        </motion.div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}
