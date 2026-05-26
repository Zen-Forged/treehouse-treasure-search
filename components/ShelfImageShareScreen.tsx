// components/ShelfImageShareScreen.tsx
//
// Session 197 Arc 2 C3 — refactored to multi-card Story sequence wrapper.
//
// Replaces session-152's single-card 1080×1350 monolith with the 5-card
// Story sequence (StoryHeroCard + 3× StoryFindCard + StoryCtaCard) per
// session-196 design record §3.5 D4 (Frame β multi-card Story) + §6 Arc 2.
//
// Composition:
//   1. SlimHeader — vendor identity (session-152 path preserved)
//   2. Eyebrow line — "5-card Story sequence · Tap Share to post"
//   3. Carousel preview — horizontal scroll-snap of 5 captured-card <img>s
//      + position indicator ("Card N of 5")
//   4. Action row — Share (primary) / Download / Copy caption / Copy link
//   5. Caption echo (read-only) for vendor preview
//   6. Footer disclaimer
//   7. Off-screen capture container (5 Arc 1 cards mounted at full 1080×N
//      with position:fixed left:-99999)
//
// State machine combines two domains:
//   - posts: null (loading) → Post[] (loaded; empty array → no-posts branch)
//   - capture (from useShelfCapture): idle → rendering → ready | error
//
// C3 ships single-card share path (find:0 strongest card; session-152 parity)
// to keep main functional between commits. C4 swaps to navigator.share
// multi-file payload (all 5 cards in sequence). C5 + C6 add regenerate +
// reorder affordances against the same capture pipeline.
//
// ShelfImageTemplate.tsx retired as scope-adjacent byproduct per
// feedback_dead_code_cleanup_as_byproduct ✅ Promoted — no consumer remains
// after this refactor.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import { PiDownloadSimple, PiShareFat, PiCopySimple, PiLinkSimple, PiShuffle, PiDotsSixVertical } from "react-icons/pi";
import { track } from "@/lib/clientEvents";
import { getVendorWindowPosts } from "@/lib/posts";
import { generateShelfCaption, placeholderHeroHook } from "@/lib/aiShelfCaption";
import { useShelfCapture } from "@/lib/useShelfCapture";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import { SlimHeader } from "@/components/ui/SlimHeader";
import { StoryHeroCard } from "@/components/share-shelf/StoryHeroCard";
import { StoryFindCard } from "@/components/share-shelf/StoryFindCard";
import { StoryCtaCard } from "@/components/share-shelf/StoryCtaCard";
import type { Mall, Post, Vendor } from "@/types/treehouse";

export interface ShelfImageShareScreenProps {
  vendor:   Vendor;
  mall:     Mall | null;
  /** Public-facing /shelf/<slug> URL — embedded in QR + share payload. */
  boothUrl: string;
}

