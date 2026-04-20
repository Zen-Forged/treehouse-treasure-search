// app/find/[id]/edit/page.tsx
// v1.2 — "Edit your find" page. New route. See build spec §5 and the
// approved mockup docs/mockups/edit-listing-v1-2.html.
//
// The layout deliberately parallels /post/preview — a vendor editing a find
// should feel like they're looking at the same page that created it. Same
// masthead chrome, same photograph primitive, same posting-as row, same
// field rhythm. Only three things are different:
//   - Replace-photo pill overlaid on the photograph (top-left)
//   - Status toggle pair beneath Price (Available · Sold)
//   - Quiet "Remove from shelf" destructive link at the very bottom
//
// Save model: AUTOSAVE. No save button. Per-field debounce of ~800ms; on
// success a small "Saved" check glyph appears next to the field label for
// ~2s and fades. On failure, an <AmberNotice> surfaces above the field with
// a retry affordance. Status toggle and Replace-photo are IMMEDIATE writes
// (explicit user gestures, different UX contract).
//
// Auth gate, on mount:
//   1. getSession() — if no user, route to /login?next=/find/[id]/edit
//   2. getPost(id) — if not found, route to /find/[id] (404 lives there)
//   3. getVendorByUserId(user.id) — verify vendor.id === post.vendor_id
//      unless isAdmin(user) bypasses. Admin can edit any post.
//   4. Non-admin, non-owner → silent route back to /find/[id]

"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Check } from "lucide-react";
import { getPost, deletePost } from "@/lib/posts";
import { compressImage, uploadPostImageViaServer } from "@/lib/imageUpload";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import PhotographPreview from "@/components/PhotographPreview";
import PostingAsBlock from "@/components/PostingAsBlock";
import AmberNotice from "@/components/AmberNotice";
import type { Post } from "@/types/treehouse";

const AUTOSAVE_DEBOUNCE_MS  = 800;
const SAVED_FADE_MS         = 2000;
const STATUS_CONFIRM_FADE_MS = 3000;

// Fields we locally debounce before PATCHing. Status and image_url are
// handled as immediate writes elsewhere.
type TextField = "title" | "caption" | "price_asking";

