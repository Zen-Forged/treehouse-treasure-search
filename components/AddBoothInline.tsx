// components/AddBoothInline.tsx
// Add-a-booth primitive — Flow 1 pre-seed surface.
//
// Session 44 (2026-04-22) — Lifted out of app/admin/page.tsx into its own
// component so both /admin Vendors tab AND /shelves (top row, admin-only)
// can render the same primitive without duplication. Session 44 also adds
// an optional hero-photo field so admins can capture a booth photo at
// seed time while standing in front of the booth, closing the loop on the
// mall-walk pre-seeding workflow.
//
// History: Originally lived at /shelves as <AddBoothSheet> (bottom sheet
// with a backdrop). Session 37 (T4b) retired /shelves' sheet and folded
// the capability into /admin Vendors tab as a private inline component.
// Session 44 is a partial reversal — the primitive lives in one place,
// but it renders at both /admin and /shelves so the mall-walk entry
// point is right where the instinct reaches for it.
//
// Chrome: v1.1k primitives (paperCream, IM Fell italic labels, inkHairline
// borders, inkWash input bg, filled green CTA). Matches /admin/login and
// /vendor-request so that when /admin gets a v1.2 pass this primitive is
// already aligned.
//
// Two states:
//   1. Collapsed — single-row entry point (paper-wash bubble + plus glyph +
//      title + italic helper subtitle + chevron). Tap expands inline.
//   2. Expanded — inline form (mall select + booth number + booth name +
//      OPTIONAL hero photo + filled green CTA). On successful create, calls
//      onCreated(vendor) and auto-collapses.
//
// Create order: vendor row FIRST (via createVendor), then optional hero
// upload against the returned vendor id. If the hero upload fails, the
// vendor still exists — we surface a soft warning via onCreated's note
// field and let the admin retry via the existing /my-shelf hero editor.
// This matches the non-blocking pattern on /my-shelf hero upload.

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight, X, Loader as LoaderIcon, Check, Image as ImageIcon } from "lucide-react";
import { createVendor, slugify } from "@/lib/posts";
import { compressImage } from "@/lib/imageUpload";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Mall, Vendor } from "@/types/treehouse";

interface AddBoothInlineProps {
  malls:     Mall[];
  open:      boolean;
  onToggle:  () => void;
  onClose:   () => void;
  /**
   * Fired after successful vendor create. `note` is set to a non-fatal
   * warning string when the vendor row was created successfully but the
   * hero upload failed — admin can retry hero upload from /my-shelf later.
   */
  onCreated: (vendor: Vendor, note?: string) => void;
}

