// components/EditBoothSheet.tsx
// Bottom sheet for editing a booth.
//
// Mode `"admin"` (default) — full booth row edit (mall + booth_number +
// display_name). Used by /shelves admin Pencil bubble. Submits via
// PATCH /api/admin/vendors.
//
// Mode `"vendor"` (Wave 1 Task 4, session 91) — display_name only. Used by
// /my-shelf vendor self-edit Pencil. Submits via PATCH /api/vendor/profile
// which gates on requireAuth + vendor ownership check. Booth_number stays
// the dedup key + mall reassignment stays admin-only.
//
// Mirrors DeleteBoothSheet's shell pattern (backdrop + grabber + motion-y
// entry + body-overflow lock). See docs/booth-management-design.md (D1–D5).

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, X, Loader as LoaderIcon, AlertTriangle, ImagePlus, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { compressImage } from "@/lib/imageUpload";
import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import { vendorHueBg } from "@/lib/utils";
import BoothFormFields from "@/components/BoothFormFields";
import FormButton from "@/components/FormButton";
import type { Vendor, Mall } from "@/types/treehouse";

interface EditBoothSheetProps {
  vendor:    Vendor;
  /**
   * Admin mode requires malls (for the relocation select). Vendor mode
   * doesn't render the select, so the prop is optional in vendor mode.
   */
  malls?:    Mall[];
  /**
   * Wave 1 Task 4 (session 91) — `"admin"` (default) edits all 3 fields via
   * /api/admin/vendors PATCH. `"vendor"` edits display_name only via
   * /api/vendor/profile PATCH.
   */
  mode?:     "admin" | "vendor";
  onClose:   () => void;
  onUpdated: (vendor: Vendor) => void;
}

