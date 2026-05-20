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
import { Pencil, X, Loader as LoaderIcon, AlertTriangle, Camera, Trash2, User as UserIcon } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { compressImage } from "@/lib/imageUpload";
import { normalizeFacebookUrl, normalizeInstagramUrl } from "@/lib/socialUrls";
import { v2, FONT_CORMORANT, FONT_INTER, FONT_LORA } from "@/lib/tokens";
import { vendorHueBg } from "@/lib/utils";
import BoothFormFields from "@/components/BoothFormFields";
import FormButton from "@/components/FormButton";
import type { Vendor, Mall } from "@/types/treehouse";

// D7 — bio character limit, mirrored by server validation in
// /api/vendor/profile PATCH. Counter on the textarea turns red at the
// 10-char warning threshold (270+).
const BIO_MAX_LEN  = 280;
const BIO_WARN_LEN = 270;

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
    mallId:         vendor.mall_id ?? "",
    boothNumber:    vendor.booth_number ?? "",
    displayName:    vendor.display_name ?? "",
    // Session 186 — vendor profile enrichment Arc 1 (D14 field order).
    // 4 enrichment text fields batched into the Save button (avatar fires
    // atomically like hero photo). Empty string means NULL in DB; trimmed
    // comparison against initial determines hasChange.
    bio:            vendor.bio ?? "",
    facebookUrl:    vendor.facebook_url ?? "",
    instagramUrl:   vendor.instagram_url ?? "",
    directionsText: vendor.directions_text ?? "",
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

  // Session 186 — Vendor identity (D14 field order). Avatar mirrors hero
  // photo's atomic-save pattern per D5 — Replace/Remove fire immediately,
  // NOT batched into the form Save. The 4 text fields batch into Save.
  const [avatarUrl,      setAvatarUrl]      = useState<string | null>(vendor.avatar_url ?? null);
  const [avatarBusy,     setAvatarBusy]     = useState<"uploading" | "removing" | null>(null);
  const [avatarError,    setAvatarError]    = useState<string | null>(null);
  const [bio,            setBio]            = useState(initial.bio);
  const [facebookUrl,    setFacebookUrl]    = useState(initial.facebookUrl);
  const [instagramUrl,   setInstagramUrl]   = useState(initial.instagramUrl);
  const [directionsText, setDirectionsText] = useState(initial.directionsText);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Lock body overflow for the duration of the sheet.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const trimmedName     = displayName.trim();
  const trimmedBio      = bio.trim();
  const trimmedFb       = facebookUrl.trim();
  const trimmedIg       = instagramUrl.trim();
  const trimmedDirs     = directionsText.trim();
  const enrichmentDirty =
    trimmedBio  !== initial.bio.trim() ||
    trimmedFb   !== initial.facebookUrl.trim() ||
    trimmedIg   !== initial.instagramUrl.trim() ||
    trimmedDirs !== initial.directionsText.trim();
  // Session 186 URL UX refinement — accept any shape the vendor types
  // and normalize via lib/socialUrls. Canonical values feed both the
  // Save-time PATCH payload AND the field-level invalid-state border.
  // Server normalizes again defensively (admin / direct-API paths).
  const facebookCanonical  = trimmedFb === "" ? null : normalizeFacebookUrl(trimmedFb);
  const instagramCanonical = trimmedIg === "" ? null : normalizeInstagramUrl(trimmedIg);
  const fbInputInvalid     = trimmedFb !== "" && facebookCanonical  === null;
  const igInputInvalid     = trimmedIg !== "" && instagramCanonical === null;
  const urlsValid          = !fbInputInvalid && !igInputInvalid;
  const bioValid           = trimmedBio.length <= BIO_MAX_LEN;
  const hasChange =
    mode === "vendor"
      ? (trimmedName !== initial.displayName.trim() || enrichmentDirty)
      : (mallId !== initial.mallId ||
         boothNumber !== initial.boothNumber ||
         trimmedName !== initial.displayName.trim());

  const canSave =
    !submitting &&
    hasChange &&
    trimmedName.length > 0 &&
    (mode === "vendor" || mallId.length > 0) &&
    (mode !== "vendor" || (urlsValid && bioValid));

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

  // Session 186 — avatar upload + remove. Mirrors handleHeroUpload /
  // handleHeroRemove shape verbatim, just hits /api/vendor-avatar with
  // maxWidth=256 per D5 (vs hero's default maxWidth=1400). Atomic save —
  // fires on Replace/Remove tap, NOT batched into form Save. onUpdated()
  // propagates the new avatar_url back to the parent so consumer renders
  // (e.g. /shelf BoothTitleBlock in Arc 2) pick up the change immediately.
  async function handleAvatarUpload(file: File) {
    if (avatarBusy) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Pick an image file.");
      return;
    }
    setAvatarBusy("uploading");
    setAvatarError(null);
    const fallbackUrl = avatarUrl;
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      // D5 — 256×256 max. compressImage scales the longest edge to
      // maxWidth; 0.85 quality density is slightly higher than the 0.82
      // default because the smaller raster needs more bits/pixel to stay
      // sharp at the 40px /shelf render.
      const compressed = await compressImage(dataUrl, 256, 0.85);
      setAvatarUrl(compressed);
      const res  = await authFetch("/api/vendor-avatar", {
        method:  "POST",
        body:    JSON.stringify({ base64DataUrl: compressed, vendorId: vendor.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setAvatarError(json.error ?? "Upload failed.");
        setAvatarUrl(fallbackUrl);
        return;
      }
      setAvatarUrl(json.url);
      onUpdated({ ...vendor, avatar_url: json.url } as Vendor);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : String(err));
      setAvatarUrl(fallbackUrl);
    } finally {
      setAvatarBusy(null);
    }
  }

  async function handleAvatarRemove() {
    if (avatarBusy || !avatarUrl) return;
    setAvatarBusy("removing");
    setAvatarError(null);
    const fallbackUrl = avatarUrl;
    try {
      setAvatarUrl(null);
      const res  = await authFetch("/api/vendor-avatar", {
        method:  "DELETE",
        body:    JSON.stringify({ vendorId: vendor.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setAvatarError(json.error ?? "Remove failed.");
        setAvatarUrl(fallbackUrl);
        return;
      }
      onUpdated({ ...vendor, avatar_url: null } as Vendor);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : String(err));
      setAvatarUrl(fallbackUrl);
    } finally {
      setAvatarBusy(null);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = mode === "vendor" ? "/api/vendor/profile" : "/api/admin/vendors";
      // Session 186 — vendor mode payload extended with 4 enrichment
      // fields per D7+D8+D10. Each field is optional + independently
      // nullable on the server; only ship a key when the value actually
      // changed from initial. Empty trimmed strings ship as null to
      // explicitly clear the column. Admin mode payload unchanged —
      // admin enrichment edits route through the impersonation flow
      // (/my-shelf?vendor=<id> Pencil → vendor mode of this sheet) per
      // sub-decision inside D15 (session 148 admin-vendor parity).
      const payload  = mode === "vendor"
        ? {
            vendorId: vendor.id,
            ...(trimmedName !== initial.displayName.trim() ? { display_name: trimmedName } : {}),
            ...(trimmedBio  !== initial.bio.trim()         ? { bio:             trimmedBio  || null } : {}),
            // Session 186 URL UX refinement — send canonical URLs from
            // lib/socialUrls; empty input ships as null (clear column).
            ...(trimmedFb   !== initial.facebookUrl.trim() ? { facebook_url:    facebookCanonical } : {}),
            ...(trimmedIg   !== initial.instagramUrl.trim()? { instagram_url:   instagramCanonical } : {}),
            ...(trimmedDirs !== initial.directionsText.trim() ? { directions_text: trimmedDirs || null } : {}),
          }
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
              {/* Session 175 iPhone QA — title 16 → 20 + eyebrow 11 → 13.
                  David: "Edit booth name text" and "kentucky treehouse..."
                  text "is just way too low. Why wasn't this caught?" The
                  contrast audit (sessions 173-174) was bounded to text COLOR
                  WCAG contrast; these sizes (16 / 11) passed color but failed
                  absolute legibility on iPhone arm-length. Size-legibility
                  is the un-enumerated dimension — sub-pattern of
                  feedback_audit_bounded_enumeration_is_patch_shape. */}
              <div style={{ fontFamily: FONT_CORMORANT, fontSize: 20, color: v2.text.primary, lineHeight: 1.3 }}>
                {mode === "vendor" ? "Edit booth name" : "Edit booth"}
              </div>
              <div
                style={{
                  fontFamily: FONT_CORMORANT, fontStyle: "italic", fontSize: 13,
                  color: v2.text.secondary, lineHeight: 1.4, marginTop: 1,
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
              <X size={14} style={{ color: v2.text.secondary }} />
            </button>
          </div>

          {/* Booth photo — replace + remove. Session 191 D4 — camera-bubble +
              trash-corner overlay on photo retires the sibling-text-button
              column (R2 reversal of session 186 D5 surfaced explicitly per
              feedback_surface_locked_design_reversals ✅ Promoted). Photo
              container itself is the tap target → file picker. Trash-corner
              stops propagation so it doesn't double-fire the picker.
              Shipped in both vendor and admin modes; hero ops fire
              immediately, NOT on Save — atomic-change mental model. */}
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
            <div
              role="button"
              tabIndex={heroBusy || submitting ? -1 : 0}
              aria-label={heroUrl ? "Replace booth photo" : "Add booth photo"}
              onClick={() => {
                if (heroBusy || submitting) return;
                fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (heroBusy || submitting) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                width: 84,
                height: 84,
                borderRadius: 8,
                overflow: "visible", // overlays extend past corners
                position: "relative",
                background: heroUrl ? undefined : vendorHueBg(vendor.display_name ?? ""),
                border: `1px solid ${v2.border.light}`,
                cursor: heroBusy || submitting ? "default" : "pointer",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
              }}
            >
              {/* Photo content — clipped to rounded-8 via inner wrapper because
                  outer overflow:visible is needed for overlay corners. */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  overflow: "hidden",
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
              {/* Camera-bubble — bottom-right corner; explicit "this is editable" affordance. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: v2.surface.card,
                  border: `1px solid ${v2.border.light}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none", // container handles tap
                }}
              >
                <Camera size={14} strokeWidth={1.7} style={{ color: v2.text.secondary }} />
              </div>
              {/* Trash-corner — top-right corner, renders only when photo present. */}
              {heroUrl && (
                <button
                  type="button"
                  aria-label="Remove booth photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHeroRemove();
                  }}
                  disabled={!!heroBusy || submitting}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: v2.surface.card,
                    border: `1px solid ${v2.border.light}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: heroBusy || submitting ? "default" : "pointer",
                    padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Trash2 size={13} strokeWidth={1.7} style={{ color: v2.accent.red }} />
                </button>
              )}
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
                // Session 186 — autoFocus retired. With the new Vendor
                // identity section (commit 5 — avatar + bio + 2 URL inputs
                // + directions), the sheet has 7 editable fields and no
                // canonical "primary edit target"; auto-focusing booth
                // name on every open pops the iOS keyboard immediately
                // and covers most of the header text the user is trying
                // to read. David: "keyboard shouldn't auto-pop up as it
                // covers most of the text. Keyboard should only pop-up
                // on click inside the menu input."
                //
                // Structural fix per `feedback_kill_bug_class_after_3_patches`
                // — session 175 patched the keyboard-cover symptom via
                // onFocus + scrollIntoView, which only fired AFTER
                // auto-focus had already pushed the keyboard up. Removing
                // autoFocus removes the symptom at its source. The
                // onFocus scrollIntoView is retained because it still
                // matters when the user manually taps the input (the
                // sheet is bottom-anchored + the input sits high in the
                // sheet body, so scrolling the input into the
                // above-keyboard region is still load-bearing on user
                // tap).
                onFocus={(e) => {
                  const target = e.currentTarget;
                  setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                }}
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
                  // Session 175 iPhone QA — helper 11 → 14. David: "Booth
                  // number and location... text is just way too low." Paired
                  // with title 16 → 20 + eyebrow 11 → 13 above. 14 matches
                  // /login bottom sub-text bump (also 14 → 16 / weight 500
                  // this session) for cross-surface Cormorant italic
                  // helper-voice consistency.
                  fontSize: 14,
                  color: v2.text.secondary,
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

          {/* Session 186 — Vendor identity section per D14 in
              docs/vendor-profile-enrichment-design.md (D2 divider + D5
              avatar + D7 bio + D8 URL inputs + D10 directions). Vendor
              mode only — admin mode (on /shelves) routes enrichment
              edits through the impersonation flow (/my-shelf?vendor=<id>
              Pencil → vendor mode of this sheet, session 148 admin-vendor
              parity). Surfaced as a sub-decision inside D15 per
              `feedback_schema_forced_deviation_not_design_reversal` —
              D15 said "both modes get all 5 fields"; Arc 1 ships vendor
              mode in /shelves remains a single-PATCH path against
              /api/admin/vendors. */}
          {mode === "vendor" && (
            <>
              {/* D2 — hairline divider. 10px above composes with the
                  vendor form's marginBottom: 14 for ~24px total breath. */}
              <div style={{ height: 1, background: v2.border.light, margin: "10px 0 18px" }} />

              {/* D5 — Profile photo (avatar). Session 191 D4 — camera-bubble +
                  trash-corner overlay; same pattern as Booth photo (R2
                  reversal of session 186 D5 sibling-text-buttons surfaced).
                  96×96 circular crop preview matches the 40px /shelf
                  compound-lockup render (Arc 2) while showing enough detail
                  for the vendor to confirm framing pre-upload.
                  compressImage(maxWidth=256) per session 186 D5. */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display:      "block",
                    fontFamily:   FONT_INTER,
                    fontSize:     13,
                    color:        v2.text.secondary,
                    lineHeight:   1.25,
                    marginBottom: 8,
                  }}
                >
                  Profile photo
                </label>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarUpload(f);
                    e.target.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={avatarBusy || submitting ? -1 : 0}
                  aria-label={avatarUrl ? "Replace profile photo" : "Add profile photo"}
                  onClick={() => {
                    if (avatarBusy || submitting) return;
                    avatarFileInputRef.current?.click();
                  }}
                  onKeyDown={(e) => {
                    if (avatarBusy || submitting) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      avatarFileInputRef.current?.click();
                    }
                  }}
                  style={{
                    width:        96,
                    height:       96,
                    borderRadius: "50%",
                    overflow:     "visible", // overlays extend past corners
                    position:     "relative",
                    background:   avatarUrl ? undefined : v2.surface.warm,
                    border:       `1px solid ${v2.border.light}`,
                    cursor:       avatarBusy || submitting ? "default" : "pointer",
                    WebkitTapHighlightColor: "transparent",
                    outline:      "none",
                  }}
                >
                  {/* Photo content — clipped to circle via inner wrapper because
                      outer overflow:visible is needed for overlay corners. */}
                  <div
                    style={{
                      position:     "absolute",
                      inset:        0,
                      borderRadius: "50%",
                      overflow:     "hidden",
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{
                          position:  "absolute",
                          inset:     0,
                          width:     "100%",
                          height:    "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position:       "absolute",
                          inset:          0,
                          display:        "flex",
                          alignItems:     "center",
                          justifyContent: "center",
                        }}
                      >
                        <UserIcon size={32} strokeWidth={1.5} style={{ color: v2.text.muted }} />
                      </div>
                    )}
                    {avatarBusy && (
                      <div
                        style={{
                          position:       "absolute",
                          inset:          0,
                          background:     "rgba(20,14,6,0.42)",
                          display:        "flex",
                          alignItems:     "center",
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
                  {/* Camera-bubble — bottom-right corner. Geometry mirrors Booth
                      photo overlay exactly for cross-surface visual consistency. */}
                  <div
                    aria-hidden
                    style={{
                      position:      "absolute",
                      bottom:        -4,
                      right:         -4,
                      width:         28,
                      height:        28,
                      borderRadius:  "50%",
                      background:    v2.surface.card,
                      border:        `1px solid ${v2.border.light}`,
                      display:       "flex",
                      alignItems:    "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Camera size={14} strokeWidth={1.7} style={{ color: v2.text.secondary }} />
                  </div>
                  {/* Trash-corner — top-right corner, renders only when avatar present. */}
                  {avatarUrl && (
                    <button
                      type="button"
                      aria-label="Remove profile photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvatarRemove();
                      }}
                      disabled={!!avatarBusy || submitting}
                      style={{
                        position:      "absolute",
                        top:           -4,
                        right:         -4,
                        width:         24,
                        height:        24,
                        borderRadius:  "50%",
                        background:    v2.surface.card,
                        border:        `1px solid ${v2.border.light}`,
                        display:       "flex",
                        alignItems:    "center",
                        justifyContent: "center",
                        cursor:        avatarBusy || submitting ? "default" : "pointer",
                        padding:       0,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Trash2 size={13} strokeWidth={1.7} style={{ color: v2.accent.red }} />
                    </button>
                  )}
                </div>
                {avatarError && (
                  <div
                    style={{
                      marginTop:    8,
                      padding:      "8px 10px",
                      borderRadius: 8,
                      background:   v2.surface.error,
                      border:       `1px solid ${v2.border.error}`,
                      fontFamily:   FONT_INTER,
                      fontSize:     12,
                      color:        v2.accent.red,
                      lineHeight:   1.5,
                      display:      "flex",
                      alignItems:   "flex-start",
                      gap:          6,
                    }}
                  >
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2, color: v2.accent.red }} />
                    <span>{avatarError}</span>
                  </div>
                )}
              </div>

              {/* D7 — Bio (textarea + 280-char counter). Cormorant italic
                  placeholder matches the literary-serif voice that the
                  bio will read in on /shelf (Arc 2 AboutBoothSection). */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display:      "block",
                    fontFamily:   FONT_INTER,
                    fontSize:     13,
                    color:        v2.text.secondary,
                    lineHeight:   1.25,
                    marginBottom: 6,
                  }}
                >
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LEN))}
                  placeholder="Tell shoppers about your booth — what you specialize in, what makes it worth visiting…"
                  disabled={submitting}
                  rows={4}
                  style={{
                    width:           "100%",
                    boxSizing:       "border-box",
                    padding:         "11px 12px",
                    borderRadius:    10,
                    background:      trimmedBio !== initial.bio.trim() ? v2.accent.greenSoft : v2.surface.card,
                    border:          `1px solid ${trimmedBio !== initial.bio.trim() ? v2.accent.green : v2.border.light}`,
                    color:           v2.text.primary,
                    fontSize:        15,
                    lineHeight:      1.5,
                    outline:         "none",
                    fontFamily:      FONT_LORA,
                    fontStyle:       "italic",
                    resize:          "vertical",
                    minHeight:       96,
                    appearance:      "none",
                    WebkitAppearance: "none",
                  }}
                />
                <div
                  style={{
                    display:        "flex",
                    justifyContent: "flex-end",
                    fontFamily:     FONT_INTER,
                    fontSize:       11,
                    color:          trimmedBio.length >= BIO_WARN_LEN ? v2.accent.red : v2.text.muted,
                    marginTop:      4,
                  }}
                >
                  {trimmedBio.length}/{BIO_MAX_LEN}
                </div>
              </div>

              {/* D8 — Facebook URL. Lenient http(s):// validation; no host
                  allowlist (vendors can paste fb.me / m.facebook.com /
                  shortlinks). Save button gates on validity; field-level
                  amber border surfaces invalid input live. */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display:      "block",
                    fontFamily:   FONT_INTER,
                    fontSize:     13,
                    color:        v2.text.secondary,
                    lineHeight:   1.25,
                    marginBottom: 6,
                  }}
                >
                  Facebook URL
                </label>
                <input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="facebook.com/yourbooth"
                  disabled={submitting}
                  inputMode="url"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width:           "100%",
                    boxSizing:       "border-box",
                    padding:         "11px 12px",
                    borderRadius:    10,
                    background:      trimmedFb !== initial.facebookUrl.trim() ? v2.accent.greenSoft : v2.surface.card,
                    border:          `1px solid ${
                      fbInputInvalid
                        ? v2.accent.red
                        : trimmedFb !== initial.facebookUrl.trim() ? v2.accent.green : v2.border.light
                    }`,
                    color:           v2.text.primary,
                    fontSize:        14,
                    outline:         "none",
                    fontFamily:      FONT_INTER,
                    appearance:      "none",
                    WebkitAppearance: "none",
                  }}
                />
              </div>

              {/* D8 — Instagram URL. Same shape as Facebook. */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display:      "block",
                    fontFamily:   FONT_INTER,
                    fontSize:     13,
                    color:        v2.text.secondary,
                    lineHeight:   1.25,
                    marginBottom: 6,
                  }}
                >
                  Instagram URL
                </label>
                <input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="@yourbooth or instagram.com/yourbooth"
                  disabled={submitting}
                  inputMode="url"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width:           "100%",
                    boxSizing:       "border-box",
                    padding:         "11px 12px",
                    borderRadius:    10,
                    background:      trimmedIg !== initial.instagramUrl.trim() ? v2.accent.greenSoft : v2.surface.card,
                    border:          `1px solid ${
                      igInputInvalid
                        ? v2.accent.red
                        : trimmedIg !== initial.instagramUrl.trim() ? v2.accent.green : v2.border.light
                    }`,
                    color:           v2.text.primary,
                    fontSize:        14,
                    outline:         "none",
                    fontFamily:      FONT_INTER,
                    appearance:      "none",
                    WebkitAppearance: "none",
                  }}
                />
              </div>

              {/* D10 — In-mall directions (textarea, multiline). Server
                  caps at 500 chars; no UI counter — directions are short
                  by nature and the cap is defensive not user-facing. */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display:      "block",
                    fontFamily:   FONT_INTER,
                    fontSize:     13,
                    color:        v2.text.secondary,
                    lineHeight:   1.25,
                    marginBottom: 6,
                  }}
                >
                  In-mall directions
                </label>
                <textarea
                  value={directionsText}
                  onChange={(e) => setDirectionsText(e.target.value)}
                  placeholder="Walk back along the right wall, past the green sign — booth is on the left after the staircase."
                  disabled={submitting}
                  rows={3}
                  style={{
                    width:           "100%",
                    boxSizing:       "border-box",
                    padding:         "11px 12px",
                    borderRadius:    10,
                    background:      trimmedDirs !== initial.directionsText.trim() ? v2.accent.greenSoft : v2.surface.card,
                    border:          `1px solid ${trimmedDirs !== initial.directionsText.trim() ? v2.accent.green : v2.border.light}`,
                    color:           v2.text.primary,
                    fontSize:        14,
                    lineHeight:      1.5,
                    outline:         "none",
                    fontFamily:      FONT_INTER,
                    resize:          "vertical",
                    minHeight:       72,
                    appearance:      "none",
                    WebkitAppearance: "none",
                  }}
                />
              </div>
            </>
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
              color: v2.text.secondary,
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
