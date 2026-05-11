// app/post/edit/[id]/page.tsx
// Edit an existing post — owner/admin only.
//
// FLOW:
//   1. Load the post by ID. Verify ownership — redirect to / if not owner.
//   2. Show current image with optional "Replace photo" affordance.
//   3. Edit title, caption, price (pre-filled with current values).
//   4. "Save changes" → optionally upload new image → updatePost() → back to /find/[id]
//
// Image replacement goes through /api/post-image (server route, service role key).
// If no new photo is picked, the existing image_url is kept unchanged.
// Price validation: must be a positive number if provided.

"use client";

export const dynamic = "force-dynamic";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, X, Check, Loader } from "lucide-react";
import { getPost, updatePost } from "@/lib/posts";
import { compressImage, uploadPostImageViaServer } from "@/lib/imageUpload";
import { getSession, isAdmin, getCachedUserId } from "@/lib/auth";
import { v2 } from "@/lib/tokens";
import FormButton from "@/components/FormButton";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import { clearPostCache, clearVendorPostsCache } from "@/lib/findContext";
import type { Post } from "@/types/treehouse";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function detectOwnership(post: Post): Promise<boolean> {
  try {
    const session = await getSession();
    if (session?.user && isAdmin(session.user)) return true;
    const uid = getCachedUserId() ?? session?.user?.id;
    if (uid && post.vendor?.user_id && uid === post.vendor.user_id) return true;
    const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
    if (raw) {
      const profile = JSON.parse(raw) as LocalVendorProfile;
      const postVendorId = post.vendor_id ?? post.vendor?.id;
      if (profile.vendor_id && postVendorId && profile.vendor_id === postVendorId) return true;
    }
  } catch {}
  return false;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg:          v2.bg.main,
  surface:     v2.surface.warm,
  border:      v2.border.light,
  textPrimary: v2.text.primary,
  textMid:     v2.text.secondary,
  textMuted:   v2.text.muted,
  textFaint:   v2.text.muted,
  green:       v2.accent.green,
  greenLight:  v2.accent.greenSoft,
  greenBorder: v2.accent.greenMid,
  greenSolid:  v2.accent.green,
  input:       v2.surface.card,
  inputBorder: v2.border.light,
  red:         v2.accent.red,
  redBg:       v2.surface.error,
  redBorder:   v2.border.error,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 9,
  background: C.input, border: `1px solid ${C.inputBorder}`,
  color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 9, color: C.textMuted, textTransform: "uppercase",
  letterSpacing: "1.8px", display: "block", marginBottom: 6,
};

// ─── Stage machine ────────────────────────────────────────────────────────────

type Stage = "loading" | "editing" | "saving" | "done" | "forbidden" | "error";

// ─── Inner component ──────────────────────────────────────────────────────────

