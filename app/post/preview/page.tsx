// app/post/preview/page.tsx
// Social post preview screen — shows a formatted card of how the post will
// look before sharing. Sits after /enhance-text, before /share.
// Gives the user a "see it live" moment with copy, native share, and save.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { useFinds, sessionToFind } from "@/hooks/useFinds";

const ease = [0.25, 0.1, 0.25, 1] as const;

// ── Treehouse logo mark (inline SVG so no network dep) ──────────────────────
function TreehouseMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L3 9h3v10h4v-5h4v5h4V9h3L12 3z" fill="rgba(200,180,126,0.55)" />
    </svg>
  );
}

// ── Simulated post card ──────────────────────────────────────────────────────
function PostCard({
  image,
  title,
  caption,
  postType,
  storyStatus,
}: {
  image:        string;
  title:        string;
  caption:      string;
  postType?:    string;
  storyStatus?: string;
}) {
  const timeAgo = "Just now";

  return (
    <motion.div
      className="w-full rounded-2xl overflow-hidden flex-shrink-0"
      style={{
        background: "rgba(13,24,13,0.7)",
        border:     "1px solid rgba(200,180,126,0.1)",
        boxShadow:  "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,180,126,0.04)",
      }}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease }}>

      {/* ── Post header (fake profile row) ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, rgba(46,82,33,0.9), rgba(13,31,13,1))",
            border: "1px solid rgba(200,180,126,0.2)",
          }}>
          <TreehouseMark size={16} />
        </div>

        {/* Name + time */}
        <div className="flex flex-col flex-1 min-w-0">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#d4c9b0", letterSpacing: "0.1px" }}>
            Kentucky Treehouse
          </span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 10, color: "#4a3a1e" }}>{timeAgo}</span>
            {storyStatus && storyStatus !== "Available" && (
              <>
                <span style={{ color: "#3a2a12", fontSize: 9 }}>·</span>
                <span style={{ fontSize: 9, color: "#6a5528" }}>{storyStatus}</span>
              </>
            )}
          </div>
        </div>

        {/* Post type pill */}
        {postType && (
          <div style={{
            padding: "2px 8px", borderRadius: 20, flexShrink: 0,
            fontSize: 8, fontWeight: 600, letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "#a8904e",
            background: "rgba(168,144,78,0.1)",
            border: "1px solid rgba(200,180,126,0.18)",
          }}>
            {postType}
          </div>
        )}
      </div>

      {/* ── Caption ── */}
      {caption && (
        <div className="px-4 pb-3">
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#c4b99a", lineHeight: 1.7 }}>
            {title ? (
              <>
                <span style={{ color: "#d4c9b0", fontWeight: 600 }}>{title}</span>
                {" — "}
                {caption}
              </>
            ) : caption}
          </p>
        </div>
      )}

      {/* ── Photo ── */}
      <div className="w-full flex-shrink-0" style={{ aspectRatio: "4/3", position: "relative" }}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.88) saturate(0.80) sepia(0.05)" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,12,5,0.45) 100%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Reaction strip (mock FB-style) ── */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: "1px solid rgba(109,188,109,0.05)" }}>
        <div className="flex items-center gap-1">
          {["👀", "🌿", "✨"].map((emoji, i) => (
            <span key={i} style={{ fontSize: 14 }}>{emoji}</span>
          ))}
          <span style={{ fontSize: 11, color: "#3a2a12", marginLeft: 4 }}>
            Be the first to react
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#2e2410" }}>Comment · Share</span>
      </div>
    </motion.div>
  );
}

