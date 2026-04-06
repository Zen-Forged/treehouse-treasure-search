// app/post/preview/page.tsx
// Vendor post flow — Step 2: Preview + Publish.
// Reads the captured image from postStore (in-memory, survives router.push),
// auto-generates a Treehouse caption via Claude, lets the vendor edit
// everything, then publishes to Supabase.

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { createPost, createVendor, uploadPostImage, slugify } from "@/lib/posts";
import { postStore } from "@/lib/postStore";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

// ─── Caption generation ───────────────────────────────────────────────────────

async function generateCaption(imageDataUrl: string): Promise<string> {
  try {
    const res  = await fetch("/api/post-caption", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageDataUrl }),
    });
    const data = await res.json();
    return data.caption ?? "";
  } catch {
    return "";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ItemImage({ src }: { src: string }) {
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", aspectRatio: "4/3" }}>
      <img
        src={src} alt="Your find"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.84) saturate(0.78) sepia(0.05)" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(5,13,5,0.35) 100%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Stage = "loading" | "edit" | "publishing" | "done" | "error";

export default function PostPreviewPage() {
  const router = useRouter();

  const [image,   setImage]   = useState<string | null>(null);
  const [profile, setProfile] = useState<LocalVendorProfile | null>(null);
  const [stage,   setStage]   = useState<Stage>("loading");
  const [postId,  setPostId]  = useState<string | null>(null);

  // Editable fields
  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");
  const [editCap, setEditCap] = useState(false);

  const captionStarted = useRef(false);

  // On mount: read from postStore + localStorage, then generate caption
  useEffect(() => {
    const draft = postStore.get();
    const raw   = localStorage.getItem(LOCAL_VENDOR_KEY);

    if (!draft || !raw) {
      router.replace("/post");
      return;
    }

    const prof = JSON.parse(raw) as LocalVendorProfile;
    setImage(draft.imageDataUrl);
    setProfile(prof);

    if (!captionStarted.current) {
      captionStarted.current = true;
      generateCaption(draft.imageDataUrl).then(cap => {
        setCaption(cap);
        setStage("edit");
      });
    }
  }, []);

  // Publish handler
  async function handlePublish() {
    if (!image || !profile || !title.trim()) return;
    setStage("publishing");

    try {
      // 1. Ensure vendor row exists
      let vendorId = profile.vendor_id;
      if (!vendorId) {
        const slug   = slugify(profile.display_name) + "-" + Date.now().toString(36);
        const vendor = await createVendor({
          mall_id:      profile.mall_id,
          display_name: profile.display_name,
          booth_number: profile.booth_number || undefined,
          slug,
        });
        if (!vendor) throw new Error("Vendor creation failed");
        vendorId = vendor.id;
        const updated: LocalVendorProfile = { ...profile, vendor_id: vendor.id, slug: vendor.slug };
        try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated)); } catch {}
        setProfile(updated);
      }

      // 2. Upload image
      const imageUrl = await uploadPostImage(image, vendorId);

      // 3. Create post
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

      // 4. Clear the draft
      postStore.clear();

      setPostId(post.id);
      setStage("done");
    } catch (err) {
      console.error("[post/preview] publish error:", err);
      setStage("error");
    }
  }

  const canPublish = title.trim().length >= 2 && stage === "edit";
  const isPublishing = stage === "publishing";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {image && (
          <div style={{ width: "78%", borderRadius: 14, overflow: "hidden", opacity: 0.45 }}>
            <img src={image} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", filter: "brightness(0.7) saturate(0.6)" }} />
          </div>
        )}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontSize: 13, color: "#4a3a1e", fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          Crafting a caption…
        </motion.div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "0 24px" }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(46,110,46,0.18)", border: "1px solid rgba(109,188,109,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Check size={28} style={{ color: "#6dbc6d" }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#f5f0e8", marginBottom: 8 }}>Find posted.</div>
          <div style={{ fontSize: 13, color: "#4a3a1e", lineHeight: 1.6 }}>It's live in the Treehouse feed.</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          {postId && (
            <button
              onClick={() => router.push(`/find/${postId}`)}
              style={{ width: "100%", padding: "14px", borderRadius: 13, fontSize: 14, fontWeight: 600, color: "#f5f0e8", cursor: "pointer", background: "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))", border: "1px solid rgba(109,188,109,0.15)" }}
            >
              View your post
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            style={{ width: "100%", padding: "13px", borderRadius: 13, fontSize: 13, color: "rgba(168,144,78,0.5)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Back to feed
          </button>
          <button
            onClick={() => router.push("/post")}
            style={{ width: "100%", padding: "12px", borderRadius: 13, fontSize: 12, color: "rgba(106,85,40,0.3)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Post another find
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#c8b47e", textAlign: "center" }}>Something went wrong.</div>
        <div style={{ fontSize: 13, color: "#3a2e18", textAlign: "center", lineHeight: 1.6 }}>The post couldn't be saved. Check your connection and try again.</div>
        <button
          onClick={() => setStage("edit")}
          style={{ padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#f5f0e8", background: "rgba(13,31,13,0.7)", border: "1px solid rgba(109,188,109,0.12)", cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Edit (main) ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 12px",
        background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(200,180,126,0.055)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.1)", cursor: "pointer" }}>
          <ArrowLeft size={14} style={{ color: "#7a6535" }} />
        </button>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "#f5f0e8", lineHeight: 1 }}>Preview</div>
          <div style={{ fontSize: 8, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>
            {profile?.display_name}{profile?.booth_number ? ` · Booth ${profile.booth_number}` : ""}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "14px 15px", paddingBottom: "max(110px, env(safe-area-inset-bottom, 110px))", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        {image && <ItemImage src={image} />}

        {/* Title */}
        <div>
          <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px", display: "block", marginBottom: 6 }}>Title</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Mid-century ceramic vase"
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, background: "rgba(5,13,5,0.8)", border: "1px solid rgba(109,188,109,0.12)", color: "#f5f0e8", fontSize: 14, outline: "none" }}
          />
        </div>

        {/* Caption */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px" }}>Caption</label>
            <button
              onClick={() => setEditCap(e => !e)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
            >
              <Pencil size={10} style={{ color: "#3a2e18" }} />
              <span style={{ fontSize: 9, color: "#3a2e18" }}>{editCap ? "Done" : "Edit"}</span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {editCap ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  rows={4} value={caption} onChange={e => setCaption(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, background: "rgba(5,13,5,0.8)", border: "1px solid rgba(200,180,126,0.18)", color: "#f5f0e8", fontSize: 14, outline: "none", fontFamily: "Georgia, serif", lineHeight: 1.65, resize: "none" }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditCap(true)}
                style={{ padding: "12px 13px", borderRadius: 9, background: "rgba(13,31,13,0.45)", border: "1px solid rgba(109,188,109,0.09)", cursor: "text" }}
              >
                {caption
                  ? <p style={{ fontSize: 14, color: "#8a7050", lineHeight: 1.68, margin: 0, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{caption}</p>
                  : <p style={{ fontSize: 13, color: "#2a2010", margin: 0, fontStyle: "italic" }}>Tap to add a caption…</p>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price */}
        <div>
          <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px", display: "block", marginBottom: 6 }}>
            Asking price <span style={{ color: "#1a1206", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "monospace", fontSize: 14, color: "#4a3a1e", pointerEvents: "none" }}>$</span>
            <input
              type="number" inputMode="decimal" min="0" step="1"
              value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 22px", borderRadius: 9, background: "rgba(5,13,5,0.8)", border: "1px solid rgba(109,188,109,0.12)", color: "#f5f0e8", fontSize: 14, outline: "none", fontFamily: "monospace" }}
            />
          </div>
        </div>

        {/* Attribution */}
        {profile && (
          <div style={{ padding: "10px 13px", borderRadius: 10, background: "rgba(8,20,8,0.4)", border: "1px solid rgba(109,188,109,0.07)" }}>
            <div style={{ fontSize: 8, color: "#1e1808", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Posting as</div>
            <div style={{ fontSize: 13, color: "#4a3a1e" }}>
              {[profile.display_name, profile.booth_number ? `Booth ${profile.booth_number}` : null, `${profile.mall_name}, ${profile.mall_city}`].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}
      </main>

      {/* Fixed publish bar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto",
          padding: "10px 15px",
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          background: "rgba(5,13,5,0.97)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(200,180,126,0.055)",
          zIndex: 50,
        }}
      >
        <button
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          style={{
            width: "100%", padding: "15px 22px", borderRadius: 14,
            fontSize: 15, fontWeight: 600, letterSpacing: "0.2px",
            cursor: canPublish && !isPublishing ? "pointer" : "default",
            transition: "all 0.2s",
            color:      canPublish ? "#f5f0e8" : "#1e1808",
            background: canPublish
              ? "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))"
              : "rgba(13,31,13,0.4)",
            border:     "1px solid rgba(109,188,109,0.15)",
            boxShadow:  canPublish ? "0 4px 20px rgba(5,15,5,0.5)" : "none",
          }}
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
