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

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, X, Loader as LoaderIcon, AlertTriangle } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import BoothFormFields from "@/components/BoothFormFields";
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
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
              <Pencil size={14} style={{ color: v1.green }} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_LORA, fontSize: 16, color: v1.inkPrimary, lineHeight: 1.3 }}>
                {mode === "vendor" ? "Edit booth name" : "Edit booth"}
              </div>
              <div
                style={{
                  fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 11,
                  color: v1.inkMuted, lineHeight: 1.4, marginTop: 1,
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
                background: "rgba(42,26,10,0.04)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: submitting ? "default" : "pointer", flexShrink: 0,
              }}
            >
              <X size={14} style={{ color: v1.inkMuted }} />
            </button>
          </div>

          {/* Form — vendor mode renders display_name only; admin mode renders
              the full 3-field BoothFormFields. */}
          {mode === "vendor" ? (
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT_LORA,
                  fontSize: 13,
                  color: v1.inkMid,
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
                  background: trimmedName !== initial.displayName.trim() ? "#fff9e8" : v1.inkWash,
                  border: `1px solid ${trimmedName !== initial.displayName.trim() ? "#c8a55a" : v1.inkHairline}`,
                  color: v1.inkPrimary,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: FONT_SYS,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              <div
                style={{
                  fontFamily: FONT_LORA,
                  fontStyle: "italic",
                  fontSize: 11,
                  color: v1.inkFaint,
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
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              fontFamily: FONT_SYS,
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              background: canSave ? v1.green : "rgba(30,77,43,0.30)",
              border: "none",
              cursor: canSave ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7,
              boxShadow: canSave ? "0 2px 10px rgba(30,77,43,0.18)" : "none",
            }}
          >
            {submitting
              ? <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Saving…</>
              : "Save changes"}
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
