// components/ShelfImageShareScreen.tsx
//
// ⚠️ PARKED — session 152 within-session retirement.
//   See ShelfImageTemplate.tsx file-top comment for full context.
//   Wrapper preserved for future refinement; no consumer wires this today.
//   Per feedback_within_session_design_record_reversal ✅ Promoted at session 128.
//
// Session 152 — Share My Shelf wrapper screen.
//
// Composes <ShelfImageTemplate> (off-screen 1080×1350 capture node) with
// html2canvas-pro capture, a visible preview <img>, and 3 action buttons
// (Share / Download / Copy caption / Copy booth link).
//
// Lifecycle:
//   1. Mount → fetch 6 most-recent available posts via getVendorWindowPosts
//   2. Posts loaded + template mounted off-screen → html2canvas-pro runs
//      → blob URL stored in state → preview <img> renders
//   3. User taps an action → respective handler runs from the cached blob
//   4. Cleanup blob URL on unmount
//
// Mobile vs desktop share handoff:
//   - navigator.canShare({ files }) supported (iOS Safari 16+ / Android
//     Chrome 75+) → "Share" button uses navigator.share({ files, text, url })
//     → opens native share sheet with Facebook + Instagram + Messages + ...
//   - Otherwise (desktop) → "Open Facebook" button opens facebook.com/sharer
//     in new tab pre-filled with booth URL; user manually attaches the
//     downloaded image.
//
// Caption auto-copied to clipboard when user taps Share OR Download, so
// they paste-after when their target composer (Facebook/Insta/etc) opens.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import { PiDownloadSimple, PiShareFat, PiCopySimple, PiLinkSimple } from "react-icons/pi";
import { track } from "@/lib/clientEvents";
import { getVendorWindowPosts } from "@/lib/posts";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import { SlimHeader } from "@/components/ui/SlimHeader";
import { ShelfImageTemplate } from "@/components/ShelfImageTemplate";
import type { Mall, Post, Vendor } from "@/types/treehouse";

export interface ShelfImageShareScreenProps {
  vendor: Vendor;
  mall:   Mall | null;
  /** Public-facing /shelf/<slug> URL — embedded in QR + share payload. */
  boothUrl: string;
}

type RenderState =
  | { kind: "loading-posts" }
  | { kind: "no-posts" }
  | { kind: "rendering" }
  | { kind: "ready"; blobUrl: string; blob: Blob }
  | { kind: "error"; message: string };