// ── Caption selector (primary vs alt) ───────────────────────────────────────
function CaptionToggle({
  primary,
  alt,
  active,
  onChange,
}: {
  primary:  string;
  alt?:     string;
  active:   "primary" | "alt";
  onChange: (v: "primary" | "alt") => void;
}) {
  if (!alt) return null;
  return (
    <div className="flex gap-2 pt-1">
      {(["primary", "alt"] as const).map(v => (
        <button key={v} onClick={() => onChange(v)}
          style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 10,
            fontWeight: active === v ? 500 : 400,
            color:      active === v ? "#c8b47e" : "#4a3a1e",
            background: active === v ? "rgba(168,144,78,0.1)" : "transparent",
            border:     `1px solid ${active === v ? "rgba(200,180,126,0.25)" : "rgba(109,188,109,0.07)"}`,
            transition: "all 0.2s", cursor: "pointer", fontFamily: "inherit",
          }}>
          {v === "primary" ? "Caption A" : "Caption B"}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PostPreviewPage() {
  const router                    = useRouter();
  const { session, clearSession } = useFindSession();
  const { saveFind }              = useFinds();

  const [captionChoice, setCaptionChoice] = useState<"primary" | "alt">("primary");
  const [copied,  setCopied]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!session?.imageOriginal) router.replace("/");
  }, []);

  const story   = session?.story;
  const image   = session?.imageEnhanced ?? session?.imageOriginal ?? "";
  const title   = session?.identification?.title ?? "";
  const primary = story?.caption    ?? session?.captionRefined ?? session?.intentText ?? "";
  const alt     = story?.altCaption ?? "";

  const activeCaption = captionChoice === "alt" && alt ? alt : primary;

  // ── Copy caption to clipboard ──
  const handleCopy = async () => {
    const text = title ? `${title} — ${activeCaption}` : activeCaption;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // ── Native share sheet (Web Share API) ──
  const handleShare = async () => {
    setSharing(true);
    try {
      const text = title ? `${title} — ${activeCaption}` : activeCaption;

      // Try to share the image blob if available
      if (image && navigator.canShare) {
        const res  = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], "treehouse-find.jpg", { type: "image/jpeg" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ text, files: [file] });
          setSharing(false);
          return;
        }
      }

      // Fallback: share text only
      await navigator.share({ text });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.warn("[post/preview] share failed:", err);
      }
    }
    setSharing(false);
  };

  // ── Save to My Picks ──
  const handleSave = async () => {
    if (!session || saved) return;
    await saveFind(sessionToFind(session, "shared"));
    setSaved(true);
    clearSession();
    setTimeout(() => router.push("/finds"), 1100);
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      {/* ── Header ── */}
      <header
        className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{
          borderBottom:   "1px solid rgba(200,180,126,0.06)",
          background:     "rgba(5,15,5,0.92)",
          backdropFilter: "blur(20px)",
        }}>
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          Post preview
        </span>
      </header>

      {/* ── Main scroll area ── */}
      <main className="flex-1 flex flex-col px-5 py-5 gap-5 pb-44 overflow-y-auto">

        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}>
          <p style={{ fontSize: 12, color: "#4a3a1e", lineHeight: 1.55 }}>
            Here's how it'll look. Swap the caption, then copy or share.
          </p>
        </motion.div>

        {/* ── Post card ── */}
        {image && (
          <PostCard
            image={image}
            title={title}
            caption={activeCaption}
            postType={story?.postType}
            storyStatus={session?.storyStatus}
          />
        )}

        {/* ── Caption toggle + display ── */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}>

          <CaptionToggle
            primary={primary}
            alt={alt}
            active={captionChoice}
            onChange={setCaptionChoice}
          />

          <div
            className="px-4 py-4 rounded-2xl relative"
            style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(200,180,126,0.08)" }}>
            <p style={{
              fontFamily: "Georgia, serif", fontSize: 14,
              color: "#c4b99a", lineHeight: 1.7, paddingRight: 32,
            }}>
              {activeCaption || <span style={{ color: "#3a2a12", fontStyle: "italic" }}>No caption yet</span>}
            </p>
            <button
              onClick={handleCopy}
              style={{
                position: "absolute", top: 12, right: 12,
                background: "none", border: "none", cursor: "pointer", padding: 4,
              }}>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check"
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <Check size={14} color="#6dbc6d" />
                  </motion.span>
                ) : (
                  <motion.span key="copy"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <Copy size={14} color="#4a3a1e" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        {/* ── Action row: copy + native share ── */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease }}>

          <motion.button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 flex-1"
            style={{
              padding: "13px 16px", borderRadius: 14, fontSize: 13, fontWeight: 500,
              color:      copied ? "#6dbc6d" : "#a8904e",
              background: "rgba(13,31,13,0.5)",
              border:     `1px solid ${copied ? "rgba(109,188,109,0.25)" : "rgba(200,180,126,0.12)"}`,
              transition: "all 0.25s",
            }}
            whileTap={{ scale: 0.97 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy caption"}
          </motion.button>

          {canShare && (
            <motion.button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center justify-center gap-2 flex-1"
              style={{
                padding: "13px 16px", borderRadius: 14, fontSize: 13, fontWeight: 500,
                color:      "#d4c9b0",
                background: "rgba(13,31,13,0.7)",
                border:     "1px solid rgba(109,188,109,0.14)",
                opacity:    sharing ? 0.55 : 1,
                transition: "all 0.25s",
              }}
              whileTap={{ scale: 0.97 }}>
              <Share2 size={14} />
              {sharing ? "Opening…" : "Share"}
            </motion.button>
          )}
        </motion.div>

        {/* ── Image prompt (dim) ── */}
        {story?.imagePrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.28, ease }}>
            <div style={{
              fontSize: 9, color: "#2e2410",
              textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 7,
            }}>
              Image prompt
            </div>
            <div style={{
              padding: "11px 14px", borderRadius: 10,
              fontSize: 11, color: "#3a2a12", lineHeight: 1.6,
              background: "rgba(5,10,5,0.5)",
              border: "1px solid rgba(200,180,126,0.04)",
            }}>
              {story.imagePrompt}
            </div>
          </motion.div>
        )}

      </main>

      {/* ── Fixed save CTA ── */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{
          background:     "rgba(5,15,5,0.97)",
          backdropFilter: "blur(24px)",
          borderTop:      "1px solid rgba(200,180,126,0.06)",
          paddingBottom:  "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}>

        <div
          className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }}
        />

        <motion.button
          onClick={handleSave}
          disabled={saved}
          className="w-full flex items-center justify-center gap-2 font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-60"
          style={{
            padding:      "17px 22px",
            borderRadius: 16,
            fontSize:     15,
            background:   saved
              ? "rgba(109,188,109,0.18)"
              : "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border:     "1px solid rgba(109,188,109,0.16)",
            boxShadow:  saved ? "none" : "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)",
            transition: "all 0.3s",
          }}
          whileTap={saved ? {} : { scale: 0.97 }}>
          <span style={{
            position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          }} />
          {saved ? (
            <><BookmarkCheck size={16} />Saved to My Picks</>
          ) : (
            <><Bookmark size={16} />Save to My Picks</>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
