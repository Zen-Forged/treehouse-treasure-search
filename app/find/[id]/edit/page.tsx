// app/find/[id]/edit/page.tsx
// v1.2 — "Edit your find" page. New route. See build spec §5 and the
// approved mockup docs/mockups/edit-listing-v1-2.html.
//
// v1.2 polish pass (session 31E) applied four changes per on-device QA feedback:
//   1. Post-it on photograph removed (redundant metadata on a management surface).
//      We pass boothNumber={null} to <PhotographPreview> — the primitive no-ops
//      the post-it when the prop is null.
//   2. <PostingAsBlock> vendor attribution row retired on this surface entirely.
//      Edit is focused on image/title/caption/price — identity is implicit.
//      /post/preview KEEPS <PostingAsBlock> because publishing is a moment where
//      vendor identity matters; editing an already-committed post is not.
//   3. Caption textarea auto-grows with content. Min height 78px; grows to
//      scrollHeight as user types. iOS-native feel. Manual resize stays off.
//   4. No functional changes to autosave / status / replace-photo / remove flows.
//
// The layout deliberately parallels /post/preview in chrome (masthead, photograph
// primitive, field rhythm) but removes the vendor-attribution row since identity
// is committed. Three surfaces are unique to Edit:
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
//   3. Ownership check via post.vendor.user_id; isAdmin(user) bypasses.
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
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import PhotographPreview from "@/components/PhotographPreview";
import AmberNotice from "@/components/AmberNotice";
import type { Post } from "@/types/treehouse";

const AUTOSAVE_DEBOUNCE_MS  = 800;
const SAVED_FADE_MS         = 2000;
const STATUS_CONFIRM_FADE_MS = 3000;

// v1.2 polish (session 31E): caption auto-grow bounds. Floor matches prior
// static minHeight so fresh posts with a short caption look identical to how
// they looked before this change. Ceiling prevents wild expansion on pasted
// essays — beyond this the textarea's own scroll takes over.
const CAPTION_MIN_HEIGHT_PX = 78;
const CAPTION_MAX_HEIGHT_PX = 260;

// Fields we locally debounce before PATCHing. Status and image_url are
// handled as immediate writes elsewhere.
type TextField = "title" | "caption" | "price_asking";

export default function EditFindPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Core state
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
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
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

  // v1.2 polish (session 31E) — ref on the caption textarea so an effect can
  // size it to content on initial fill + on every keystroke. See captionResize
  // effect below.
  const captionRef = useRef<HTMLTextAreaElement | null>(null);

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
      setStage("edit");
    })();

    return () => {
      cancelled = true;
      Object.values(debouncers.current).forEach((t) => { if (t) clearTimeout(t); });
      debouncers.current = {};
      if (savedTimer.current)  clearTimeout(savedTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // v1.2 polish (session 31E) — caption auto-grow effect. Fires on every
  // caption change (including the initial setCaption from the server fetch)
  // so the textarea lands at the correct size for its content on first paint.
  // Algorithm: reset height to auto (so scrollHeight reads the true content
  // height, not the previous style.height), then clamp scrollHeight between
  // CAPTION_MIN_HEIGHT_PX and CAPTION_MAX_HEIGHT_PX.
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

  // Autosave helpers
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

  function scheduleTextSave(field: TextField, rawValue: string) {
    if (debouncers.current[field]) clearTimeout(debouncers.current[field]);

    debouncers.current[field] = setTimeout(() => {
      if (!post) return;

      let update: Record<string, string | number | null>;
      if (field === "title") {
        const t = rawValue.trim();
        if (t.length < 1) {
          setFieldErrors((prev) => ({ ...prev, title: "Title can't be empty." }));
          return;
        }
        update = { title: t };
      } else if (field === "caption") {
        const c = rawValue.trim();
        update = { caption: c.length > 0 ? c : null };
      } else {
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

  // Status toggle (immediate write)
  async function handleStatusChange(next: "available" | "sold") {
    if (!post || post.status === next) return;
    const prev = post.status;
    setPost({ ...post, status: next });

    const ok = await patchPost({ status: next }, null);
    if (!ok) {
      setPost({ ...post, status: prev });
      setFieldErrors((e) => ({ ...e, title: "Couldn't update status — try again." }));
      return;
    }

    setStatusConfirm(next);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatusConfirm(null), STATUS_CONFIRM_FADE_MS);
  }

  // Replace photo flow (immediate write on confirm)
  function openPhotoPicker() {
    setReplaceError(null);
    galleryInputRef.current?.click();
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

  // Remove from shelf (quiet destructive)
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

  // Callbacks for onChange wiring
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

  // Render: loading / forbidden / notfound
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
            fontFamily: FONT_LORA,
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
        {/* Masthead (Mode C) */}
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
                fontFamily: FONT_LORA,
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
                fontFamily: FONT_LORA,
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

        {/* Photograph — v1.2 polish (session 31E): boothNumber explicitly null
            so <PhotographPreview> skips the post-it. Redundant metadata on a
            management surface. */}
        <PhotographPreview
          imageUrl={displayedPhoto}
          boothNumber={null}
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

        {/* v1.2 polish (session 31E): post-it overhang spacer retired along
            with the post-it. Photograph now sits cleanly above the content.
            The 18px bottom padding inside <PhotographPreview> already gives
            breathing room before the replace confirmation bar / fields. */}

        {/* Replace-photo confirmation bar */}
        <AnimatePresence>
          {pendingPhoto && (
            <motion.div
              key="replace-confirm"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              style={{
                margin: "14px 22px 4px",
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
                  fontFamily: FONT_LORA,
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
                  fontFamily: FONT_LORA,
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

        {/* v1.2 polish (session 31E): <PostingAsBlock> retired on this surface.
            Edit is focused on image/title/caption/price. Vendor identity is
            implicit once the post exists — publishing was the identity moment,
            editing is not. /post/preview keeps <PostingAsBlock> because that
            surface IS the identity moment. */}

        {/* Fields */}
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

          {/* Caption — v1.2 polish (session 31E) auto-grow via captionRef + effect.
              Start height matches prior static minHeight so first paint is
              unchanged for short captions; grows with content; hard-clamped
              so pasted essays don't explode the layout. */}
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
              ref={captionRef}
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: CAPTION_MIN_HEIGHT_PX,
                maxHeight: CAPTION_MAX_HEIGHT_PX,
                resize: "none",
                lineHeight: 1.5,
                overflowY: "auto",
              }}
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
                fontFamily: FONT_LORA,
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
                      fontFamily: FONT_LORA,
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

        {/* Remove from shelf (destructive quiet link) */}
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
                fontFamily: FONT_LORA,
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
                  fontFamily: FONT_LORA,
                  fontSize: 16,
                  color: v1.inkPrimary,
                  marginBottom: 8,
                }}
              >
                Remove this find?
              </div>
              <div
                style={{
                  fontFamily: FONT_LORA,
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
                    fontFamily: FONT_LORA,
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
                    fontFamily: FONT_LORA,
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

// Helpers

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
            fontFamily: FONT_LORA,
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
        fontFamily: FONT_LORA,
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