export default function EditBoothSheet({
  vendor,
  malls,
  mode = "admin",
  onClose,
  onUpdated,
}: EditBoothSheetProps) {
  // Pre-fill from vendor; capture initial values for change-detection.
  const initial = {
    mallId:      vendor.mall_id ?? "",
    boothNumber: vendor.booth_number ?? "",
    displayName: vendor.display_name ?? "",
  };

  const [mallId,      setMallId]      = useState(initial.mallId);
  const [boothNumber, setBoothNumber] = useState(initial.boothNumber);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Hero photo — sheet owns its own state. Replace + Remove fire immediately
  // (NOT batched into Save) — keeps the "photo change feels atomic" mental
  // model that the old on-photo bubbles had. onUpdated() is called for both
  // text-field saves and hero ops so the parent reconciles a single way.
  const [heroUrl,     setHeroUrl]     = useState<string | null>(
    (vendor.hero_image_url as string | null | undefined) ?? null,
  );
  const [heroBusy,    setHeroBusy]    = useState<"uploading" | "removing" | null>(null);
  const [heroError,   setHeroError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body overflow for the duration of the sheet.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const trimmedName  = displayName.trim();
  const hasChange =
    mode === "vendor"
      ? trimmedName !== initial.displayName.trim()
      : (mallId !== initial.mallId ||
         boothNumber !== initial.boothNumber ||
         trimmedName !== initial.displayName.trim());

  const canSave =
    !submitting &&
    hasChange &&
    trimmedName.length > 0 &&
    (mode === "vendor" || mallId.length > 0);

  async function handleHeroUpload(file: File) {
    if (heroBusy) return;
    if (!file.type.startsWith("image/")) {
      setHeroError("Pick an image file.");
      return;
    }
    setHeroBusy("uploading");
    setHeroError(null);
    const fallbackUrl = heroUrl;
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      // Optimistic preview — sheet shows the new photo immediately.
      setHeroUrl(compressed);
      const res  = await authFetch("/api/vendor-hero", {
        method:  "POST",
        body:    JSON.stringify({ base64DataUrl: compressed, vendorId: vendor.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setHeroError(json.error ?? "Upload failed.");
        setHeroUrl(fallbackUrl);
        return;
      }
      setHeroUrl(json.url);
      onUpdated({ ...vendor, hero_image_url: json.url } as Vendor);
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : String(err));
      setHeroUrl(fallbackUrl);
    } finally {
      setHeroBusy(null);
    }
  }

  async function handleHeroRemove() {
    if (heroBusy || !heroUrl) return;
    setHeroBusy("removing");
    setHeroError(null);
    const fallbackUrl = heroUrl;
    try {
      // Optimistic clear.
      setHeroUrl(null);
      const res  = await authFetch("/api/vendor-hero", {
        method:  "DELETE",
        body:    JSON.stringify({ vendorId: vendor.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setHeroError(json.error ?? "Remove failed.");
        setHeroUrl(fallbackUrl);
        return;
      }
      onUpdated({ ...vendor, hero_image_url: null } as Vendor);
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : String(err));
      setHeroUrl(fallbackUrl);
    } finally {
      setHeroBusy(null);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = mode === "vendor" ? "/api/vendor/profile" : "/api/admin/vendors";
      const payload  = mode === "vendor"
        ? { vendorId: vendor.id, display_name: trimmedName }
        : {
            vendorId:     vendor.id,
            display_name: trimmedName,
            booth_number: boothNumber.trim() || null,
            mall_id:      mallId,
          };
      const res = await authFetch(endpoint, {
        method: "PATCH",
        body:   JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.code === "BOOTH_CONFLICT") {
          setError(
            json.error ??
            "A booth with that number already exists at this location. Pick a different number.",
          );
        } else {
          setError(json.error ?? `HTTP ${res.status}`);
        }
        setSubmitting(false);
        return;
      }
      onUpdated(json.vendor as Vendor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const sheetBg = v2.bg.main;
  const borderC = v2.border.light;

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
          <div style={{ width: 44, height: 4, borderRadius: 4, background: v2.text.muted, margin: "0 auto 18px" }} />

          {/* Head */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: v2.surface.warm,
                border: `1px solid ${borderC}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Pencil size={14} style={{ color: v2.accent.green }} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_CORMORANT, fontSize: 16, color: v2.text.primary, lineHeight: 1.3 }}>
                {mode === "vendor" ? "Edit booth name" : "Edit booth"}
              </div>
              <div
                style={{
                  fontFamily: FONT_CORMORANT, fontStyle: "italic", fontSize: 11,
                  color: v2.text.muted, lineHeight: 1.4, marginTop: 1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {initial.displayName}{vendor.mall?.name ? ` · ${vendor.mall.name}` : ""}
              </div>
            </div>
            <button
              onClick={submitting ? undefined : onClose}
              aria-label="Close"
              disabled={submitting}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: v2.surface.warm, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: submitting ? "default" : "pointer", flexShrink: 0,
              }}
            >
              <X size={14} style={{ color: v2.text.muted }} />
            </button>
          </div>

          {/* Booth photo — replace + remove. Shipped in both vendor and admin
              modes (admin self-help and vendor self-edit converge on the same
              affordance set). Hero ops fire immediately, NOT on Save — keeps
              the change-feels-atomic mental model the on-photo bubbles had. */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontFamily: FONT_INTER,
                fontSize: 13,
                color: v2.text.secondary,
                lineHeight: 1.25,
                marginBottom: 8,
              }}
            >
              Booth photo
            </label>
            <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 84,
                  height: 84,
                  borderRadius: 8,
                  overflow: "hidden",
                  position: "relative",
                  background: heroUrl ? undefined : vendorHueBg(vendor.display_name ?? ""),
                  border: `1px solid ${v2.border.light}`,
                }}
              >
                {heroUrl && (
                  <img
                    src={heroUrl}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                {heroBusy && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(20,14,6,0.42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LoaderIcon
                      size={18}
                      style={{ color: v2.surface.card, animation: "spin 0.9s linear infinite" }}
                    />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHeroUpload(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!heroBusy || submitting}
                  style={{
                    flex: 1,
                    padding: "0 12px",
                    borderRadius: 8,
                    background: v2.surface.card,
                    border: `1px solid ${v2.border.light}`,
                    fontFamily: FONT_INTER,
                    fontSize: 13,
                    color: v2.text.primary,
                    cursor: heroBusy || submitting ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <ImagePlus size={14} strokeWidth={1.7} style={{ color: v2.text.secondary }} />
                  {heroUrl ? "Replace photo" : "Add photo"}
                </button>
                {heroUrl && (
                  <button
                    type="button"
                    onClick={handleHeroRemove}
                    disabled={!!heroBusy || submitting}
                    style={{
                      flex: 1,
                      padding: "0 12px",
                      borderRadius: 8,
                      background: "transparent",
                      border: `1px solid ${v2.border.light}`,
                      fontFamily: FONT_INTER,
                      fontSize: 13,
                      color: v2.text.muted,
                      cursor: heroBusy || submitting ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <Trash2 size={13} strokeWidth={1.7} style={{ color: v2.text.muted }} />
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            {heroError && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: v2.surface.error,
                  border: `1px solid ${v2.border.error}`,
                  fontFamily: FONT_INTER,
                  fontSize: 12,
                  color: v2.accent.red,
                  lineHeight: 1.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2, color: v2.accent.red }} />
                <span>{heroError}</span>
              </div>
            )}
          </div>

          {/* Form — vendor mode renders display_name only; admin mode renders
              the full 3-field BoothFormFields. */}
          {mode === "vendor" ? (
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT_INTER,
                  fontSize: 13,
                  color: v2.text.secondary,
                  lineHeight: 1.25,
                  marginBottom: 6,
                }}
              >
                Booth name
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. ZenForged Finds"
                disabled={submitting}
                autoFocus
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 12px",
                  borderRadius: 10,
                  background: trimmedName !== initial.displayName.trim() ? v2.accent.greenSoft : v2.surface.card,
                  border: `1px solid ${trimmedName !== initial.displayName.trim() ? v2.accent.green : v2.border.light}`,
                  color: v2.text.primary,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: FONT_INTER,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              <div
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontStyle: "italic",
                  fontSize: 11,
                  color: v2.text.muted,
                  lineHeight: 1.4,
                  marginTop: 6,
                }}
              >
                Booth number and location are managed by Treehouse Finds.
                Reach out if either needs to change.
              </div>
            </div>
          ) : (
            <BoothFormFields
              malls={malls ?? []}
              mallId={mallId} setMallId={setMallId}
              boothNumber={boothNumber} setBoothNumber={setBoothNumber}
              displayName={displayName} setDisplayName={setDisplayName}
              initialValues={initial}
              disabled={submitting}
            />
          )}

          {/* Conflict / error */}
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 9,
                background: v2.surface.error,
                border: `1px solid ${v2.border.error}`,
                fontFamily: FONT_INTER,
                fontSize: 12,
                color: v2.accent.red,
                lineHeight: 1.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: v2.accent.red }} />
              <span>{error}</span>
            </div>
          )}

          {/* CTA */}
          <FormButton
            size="compact"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {submitting
              ? <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Saving…</>
              : "Save changes"}
          </FormButton>
          <button
            onClick={submitting ? undefined : onClose}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              fontFamily: FONT_CORMORANT,
              fontStyle: "italic",
              fontSize: 12,
              color: v2.text.muted,
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
