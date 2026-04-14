// app/find/[id]/page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Tag, ArrowLeft, Heart, Pencil, Store, MapPin } from "lucide-react";
import { getPost, getVendorPosts, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import { getCachedUserId, getSession, isAdmin } from "@/lib/auth";
import { colors } from "@/lib/tokens";
import { flagKey, mapsUrl } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ─── Owner detection ───────────────────────────────────────────────────────────

async function detectOwnershipAsync(post: Post): Promise<boolean> {
  try {
    const session = await getSession();
    if (session?.user && isAdmin(session.user)) return true;
    const sessionUid = getCachedUserId() ?? session?.user?.id;
    if (sessionUid && post.vendor?.user_id && sessionUid === post.vendor.user_id) return true;
    const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
    if (raw) {
      const profile = JSON.parse(raw) as LocalVendorProfile;
      const profileVendorId = profile.vendor_id;
      const postVendorId    = post.vendor_id ?? post.vendor?.id;
      if (profileVendorId && postVendorId && profileVendorId === postVendorId) return true;
    }
  } catch {}
  return false;
}

// ─── Booth location box ────────────────────────────────────────────────────────

function BoothBox({ boothNumber }: { boothNumber: string }) {
  return (
    <div style={{
      position: "absolute", bottom: -22, left: 20,
      background: colors.tag, border: `1.5px solid ${colors.tagBorder}`,
      borderRadius: 8, padding: "6px 14px 7px",
      boxShadow: "0 2px 8px rgba(26,24,16,0.10), 0 1px 3px rgba(26,24,16,0.06)",
    }}>
      <div style={{
        fontFamily: "system-ui, sans-serif", fontSize: 8, fontWeight: 600,
        textTransform: "uppercase" as const, letterSpacing: "1.8px",
        color: colors.textMuted, lineHeight: 1, marginBottom: 4,
      }}>
        Booth
      </div>
      <div style={{
        fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700,
        color: colors.green, letterSpacing: "0.2px", lineHeight: 1,
      }}>
        {boothNumber}
      </div>
    </div>
  );
}

// ─── Shelf card ────────────────────────────────────────────────────────────────

function ShelfCard({ post }: { post: Post }) {
  const [imgErr, setImgErr] = useState(false);
  const isSold = post.status === "sold";
  const hasImg = !!post.image_url && !imgErr;

  return (
    <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none", flexShrink: 0, width: "42vw", maxWidth: 170 }}>
      <div style={{ borderRadius: 14, overflow: "hidden", background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(26,24,16,0.06)", position: "relative", opacity: isSold ? 0.62 : 1, transition: "opacity 0.2s" }}>
        {hasImg ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
            <img src={post.image_url!} alt={post.title} loading="lazy" onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.99) saturate(0.96)" }} />
            {isSold && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.3px",
                padding: "2px 7px", borderRadius: 4,
                background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                whiteSpace: "nowrap",
              }}>
                Found a home
              </div>
            )}
          </div>
        ) : (
          <div style={{ aspectRatio: "3/4", padding: "12px 10px", display: "flex", alignItems: "flex-end", background: colors.surface }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 600, color: colors.textMid, lineHeight: 1.3 }}>{post.title}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, paddingLeft: 2, fontFamily: "Georgia, serif", fontSize: 10, color: colors.textMuted, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
        {post.title}
      </div>
    </Link>
  );
}

// ─── Shelf section ─────────────────────────────────────────────────────────────

