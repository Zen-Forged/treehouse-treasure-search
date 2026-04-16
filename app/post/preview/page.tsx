// app/post/preview/page.tsx
// Vendor post flow — Step 2: Preview + edit before saving to shelf.

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Pencil, Camera } from "lucide-react";
import { createPost, createVendor, uploadPostImage, slugify } from "@/lib/posts";
import { postStore } from "@/lib/postStore";
import { safeStorage } from "@/lib/safeStorage";
import { ensureAnonSession } from "@/lib/auth";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.1)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.18)",
  input:       "rgba(255,255,255,0.7)",
  inputBorder: "rgba(26,26,24,0.14)",
  header:      "rgba(240,237,230,0.96)",
};

const FACEBOOK_PAGE_URL = "https://www.facebook.com/KentuckyTreehouse";

function compressForUpload(dataUrl: string, maxWidth = 1200, quality = 0.78): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length > 1_000_000) {
        const canvas2 = document.createElement("canvas");
        const scale2  = 0.75;
        canvas2.width  = Math.round(canvas.width  * scale2);
        canvas2.height = Math.round(canvas.height * scale2);
        canvas2.getContext("2d")!.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
        resolve(canvas2.toDataURL("image/jpeg", 0.72));
      } else {
        resolve(result);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function generateTitleAndCaption(imageDataUrl: string): Promise<{ title: string; caption: string }> {
  try {
    const thumb = await compressForUpload(imageDataUrl, 800, 0.7);
    const res = await fetch("/api/post-caption", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageDataUrl: thumb }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { title: data.title ?? "", caption: data.caption ?? "" };
  } catch (err) {
    console.error("[preview] generateTitleAndCaption failed:", err);
    return { title: "", caption: "" };
  }
}

// ── Item 2c: Full image — no maxHeight constraint, objectFit contain ──────────
function ItemImage({ src }: { src: string }) {
  return (
    <div style={{
      width: "100%",
      borderRadius: 14,
      overflow: "hidden",
      background: C.surface,
      // Show full image without cropping — vendor needs to see exactly what they captured
    }}>
      <img
        src={src}
        alt="Your find"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// ── Item 3: Edit field label row — pencil icon always visible ─────────────────
function EditableLabel({
  label, isEditing, onToggle,
}: {
  label: string;
  isEditing: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <label style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase" as const, letterSpacing: "1.8px", lineHeight: 1 }}>
        {label}
      </label>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: isEditing ? C.greenLight : C.surface,
          border: `1px solid ${isEditing ? C.greenBorder : C.border}`,
          borderRadius: 20, padding: "4px 10px",
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <Pencil size={10} style={{ color: isEditing ? C.green : C.textMuted }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: isEditing ? C.green : C.textMuted, letterSpacing: "0.2px" }}>
          {isEditing ? "Done" : "Edit"}
        </span>
      </button>
    </div>
  );
}

type Stage = "loading" | "edit" | "publishing" | "done" | "error";

export default function PostPreviewPage() {
  const router = useRouter();

  const [image,       setImage]       = useState<string | null>(null);
  const [profile,     setProfile]     = useState<LocalVendorProfile | null>(null);
  const [stage,       setStage]       = useState<Stage>("loading");
  const [errorDetail, setErrorDetail] = useState<string>("");

  const [title,     setTitle]     = useState("");
  const [caption,   setCaption]   = useState("");
  const [price,     setPrice]     = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [editCap,   setEditCap]   = useState(false);
  const [editPrice, setEditPrice] = useState(false);

  const started = useRef(false);

  useEffect(() => {
    const draft = postStore.get();
    const raw = safeStorage.getItem(LOCAL_VENDOR_KEY);

    if (!draft || !raw) { router.replace("/post"); return; }

    let prof: LocalVendorProfile;
    try { prof = JSON.parse(raw); } catch { router.replace("/post"); return; }

    setImage(draft.imageDataUrl);
    setProfile(prof);

    if (!started.current) {
      started.current = true;
      generateTitleAndCaption(draft.imageDataUrl).then(({ title: t, caption: c }) => {
        setTitle(t);
        setCaption(c);
        setStage("edit");
      });
    }
  }, []);

  async function handlePublish() {
    if (!image || !profile || !title.trim()) return;
    setStage("publishing");
    setErrorDetail("");

    try {
      if (!profile.display_name?.trim()) {
        setErrorDetail("Profile error: display_name is empty. Go back and re-save your vendor profile.");
        throw new Error("missing display_name");
      }
      if (!profile.mall_id?.trim()) {
        setErrorDetail("Profile error: mall_id is empty. Safari may have cleared your saved profile. Go back and re-select your mall.");
        throw new Error("missing mall_id");
      }

      let userId = profile.user_id ?? null;
      if (!userId) {
        userId = await ensureAnonSession();
        if (userId) {
          const updated = { ...profile, user_id: userId };
          safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated));
          setProfile(updated);
        }
      }

      let vendorId   = profile.vendor_id ?? null;
      let vendorSlug = profile.slug ?? null;

      if (!vendorId) {
        const baseSlug = slugify(profile.display_name);
        const slug     = baseSlug + "-" + Date.now().toString(36);

        const { data: vendor, error: vendorErr } = await createVendor({
          mall_id:      profile.mall_id,
          display_name: profile.display_name,
          booth_number: profile.booth_number || undefined,
          slug,
          user_id:      userId ?? undefined,
        });

        if (!vendor) {
          setErrorDetail(
            `Vendor creation failed.\n` +
            `mall_id: "${profile.mall_id}"\n` +
            `display_name: "${profile.display_name}"\n` +
            `Supabase error: ${vendorErr ?? "null (no response)"}`
          );
          throw new Error("vendor null");
        }

        vendorId   = vendor.id;
        vendorSlug = vendor.slug;

        const updated: LocalVendorProfile = {
          ...profile,
          vendor_id: vendor.id,
          slug:      vendor.slug,
          user_id:   userId ?? undefined,
        };
        safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated));
        setProfile(updated);
      }

      let uploadImage = image;
      try { uploadImage = await compressForUpload(image, 1200, 0.78); } catch {}

      let imageUrl: string | null = null;
      try {
        imageUrl = await uploadPostImage(uploadImage, vendorId);
        if (!imageUrl) console.warn("[publish] image upload returned null — posting without image");
      } catch (uploadErr) {
        console.warn("[publish] image upload threw:", uploadErr);
      }

      const priceNum = price.trim() ? parseFloat(price.replace(/[^0-9.]/g, "")) : null;

      const { data: post, error: postErr } = await createPost({
        vendor_id:      vendorId,
        mall_id:        profile.mall_id,
        title:          title.trim(),
        caption:        caption.trim() || undefined,
        image_url:      imageUrl ?? undefined,
        price_asking:   priceNum && !isNaN(priceNum) ? priceNum : null,
        location_label: profile.booth_number ? `Booth ${profile.booth_number}` : undefined,
      });

      if (!post) {
        setErrorDetail(
          `Post insert failed.\n` +
          `vendor_id: "${vendorId}"\n` +
          `mall_id: "${profile.mall_id}"\n` +
          `Supabase error: ${postErr ?? "null (no response)"}`
        );
        throw new Error("post null");
      }

      postStore.clear();
      setStage("done");

    } catch (err) {
      console.error("[publish] error:", err);
      setStage("error");
    }
  }

  const canPublish   = title.trim().length >= 2 && stage === "edit";
  const isPublishing = stage === "publishing";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
    background: C.input, border: `1px solid ${C.greenBorder}`,
    color: C.textPrimary, fontSize: 14, outline: "none",
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {image && (
          <div style={{ width: "78%", borderRadius: 14, overflow: "hidden", opacity: 0.55 }}>
            <img src={image} alt="" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
          </div>
        )}
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontSize: 13, color: C.textMuted, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          Identifying your find…
        </motion.div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "0 24px" }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(30,77,43,0.1)", border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={28} style={{ color: C.green }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Saved to shelf.</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>It&apos;s live in the Treehouse feed.</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <button onClick={() => router.push("/my-shelf")}
            style={{ width: "100%", padding: "14px", borderRadius: 13, fontSize: 14, fontWeight: 600, color: "#fff", background: C.green, border: "none", cursor: "pointer" }}>
            View my shelf
          </button>
          <a href={FACEBOOK_PAGE_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", width: "100%", padding: "13px", borderRadius: 13, fontSize: 13, fontWeight: 500, color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
            Visit us on Facebook
          </a>
          <button onClick={() => router.push("/post")}
            style={{ width: "100%", padding: "12px", borderRadius: 13, fontSize: 12, color: C.textFaint, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Camera size={13} style={{ color: C.textFaint }} />
            Add another find
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.textPrimary, textAlign: "center" }}>Something went wrong.</div>
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.6 }}>The post couldn&apos;t be saved.</div>
        {errorDetail && (
          <div style={{ fontSize: 11, color: C.textFaint, textAlign: "left", lineHeight: 1.7, fontFamily: "monospace", background: C.surface, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {errorDetail}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button onClick={() => setStage("edit")} style={{ padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", background: C.green, border: "none", cursor: "pointer", width: "100%" }}>
            Try again
          </button>
          <button onClick={() => router.push("/post")} style={{ padding: "11px 24px", borderRadius: 12, fontSize: 12, color: C.textMuted, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", width: "100%" }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 12px", background: C.header, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
          <ArrowLeft size={14} style={{ color: C.textMid }} />
        </button>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, lineHeight: 1 }}>Preview</div>
          <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>
            {profile?.display_name}{profile?.booth_number ? ` · Booth ${profile.booth_number}` : ""}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: "14px 15px", paddingBottom: "max(110px, env(safe-area-inset-bottom, 110px))", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

        {/* Item 2c: Full image — no maxHeight, no cropping */}
        {image && <ItemImage src={image} />}

        {/* Item 3: Title — Edit button always visible as pill */}
        <div>
          <EditableLabel label="Title" isEditing={editTitle} onToggle={() => setEditTitle(e => !e)} />
          <AnimatePresence mode="wait">
            {editTitle ? (
              <motion.div key="title-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mid-century ceramic vase"
                  style={{ ...inputStyle, fontFamily: "Georgia, serif" }}
                  autoFocus
                />
              </motion.div>
            ) : (
              <motion.div key="title-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditTitle(true)}
                style={{ padding: "10px 13px", borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: "text" }}
              >
                {title
                  ? <p style={{ fontSize: 15, color: C.textPrimary, lineHeight: 1.3, margin: 0, fontFamily: "Georgia, serif", fontWeight: 600 }}>{title}</p>
                  : <p style={{ fontSize: 13, color: C.textFaint, margin: 0, fontStyle: "italic" }}>Tap to add a title…</p>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Item 3: Caption — Edit button always visible as pill */}
        <div>
          <EditableLabel label="Caption" isEditing={editCap} onToggle={() => setEditCap(e => !e)} />
          <AnimatePresence mode="wait">
            {editCap ? (
              <motion.div key="cap-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea rows={4} value={caption} onChange={e => setCaption(e.target.value)}
                  style={{ ...inputStyle, fontFamily: "Georgia, serif", lineHeight: 1.65, resize: "none" } as React.CSSProperties}
                />
              </motion.div>
            ) : (
              <motion.div key="cap-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditCap(true)}
                style={{ padding: "12px 13px", borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: "text" }}
              >
                {caption
                  ? <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.68, margin: 0, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{caption}</p>
                  : <p style={{ fontSize: 13, color: C.textFaint, margin: 0, fontStyle: "italic" }}>Tap to add a caption…</p>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Item 3: Price — Edit button added, consistent with title/caption pattern */}
        <div>
          <EditableLabel
            label={`Asking price ${!editPrice ? "(optional — tap Edit to set)" : "(optional)"}`}
            isEditing={editPrice}
            onToggle={() => setEditPrice(e => !e)}
          />
          <AnimatePresence mode="wait">
            {editPrice ? (
              <motion.div key="price-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "monospace", fontSize: 14, color: C.textMuted, pointerEvents: "none" }}>$</span>
                  <input type="number" inputMode="decimal" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
                    style={{ ...inputStyle, paddingLeft: 22, fontFamily: "monospace" }}
                    autoFocus
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div key="price-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditPrice(true)}
                style={{ padding: "10px 13px", borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: "text" }}
              >
                {price
                  ? <p style={{ fontSize: 15, color: C.textPrimary, lineHeight: 1.3, margin: 0, fontFamily: "monospace", fontWeight: 600 }}>${price}</p>
                  : <p style={{ fontSize: 13, color: C.textFaint, margin: 0, fontStyle: "italic" }}>No price set</p>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Attribution */}
        {profile && (
          <div style={{ padding: "10px 13px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Posting as</div>
            <div style={{ fontSize: 13, color: C.textMid }}>
              {[profile.display_name, profile.booth_number ? `Booth ${profile.booth_number}` : null, `${profile.mall_name}, ${profile.mall_city}`].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}
      </main>

      {/* Save bar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", padding: "10px 15px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))", background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `1px solid ${C.border}`, zIndex: 50 }}
      >
        <button
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          style={{ width: "100%", padding: "15px 22px", borderRadius: 14, fontSize: 15, fontWeight: 600, letterSpacing: "0.2px", cursor: canPublish && !isPublishing ? "pointer" : "default", transition: "all 0.2s", color: canPublish ? "#fff" : C.textFaint, background: canPublish ? C.green : C.surfaceDeep, border: "none", boxShadow: canPublish ? "0 2px 12px rgba(30,77,43,0.25)" : "none" }}
        >
          {isPublishing
            ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Saving…</motion.span>
            : !title.trim() ? "Add a title to save" : "Save to Shelf"
          }
        </button>
      </motion.div>
    </div>
  );
}