export function ShelfImageShareScreen({
  vendor,
  mall,
  boothUrl,
}: ShelfImageShareScreenProps) {
  const [posts, setPosts]               = useState<Post[] | null>(null);
  const [picks, setPicks]               = useState<Post[]>([]);
  const [captureKey, setCaptureKey]     = useState(0);
  const [aiHookSeed, setAiHookSeed]     = useState(0);
  const [copyToast, setCopyToast]       = useState<"caption" | "link" | null>(null);
  const containerRef                    = useRef<HTMLDivElement>(null);

  // ─── Mount: fire view event + fetch posts ────────────────────────────
  const trackPayload = useMemo(() => ({
    vendor_slug: vendor.slug,
    mall_id:     mall?.id ?? vendor.mall?.id ?? null,
  }), [vendor.slug, mall?.id, vendor.mall?.id]);

  useEffect(() => {
    track("share_shelf_image_viewed", trackPayload);
    let alive = true;
    getVendorWindowPosts(vendor.id).then(fetched => {
      if (!alive) return;
      setPosts(fetched);
      if (fetched.length > 0) {
        // Default picks per D10 — top 3 most-recent available posts.
        setPicks(fetched.slice(0, 3));
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor.id]);

  // ─── Capture pipeline gate ───────────────────────────────────────────
  const captureReady = picks.length === 3;
  const capture = useShelfCapture({
    containerRef,
    captureKey,
    enabled: captureReady,
  });

  // ─── Caption + hook gen (placeholder per Arc 4 swap-target) ──────────
  const caption = useMemo(() => {
    if (picks.length === 0) return "";
    return generateShelfCaption({
      vendor,
      mall,
      posts:  picks,
      format: "story",
      boothUrl,
    });
  }, [vendor, mall, picks, boothUrl]);

  const aiHook = useMemo(
    () => placeholderHeroHook(picks.length, aiHookSeed),
    [picks.length, aiHookSeed],
  );

  // ─── Auto-clear copy toast after 1.8s ────────────────────────────────
  useEffect(() => {
    if (!copyToast) return;
    const t = window.setTimeout(() => setCopyToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  // ─── Actions (C4: multi-file native share + download-all) ────────────
  // D14 navigator.share({ files: [...] }) with 5 PNG File objects in
  // sequence order. iOS Safari 16+ / Android Chrome 75+ support multi-file
  // payload. Defensive fallback ladder per design record risk register:
  //   1. canShare({ files: all 5 }) → native multi-file share
  //   2. canShare({ files: [hero] }) → native single-card share (degrade
  //      gracefully if device rejects multi-file)
  //   3. Desktop fallback → open FB sharer + download all 5 in sequence
  const handleNativeShare = useCallback(async () => {
    if (capture.status !== "ready") return;
    const files = buildOrderedFiles(capture.cards, vendor);
    if (files.length === 0) return;

    // Auto-copy caption FIRST so vendor pastes it into their composer.
    try { await navigator.clipboard.writeText(caption); } catch { /* non-fatal */ }

    const canMulti = typeof navigator !== "undefined"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files });

    if (canMulti && typeof navigator.share === "function") {
      try {
        await navigator.share({ files, text: caption, url: boothUrl });
        track("share_shelf_image_downloaded", { ...trackPayload, method: "native_share_multi", file_count: files.length });
        return;
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) console.error("[share-my-shelf] navigator.share multi-file failed:", err);
        if (isAbort) return; // user canceled — don't fall through to fallback
      }
    }

    // Fallback to single-card if multi-file rejected/unsupported but
    // single-file is. Mirrors session-152 path; vendor gets the hero card
    // they can post manually + subsequent cards via separate share/download.
    const single = files[0];
    const canSingle = typeof navigator !== "undefined"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [single] });

    if (canSingle && typeof navigator.share === "function") {
      try {
        await navigator.share({ files: [single], text: caption, url: boothUrl });
        track("share_shelf_image_downloaded", { ...trackPayload, method: "native_share_single", file_count: 1 });
        return;
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) console.error("[share-my-shelf] navigator.share single failed:", err);
        if (isAbort) return;
      }
    }

    // Desktop fallback — open FB sharer FIRST (must be inside user gesture)
    // + download all 5 in sequence so vendor can attach manually.
    const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(boothUrl)}`;
    window.open(fbHref, "_blank", "noopener,noreferrer");
    downloadFilesSequentially(files);
    track("share_shelf_image_downloaded", { ...trackPayload, method: "desktop_fallback", file_count: files.length });
    setCopyToast("caption");
  }, [capture, caption, boothUrl, vendor, trackPayload]);

  const handleDownload = useCallback(async () => {
    if (capture.status !== "ready") return;
    const files = buildOrderedFiles(capture.cards, vendor);
    if (files.length === 0) return;
    try { await navigator.clipboard.writeText(caption); } catch { /* */ }

    // iOS Safari / iOS PWA intercepts `<a download>` + blob URL as an
    // open-intent rather than a save-to-disk intent and routes to a
    // registered PNG handler (Instagram, Photos, etc.) — David's session 198
    // QA surfaced "Open in Instagram" instead of save. The canonical iOS
    // save path is navigator.share({ files }) with NO text/url payload so
    // the share sheet foregrounds "Save N Images" / "Save to Files" rather
    // than messaging apps. Non-iOS keeps the existing 5-sequential
    // `<a download>` path which routes cleanly to the Downloads folder on
    // Android Chrome + every desktop browser.
    const isIOS = typeof navigator !== "undefined"
      && /iPad|iPhone|iPod/.test(navigator.userAgent)
      && typeof navigator.share === "function"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files });

    if (isIOS) {
      try {
        await navigator.share({ files });
        track("share_shelf_image_downloaded", { ...trackPayload, method: "ios_save", file_count: files.length });
        setCopyToast("caption");
        return;
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) console.error("[share-my-shelf] iOS save-to-photos share failed:", err);
        if (isAbort) return; // user canceled — don't fall through
        // Non-abort error falls through to <a download> path below (best-
        // effort; will route to Instagram on iOS but at least attempts).
      }
    }

    downloadFilesSequentially(files);
    track("share_shelf_image_downloaded", { ...trackPayload, method: "download", file_count: files.length });
    setCopyToast("caption");
  }, [capture, caption, vendor, trackPayload]);

  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopyToast("caption");
    } catch { /* clipboard blocked — silent */ }
  }, [caption]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(boothUrl);
      setCopyToast("link");
    } catch { /* */ }
  }, [boothUrl]);

  // ─── Regenerate (D8) — re-rolls finds + cycles placeholder hook ───────
  // Per D8 (single affordance re-rolls finds + AI caption together) + D10
  // (regenerate re-rolls which 3 picks; random shuffle if vendor has >3
  // posts). Always bumps aiHookSeed so the hero hook visibly changes even
  // when picks can't change (vendor ≤3 posts), and bumps captureKey so
  // useShelfCapture re-runs against the new off-screen DOM.
  //
  // Real AI caption gen lands in Arc 4; until then placeholder cycles
  // through 5 hook variants per placeholderHeroHook (lib/aiShelfCaption).
  const handleRegenerate = useCallback(() => {
    if (!posts || posts.length === 0) return;
    if (posts.length > 3) {
      // Fisher-Yates-equivalent shuffle via Math.random sort — sufficient
      // for the 6-post window. Take first 3 after shuffle.
      const shuffled = [...posts].sort(() => Math.random() - 0.5);
      setPicks(shuffled.slice(0, 3));
    }
    setAiHookSeed(s => s + 1);
    setCaptureKey(k => k + 1);
  }, [posts]);

  // ─── Reorder (D3) — drag-rearrange the 3 finds within Story sequence ──
  // Per D3 (vendor input depth: zero-input + regenerate + reorder).
  // Hero (slot 0) + CTA (slot 4) stay fixed; only the 3 find slots
  // rearrange. framer-motion Reorder.Group on a separate compact chip row
  // below the carousel avoids touch-action conflict with the horizontal
  // scroll-snap carousel above.
  const handleReorder = useCallback((newOrder: Post[]) => {
    setPicks(newOrder);
    setCaptureKey(k => k + 1);
  }, []);

  // ─── Derived strings for SlimHeader ──────────────────────────────────
  const boothName   = vendor.display_name;
  const mallName    = mall?.name ?? vendor.mall?.name ?? "";
  const boothNo     = vendor.booth_number;
  const mallAddress = mall?.address ?? [mall?.city, mall?.state].filter(Boolean).join(", ");

  // Overall wrapper render state — combines posts fetch + capture status.
  // "insufficient-posts" branch is a schema-forced extension per
  // feedback_schema_forced_deviation_not_design_reversal ✅ Promoted —
  // D9 froze 5-card sequence (1 hero + 3 finds + 1 CTA) but didn't
  // enumerate the <3-posts case. The 3-find floor is structural for
  // MVP per D9; Tier B6 (pre-capture vendor inputs) would unblock 1-2
  // post vendors via variable card counts.
  const wrapperState: "loading-posts" | "no-posts" | "insufficient-posts" | "rendering" | "ready" | "error" = (() => {
    if (posts === null) return "loading-posts";
    if (posts.length === 0) return "no-posts";
    if (posts.length < 3) return "insufficient-posts";
    if (capture.status === "error") return "error";
    if (capture.status === "ready") return "ready";
    return "rendering";
  })();

  const cards = capture.status === "ready" ? capture.cards : null;

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <>
      <SlimHeader
        title={boothName}
        boothPill={boothNo ?? undefined}
        contextLabel={mallName || undefined}
        addressLine={mallAddress || undefined}
      />

      {/* Instructions — session 198 C2. Replaces cryptic eyebrow ("Share
          My Shelf · 5-card Story sequence") + bottom footer disclaimer
          with action-oriented title + 3-step guidance. Sets vendor
          expectations top-of-screen so the carousel + action buttons
          aren't met with confusion about what's happening. */}
      <div style={{ marginTop: 18, marginBottom: 16 }}>
        <div
          style={{
            fontFamily:    FONT_CORMORANT,
            fontSize:      22,
            fontWeight:    500,
            letterSpacing: "-0.005em",
            color:         v2.text.primary,
            textAlign:     "center",
            lineHeight:    1.3,
            marginBottom:  12,
          }}
        >
          How to share your shelf
        </div>
        <ol
          style={{
            margin:        0,
            padding:       0,
            listStyle:     "none",
            display:       "flex",
            flexDirection: "column",
            gap:           8,
            fontFamily:    FONT_INTER,
            fontSize:      13,
            color:         v2.text.secondary,
            lineHeight:    1.5,
          }}
        >
          <Step num={1}>Preview your 5 cards below — drag chips to reorder.</Step>
          <Step num={2}>Tap Share, then pick Facebook, Instagram, or any app.</Step>
          <Step num={3}>We&apos;ll attach the images and copy your caption to paste.</Step>
        </ol>
      </div>

      {/* Carousel preview — horizontal scroll-snap */}
      <CarouselPreview state={wrapperState} cards={cards} errorMessage={capture.status === "error" ? capture.message : undefined} />

      {/* Reorder strip (D3) — drag-rearrange the 3 finds within Story sequence.
          Hero + CTA stay fixed at slots 0 + 4. Compact chip row below the
          carousel; framer-motion Reorder.Group avoids touch-action conflict
          with the horizontal scroll-snap carousel above. Only renders when
          ready + picks settled (3 finds present). */}
      {wrapperState === "ready" && picks.length === 3 && (
        <ReorderStrip picks={picks} onReorder={handleReorder} />
      )}

      {/* Regenerate affordance — D8 single-affordance re-rolls finds + hook.
          Always-visible when posts loaded (cycles hook variant even when
          picks can't change on vendors with ≤3 posts). */}
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={wrapperState !== "ready" || posts === null || posts.length === 0}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            8,
          width:          "100%",
          marginTop:      14,
          padding:        "10px 14px",
          border:         `1px dashed ${v2.border.medium}`,
          borderRadius:   999,
          background:     "transparent",
          color:          v2.text.secondary,
          fontFamily:     FONT_CORMORANT,
          fontStyle:      "italic",
          fontSize:       14,
          cursor:         (wrapperState !== "ready" || posts === null || posts.length === 0) ? "default" : "pointer",
          opacity:        (wrapperState !== "ready" || posts === null || posts.length === 0) ? 0.45 : 1,
          transition:     "opacity 0.15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <PiShuffle size={16} color={v2.text.secondary} />
        <span>Regenerate</span>
      </button>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        <ActionButton
          primary
          disabled={wrapperState !== "ready"}
          icon={<PiShareFat size={18} color={v2.surface.card} />}
          label="Share"
          onClick={handleNativeShare}
        />
        <ActionButton
          disabled={wrapperState !== "ready"}
          icon={<PiDownloadSimple size={18} color={v2.text.primary} />}
          label="Download all 5 cards"
          onClick={handleDownload}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ActionButton
            small
            icon={<PiCopySimple size={16} color={v2.text.primary} />}
            label={copyToast === "caption" ? "Copied" : "Copy caption"}
            onClick={handleCopyCaption}
          />
          <ActionButton
            small
            icon={<PiLinkSimple size={16} color={v2.text.primary} />}
            label={copyToast === "link" ? "Copied" : "Copy booth link"}
            onClick={handleCopyLink}
          />
        </div>
      </div>

      {/* Caption echo */}
      {caption && (
        <div
          style={{
            marginTop:    16,
            padding:      "10px 12px",
            background:   v2.surface.warm,
            border:       `1px solid ${v2.border.light}`,
            borderRadius: 8,
            fontFamily:   FONT_INTER,
            fontSize:     12,
            lineHeight:   1.5,
            color:        v2.text.secondary,
            whiteSpace:   "pre-line",
          }}
        >
          <div
            style={{
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color:         v2.text.muted,
              marginBottom:  4,
            }}
          >
            Caption
          </div>
          {caption}
        </div>
      )}

      {/* ─── Off-screen capture container ─────────────────────────────
          Mounts the 5 Arc 1 cards at full 1080×N for html2canvas-pro.
          Positioned off-screen (left: -99999) so capture sees painted
          DOM without occupying viewport. pointerEvents: none keeps
          accidental interaction out. Mounted only after picks settle so
          we don't capture a half-rendered state. */}
      {captureReady && (
        <div
          ref={containerRef}
          aria-hidden="true"
          style={{
            position:      "fixed",
            left:          -99999,
            top:           0,
            width:         1080,
            pointerEvents: "none",
          }}
        >
          <div data-shelf-card="hero">
            <StoryHeroCard
              vendor={vendor}
              mall={mall}
              findCount={picks.length}
              aiHook={aiHook}
            />
          </div>
          <div data-shelf-card="find:0">
            <StoryFindCard post={picks[0]} vendor={vendor} index={1} />
          </div>
          <div data-shelf-card="find:1">
            <StoryFindCard post={picks[1]} vendor={vendor} index={2} />
          </div>
          <div data-shelf-card="find:2">
            <StoryFindCard post={picks[2]} vendor={vendor} index={3} />
          </div>
          <div data-shelf-card="cta">
            <StoryCtaCard vendor={vendor} boothUrl={boothUrl} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── CarouselPreview ──────────────────────────────────────────────────────
// Horizontal scroll-snap carousel of 5 captured-card <img>s. Each card
// preview ~240px wide (9:16 → ~427px tall). When wrapperState !== "ready",
// shows a single status message inside a placeholder slot.
function CarouselPreview({
  state,
  cards,
  errorMessage,
}: {
  state:        "loading-posts" | "no-posts" | "insufficient-posts" | "rendering" | "ready" | "error";
  cards:        Map<import("@/lib/useShelfCapture").ShelfCardId, import("@/lib/useShelfCapture").CapturedCard> | null;
  errorMessage?: string;
}) {
  const PREVIEW_WIDTH  = 240;
  const STORY_HEIGHT   = Math.round(PREVIEW_WIDTH * (1920 / 1080)); // ~427

  if (state !== "ready" || !cards) {
    return (
      <div
        style={{
          width:         "100%",
          height:        STORY_HEIGHT,
          background:    v2.surface.warm,
          border:        `1px solid ${v2.border.light}`,
          borderRadius:  10,
          overflow:      "hidden",
          display:       "flex",
          alignItems:    "center",
          justifyContent: "center",
          padding:       "0 24px",
          boxShadow:     "0 1px 2px rgba(43,33,26,0.04)",
        }}
      >
        <StatusCopy isError={state === "error"}>
          {captureStatusCopy(state, errorMessage)}
        </StatusCopy>
      </div>
    );
  }

  // Ready — render 5 captured cards in scroll-snap carousel
  const order: Array<{ id: import("@/lib/useShelfCapture").ShelfCardId; label: string }> = [
    { id: "hero",   label: "1 · Hero" },
    { id: "find:0", label: "2 · Find" },
    { id: "find:1", label: "3 · Find" },
    { id: "find:2", label: "4 · Find" },
    { id: "cta",    label: "5 · CTA" },
  ];

  return (
    <div
      style={{
        display:            "flex",
        gap:                12,
        overflowX:          "auto",
        scrollSnapType:     "x mandatory",
        WebkitOverflowScrolling: "touch",
        paddingBottom:      6,
        // Soft scrollbar on desktop; hidden on mobile via webkit
        scrollbarWidth:     "thin",
      }}
    >
      {order.map(({ id, label }) => {
        const card = cards.get(id);
        if (!card) return null;
        return (
          <div
            key={id}
            style={{
              flexShrink:        0,
              scrollSnapAlign:   "center",
              display:           "flex",
              flexDirection:     "column",
              alignItems:        "center",
            }}
          >
            <div
              style={{
                width:        PREVIEW_WIDTH,
                height:       STORY_HEIGHT,
                borderRadius: 8,
                overflow:     "hidden",
                border:       `1px solid ${v2.border.light}`,
                boxShadow:    "0 2px 6px rgba(43,33,26,0.08)",
                background:   v2.surface.warm,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.url}
                alt={`Card preview — ${label}`}
                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                marginTop:     6,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color:         v2.text.muted,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function captureStatusCopy(
  state: "loading-posts" | "no-posts" | "insufficient-posts" | "rendering" | "ready" | "error",
  errorMessage?: string,
): string {
  switch (state) {
    case "loading-posts":       return "Loading your shelf…";
    case "no-posts":            return "Add at least one find to your shelf to share it.";
    case "insufficient-posts":  return "Add at least 3 finds to your shelf to share a 5-card Story sequence.";
    case "rendering":           return "Generating your 5-card Story…";
    case "error":               return errorMessage ?? "Couldn't render. Please try again.";
    case "ready":               return ""; // unreachable; caller branches on ready
  }
}

function StatusCopy({ children, isError = false }: { children: React.ReactNode; isError?: boolean }) {
  return (
    <div
      style={{
        textAlign:  "center",
        fontFamily: FONT_CORMORANT,
        fontStyle:  "italic",
        fontSize:   16,
        lineHeight: 1.5,
        color:      isError ? v2.accent.red : v2.text.muted,
      }}
    >
      {children}
    </div>
  );
}

// ─── ReorderStrip ──────────────────────────────────────────────────────────
// framer-motion Reorder.Group on the 3 picked finds. Drag a chip to
// rearrange; onReorder fires with the new Post[] order. Bumping captureKey
// in the caller's handler re-triggers useShelfCapture against the new
// off-screen DOM mount order.
//
// Hero (slot 0) + CTA (slot 4) stay fixed — they're NOT inside the Reorder
// group; only the 3 find slots reorder among themselves.
//
// touch-action: none on Reorder.Item lets framer-motion own the drag
// gesture without the browser's scroll-pan interfering. Safe here because
// the strip sits in vertical-stack layout (no parent horizontal scroll).
function ReorderStrip({
  picks,
  onReorder,
}: {
  picks:     Post[];
  onReorder: (newOrder: Post[]) => void;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontFamily:    FONT_INTER,
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         v2.text.muted,
          marginBottom:  6,
          textAlign:     "center",
        }}
      >
        Drag to reorder finds
      </div>
      <Reorder.Group
        axis="x"
        values={picks}
        onReorder={onReorder}
        style={{
          display:     "flex",
          gap:         8,
          listStyle:   "none",
          padding:     0,
          margin:      0,
        }}
      >
        {picks.map((post, i) => (
          <Reorder.Item
            key={post.id}
            value={post}
            style={{
              flex:           1,
              minWidth:       0, // allow shrink for ellipsis on long titles
              touchAction:    "none",
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              padding:        "8px 10px",
              background:     v2.surface.card,
              border:         `1px solid ${v2.border.light}`,
              borderRadius:   8,
              cursor:         "grab",
              fontFamily:     FONT_CORMORANT,
              fontStyle:      "italic",
              fontSize:       12,
              color:          v2.text.primary,
              WebkitTapHighlightColor: "transparent",
            }}
            whileDrag={{
              scale:     1.05,
              boxShadow: "0 6px 14px rgba(43,33,26,0.18)",
              cursor:    "grabbing",
              zIndex:    10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily:    FONT_INTER,
                fontWeight:    700,
                fontSize:      10,
                color:         v2.accent.green,
                flexShrink:    0,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                flex:         1,
                minWidth:     0,
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {post.title}
            </span>
            <PiDotsSixVertical size={14} color={v2.text.muted} style={{ flexShrink: 0 }} />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

// ─── ActionButton ──────────────────────────────────────────────────────────
function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  primary  = false,
  small    = false,
}: {
  icon:      React.ReactNode;
  label:     string;
  onClick:   () => void;
  disabled?: boolean;
  primary?:  boolean;
  small?:    boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            8,
        width:          "100%",
        padding:        small ? "10px 12px" : "14px 16px",
        border:         primary ? "none" : `1px solid ${v2.border.light}`,
        borderRadius:   999,
        background:     primary ? v2.accent.green : v2.surface.card,
        color:          primary ? v2.surface.card : v2.text.primary,
        fontFamily:     FONT_CORMORANT,
        fontWeight:     primary ? 600 : 500,
        fontSize:       small ? 14 : 16,
        letterSpacing:  "-0.005em",
        cursor:         disabled ? "default" : "pointer",
        opacity:        disabled ? 0.5 : 1,
        transition:     "opacity 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Step ──────────────────────────────────────────────────────────────────
// Numbered step in the "How to share your shelf" instructions block.
// Green circle bullet (matches engagement-tier color vocabulary) + Inter
// 13px body copy.
function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span
        style={{
          flexShrink:     0,
          width:          20,
          height:         20,
          borderRadius:   "50%",
          background:     v2.accent.green,
          color:          v2.surface.card,
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     FONT_INTER,
          fontSize:       11,
          fontWeight:     700,
          marginTop:      1, // optical balance with first text line
        }}
        aria-hidden="true"
      >
        {num}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </li>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

// Sequence order matches the Story flow: hero → 3 finds → CTA. Filename
// prefixed with "1-" through "5-" so when the vendor downloads + picks
// them in FB's photo picker, the OS-default alphabetical sort puts them
// in the right order.
const SHELF_FILE_ORDER: Array<{ id: import("@/lib/useShelfCapture").ShelfCardId; suffix: string }> = [
  { id: "hero",   suffix: "1-hero" },
  { id: "find:0", suffix: "2-find-1" },
  { id: "find:1", suffix: "3-find-2" },
  { id: "find:2", suffix: "4-find-3" },
  { id: "cta",    suffix: "5-cta" },
];

function buildOrderedFiles(
  cards: Map<import("@/lib/useShelfCapture").ShelfCardId, import("@/lib/useShelfCapture").CapturedCard>,
  vendor: Vendor,
): File[] {
  const files: File[] = [];
  for (const { id, suffix } of SHELF_FILE_ORDER) {
    const card = cards.get(id);
    if (!card) continue;
    files.push(new File([card.blob], buildFilename(vendor, suffix), { type: "image/png" }));
  }
  return files;
}

function buildFilename(vendor: Vendor, slot: string): string {
  const slug = vendor.slug || "booth";
  return `treehouse-finds-${slug}-${slot}.png`;
}

// Sequential download with a small stagger between files so the browser
// doesn't suppress them as a single pop-up burst. Chrome allows ~10
// programmatic downloads in quick succession; 5 with 200ms stagger is
// well inside the safe zone on all major browsers.
function downloadFilesSequentially(files: File[]): void {
  files.forEach((file, i) => {
    window.setTimeout(() => downloadFile(file), i * 200);
  });
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