export function ShelfImageShareScreen({
  vendor,
  mall,
  boothUrl,
}: ShelfImageShareScreenProps) {
  const [posts, setPosts]     = useState<Post[] | null>(null);
  const [render, setRender]   = useState<RenderState>({ kind: "loading-posts" });
  const [copyToast, setCopyToast] = useState<"caption" | "link" | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const boothName = vendor.display_name;
  const mallName  = mall?.name ?? vendor.mall?.name ?? "";
  const boothNo   = vendor.booth_number;
  const mallAddress = mall?.address ?? [mall?.city, mall?.state].filter(Boolean).join(", ");

  const caption = buildCaption(boothName, mallName, boothNo);
  const trackPayload = {
    vendor_slug: vendor.slug,
    mall_id:     mall?.id ?? vendor.mall?.id ?? null,
  };

  // 1. Mount-time analytics fire + load posts
  useEffect(() => {
    track("share_shelf_image_viewed", trackPayload);
    let alive = true;
    getVendorWindowPosts(vendor.id).then(fetched => {
      if (!alive) return;
      setPosts(fetched);
      if (fetched.length === 0) {
        setRender({ kind: "no-posts" });
      } else {
        setRender({ kind: "rendering" });
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor.id]);

  // 2. Capture the off-screen template once posts are loaded + template mounted
  useEffect(() => {
    if (render.kind !== "rendering") return;
    if (!captureRef.current) return;
    let alive = true;

    // Short delay so any final image decode completes before capture. The
    // crossOrigin="anonymous" img tags on Supabase CDN URLs trigger native
    // image loading on mount; ~250ms covers the longest decode tail on
    // mid-range mobile.
    const t = window.setTimeout(async () => {
      if (!alive || !captureRef.current) return;
      try {
        const canvas = await html2canvas(captureRef.current, {
          // 1080 native — node renders at 1080×1350 fixed; scale 1 preserves.
          scale: 1,
          // Render bg explicitly; default is white which would replace v2.bg.main.
          backgroundColor: "#F7F3EB",
          // Respect crossOrigin on img tags. Some forks default to false here.
          useCORS: true,
          // Skip iframes — we have none in the capture path.
          allowTaint: false,
          // Avoid logging noise in production.
          logging:    false,
        });

        canvas.toBlob(blob => {
          if (!alive) return;
          if (!blob) {
            setRender({ kind: "error", message: "Couldn't render the image. Please try again." });
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          setRender({ kind: "ready", blobUrl, blob });
        }, "image/png", 0.95);
      } catch (err) {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setRender({ kind: "error", message: `Render failed: ${msg.slice(0, 80)}` });
      }
    }, 250);

    return () => { alive = false; window.clearTimeout(t); };
  }, [render.kind]);

  // 3. Cleanup blob URL on unmount or re-render
  useEffect(() => {
    return () => {
      if (render.kind === "ready") {
        URL.revokeObjectURL(render.blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-clear copy toast after 1.8s
  useEffect(() => {
    if (!copyToast) return;
    const t = window.setTimeout(() => setCopyToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [copyToast]);

  // ─── Actions ───────────────────────────────────────────────────────────
  const handleNativeShare = useCallback(async () => {
    if (render.kind !== "ready") return;
    const file = new File([render.blob], buildFilename(vendor), { type: "image/png" });

    // Auto-copy caption first so vendor can paste it after the share-sheet
    // close in their target composer.
    try { await navigator.clipboard.writeText(caption); } catch { /* clipboard blocked is non-fatal */ }

    // navigator.canShare with files is the supported-check; navigator.share
    // alone exists on desktops where files aren't supported. Guard both.
    const canShareFiles = typeof navigator !== "undefined"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [file] });

    if (canShareFiles && typeof navigator.share === "function") {
      try {
        await navigator.share({ files: [file], text: caption, url: boothUrl });
        track("share_shelf_image_downloaded", { ...trackPayload, method: "native_share" });
      } catch (err) {
        // AbortError when user dismisses — silent. Other errors are
        // non-fatal too; vendor can retry or use Download.
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          console.error("[share-my-shelf] navigator.share failed:", err);
        }
      }
    } else {
      // Desktop fallback: download the image + open Facebook sharer in a new tab.
      // Open the new tab FIRST (browser-blocked otherwise if not in user-gesture).
      const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(boothUrl)}`;
      window.open(fbHref, "_blank", "noopener,noreferrer");
      downloadBlob(render.blob, buildFilename(vendor));
      track("share_shelf_image_downloaded", { ...trackPayload, method: "desktop_fallback" });
      setCopyToast("caption");
    }
  }, [render, caption, boothUrl, vendor, trackPayload]);

  const handleDownload = useCallback(async () => {
    if (render.kind !== "ready") return;
    try { await navigator.clipboard.writeText(caption); } catch { /* */ }
    downloadBlob(render.blob, buildFilename(vendor));
    track("share_shelf_image_downloaded", { ...trackPayload, method: "download" });
    setCopyToast("caption");
  }, [render, caption, vendor, trackPayload]);

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

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <SlimHeader
        title={boothName}
        boothPill={boothNo ?? undefined}
        contextLabel={mallName || undefined}
        addressLine={mallAddress || undefined}
      />

      {/* Eyebrow */}
      <div
        style={{
          marginTop:     18,
          marginBottom:  10,
          fontFamily:    FONT_INTER,
          fontSize:      11,
          fontWeight:    600,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color:         v2.text.muted,
        }}
      >
        Share My Shelf · Image preview
      </div>

      {/* Preview area — fixed aspect 4:5 (1080×1350) container */}
      <div
        style={{
          width:         "100%",
          aspectRatio:   "1080 / 1350",
          background:    v2.surface.warm,
          border:        `1px solid ${v2.border.light}`,
          borderRadius:  10,
          overflow:      "hidden",
          display:       "flex",
          alignItems:    "center",
          justifyContent: "center",
          marginBottom:  16,
          boxShadow:     "0 1px 2px rgba(43,33,26,0.04)",
        }}
      >
        {render.kind === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={render.blobUrl}
            alt="Generated Share My Shelf image preview"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <PreviewStatus render={render} />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Primary — Share */}
        <ActionButton
          primary
          disabled={render.kind !== "ready"}
          icon={<PiShareFat size={18} color="#FBF6EA" />}
          label={mobileShareLabel()}
          onClick={handleNativeShare}
        />

        {/* Secondary — Download */}
        <ActionButton
          disabled={render.kind !== "ready"}
          icon={<PiDownloadSimple size={18} color={v2.text.primary} />}
          label="Download image"
          onClick={handleDownload}
        />

        {/* Tertiary row — Copy caption + Copy booth link side-by-side */}
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

      {/* Caption echo — vendor can read what's been queued for their post */}
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

      {/* Footer disclaimer */}
      <div
        style={{
          marginTop:    14,
          fontFamily:   FONT_CORMORANT,
          fontStyle:    "italic",
          fontSize:     12,
          color:        v2.text.muted,
          textAlign:    "center",
          lineHeight:   1.5,
        }}
      >
        Tap Share to post directly on Facebook, Instagram, or anywhere else.
      </div>

      {/* Off-screen capture node — actual image source for html2canvas-pro.
          Mounted only while we have posts to render; otherwise omitted to
          skip wasted DOM weight when vendor has zero available finds. */}
      {posts && posts.length > 0 && (
        <ShelfImageTemplate
          domRef={captureRef}
          vendor={vendor}
          mall={mall}
          posts={posts}
          boothUrl={boothUrl}
        />
      )}
    </>
  );
}

// ─── PreviewStatus ─────────────────────────────────────────────────────────
function PreviewStatus({ render }: { render: RenderState }) {
  if (render.kind === "loading-posts") {
    return <StatusCopy>Loading your shelf…</StatusCopy>;
  }
  if (render.kind === "rendering") {
    return <StatusCopy>Generating preview…</StatusCopy>;
  }
  if (render.kind === "no-posts") {
    return (
      <StatusCopy>
        Add at least one find to your shelf to share it.
      </StatusCopy>
    );
  }
  if (render.kind === "error") {
    return <StatusCopy isError>{render.message}</StatusCopy>;
  }
  return null;
}

function StatusCopy({ children, isError = false }: { children: React.ReactNode; isError?: boolean }) {
  return (
    <div
      style={{
        padding:    "0 24px",
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
  const isPrimary = primary;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display:       "flex",
        alignItems:    "center",
        justifyContent: "center",
        gap:           8,
        width:         "100%",
        padding:       small ? "10px 12px" : "14px 16px",
        border:        isPrimary ? "none" : `1px solid ${v2.border.light}`,
        borderRadius:  999,
        background:    isPrimary ? v2.accent.green : v2.surface.card,
        color:         isPrimary ? "#FBF6EA" : v2.text.primary,
        fontFamily:    FONT_CORMORANT,
        fontWeight:    isPrimary ? 600 : 500,
        fontSize:      small ? 14 : 16,
        letterSpacing: "-0.005em",
        cursor:        disabled ? "default" : "pointer",
        opacity:       disabled ? 0.5 : 1,
        transition:    "opacity 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildCaption(boothName: string, mallName: string, boothNo: string | null): string {
  const parts: string[] = [];
  parts.push(mallName
    ? `Fresh finds are waiting at ${boothName} in ${mallName}.`
    : `Fresh finds are waiting at ${boothName}.`);
  parts.push("Preview the shelf before you visit.");
  if (boothNo) parts.push(`Booth ${boothNo}.`);
  return parts.join(" ");
}

function buildFilename(vendor: Vendor): string {
  const slug = vendor.slug || "booth";
  return `treehouse-finds-${slug}.png`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the download has time to register the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function mobileShareLabel(): string {
  // Match the OS-native share affordance language. iOS uses "Share";
  // Android also uses "Share". Generic copy works across both. Falls back
  // to "Open Facebook" semantically on desktop but the button label stays
  // "Share" so the affordance reads consistently.
  return "Share";
}