function ShelfSection({ vendorId, currentPostId, onReady }: { vendorId: string; currentPostId: string; onReady: (hasItems: boolean) => void }) {
  const [items, setItems] = useState<Post[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getVendorPosts(vendorId, 12).then(posts => {
      const filtered = posts.filter(p => p.id !== currentPostId);
      setItems(filtered);
      setReady(true);
      onReady(filtered.length > 0);
    });
  }, [vendorId, currentPostId, onReady]);

  if (!ready || items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }} style={{ marginBottom: 32 }}>
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500 }}>
          More from this shelf
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: colors.textFaint }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", overflowY: "hidden", paddingLeft: 20, paddingRight: 20, paddingBottom: 4, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }} className="hide-scrollbar">
        {items.map(item => (
          <div key={item.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <ShelfCard post={item} />
          </div>
        ))}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FindDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [post,          setPost]          = useState<Post | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [actionBusy,    setActionBusy]    = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [shelfHasItems, setShelfHasItems] = useState(false);
  const [isSaved,       setIsSaved]       = useState(false);

  useEffect(() => {
    if (!id) return;
    try { setIsSaved(safeStorage.getItem(flagKey(id)) === "1"); } catch {}
    getPost(id).then(async data => {
      setPost(data);
      setLoading(false);
      if (data) {
        const isOwner = await detectOwnershipAsync(data);
        setIsMyPost(isOwner);
      }
    });
  }, [id]);

  function handleToggleSave() {
    if (!id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) safeStorage.setItem(flagKey(id), "1");
      else      safeStorage.removeItem(flagKey(id));
    } catch {}
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title ?? "A Treehouse find", text: post?.caption ?? "", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleToggleSold() {
    if (!post || actionBusy) return;
    const next = post.status === "sold" ? "available" : "sold";
    setActionBusy(true);
    const ok = await updatePostStatus(post.id, next);
    if (ok) setPost(p => p ? { ...p, status: next } : p);
    setActionBusy(false);
  }

  async function handleDelete() {
    if (!post || actionBusy) return;
    setActionBusy(true);
    const ok = await deletePost(post.id);
    if (ok) router.replace("/");
    else    setActionBusy(false);
  }

  const handleShelfReady = useCallback((hasItems: boolean) => { setShelfHasItems(hasItems); }, []);

  function handleExploreBooth() {
    const slug = post?.vendor?.slug;
    if (slug) router.push(`/shelf/${slug}`);
  }

  const showOwnerControls = isMyPost;

  const mapLink = post?.mall?.address
    ? mapsUrl(post.mall.address)
    : post?.mall
    ? mapsUrl(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)
    : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: colors.textFaint, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: colors.textPrimary }}>This find has moved on.</div>
        <button onClick={() => router.push("/")} style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.green, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Browse the feed</button>
      </div>
    );
  }

  const isSold      = post.status === "sold";
  const hasVendor   = !!post.vendor;
  const boothNumber = post.vendor?.booth_number ?? null;
  const hasBoothBox = !!boothNumber;
  const hasContent  = !!(post.caption || post.description);
  const hasPrice    = post.price_asking != null;
  const vendorSlug  = post.vendor?.slug ?? null;

  // Mall location label for inline line
  const mallLocationLabel = post.mall?.name
    ? post.mall.address
      ? `${post.mall.name} · ${post.mall.address}`
      : `${post.mall.name}${post.mall.city ? ` · ${post.mall.city}` : ""}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* ── 1. Hero image ── */}
      <div style={{ position: "relative", width: "100%", marginBottom: hasBoothBox ? 34 : 0 }}>
        {post.image_url ? (
          <img src={post.image_url} alt={post.title}
            style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", filter: isSold ? "grayscale(0.35) brightness(0.88)" : "none" }} />
        ) : (
          <div style={{ height: 120, background: colors.surface }} />
        )}

        {isSold && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.6px", padding: "5px 12px", borderRadius: 6, background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.95)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
            Found a home
          </div>
        )}

        {/* Back button */}
        <button onClick={() => router.back()} aria-label="Go back"
          style={{ position: "absolute", top: "max(14px, env(safe-area-inset-top, 14px))", left: 14, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,237,230,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid rgba(26,24,16,0.10)`, cursor: "pointer", boxShadow: "0 2px 8px rgba(26,24,16,0.12)", WebkitTapHighlightColor: "transparent" }}>
          <ArrowLeft size={15} style={{ color: colors.textMid }} />
        </button>

        {/* Heart + Share */}
        <div style={{ position: "absolute", bottom: 12, right: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleToggleSave} aria-label={isSaved ? "Remove from My Finds" : "Save to My Finds"}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isSaved ? colors.greenSolid : "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "none", cursor: "pointer", transition: "background 0.18s", boxShadow: isSaved ? "0 2px 8px rgba(30,77,43,0.40)" : "0 1px 5px rgba(0,0,0,0.20)", WebkitTapHighlightColor: "transparent" }}>
            <Heart size={15} strokeWidth={isSaved ? 0 : 1.8} style={{ color: "rgba(255,255,255,0.95)", fill: isSaved ? "rgba(255,255,255,0.95)" : "none" }} />
          </button>
          <button onClick={handleShare}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <Send size={14} style={{ color: copied ? "#a8d5b5" : "rgba(255,255,255,0.92)" }} />
          </button>
        </div>

        {hasBoothBox && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
            <BoothBox boothNumber={boothNumber!} />
          </motion.div>
        )}
      </div>

      {/* ── 2. Content block ── */}
      <div style={{ padding: "16px 20px 0" }}>

        {/* Mall inline line — compact, left-aligned, right under image */}
        {post.mall && mallLocationLabel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.04 }}
            style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}
          >
            <MapPin size={11} style={{ color: colors.green, flexShrink: 0 }} />
            {mapLink ? (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "Georgia, serif", fontSize: 12, color: colors.green,
                  textDecoration: "none", borderBottom: `1px solid ${colors.greenBorder}`,
                  lineHeight: 1.3,
                }}
              >
                {mallLocationLabel} · Directions
              </a>
            ) : (
              <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: colors.textMuted, lineHeight: 1.3 }}>
                {mallLocationLabel}
              </span>
            )}
          </motion.div>
        )}

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.22, letterSpacing: "-0.5px", margin: "0 0 8px" }}>
            {post.title}
          </h1>
        </motion.div>

        {/* Price + status row */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: 0.05 }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}
        >
          {hasPrice && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.green, letterSpacing: "-0.3px" }}>
              ${post.price_asking!.toLocaleString()}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isSold && (
              <motion.div animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: colors.green, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 500, color: isSold ? colors.textMuted : colors.green, letterSpacing: "0.1px" }}>
              {isSold ? "Found a home" : "On Display"}
            </span>
          </div>
        </motion.div>

        {hasContent && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }} style={{ marginBottom: 24 }}>
            {post.caption && (
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: colors.textMid, lineHeight: 1.85, margin: "0 0 10px" }}>
                {post.caption}
              </p>
            )}
            {post.description && (
              <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.8, margin: 0 }}>
                {post.description}
              </p>
            )}
          </motion.div>
        )}

        {/* Explore the Booth CTA */}
        {vendorSlug && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <button onClick={handleExploreBooth}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 28, fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif", color: colors.green, background: colors.greenLight, border: `1px solid ${colors.greenBorder}`, cursor: "pointer", transition: "background 0.18s, color 0.18s", WebkitTapHighlightColor: "transparent" }}>
              <Store size={15} style={{ color: colors.green }} />
              Explore the Booth
            </button>
          </motion.div>
        )}
      </div>

      {/* ── More from this shelf ── */}
      {hasVendor && (
        <>
          {shelfHasItems && <div style={{ height: 1, background: colors.border, margin: "0 0 24px" }} />}
          <ShelfSection vendorId={post.vendor!.id} currentPostId={post.id} onReady={handleShelfReady} />
        </>
      )}

      {/* ── Owner controls ── */}
      {showOwnerControls && (
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}
            style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", padding: "12px 16px 14px" }}>
            <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 500, marginBottom: 10 }}>
              Manage
            </div>
            <button onClick={() => router.push(`/post/edit/${post.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 10, WebkitTapHighlightColor: "transparent" }}>
              <Pencil size={11} style={{ color: colors.green }} />
              <span style={{ fontSize: 11, color: colors.green, fontWeight: 500 }}>Edit listing</span>
            </button>
            <button onClick={handleToggleSold} disabled={actionBusy}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: actionBusy ? "default" : "pointer", padding: "4px 0", marginBottom: 10, opacity: actionBusy ? 0.5 : 1, WebkitTapHighlightColor: "transparent" }}>
              <Tag size={11} style={{ color: isSold ? colors.green : colors.textFaint }} />
              <span style={{ fontSize: 11, color: isSold ? colors.green : colors.textMuted, fontWeight: isSold ? 600 : 400 }}>
                {isSold ? "Mark as available" : "Mark as sold"}
              </span>
            </button>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", WebkitTapHighlightColor: "transparent" }}>
                <Trash2 size={11} style={{ color: colors.textFaint }} />
                <span style={{ fontSize: 11, color: colors.textFaint }}>Delete post</span>
              </button>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ padding: "13px", borderRadius: 11, background: colors.redBg, border: `1px solid ${colors.redBorder}` }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: colors.red, marginBottom: 4 }}>Delete this post?</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 13, lineHeight: 1.65 }}>
                    This can&apos;t be undone. The image and listing will be permanently removed.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleDelete} disabled={actionBusy}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#fff", background: colors.red, border: "none", cursor: "pointer", opacity: actionBusy ? 0.6 : 1 }}>
                      {actionBusy ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button onClick={() => setShowDelete(false)}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, color: colors.textMid, background: colors.surface, border: `1px solid ${colors.border}`, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      )}

      <div style={{ paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }} />
      <BottomNav active={null} />

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
