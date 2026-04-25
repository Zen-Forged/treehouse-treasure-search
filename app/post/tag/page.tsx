// app/post/tag/page.tsx
//
// Tag-capture step of the Add Find flow. Sits between /my-shelf
// (AddFindSheet item-photo capture) and /post/preview (review + publish).
//
// Mockup: docs/mockups/add-find-with-tag-v1.html — Frame 1 (ready state),
// Frame 2 (extracting). Decisions D1-D8 + M1-M5 frozen in
// docs/add-find-tag-design.md.
//
// Flow:
//   1. Mount — read postStore.imageDataUrl (set by /my-shelf). If absent,
//      redirect back to /my-shelf (deep-link-from-nowhere fallback).
//   2. Vendor taps "Take photo of tag" → camera opens → tag photo captured.
//   3. Stage flips to "extracting". Two API calls fire in parallel:
//        - /api/extract-tag with the tag photo
//        - /api/post-caption with the item photo (pre-fetch the caption now
//          so /post/preview lands fully populated, no network on mount)
//   4. Both promises settle → write full PostDraft to postStore with
//      extractionRan + extracted{Title,Price} + caption{Title,Text} +
//      captionFailed → router.replace("/post/preview"). Replace (not push)
//      so back-from-preview lands on /my-shelf, not /post/tag.
//   5. Skip path — vendor taps "Skip — I'll add title and price manually" →
//      postStore gets extractionRan="skip" → router.replace("/post/preview").
//      Preview's hydrate branches to today's behavior (fire post-caption on
//      mount).
//
// Failure handling per D5: HTTP / mock-fallback failures on either API are
// captured into postStore (extractionRan="error" / captionFailed=true) and
// the flow proceeds to /post/preview where the appropriate AmberNotice
// surfaces. We do NOT strand the vendor on /post/tag with an error screen —
// the failure UX lives in one place, on preview.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { compressImage } from "@/lib/imageUpload";
import { postStore, type PostDraft } from "@/lib/postStore";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";

type Stage = "ready" | "extracting";

interface ExtractTagResponse {
  title: string;
  price: number | null;
  source: "claude" | "mock";
  reason?: string;
}

interface PostCaptionResponse {
  title: string;
  caption: string;
  source: "claude" | "mock";
  reason?: string;
}

async function compressForUpload(dataUrl: string, maxWidth = 1200, quality = 0.78): Promise<string> {
  const first = await compressImage(dataUrl, maxWidth, quality);
  if (first.length <= 1_000_000) return first;
  return compressImage(first, Math.round(maxWidth * 0.75), 0.72);
}

async function callExtractTag(tagDataUrl: string): Promise<ExtractTagResponse> {
  try {
    const compressed = await compressForUpload(tagDataUrl, 1200, 0.78);
    const res = await fetch("/api/extract-tag", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageDataUrl: compressed }),
    });
    if (!res.ok) {
      console.warn("[post/tag] extract-tag HTTP", res.status);
      return { title: "", price: null, source: "mock", reason: "http" };
    }
    return (await res.json()) as ExtractTagResponse;
  } catch (err) {
    console.error("[post/tag] extract-tag fetch failed:", err);
    return { title: "", price: null, source: "mock", reason: "fetch" };
  }
}

async function callPostCaption(itemDataUrl: string): Promise<PostCaptionResponse> {
  try {
    const compressed = await compressForUpload(itemDataUrl, 800, 0.7);
    const res = await fetch("/api/post-caption", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageDataUrl: compressed }),
    });
    if (!res.ok) {
      console.warn("[post/tag] post-caption HTTP", res.status);
      return { title: "", caption: "", source: "mock", reason: "http" };
    }
    return (await res.json()) as PostCaptionResponse;
  } catch (err) {
    console.error("[post/tag] post-caption fetch failed:", err);
    return { title: "", caption: "", source: "mock", reason: "fetch" };
  }
}

function PostTagInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const cameraRef    = useRef<HTMLInputElement | null>(null);

  const [stage,        setStage]        = useState<Stage>("ready");
  const [itemImage,    setItemImage]    = useState<string | null>(null);
  const [tagImage,     setTagImage]     = useState<string | null>(null);

  // Preserve admin ?vendor= impersonation param across redirects to preview.
  const vendorParam = searchParams.get("vendor");
  const previewDest = vendorParam ? `/post/preview?vendor=${vendorParam}` : "/post/preview";

  // ── Mount: pull item photo from postStore (set by /my-shelf) ─────────────
  useEffect(() => {
    const draft = postStore.get();
    if (!draft?.imageDataUrl) {
      router.replace("/my-shelf");
      return;
    }
    setItemImage(draft.imageDataUrl);
  }, [router]);

  // ── Skip path ────────────────────────────────────────────────────────────
  function handleSkip() {
    const draft = postStore.get();
    if (!draft?.imageDataUrl) {
      router.replace("/my-shelf");
      return;
    }
    postStore.set({
      ...draft,
      extractionRan: "skip",
    });
    router.replace(previewDest);
  }

  // ── Tag capture path ─────────────────────────────────────────────────────
  async function handleTagFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";  // reset so re-picking the same file refires onChange
    if (!file) return;

    const draft = postStore.get();
    if (!draft?.imageDataUrl) {
      router.replace("/my-shelf");
      return;
    }

    // Read the tag file as a data URL
    let tagDataUrl: string;
    try {
      tagDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error("[post/tag] FileReader error:", err);
      // Fall back to skip semantics — don't strand the vendor.
      handleSkip();
      return;
    }

    setTagImage(tagDataUrl);
    setStage("extracting");

    // Fire both APIs in parallel — preview lands ready on first paint.
    const [tagResult, captionResult] = await Promise.all([
      callExtractTag(tagDataUrl),
      callPostCaption(draft.imageDataUrl),
    ]);

    const tagSucceeded     = tagResult.source === "claude";
    const captionSucceeded = captionResult.source === "claude";

    const next: PostDraft = {
      imageDataUrl:    draft.imageDataUrl,
      extractionRan:   tagSucceeded ? "success" : "error",
      extractedTitle:  tagSucceeded ? tagResult.title : "",
      extractedPrice:  tagSucceeded ? tagResult.price : null,
      captionTitle:    captionSucceeded ? captionResult.title : "",
      captionText:     captionSucceeded ? captionResult.caption : "",
      captionFailed:   !captionSucceeded,
    };

    console.log("[post/tag] writing draft:", {
      tagSucceeded,
      captionSucceeded,
      extractedTitle: next.extractedTitle,
      extractedPrice: next.extractedPrice,
    });

    postStore.set(next);
    router.replace(previewDest);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const isExtracting = stage === "extracting";

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
      {/* Hidden camera input — tag capture only */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleTagFile}
        style={{ display: "none" }}
      />

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(108px, calc(env(safe-area-inset-bottom, 0px) + 96px))",
        }}
      >
        {/* ── Masthead (Mode C) ─────────────────────────────────────── */}
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
            disabled={isExtracting}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isExtracting ? "default" : "pointer",
              opacity: isExtracting ? 0.45 : 1,
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
                fontFamily: FONT_IM_FELL,
                fontSize: 24,
                color: v1.inkPrimary,
                letterSpacing: "-0.005em",
                lineHeight: 1.15,
              }}
            >
              {isExtracting ? "Reading the tag…" : "Now the tag"}
            </div>
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.4,
              }}
            >
              {isExtracting ? "Just a moment." : "Capture the title and price in one shot."}
            </div>
          </div>
        </div>

        {/* ── Body — Frame 1 (ready) or Frame 2 (extracting) ────────── */}
        {!isExtracting && itemImage && (
          <>
            <div style={{ padding: "20px 22px 0" }}>
              <div
                style={{
                  width: "78%",
                  margin: "0 auto",
                  borderRadius: v1.imageRadius,
                  overflow: "hidden",
                  background: "#cdb88e",
                  boxShadow: "0 4px 20px rgba(42,26,10,0.18)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={itemImage}
                  alt="item to be tagged"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>

            <div style={{ padding: "26px 22px 0", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkMuted,
                  lineHeight: 1.6,
                }}
              >
                We&rsquo;ll read the item name and price<br />directly from the inventory tag.
              </div>
            </div>
          </>
        )}

        {isExtracting && itemImage && (
          <>
            <div
              style={{
                padding: "22px 22px 0",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <PhotoPair label="Item" src={itemImage} />
              {tagImage && <PhotoPair label="Tag" src={tagImage} />}
            </div>

            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkMuted,
                textAlign: "center",
                marginTop: 28,
                lineHeight: 1.5,
              }}
            >
              Pulling title and price…
            </motion.div>
          </>
        )}
      </div>

      {/* ── Sticky bottom CTA stack ─────────────────────────────────── */}
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
          gap: 6,
        }}
      >
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={isExtracting}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 14,
            fontFamily: FONT_SYS,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.2px",
            color: isExtracting ? v1.inkFaint : "#fff",
            background: isExtracting ? v1.inkWash : v1.green,
            border: "none",
            cursor: isExtracting ? "default" : "pointer",
            boxShadow: isExtracting ? "none" : "0 2px 12px rgba(30,77,43,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "background 0.18s ease, color 0.18s ease",
          }}
        >
          {isExtracting ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic" }}
            >
              Reading…
            </motion.span>
          ) : (
            <>
              <Camera size={18} strokeWidth={1.6} />
              Take photo of tag
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={isExtracting}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 14,
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            background: "transparent",
            border: "none",
            textDecoration: "underline",
            textDecorationColor: v1.inkFaint,
            textUnderlineOffset: 3,
            cursor: isExtracting ? "default" : "pointer",
            opacity: isExtracting ? 0.45 : 1,
          }}
        >
          Skip — I&rsquo;ll add title and price manually
        </button>
      </div>
    </div>
  );
}

// ── PhotoPair — small labeled thumbnail used in the extracting state ─────
function PhotoPair({ label, src }: { label: string; src: string }) {
  return (
    <div style={{ flex: "0 0 42%", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 11,
          color: v1.inkMuted,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: v1.imageRadius,
          overflow: "hidden",
          background: "#cdb88e",
          boxShadow: "0 3px 12px rgba(42,26,10,0.16)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label.toLowerCase()}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    </div>
  );
}

// Suspense wrapper required by useSearchParams in Next 14.
export default function PostTagPage() {
  return (
    <Suspense>
      <PostTagInner />
    </Suspense>
  );
}