// ══════════════════════════════════════════════════════════════════════════
export default function EditFindPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── Core state ─────────────────────────────────────────────────────────
  const [post,        setPost]        = useState<Post | null>(null);
  const [stage,       setStage]       = useState<"loading" | "edit" | "forbidden" | "notfound">("loading");

  // Per-field local values (what the vendor sees while typing)
  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");

  // Autosave flash state per field — which one is currently showing "Saved"
  const [savedFlash, setSavedFlash] = useState<TextField | null>(null);
  // Per-field error state — sets an amber notice that appears above the field
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TextField, string>>>({});

  // Status confirmation banner (visible for ~3s after flip)
  const [statusConfirm, setStatusConfirm] = useState<"sold" | "available" | null>(null);

  // Replace-photo flow state
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null); // compressed data URL preview
  const [replaceBusy,  setReplaceBusy]  = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // Remove flow state
  const [removing, setRemoving] = useState(false);

  // Debounce refs per text field
  const debouncers = useRef<Partial<Record<TextField, ReturnType<typeof setTimeout>>>>({});
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hidden input refs for Replace-photo
  const cameraInputRef  = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // ── Mount: auth gate + identity resolution ────────────────────────────
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

      // Ownership check: admin bypasses. Otherwise match user_id → vendor →
      // post.vendor_id. The Post join gives us vendor.user_id directly, so
      // we don't need a second round-trip.
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
      setStage("edit");
    })();

    return () => {
      cancelled = true;
      // Clear any pending debouncers so we don't PATCH after unmount
      Object.values(debouncers.current).forEach((t) => { if (t) clearTimeout(t); });
      debouncers.current = {};
      if (savedTimer.current)  clearTimeout(savedTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Autosave helpers ───────────────────────────────────────────────────

  // Fire a PATCH with a partial update. On success, flash "Saved" next to
  // the named field. On failure, surface an amber notice above that field.
  async function patchPost(
    updates: Record<string, string | number | null>,
    flashField: TextField | null,
  ): Promise<boolean> {
    if (!post) return false;
    try {
      const res = await authFetch(`/api/my-posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const msg = json?.error ?? `Couldn't save that change (${res.status}).`;
        if (flashField) {
          setFieldErrors((prev) => ({ ...prev, [flashField]: msg }));
        }
        return false;
      }
      // Update local post reference with server response so subsequent
      // edits don't stale-diff against the pre-save snapshot
      setPost(json.post as Post);
      if (flashField) {
        setFieldErrors((prev) => {
          if (!prev[flashField]) return prev;
          const { [flashField]: _removed, ...rest } = prev;
          return rest;
        });
        setSavedFlash(flashField);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSavedFlash(null), SAVED_FADE_MS);
      }
      return true;
    } catch (err) {
      console.error("[edit] patch failed:", err);
      if (flashField) {
        setFieldErrors((prev) => ({
          ...prev,
          [flashField]: "Couldn't save that change — retry?",
        }));
      }
      return false;
    }
  }

  // Debounced per-field text save. Called from each input's onChange.
  function scheduleTextSave(field: TextField, rawValue: string) {
    // Clear any pending timer for this field
    if (debouncers.current[field]) clearTimeout(debouncers.current[field]);

    debouncers.current[field] = setTimeout(() => {
      if (!post) return;

      // Coerce the value to what the API wants
      let update: Record<string, string | number | null>;
      if (field === "title") {
        const t = rawValue.trim();
        if (t.length < 1) {
          // Autosave does not permit empty titles — show inline error but
          // don't PATCH. Clearing the title then blurring away won't save
          // an empty string.
          setFieldErrors((prev) => ({ ...prev, title: "Title can't be empty." }));
          return;
        }
        update = { title: t };
      } else if (field === "caption") {
        const c = rawValue.trim();
        update = { caption: c.length > 0 ? c : null };
      } else {
        // price_asking
        if (rawValue.trim() === "") {
          update = { price_asking: null };
        } else {
          const n = parseFloat(rawValue.replace(/[^0-9.]/g, ""));
          if (!isFinite(n) || n < 0) {
            setFieldErrors((prev) => ({ ...prev, price_asking: "Price must be a positive number." }));
            return;
          }
          update = { price_asking: n };
        }
      }

      patchPost(update, field);
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  // ── Status toggle (immediate write) ────────────────────────────────────
  async function handleStatusChange(next: "available" | "sold") {
    if (!post || post.status === next) return;
    // Optimistic update
    const prev = post.status;
    setPost({ ...post, status: next });

    const ok = await patchPost({ status: next }, null);
    if (!ok) {
      // Rollback on failure
      setPost({ ...post, status: prev });
      setFieldErrors((e) => ({ ...e, title: "Couldn't update status — try again." }));
      return;
    }

    setStatusConfirm(next);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatusConfirm(null), STATUS_CONFIRM_FADE_MS);
  }

  // ── Replace photo flow (immediate write on confirm) ────────────────────
  function openPhotoPicker() {
    setReplaceError(null);
    setShowPhotoPicker(true);
    // Tap the gallery input by default; a separate gesture could open
    // camera. On mobile Safari showing a tiny picker overlay is flaky, so
    // we just fire the gallery input directly — the vendor can pick "Take
    // Photo" from inside iOS's native sheet.
    galleryInputRef.current?.click();
    setShowPhotoPicker(false);
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setReplaceError(null);
    try {
      const reader = new FileReader();
      const raw = await new Promise<string>((res, rej) => {
        reader.onload  = (ev) => res(ev.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(raw, 1400, 0.82);
      setPendingPhoto(compressed);
    } catch (err) {
      console.error("[edit] photo read failed:", err);
      setReplaceError("Couldn't read that photo. Try another.");
    }
  }

  async function confirmReplacePhoto() {
    if (!pendingPhoto || !post) return;
    setReplaceBusy(true);
    setReplaceError(null);
    try {
      const url = await uploadPostImageViaServer(pendingPhoto, post.vendor_id);
      const ok  = await patchPost({ image_url: url }, null);
      if (!ok) throw new Error("PATCH failed");
      // Surface success via the Saved flash on a synthetic field key —
      // simplest is to reuse title flash briefly (the spec only calls for
      // post-level signal, not a per-field one, for photo replacement).
      // Here we clear pendingPhoto and rely on the photo itself updating
      // via setPost(json.post) inside patchPost.
      setPendingPhoto(null);
    } catch (err) {
      console.error("[edit] photo replace failed:", err);
      setReplaceError(
        err instanceof Error ? err.message : "Couldn't save the new photo.",
      );
    } finally {
      setReplaceBusy(false);
    }
  }

  function cancelReplacePhoto() {
    setPendingPhoto(null);
    setReplaceError(null);
  }

  // ── Remove from shelf (quiet destructive) ──────────────────────────────
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  async function handleRemove() {
    if (!post || removing) return;
    setRemoving(true);
    try {
      const ok = await deletePost(post.id);
      if (ok) {
        router.replace("/my-shelf");
      } else {
        setRemoving(false);
        setFieldErrors((e) => ({ ...e, title: "Couldn't remove that find — try again." }));
        setShowRemoveConfirm(false);
      }
    } catch (err) {
      console.error("[edit] remove failed:", err);
      setRemoving(false);
      setShowRemoveConfirm(false);
    }
  }

  // ── Callbacks for onChange wiring (stable via useCallback) ─────────────
  const onTitleChange = useCallback((v: string) => {
    setTitle(v);
    scheduleTextSave("title", v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const onCaptionChange = useCallback((v: string) => {
    setCaption(v);
    scheduleTextSave("caption", v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const onPriceChange = useCallback((v: string) => {
    setPrice(v);
    scheduleTextSave("price_asking", v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  // ── Render: loading / forbidden / notfound ─────────────────────────────
  if (stage === "loading" || stage === "forbidden" || stage === "notfound") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            color: v1.inkMuted,
            fontSize: 15,
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!post) return null;

  const boothNumber = post.vendor?.booth_number ?? null;
  const displayedPhoto = pendingPhoto ?? post.image_url ?? "";
  const sold = post.status === "sold";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hidden file input for photo replacement */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onPhotoPicked}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* Camera input kept available for future use; not wired in v1.2 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoPicked}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
        }}
      >
        {/* ── Masthead (Mode C) ──────────────────────────────────────── */}
        <div
          style={{
            padding: "max(14px, env(safe-area-inset-top, 14px)) 22px 10px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            background: "rgba(232,221,199,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${v1.inkHairline}`,
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginTop: 1,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={17} strokeWidth={2} style={{ color: v1.inkPrimary }} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontSize: 24,
                color: v1.inkPrimary,
                letterSpacing: "-0.005em",
                lineHeight: 1.15,
              }}
            >
              Edit your find
            </div>
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.4,
              }}
            >
              Changes save as you type.
            </div>
          </div>
        </div>

        {/* ── Photograph ────────────────────────────────────────────── */}
        <PhotographPreview
          imageUrl={displayedPhoto}
          boothNumber={boothNumber}
          sold={sold}
          topLeftAction={
            <button
              onClick={openPhotoPicker}
              disabled={replaceBusy}
              aria-label="Replace photo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 11px 7px 9px",
                background: "rgba(20,18,12,0.58)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff9e8",
                fontFamily: FONT_SYS,
                fontSize: 12,
                cursor: replaceBusy ? "default" : "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <RefreshCw size={12} strokeWidth={2} style={{ color: "#fff9e8" }} />
              Replace photo
            </button>
          }
        />

        {/* Post-it overhang spacer */}
        <div style={{ height: 22 }} aria-hidden="true" />

        {/* Replace-photo confirmation bar (renders when pendingPhoto is set) */}
        <AnimatePresence>
          {pendingPhoto && (
            <motion.div
              key="replace-confirm"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              style={{
                margin: "0 22px 14px",
                padding: "12px 14px",
                borderRadius: 10,
                background: v1.inkWash,
                border: `1px solid ${v1.inkHairline}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkPrimary,
                  flex: 1,
                  minWidth: 140,
                }}
              >
                New photo picked. Save replacement?
              </span>
              <button
                onClick={confirmReplacePhoto}
                disabled={replaceBusy}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: v1.green,
                  color: "#fff",
                  fontFamily: FONT_SYS,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: replaceBusy ? "default" : "pointer",
                  opacity: replaceBusy ? 0.7 : 1,
                }}
              >
                {replaceBusy ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelReplacePhoto}
                disabled={replaceBusy}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: v1.inkMuted,
                  cursor: replaceBusy ? "default" : "pointer",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                }}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {replaceError && (
          <div style={{ padding: "0 22px 14px" }}>
            <AmberNotice>{replaceError}</AmberNotice>
          </div>
        )}

        {/* ── Posting-as ────────────────────────────────────────────── */}
        {post.vendor && <PostingAsBlock vendor={post.vendor} />}

        {/* ── Fields ────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "18px 22px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Title */}
          <EditField
            field="title"
            label="Title"
            savedFlash={savedFlash}
            error={fieldErrors.title ?? null}
            onRetry={() => {
              setFieldErrors((e) => ({ ...e, title: undefined }));
              scheduleTextSave("title", title);
            }}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              style={inputStyle}
            />
          </EditField>

          {/* Caption */}
          <EditField
            field="caption"
            label="Caption"
            optional
            savedFlash={savedFlash}
            error={fieldErrors.caption ?? null}
            onRetry={() => {
              setFieldErrors((e) => ({ ...e, caption: undefined }));
              scheduleTextSave("caption", caption);
            }}
          >
            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              rows={3}
              style={{ ...inputStyle, minHeight: 78, resize: "none", lineHeight: 1.5 }}
            />
          </EditField>

          {/* Price */}
          <EditField
            field="price_asking"
            label="Price"
            optional
            savedFlash={savedFlash}
            error={fieldErrors.price_asking ?? null}
            onRetry={() => {
              setFieldErrors((e) => ({ ...e, price_asking: undefined }));
              scheduleTextSave("price_asking", price);
            }}
          >
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: FONT_SYS,
                  fontSize: 16,
                  color: v1.inkMuted,
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
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </EditField>

          {/* Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 13,
                color: v1.inkMuted,
                lineHeight: 1.3,
              }}
            >
              Status
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <StatusPill
                label="Available"
                active={post.status === "available"}
                onClick={() => handleStatusChange("available")}
              />
              <StatusPill
                label="Sold"
                active={post.status === "sold"}
                onClick={() => handleStatusChange("sold")}
              />
            </div>

            <AnimatePresence>
              {statusConfirm && (
                <motion.div
                  key={`status-${statusConfirm}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: v1.inkWash,
                    borderRadius: 10,
                    border: `0.5px solid ${v1.inkHairline}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Check size={13} strokeWidth={3} style={{ color: v1.green, flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: v1.inkMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    {statusConfirm === "sold"
                      ? "Marked sold. Shoppers will see this as \u201cFound a home.\u201d"
                      : "Marked available again."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Remove from shelf (destructive quiet link) ────────────── */}
        <div
          style={{
            padding: "28px 22px 40px",
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
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.red,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "rgba(139,32,32,0.38)",
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
                  fontFamily: FONT_IM_FELL,
                  fontSize: 16,
                  color: v1.inkPrimary,
                  marginBottom: 8,
                }}
              >
                Remove this find?
              </div>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: v1.inkMuted,
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
                    fontFamily: FONT_IM_FELL,
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
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: v1.inkMuted,
                    background: "none",
                    border: "none",
                    cursor: removing ? "default" : "pointer",
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: v1.inkFaint,
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════

function EditField({
  field,
  label,
  optional,
  savedFlash,
  error,
  onRetry,
  children,
}: {
  field: TextField;
  label: string;
  optional?: boolean;
  savedFlash: TextField | null;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const showSaved = savedFlash === field;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 18,
        }}
      >
        <label
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 13,
            color: v1.inkMuted,
            lineHeight: 1.3,
          }}
        >
          {label}
          {optional && (
            <span style={{ color: v1.inkFaint, fontStyle: "italic", marginLeft: 4 }}>
              (optional)
            </span>
          )}
        </label>

        <AnimatePresence>
          {showSaved && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, x: 2 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: FONT_SYS,
                fontStyle: "italic",
                fontSize: 11,
                color: v1.green,
              }}
            >
              <Check size={11} strokeWidth={3} />
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <AmberNotice
          action={
            <button
              onClick={onRetry}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: FONT_SYS,
                fontSize: 12,
                color: v1.amber,
                cursor: "pointer",
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "rgba(122,92,30,0.4)",
                textUnderlineOffset: 3,
              }}
            >
              Retry
            </button>
          }
        >
          {error}
        </AmberNotice>
      )}

      {children}
    </div>
  );
}

function StatusPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "12px 14px",
        borderRadius: 999,
        fontFamily: FONT_IM_FELL,
        fontSize: 16,
        color: active ? v1.inkPrimary : v1.inkMuted,
        fontWeight: active ? 500 : 400,
        background: v1.inkWash,
        border: active ? `1.5px solid ${v1.inkPrimary}` : "1.5px solid transparent",
        textAlign: "center",
        lineHeight: 1.2,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "border-color 0.18s ease, color 0.18s ease",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: FONT_SYS,
  fontSize: 16,
  color: v1.inkPrimary,
  background: v1.inkWash,
  border: `1px solid ${v1.inkHairline}`,
  borderRadius: 14,
  padding: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  lineHeight: 1.4,
  WebkitTapHighlightColor: "transparent",
};
