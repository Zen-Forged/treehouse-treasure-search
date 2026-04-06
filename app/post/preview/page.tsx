// app/post/preview/page.tsx
// Vendor post flow — Step 2: Preview + Publish.

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { createPost, createVendor, uploadPostImage, slugify } from "@/lib/posts";
import { postStore } from "@/lib/postStore";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

// ── Palette ───────────────────────────────────────────────────────────────────
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
  greenBorder: "rgba(30,77,43,0.18)",
  input:       "rgba(255,255,255,0.7)",
  inputBorder: "rgba(26,26,24,0.14)",
  header:      "rgba(240,237,230,0.96)",
};

async function generateCaption(imageDataUrl: string): Promise<string> {
  try {
    const res  = await fetch("/api/post-caption", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body:   JSON.stringify({ imageDataUrl }),
    });
    const data = await res.json();
    return data.caption ?? "";
  } catch { return ""; }
}

function ItemImage({ src }: { src: string }) {
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", aspectRatio: "4/3" }}>
      <img src={src} alt="Your find" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

type Stage = "loading" | "edit" | "publishing" | "done" | "error";

export default function PostPreviewPage() {
  const router = useRouter();

  const [image,   setImage]   = useState<string | null>(null);
  const [profile, setProfile] = useState<LocalVendorProfile | null>(null);
  const [stage,   setStage]   = useState<Stage>("loading");
  const [postId,  setPostId]  = useState<string | null>(null);

  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");
  const [editCap, setEditCap] = useState(false);

  const captionStarted = useRef(false);

  useEffect(() => {
    const draft = postStore.get();
    const raw   = localStorage.getItem(LOCAL_VENDOR_KEY);
    if (!draft || !raw) { router.replace("/post"); return; }
    const prof = JSON.parse(raw) as LocalVendorProfile;
    setImage(draft.imageDataUrl);
    setProfile(prof);
    if (!captionStarted.current) {
      captionStarted.current = true;
      generateCaption(draft.imageDataUrl).then(cap => { setCaption(cap); setStage("edit"); });
    }
  }, []);

  async function handlePublish() {
    if (!image || !profile || !title.trim()) return;
    setStage("publishing");
    try {
      let vendorId = profile.vendor_id;
      if (!vendorId) {
        const slug   = slugify(profile.display_name) + "-" + Date.now().toString(36);
        const vendor = await createVendor({ mall_id: profile.mall_id, display_name: profile.display_name, booth_number: profile.booth_number || undefined, slug });
        if (!vendor) throw new Error("Vendor creation failed");
        vendorId = vendor.id;
        const updated: LocalVendorProfile = { ...profile, vendor_id: vendor.id, slug: vendor.slug };
        try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated)); } catch {}
        setProfile(updated);
      }
      const imageUrl = await uploadPostImage(image, vendorId);
      const priceNum = price.trim() ? parseFloat(price.replace(/[^0-9.]/g, "")) : null;
      const post = await createPost({
        vendor_id:      vendorId,
        mall_id:        profile.mall_id,
        title:          title.trim(),
        caption:        caption.trim() || undefined,
        image_url:      imageUrl ?? undefined,
        price_asking:   priceNum && !isNaN(priceNum) ? priceNum : null,
        location_label: profile.booth_number ? `Booth ${profile.booth_number}` : undefined,
      });
      if (!post) throw new Error("Post creation failed");
      postStore.clear();
      setPostId(post.id);
      setStage("done");
    } catch (err) {
      console.error("[post/preview] publish error:", err);
      setStage("error");
    }
  }

  const canPublish   = title.trim().length >= 2 && stage === "edit";
  const isPublishing = stage === "publishing";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
    background: C.input, border: `1px solid ${C.inputBorder}`,
    color: C.textPrimary, fontSize: 14, outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: C.textMuted, textTransform: "uppercase",
    letterSpacing: "1.8px", display: "block", marginBottom: 6,
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {image && (
          <div style={{ width: "78%", borderRadius: 14, overflow: "hidden", opacity: 0.55 }}>
            <img src={image} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
          </div>
        )}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontSize: 13, color: C.textMuted, fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          Crafting a caption…
        </motion.div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "0 24px" }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(30,77,43,0.1)", border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Check size={28} style={{ color: C.green }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Find posted.</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>It's live in the Treehouse feed.</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          {postId && (
            <button onClick={() => router.push(`/find/${postId}`)} style={{ width: "100%", padding: "14px", borderRadius: 13, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", background: C.green, border: "none" }}>
              View your post
            </button>
          )}
          <button onClick={() => router.push("/")} style={{ width: "100%", padding: "13px", borderRadius: 13, fontSize: 13, color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            Back to feed
          </button>
          <button onClick={() => router.push("/post")} style={{ width: "100%", padding: "12px", borderRadius: 13, fontSize: 12, color: C.textFaint, background: "transparent", border: "none", cursor: "pointer" }}>
            Post another find
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
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.6 }}>The post couldn't be saved. Check your connection and try again.</div>
        <button onClick={() => setStage("edit")} style={{ padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", background: C.green, border: "none", cursor: "pointer" }}>
          Try again
        </button>
      </div>
    );
  }

  // ── Edit (main) ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
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

      {/* Content */}
      <main style={{ flex: 1, padding: "14px 15px", paddingBottom: "max(110px, env(safe-area-inset-bottom, 110px))", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        {image && <ItemImage src={image} />}

        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid-century ceramic vase" style={inputStyle} />
        </div>

        {/* Caption */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Caption</label>
            <button onClick={() => setEditCap(e => !e)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
              <Pencil size={10} style={{ color: C.textMuted }} />
              <span style={{ fontSize: 9, color: C.textMuted }}>{editCap ? "Done" : "Edit"}</span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {editCap ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea rows={4} value={caption} onChange={e => setCaption(e.target.value)}
                  style={{ ...inputStyle, fontFamily: "Georgia, serif", lineHeight: 1.65, resize: "none", border: `1px solid ${C.greenBorder}` } as React.CSSProperties}
                />
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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

        {/* Price */}
        <div>
          <label style={labelStyle}>
            Asking price <span style={{ color: C.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "monospace", fontSize: 14, color: C.textMuted, pointerEvents: "none" }}>$</span>
            <input type="number" inputMode="decimal" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
              style={{ ...inputStyle, paddingLeft: 22, fontFamily: "monospace" }} />
          </div>
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

      {/* Fixed publish bar */}
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
            ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Publishing…</motion.span>
            : !title.trim() ? "Add a title to publish" : "Publish to Treehouse"
          }
        </button>
      </motion.div>
    </div>
  );
}
