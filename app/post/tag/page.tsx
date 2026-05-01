// app/post/tag/page.tsx
//
// Tag-capture step of the Add Find flow. Sits between /my-shelf
// (AddFindSheet item-photo capture) and /post/preview (review + publish).
//
// Session 94 — capture-flow refinement (docs/capture-flow-refinement-design.md).
// Adopted shared <StickyMasthead />; bespoke sticky chrome retired (D3).
// Title + subtitle relocated to a centered block below the masthead (D4).
// New instructional ready-state copy (D6). Find + Tag photos rendered in
// polaroid wrappers, stacked vertically with lowercase italic labels below
// (D5). Find retake affordance below the polaroid (D13) — does NOT re-fire
// /api/post-caption or /api/extract-tag. Vertical centering on the middle
// band between masthead and CTAs (D14).
//
// Original mockup: docs/mockups/add-find-with-tag-v1.html — Frame 1 (ready
// state), Frame 2 (extracting). D1-D8 + M1-M5 frozen in
// docs/add-find-tag-design.md. Capture-flow refinement V3 supersedes the
// visual layout but the flow logic + analytics events are unchanged.
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
//   6. Retake path (session 94) — "Retake" link below Find polaroid opens
//      <AddFindSheet title="Replace photo" /> → file-picker → reads new
//      image → updates postStore.imageDataUrl. NO /api/post-caption call;
//      caption stays as whatever /post/preview will fire on first arrival.
//      AI APIs do not re-run.
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
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import { track } from "@/lib/clientEvents";
import StickyMasthead from "@/components/StickyMasthead";
import AddFindSheet from "@/components/AddFindSheet";
import PolaroidTile from "@/components/PolaroidTile";

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

function PolLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT_LORA,
        fontStyle: "italic",
        fontSize: 13,
        color: v1.inkMuted,
        letterSpacing: "0.04em",
        textAlign: "center",
        textTransform: "lowercase",
        lineHeight: 1.2,
      }}
    >
      {children}
    </div>
  );
}

function PostTagInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // File-input refs:
  //   tagCameraRef       — Tag photo capture (existing flow)
  //   findRetakeCameraRef / findRetakeLibraryRef — Find retake (session 94)
  const tagCameraRef         = useRef<HTMLInputElement | null>(null);
  const findRetakeCameraRef  = useRef<HTMLInputElement | null>(null);
  const findRetakeLibraryRef = useRef<HTMLInputElement | null>(null);

  const [stage,      setStage]      = useState<Stage>("ready");
  const [itemImage,  setItemImage]  = useState<string | null>(null);
  const [tagImage,   setTagImage]   = useState<string | null>(null);
  const [retakeOpen, setRetakeOpen] = useState(false);

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
    track("tag_skipped", {});
    postStore.set({
      ...draft,
      extractionRan: "skip",
    });
    router.replace(previewDest);
  }

  // ── Find retake (session 94) — no AI calls ──────────────────────────────
  async function handleFindRetake(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";  // reset so re-picking the same file refires
    if (!file) return;

    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error("[post/tag] find retake reader error:", err);
      return;
    }

    const draft = postStore.get();
    if (!draft) {
      router.replace("/my-shelf");
      return;
    }

    // Update postStore.imageDataUrl. Hard rule: no /api/post-caption refire,
    // no /api/extract-tag refire — vendor's typed/extracted fields preserved.
    postStore.set({ ...draft, imageDataUrl: dataUrl });
    setItemImage(dataUrl);
    setRetakeOpen(false);
  }

  // ── Tag capture path ─────────────────────────────────────────────────────
  async function handleTagFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const draft = postStore.get();
    if (!draft?.imageDataUrl) {
      router.replace("/my-shelf");
      return;
    }

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
      handleSkip();
      return;
    }

    setTagImage(tagDataUrl);
    setStage("extracting");

    const [tagResult, captionResult] = await Promise.all([
      callExtractTag(tagDataUrl),
      callPostCaption(draft.imageDataUrl),
    ]);

    const tagSucceeded     = tagResult.source === "claude";
    const captionSucceeded = captionResult.source === "claude";

    track("tag_extracted", {
      has_price: tagSucceeded && tagResult.price !== null && tagResult.price !== undefined,
      has_title: tagSucceeded && !!tagResult.title,
    });

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
      {/* Hidden file inputs */}
      <input
        ref={tagCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleTagFile}
        style={{ display: "none" }}
      />
      <input
        ref={findRetakeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFindRetake}
        style={{ display: "none" }}
      />
      <input
        ref={findRetakeLibraryRef}
        type="file"
        accept="image/*"
        onChange={handleFindRetake}
        style={{ display: "none" }}
      />

      {/* ── Masthead (session 94 — shared StickyMasthead) ──────────────── */}
      <StickyMasthead
        left={
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            disabled={isExtracting}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isExtracting ? "default" : "pointer",
              opacity: isExtracting ? 0.45 : 1,
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} strokeWidth={2} style={{ color: v1.inkPrimary }} />
          </button>
        }
      />

      {/* ── Middle band — vertically centered when content fits ───────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflowY: "auto",
          paddingTop: 18,
          paddingBottom: isExtracting
            ? 18
            : "max(140px, calc(env(safe-area-inset-bottom, 0px) + 128px))",
        }}
      >
        {/* Centered title block */}
        <div style={{ textAlign: "center", padding: "0 22px 14px" }}>
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
            {isExtracting ? "Reading the tag…" : "Take a photo of the tag"}
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
            {isExtracting
              ? "Just a moment."
              : "We'll read the title and price right off the tag, so you don't have to type them in."}
          </div>
        </div>

        {/* Photos — Find always; Tag added during extraction */}
        <div
          style={{
            padding: "0 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "center",
          }}
        >
          {itemImage && (
            <div
              style={{
                width: "60%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <PolaroidTile
                src={itemImage}
                alt="your find"
                photoBg="#cdb88e"
                photoRadius={4}
                lens={false}
                innerInsetShadow
              />
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <PolLabel>Find</PolLabel>
                {!isExtracting && (
                  <button
                    onClick={() => setRetakeOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: v1.inkPrimary,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    Retake
                  </button>
                )}
              </div>
            </div>
          )}

          {isExtracting && tagImage && (
            <div
              style={{
                width: "60%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <PolaroidTile
                src={tagImage}
                alt="price tag"
                photoBg="#cdb88e"
                photoRadius={4}
                lens={false}
                innerInsetShadow
              />
              <div style={{ marginTop: 6 }}>
                <PolLabel>Tag</PolLabel>
              </div>
            </div>
          )}
        </div>

        {isExtracting && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            Pulling title and price…
          </motion.div>
        )}
      </div>

      {/* ── Bottom CTA stack — only in ready state ────────────────────── */}
      {!isExtracting && (
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
            onClick={() => tagCameraRef.current?.click()}
            style={{
              width: "100%",
              padding: 15,
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.2px",
              color: "#fff",
              background: v1.green,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(30,77,43,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Camera size={18} strokeWidth={1.6} />
            Take photo of tag
          </button>

          <button
            onClick={handleSkip}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 14,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              background: "transparent",
              border: "none",
              textDecoration: "underline",
              textDecorationColor: v1.inkFaint,
              textUnderlineOffset: 3,
              cursor: "pointer",
            }}
          >
            Skip — I&rsquo;ll add title and price manually
          </button>
        </div>
      )}

      {/* ── Find retake sheet (session 94) ────────────────────────────── */}
      <AddFindSheet
        open={retakeOpen}
        onClose={() => setRetakeOpen(false)}
        onTakePhoto={() => findRetakeCameraRef.current?.click()}
        onChooseFromLibrary={() => findRetakeLibraryRef.current?.click()}
        title="Replace photo"
      />
    </div>
  );
}

export default function PostTagPage() {
  return (
    <Suspense>
      <PostTagInner />
    </Suspense>
  );
}
