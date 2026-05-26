// app/find/[id]/edit/page.tsx
// "Edit find details" — vendor/admin form for an existing post.
//
// Session 2 (2026-05-01) — converted from autosave to form-submit:
//   - Single "Post changes" button in a sticky bottom bar (matches /post/preview)
//   - All fields (title / price / caption / status) batched in one PATCH on submit
//   - No per-field debounce, no Saved flash badge, no per-field amber notice
//   - On failure: single AmberNotice above the submit button
//   - On success: router.replace(`/find/[id]`) — vendor sees committed changes
//
// Also session 2:
//   - Replace photo flow + polaroid display retired entirely (vendor sees the
//     photo on /find/[id] before tapping the inline pencil; this page is now
//     details-only). Photo replacement re-enters the codebase later if needed.
//   - Field order: Title → Price → Caption → Status (David's call — Price
//     belongs immediately under Title in the vendor's mental model).
//   - Title block tightened: "Edit find details" + "Click submit when finished".
//
// Auth gate, on mount:
//   1. getSession() — if no user, route to /login?next=/find/[id]/edit
//   2. getPost(id) — if not found, route to /find/[id] (404 lives there)
//   3. Ownership check via post.vendor.user_id; isAdmin(user) bypasses.
//   4. Non-admin, non-owner → silent route back to /find/[id]
//
// "Remove from shelf" destructive link stays at the bottom (separate from the
// submit flow — it deletes rather than saves edits).

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PiCamera } from "react-icons/pi";
import { getPost, deletePost } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { clearPostCache, clearVendorPostsCache } from "@/lib/findContext";
import { compressImage, uploadPostImageViaServer } from "@/lib/imageUpload";
import { v1, v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import AmberNotice from "@/components/AmberNotice";
import FormButton from "@/components/FormButton";
import type { Post } from "@/types/treehouse";

// Caption auto-grow bounds (preserved from v1.2 polish session 31E).
const CAPTION_MIN_HEIGHT_PX = 78;
const CAPTION_MAX_HEIGHT_PX = 260;

type PostStatus = "available" | "sold";

export default function EditFindPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post,        setPost]        = useState<Post | null>(null);
  const [stage,       setStage]       = useState<"loading" | "edit" | "forbidden" | "notfound">("loading");

  // Local field values
  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");
  const [status,  setStatus]  = useState<PostStatus>("available");

  // Submit state
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  // Remove flow state
  const [removing,           setRemoving]           = useState(false);
  const [showRemoveConfirm,  setShowRemoveConfirm]  = useState(false);

  // Session 198 C8 — photo replace state per David's session 198 QA:
  // "Enable the ability for the image photo to be removed or replaced
  // from the edit find screen." REPLACE shipped; REMOVE deferred per
  // API constraint (PATCH /api/my-posts/[id] requires non-empty http(s)
  // URL on image_url validation at lib/posts route.ts:120). The
  // existing "Remove from shelf" link is the canonical destructive
  // option; photo-less finds aren't supported by the entity model.
  // imageUrl tracks the current preview (updates immediately on
  // upload success); originalImageUrl preserved for change-detection
  // so handleSubmit only PATCHes image_url when actually swapped.
  const [imageUrl,         setImageUrl]         = useState<string>("");
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false);
  const [photoError,       setPhotoError]       = useState<string | null>(null);

  const captionRef     = useRef<HTMLTextAreaElement | null>(null);
  const photoInputRef  = useRef<HTMLInputElement | null>(null);

  // Mount: auth gate + identity resolution
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const session = await getSession();
      if (cancelled) return;

      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent(`/find/${id}/edit`)}`);
        return;
      }
      const user = session.user;
      const admin = isAdmin(user);

      const fetched = await getPost(id);
      if (cancelled) return;

      if (!fetched) {
        setStage("notfound");
        router.replace(`/find/${id}`);
        return;
      }

      const postVendorUserId = fetched.vendor?.user_id ?? null;
      const isOwner = !!postVendorUserId && postVendorUserId === user.id;

      if (!admin && !isOwner) {
        setStage("forbidden");
        router.replace(`/find/${id}`);
        return;
      }

      setPost(fetched);
      setTitle(fetched.title ?? "");
      setCaption(fetched.caption ?? "");
      setPrice(
        typeof fetched.price_asking === "number" && fetched.price_asking > 0
          ? String(fetched.price_asking)
          : "",
      );
      setStatus(fetched.status === "sold" ? "sold" : "available");
      // Session 198 C8 — hydrate photo state. originalImageUrl preserved
      // for change-detection in handleSubmit (only PATCH image_url when
      // user actually swapped the photo).
      setImageUrl(fetched.image_url ?? "");
      setOriginalImageUrl(fetched.image_url ?? "");
      setStage("edit");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Caption auto-grow — recompute on every value change.
  useEffect(() => {
    const el = captionRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      CAPTION_MAX_HEIGHT_PX,
      Math.max(CAPTION_MIN_HEIGHT_PX, el.scrollHeight),
    );
    el.style.height = `${next}px`;
  }, [caption]);

  // ── Submit (form-submit replacement for autosave) ────────────────────────
  async function handleSubmit() {
    if (!post || submitting) return;

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1) {
      setSubmitError("Title can't be empty.");
      return;
    }

    let priceValue: number | null = null;
    const priceTrimmed = price.trim();
    if (priceTrimmed !== "") {
      const n = parseFloat(priceTrimmed.replace(/[^0-9.]/g, ""));
      if (!isFinite(n) || n < 0) {
        setSubmitError("Price must be a positive number.");
        return;
      }
      priceValue = n;
    }

    const captionTrimmed = caption.trim();
    // Session 198 C8 — include image_url in updates ONLY when actually
    // swapped (handlePhotoChange uploads + sets imageUrl on success;
    // originalImageUrl preserved at load time). Avoids no-op writes when
    // user only edits text fields. PATCH /api/my-posts/[id] requires
    // non-empty http(s) URL per its image_url validator (route.ts:120),
    // so we never pass null/empty here.
    const imageChanged = imageUrl.length > 0 && imageUrl !== originalImageUrl;
    const updates = {
      title:         trimmedTitle,
      caption:       captionTrimmed.length > 0 ? captionTrimmed : null,
      price_asking:  priceValue,
      status,
      ...(imageChanged ? { image_url: imageUrl } : {}),
    };

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await authFetch(`/api/my-posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSubmitError(json?.error ?? `Couldn't save your changes (${res.status}).`);
        setSubmitting(false);
        return;
      }
      // Phase B QA fix #2 (session 100) — invalidate the shared post cache
      // so /find/[id] re-fetches the freshly-edited row instead of showing
      // the pre-edit cached snapshot. Session 101 — also invalidate the
      // vendor-posts cache so the booth carousel re-fetches with the
      // updated title / sold flag.
      clearPostCache(post.id);
      if (post.vendor_id) clearVendorPostsCache(post.vendor_id);
      router.replace(`/find/${post.id}`);
    } catch (err) {
      console.error("[edit] submit failed:", err);
      setSubmitError("Couldn't save your changes — try again.");
      setSubmitting(false);
    }
  }

  // ── Photo replace ────────────────────────────────────────────────────────
  // Session 198 C8 — file picker → FileReader dataURL → compressImage
  // (canvas resize to 1400px longest edge + JPEG re-encode at 0.82
  // quality, ~150-400KB output) → uploadPostImageViaServer
  // (POST /api/post-image with base64 + vendorId; returns public Supabase
  // URL). Preview state updates immediately; the new URL is included in
  // the PATCH body on the next "Post changes" tap via the imageChanged
  // branch in handleSubmit. If user backs out before submitting, the
  // upload is orphaned in storage (acceptable MVP trade-off).
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !post) return;
    e.target.value = ""; // allow reselecting the same file later

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      // Read file as base64 data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Couldn't read selected file."));
        reader.readAsDataURL(file);
      });

      // Compress (resize + JPEG re-encode, browser-side)
      const compressed = await compressImage(dataUrl);

      // Upload to /api/post-image → returns public Supabase URL
      if (!post.vendor_id) {
        throw new Error("Missing vendor reference — can't upload.");
      }
      const newUrl = await uploadPostImageViaServer(compressed, post.vendor_id);
      setImageUrl(newUrl);
    } catch (err) {
      console.error("[edit] photo upload failed:", err);
      setPhotoError(err instanceof Error ? err.message : "Photo upload failed — try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Remove from shelf (separate destructive flow) ────────────────────────
  async function handleRemove() {
    if (!post || removing) return;
    setRemoving(true);
    try {
      const ok = await deletePost(post.id);
      if (ok) {
        router.replace("/my-shelf");
      } else {
        setRemoving(false);
        setSubmitError("Couldn't remove that find — try again.");
        setShowRemoveConfirm(false);
      }
    } catch (err) {
      console.error("[edit] remove failed:", err);
      setRemoving(false);
      setShowRemoveConfirm(false);
    }
  }

  // Render: loading / forbidden / notfound
  if (stage === "loading" || stage === "forbidden" || stage === "notfound") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v2.bg.main,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            color: v2.text.secondary,
            fontSize: 15,
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!post) return null;

  const canSubmit = title.trim().length >= 1 && !submitting;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v2.bg.main,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ padding: "max(12px, env(safe-area-inset-top, 12px)) 16px 6px", flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: v1.iconBubble,
            border: "none",
            cursor: "pointer",
            padding: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 96px))",
        }}
      >
        {/* Title block */}
        <div style={{ textAlign: "center", padding: "2px 22px 14px" }}>
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontSize: 24,
              color: v2.text.primary,
              letterSpacing: "-0.005em",
              lineHeight: 1.15,
              marginBottom: 4,
            }}
          >
            Edit find details
          </div>
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontStyle: "italic",
              // Session 198 C2 — fontSize 14 → 16 per David's session 198
              // QA ("Make the text a bit larger as well"). Matches session
              // 153 /login subtitle bump canonical.
              fontSize: 16,
              color: v2.text.secondary,
              lineHeight: 1.5,
              maxWidth: 320,
              margin: "0 auto",
            }}
          >
            {/* Session 198 C2 — "Click submit when finished" → "Click post
                changes when finished" per David's session 198 QA: "There
                is no submit button on this page so 'click submit when
                finished' isn't accurate." Subtitle now syncs with the
                button label "Post changes" (sticky save bar at line ~567). */}
            Click post changes when finished
          </div>
        </div>

        {/* Session 198 C8 — Photo display + Replace photo affordance.
            Per David's session 198 QA: "Enable the ability for the
            image photo to be removed or replaced from the edit find
            screen." REPLACE shipped (file picker → compressImage →
            uploadPostImageViaServer → preview updates; new URL
            included in PATCH body on next Post changes tap via
            imageChanged branch in handleSubmit). REMOVE deferred per
            API constraint (image_url validator requires non-empty
            http(s) URL) + entity-model decision about photo-less
            finds (the existing "Remove from shelf" link below is the
            canonical destructive option for photo-less intent).
            Renders the polaroid 4:5 aspect to mirror /find/[id]
            display chrome so vendor sees "yes this is the find I
            want to edit." */}
        {imageUrl && (
          <div style={{ padding: "0 22px 18px" }}>
            <div
              style={{
                width:        "100%",
                aspectRatio:  "4 / 5",
                borderRadius: 14,
                overflow:     "hidden",
                background:   v1.inkWash,
                marginBottom: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={post.title ?? "Find photo"}
                style={{
                  width:     "100%",
                  height:    "100%",
                  objectFit: "cover",
                  display:   "block",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto || submitting}
              aria-label="Replace Photo"
              style={{
                width:          "100%",
                background:     v2.surface.input,
                color:          v2.accent.greenMid,
                border:         `1px solid ${v2.accent.greenMid}`,
                borderRadius:   10,
                padding:        9,
                fontFamily:     FONT_INTER,
                fontSize:       11,
                fontWeight:     600,
                letterSpacing:  "0.12em",
                textTransform:  "uppercase",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            8,
                cursor:         uploadingPhoto || submitting ? "default" : "pointer",
                opacity:        uploadingPhoto || submitting ? 0.6 : 1,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <PiCamera size={13} aria-hidden style={{ flexShrink: 0 }} />
              {uploadingPhoto ? "Uploading…" : "Replace Photo"}
            </button>
            {photoError && (
              <div
                role="alert"
                style={{
                  marginTop:  8,
                  fontFamily: FONT_INTER,
                  fontSize:   12,
                  color:      v1.red,
                  textAlign:  "center",
                  lineHeight: 1.5,
                }}
              >
                {photoError}
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* Fields — Title / Price / Caption / Status */}
        <div
          style={{
            padding: "0 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <FieldGroup label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </FieldGroup>

          <FieldGroup label="Price" optional>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: FONT_INTER,
                  fontSize: 16,
                  color: v2.text.secondary,
                  pointerEvents: "none",
                }}
              >
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Caption" optional>
            <textarea
              ref={captionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: CAPTION_MIN_HEIGHT_PX,
                maxHeight: CAPTION_MAX_HEIGHT_PX,
                resize: "none",
                lineHeight: 1.5,
                overflowY: "auto",
              }}
            />
          </FieldGroup>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontFamily: FONT_CORMORANT,
                fontSize: 15,
                color: v2.text.primary,
                lineHeight: 1.25,
              }}
            >
              Status
            </label>
            {/* Session 198 C5 — segmented-pill toggle replaces the previous
                2-separate-pill grid (StatusPill × 2 with 8px gap). One
                unified rounded-pill chrome; selected half gets filled
                greenMid bg + white text; unselected stays transparent +
                ink-secondary. Per David's session 198 QA: "Change status
                into a toggle instead of two separate buttons for
                available/sold." Matches iOS-canonical segmented-control
                vocabulary for binary equal-weight-labels. */}
            <StatusToggle status={status} onChange={setStatus} />
          </div>
        </div>

        {/* Remove from shelf (destructive quiet link) */}
        <div
          style={{
            padding: "28px 22px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {!showRemoveConfirm ? (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              disabled={removing}
              style={{
                fontFamily: FONT_CORMORANT,
                fontStyle: "italic",
                // Session 198 C3 — fontSize 14 → 16 + fontWeight default
                // → 500 per David's session 198 QA: "Remove from shelf
                // text is really small and hard to read increase font
                // weight and font size." Matches Cormorant italic 500
                // secondary-voice canonical (session 153 /login subtitle).
                // Bumped textDecorationColor opacity 0.38 → 0.55 so the
                // dotted underline tracks the heavier text weight.
                fontSize: 16,
                fontWeight: 500,
                color: v1.red,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "rgba(139,32,32,0.55)",
                textUnderlineOffset: 3,
                background: "none",
                border: "none",
                cursor: removing ? "default" : "pointer",
                padding: "6px 4px",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Remove from shelf
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                background: v1.inkWash,
                border: `0.5px solid ${v1.inkHairline}`,
                textAlign: "center",
                maxWidth: 320,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontSize: 16,
                  color: v2.text.primary,
                  marginBottom: 8,
                }}
              >
                Remove this find?
              </div>
              <div
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: v2.text.secondary,
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                The photograph and listing will be permanently removed.
              </div>
              <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  style={{
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: v1.red,
                    background: "none",
                    border: "none",
                    cursor: removing ? "default" : "pointer",
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: "rgba(139,32,32,0.4)",
                    textUnderlineOffset: 3,
                    opacity: removing ? 0.6 : 1,
                    padding: "4px 2px",
                  }}
                >
                  {removing ? "Removing…" : "Yes, remove"}
                </button>
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={removing}
                  style={{
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: v2.text.secondary,
                    background: "none",
                    border: "none",
                    cursor: removing ? "default" : "pointer",
                    textDecoration: "underline",
                    textDecorationStyle: "solid",
                    textDecorationColor: v2.border.light,
                    textUnderlineOffset: 3,
                    padding: "4px 2px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Sticky save bar with "Post changes" submit ──────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 430,
          margin: "0 auto",
          padding: "12px 22px",
          paddingBottom: "max(18px, env(safe-area-inset-bottom, 18px))",
          background: v2.bg.main,
          borderTop: `1px solid ${v1.inkHairline}`,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {submitError && (
          <AmberNotice>{submitError}</AmberNotice>
        )}
        <FormButton
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            fontWeight: 500,
            letterSpacing: "0.2px",
            transition: "background 0.18s ease",
          }}
        >
          {submitting ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontFamily: FONT_CORMORANT, fontStyle: "italic" }}
            >
              Saving…
            </motion.span>
          ) : (
            "Post changes"
          )}
        </FormButton>
      </div>
    </div>
  );
}

// Helpers

function FieldGroup({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        style={{
          fontFamily: FONT_CORMORANT,
          fontSize: 15,
          color: v2.text.primary,
          lineHeight: 1.25,
        }}
      >
        {label}
        {optional && (
          <span
            style={{
              fontStyle: "italic",
              fontSize: 14,
              color: v2.text.primary,
              marginLeft: 5,
              fontWeight: 400,
            }}
          >
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// Session 198 C5 — replaces the previous StatusPill (2 separate pills
// with their own borders + 8px gap) with a unified segmented-pill
// toggle. Container holds both halves with a single rounded-pill
// chrome + inkHairline border; selected segment fills greenMid + white
// text; unselected stays transparent + ink-secondary. radioGroup role
// for a11y so screen readers announce as a single picker, not two
// independent buttons.
function StatusToggle({
  status,
  onChange,
}: {
  status:   PostStatus;
  onChange: (next: PostStatus) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Listing status"
      style={{
        display:            "grid",
        gridTemplateColumns: "1fr 1fr",
        background:         v1.inkWash,
        border:             `1.5px solid ${v1.inkHairline}`,
        borderRadius:       999,
        padding:            3,
      }}
    >
      <StatusSegment
        label="Available"
        active={status === "available"}
        onClick={() => onChange("available")}
      />
      <StatusSegment
        label="Sold"
        active={status === "sold"}
        onClick={() => onChange("sold")}
      />
    </div>
  );
}

function StatusSegment({
  label,
  active,
  onClick,
}: {
  label:   string;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      style={{
        padding:        "10px 14px",
        borderRadius:   999,
        fontFamily:     FONT_CORMORANT,
        fontSize:       16,
        color:          active ? "#fff" : v2.text.secondary,
        fontWeight:     active ? 600 : 400,
        background:     active ? v2.accent.greenMid : "transparent",
        border:         "none",
        textAlign:      "center",
        lineHeight:     1.2,
        cursor:         "pointer",
        WebkitTapHighlightColor: "transparent",
        transition:     "background-color 0.18s ease, color 0.18s ease",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: FONT_INTER,
  fontSize: 16,
  color: v2.text.primary,
  background: v2.surface.card,
  border: `1px solid ${v1.inkHairline}`,
  borderRadius: 14,
  padding: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  lineHeight: 1.4,
  WebkitTapHighlightColor: "transparent",
};