function EditPostInner() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [post,          setPost]          = useState<Post | null>(null);
  const [stage,         setStage]         = useState<Stage>("loading");
  const [mounted,       setMounted]       = useState(false);
  const [priceError,    setPriceError]    = useState<string | null>(null);
  const [errorDetail,   setErrorDetail]   = useState<string | null>(null);

  const [editTitle,   setEditTitle]   = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editPrice,   setEditPrice]   = useState("");

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const pendingImageRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const p = await getPost(postId);
      if (!p) { router.replace("/"); return; }

      const isOwner = await detectOwnership(p);
      if (!isOwner) {
        setStage("forbidden");
        setTimeout(() => router.replace(`/find/${postId}`), 1500);
        return;
      }

      setPost(p);
      setEditTitle(p.title ?? "");
      setEditCaption(p.caption ?? "");
      setEditPrice(p.price_asking != null ? String(p.price_asking) : "");
      setCurrentImageUrl(p.image_url ?? null);
      setStage("editing");
    })();
  }, [postId]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const reader = new FileReader();
      const rawData = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(rawData);
      setNewImagePreview(compressed);
      pendingImageRef.current = compressed;
    } catch (err) {
      console.error("[edit] handleFile failed:", err);
      setErrorDetail(err instanceof Error ? err.message : "Couldn't read that image.");
      setStage("error");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  function clearNewImage() {
    setNewImagePreview(null);
    pendingImageRef.current = null;
  }

  // ── Save changes ──
  async function handleSave() {
    if (!post || !editTitle.trim()) return;

    // Price validation — must be a positive number if provided
    if (editPrice.trim()) {
      const priceVal = parseFloat(editPrice.trim());
      if (isNaN(priceVal) || priceVal < 0) {
        setPriceError("Price must be a positive number.");
        return;
      }
    }
    setPriceError(null);

    setStage("saving");
    setErrorDetail(null);

    try {
      let imageUrl = post.image_url ?? undefined;

      // If the vendor picked a new photo, upload it. Any failure aborts the
      // save — we do NOT silently keep the old URL and pretend everything
      // worked (session 14 lesson: silent upload failures create orphans).
      if (pendingImageRef.current) {
        const vendorId = post.vendor_id ?? post.vendor?.id;
        if (!vendorId) {
          setErrorDetail("Missing vendor id — cannot upload new photo.");
          setStage("error");
          return;
        }
        try {
          imageUrl = await uploadPostImageViaServer(pendingImageRef.current, vendorId);
        } catch (err) {
          console.error("[edit] image upload failed, aborting save:", err);
          setErrorDetail(err instanceof Error ? err.message : "Couldn't upload new photo.");
          setStage("error");
          return;
        }
      }

      const priceNum = editPrice.trim() ? parseFloat(editPrice.trim()) : null;

      const ok = await updatePost(post.id, {
        title:        editTitle.trim(),
        caption:      editCaption.trim() || undefined,
        price_asking: priceNum != null && !isNaN(priceNum) ? priceNum : null,
        ...(imageUrl !== (post.image_url ?? undefined) ? { image_url: imageUrl } : {}),
      });

      if (!ok) { setStage("error"); return; }

      // Phase B QA fix #2 (session 100) — invalidate the shared post cache
      // so /find/[id] re-fetches the freshly-edited row instead of showing
      // the pre-edit cached snapshot. Session 101 — also invalidate the
      // vendor-posts cache so the booth carousel re-fetches with the
      // updated title / sold flag.
      clearPostCache(post.id);
      if (post.vendor_id) clearVendorPostsCache(post.vendor_id);

      setStage("done");
      setTimeout(() => {
        router.refresh();
        router.push(`/find/${post.id}`);
      }, 1400);

    } catch (err) {
      console.error("[edit] save failed:", err);
      setErrorDetail(err instanceof Error ? err.message : "Couldn't save changes.");
      setStage("error");
    }
  }

  const showToast = stage === "saving" || stage === "done" || stage === "error";
  const toastEl = (
    <AnimatePresence>
      {showToast && (
        <div key="toast-shell" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <motion.div
            key="toast-inner"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              pointerEvents: "auto",
              width: "min(300px, calc(100vw - 48px))",
              background: stage === "error" ? v2.accent.red : stage === "done" ? v2.accent.greenDark : v2.text.primary,
              borderRadius: 20, padding: "22px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              boxShadow: "0 8px 40px rgba(0,0,0,0.30)", textAlign: "center",
            }}
          >
            {stage === "saving" && <Loader size={20} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />}
            {stage === "done" && (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} style={{ color: v2.surface.card }} />
              </div>
            )}
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: v2.surface.card, lineHeight: 1.3, marginBottom: 4 }}>
                {stage === "saving" ? "Saving changes…" : stage === "done" ? "Listing updated!" : (errorDetail ?? "Something went wrong")}
              </div>
              {stage === "saving" && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Just a moment…</div>}
              {stage === "done"   && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Heading back to the listing…</div>}
            </div>
            {stage === "error" && (
              <button onClick={() => { setStage("editing"); setErrorDetail(null); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 16px" }}>
                Dismiss
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted }}>
          Loading…
        </motion.div>
      </div>
    );
  }

  if (stage === "forbidden") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.textPrimary, marginBottom: 8 }}>Not your listing</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>Redirecting…</div>
        </div>
      </div>
    );
  }

  const displayImage = newImagePreview ?? currentImageUrl;
  const canSave = editTitle.trim().length > 0 && stage === "editing";

  return (
    <>
      {mounted && createPortal(toastEl, document.body)}

      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 40 }}>
          <button onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <ArrowLeft size={18} strokeWidth={1.6} style={{ color: C.textMid }} />
          </button>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1 }}>Edit Listing</div>
            {post?.vendor && (
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>
                {post.vendor.display_name}{post.vendor.booth_number ? ` · Booth ${post.vendor.booth_number}` : ""}
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: "18px 16px", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Photo</label>
            {displayImage ? (
              <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: C.surface }}>
                <img src={displayImage} alt="Listing photo" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: 12, gap: 8, background: "linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 60%)" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => cameraRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.30)", color: v2.surface.card, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      <Camera size={12} /> Take new photo
                    </button>
                    <button onClick={() => galleryRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.30)", color: v2.surface.card, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      Choose from library
                    </button>
                  </div>
                </div>
                {newImagePreview && (
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 12, background: C.green, fontSize: 10, fontWeight: 600, color: v2.surface.card }}>New photo</div>
                    <button onClick={clearNewImage}
                      style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={12} style={{ color: v2.surface.card }} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => cameraRef.current?.click()}
                  style={{ flex: 1, padding: "28px 12px", borderRadius: 14, border: `1px dashed rgba(30,77,43,0.3)`, background: C.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Camera size={20} style={{ color: C.green }} />
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>Take photo</span>
                </button>
                <button onClick={() => galleryRef.current?.click()}
                  style={{ flex: 1, padding: "28px 12px", borderRadius: 14, border: `1px dashed ${C.border}`, background: C.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🖼</span>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>From library</span>
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              placeholder="What is this?"
              style={{ ...inputStyle, fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600 }}
              autoFocus={!displayImage} />
          </div>

          {/* Caption */}
          <div>
            <label style={labelStyle}>Caption <span style={{ color: C.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)}
              placeholder="A short description or story about this piece…" rows={3}
              style={{ ...inputStyle, fontFamily: "Georgia, serif", fontStyle: editCaption ? "italic" : "normal", lineHeight: 1.65, resize: "vertical" as const }} />
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>Price <span style={{ color: C.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "monospace", fontSize: 14, color: C.textMuted, pointerEvents: "none" }}>$</span>
              <input type="number" inputMode="decimal" min="0" value={editPrice}
                onChange={e => { setEditPrice(e.target.value); if (priceError) setPriceError(null); }}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: 26, fontFamily: "monospace", borderColor: priceError ? C.red : C.inputBorder }} />
            </div>
            {priceError && (
              <div style={{ fontSize: 11, color: C.red, marginTop: 5 }}>{priceError}</div>
            )}
          </div>

          {/* Save */}
          <FormButton
            onClick={handleSave}
            disabled={!canSave}
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
              marginTop: 4,
            }}
          >
            Save changes
          </FormButton>
        </main>
      </div>

      <style>{`.hidden { display: none; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}

export default function EditPostPage() {
  return (
    <Suspense>
      <EditPostInner />
    </Suspense>
  );
}
