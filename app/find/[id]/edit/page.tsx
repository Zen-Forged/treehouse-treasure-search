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
import { getPost, deletePost } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
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
      setStatus(fetched.status === "sold" ? "sold" : "available");
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
    const updates = {
      title:         trimmedTitle,
      caption:       captionTrimmed.length > 0 ? captionTrimmed : null,
      price_asking:  priceValue,
      status,
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
      router.replace(`/find/${post.id}`);
    } catch (err) {
      console.error("[edit] submit failed:", err);
      setSubmitError("Couldn't save your changes — try again.");
      setSubmitting(false);
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

  const canSubmit = title.trim().length >= 1 && !submitting;

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
              fontFamily: FONT_LORA,
              fontSize: 24,
              color: v1.inkPrimary,
              letterSpacing: "-0.005em",
              lineHeight: 1.15,
              marginBottom: 4,
            }}
          >
            Edit find details
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              lineHeight: 1.5,
              maxWidth: 290,
              margin: "0 auto",
            }}
          >
            Click submit when finished
          </div>
        </div>

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
                fontFamily: FONT_LORA,
                fontSize: 15,
                color: v1.inkMid,
                lineHeight: 1.25,
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
                active={status === "available"}
                onClick={() => setStatus("available")}
              />
              <StatusPill
                label="Sold"
                active={status === "sold"}
                onClick={() => setStatus("sold")}
              />
            </div>
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
          background: "rgba(232,221,199,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
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
              style={{ fontFamily: FONT_LORA, fontStyle: "italic" }}
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
          fontFamily: FONT_LORA,
          fontSize: 15,
          color: v1.inkMid,
          lineHeight: 1.25,
        }}
      >
        {label}
        {optional && (
          <span
            style={{
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkFaint,
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
  background: v1.postit,
  border: `1px solid ${v1.inkHairline}`,
  borderRadius: 14,
  padding: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  lineHeight: 1.4,
  WebkitTapHighlightColor: "transparent",
};