export default function AddBoothInline({
  malls,
  open,
  onToggle,
  onClose,
  onCreated,
}: AddBoothInlineProps) {
  const [mallId,      setMallId]      = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [heroFile,    setHeroFile]    = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [done,        setDone]        = useState(false);

  const heroInputRef = useRef<HTMLInputElement | null>(null);

  // Default to the first mall once loaded. Production has one mall today;
  // this becomes meaningful once multi-mall support comes online.
  useEffect(() => {
    if (!mallId && malls.length > 0) {
      setMallId(malls[0].id);
    }
  }, [malls, mallId]);

  // Clean up object URL on unmount / file swap to avoid a small leak.
  useEffect(() => {
    return () => {
      if (heroPreview) URL.revokeObjectURL(heroPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroPreview]);

  function resetForm() {
    setDisplayName("");
    setBoothNumber("");
    // Leave mallId as the defaulted value — admin typically seeds several
    // booths at the same mall in one sitting.
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroFile(null);
    setHeroPreview(null);
    setDone(false);
    setSubmitting(false);
  }

  function handleHeroFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
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
      const res = await fetch("/api/vendor-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleSubmit() {
    if (!displayName.trim()) { setError("Booth name is required."); return; }
    if (!mallId) { setError("Please select a mall location."); return; }
    setSubmitting(true);
    setError(null);

    const slug = slugify(displayName.trim());
    const { data: vendor, error: createErr } = await createVendor({
      mall_id:      mallId,
      display_name: displayName.trim(),
      booth_number: boothNumber.trim() || undefined,
      slug,
    });

    if (createErr || !vendor) {
      setError(createErr ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    // Optional hero upload — non-blocking on failure. Vendor row is already
    // persisted at this point, so a failed hero upload leaves a valid
    // unclaimed booth; admin can retry hero from /my-shelf later.
    let heroNote: string | undefined;
    if (heroFile) {
      const heroResult = await uploadHero(vendor.id, heroFile);
      if (!heroResult.ok) {
        heroNote = `Booth saved, but hero photo upload failed: ${heroResult.error}. You can add one later from My Booth.`;
      }
    }

    setDone(true);
    setTimeout(() => {
      onCreated(vendor, heroNote);
      resetForm();
    }, 800);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: 10,
    background: v1.inkWash,
    border: `1px solid ${v1.inkHairline}`,
    color: v1.inkPrimary,
    fontSize: 14,
    outline: "none",
    fontFamily: FONT_SYS,
    appearance: "none",
    WebkitAppearance: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: FONT_IM_FELL,
    fontStyle: "italic",
    fontSize: 12,
    color: v1.inkMuted,
    lineHeight: 1.3,
    marginBottom: 6,
  };

  const optionalStyle: React.CSSProperties = {
    fontStyle: "italic",
    color: v1.inkFaint,
    marginLeft: 3,
  };

  // Collapsed state — single-row entry point
  if (!open) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "12px 14px",
          marginBottom: 16,
          background: v1.inkWash,
          border: `0.5px solid ${v1.inkHairline}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 11,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(42,26,10,0.04)",
          border: `0.5px solid ${v1.inkHairline}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Plus size={14} style={{ color: v1.green }} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: FONT_IM_FELL, fontSize: 14, color: v1.inkPrimary,
            lineHeight: 1.25,
          }}>
            Add a booth
          </div>
          <div style={{
            fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 11,
            color: v1.inkMuted, lineHeight: 1.4, marginTop: 1,
          }}>
            Pre-seed a booth for later vendor claim
          </div>
        </div>
        <ChevronRight size={13} style={{ color: v1.inkMuted, flexShrink: 0 }} strokeWidth={1.8} />
      </button>
    );
  }

  // Expanded state — inline form
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        marginBottom: 16,
        padding: "16px",
        background: v1.inkWash,
        border: `0.5px solid ${v1.inkHairline}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(42,26,10,0.04)",
            border: `0.5px solid ${v1.inkHairline}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={13} style={{ color: v1.green }} strokeWidth={1.8} />
          </div>
          <div style={{
            fontFamily: FONT_IM_FELL, fontSize: 14, color: v1.inkPrimary,
          }}>
            Add a booth
          </div>
        </div>
        <button
          onClick={() => { resetForm(); onClose(); }}
          aria-label="Close"
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={14} style={{ color: v1.inkMuted }} />
        </button>
      </div>

      {/* Mall */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Mall</label>
        <select
          value={mallId}
          onChange={e => setMallId(e.target.value)}
          style={{
            ...inputStyle,
            paddingRight: 36,
            cursor: "pointer",
            backgroundImage:
              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5538' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "12px 12px",
          }}
        >
          <option value="">Select a location…</option>
          {malls.map(m => (
            <option key={m.id} value={m.id}>{m.name}{m.city ? ` — ${m.city}` : ""}</option>
          ))}
        </select>
      </div>

      {/* Booth number */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          Booth number <span style={optionalStyle}>(optional)</span>
        </label>
        <input
          value={boothNumber}
          onChange={e => setBoothNumber(e.target.value)}
          placeholder="e.g. 369"
          style={inputStyle}
          inputMode="numeric"
        />
      </div>

      {/* Booth name */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Booth name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. ZenForged Finds"
          style={inputStyle}
        />
      </div>

      {/* Hero photo — session 44, optional */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Hero photo <span style={optionalStyle}>(optional)</span>
        </label>

        {heroPreview ? (
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 10,
            overflow: "hidden",
            border: `1px solid ${v1.inkHairline}`,
            background: v1.paperCream,
          }}>
            <img
              src={heroPreview}
              alt="Hero preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <button
              onClick={clearHero}
              aria-label="Remove hero photo"
              style={{
                position: "absolute", top: 8, right: 8,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(20,18,12,0.62)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={13} style={{ color: "rgba(255,255,255,0.95)" }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => heroInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "22px 14px",
              borderRadius: 10,
              background: "rgba(42,26,10,0.02)",
              border: `1px dashed ${v1.inkHairline}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 13,
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

      {error && (
        <div style={{
          marginBottom: 12,
          padding: "9px 12px",
          borderRadius: 9,
          background: v1.redBg,
          border: `1px solid ${v1.redBorder}`,
          fontFamily: FONT_SYS,
          fontSize: 12,
          color: v1.red,
          lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || done}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 10,
          fontFamily: FONT_SYS,
          fontSize: 13,
          fontWeight: 500,
          color: "#fff",
          background: submitting || done ? "rgba(30,77,43,0.40)" : v1.green,
          border: "none",
          cursor: submitting || done ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 7,
          boxShadow: submitting || done ? "none" : "0 2px 10px rgba(30,77,43,0.18)",
        }}
      >
        {done ? (
          <><Check size={14} strokeWidth={2} /> Booth added</>
        ) : submitting ? (
          <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> {heroFile ? "Saving + uploading photo…" : "Adding…"}</>
        ) : (
          "Add booth"
        )}
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
