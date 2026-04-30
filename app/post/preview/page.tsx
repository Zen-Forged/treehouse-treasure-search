// app/post/preview/page.tsx
// "Review your find" page — refreshed end-to-end in session 94 per
// docs/capture-flow-refinement-design.md (V3 commitment surface).
//
// What changed vs. v1.2:
//   D7  Title / Caption / Price moved ABOVE the photo (was below the photo
//       under the posting-as block).
//   D8  <PostingAsBlock /> removed entirely; <PhotographPreview /> retired
//       on this page (still used by /post/edit/[id]). Booth-location post-it
//       gone with it.
//   D9  Input field bg: v1.inkWash → v1.postit (#fbf3df) — matches the
//       sign-in email input on /login/email.
//   D10 Caption textarea = auto-grow; height tracks scrollHeight on every
//       change. No internal scroll. Page scrolls on overflow.
//   D11 Disabled publish button unified to the rgba(30,77,43,0.40) +
//       white-text pattern used by /vendor-request and /login/email.
//   D12 Post-publish "View my shelf / Add another find" interstitial
//       retired. On success: router.replace(myShelfHref) directly.
//   D13 Find-photo retake added — italic dotted-link below the polaroid.
//       Tap → AddFindSheet → file picker → updates postStore.imageDataUrl.
//       Hard rule: NO /api/post-caption refire on retake; fields preserved.
//   D14 Vertical centering — middle band is a flex column with
//       justify-content: center; falls to top-anchored scroll on overflow.
//   D15 Title block padded with extra top space (~32px) so it reads
//       slightly shifted-down from the masthead — David's call accepting
//       a small scroll on a content-heavy page.
//
// Identity resolution + publish behavior preserved verbatim from the
// session-35 multi-booth pass:
//   - Admin with ?vendor=id → impersonate that vendor.
//   - Authed user → getVendorsByUserId + resolveActiveBooth (multi-booth
//     safe; single-booth users get vendors[0]).
//   - Authed user with zero vendors → route back to /my-shelf for self-heal.
//   - Unauth → legacy LOCAL_VENDOR_KEY fallback.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  createPost,
  createVendor,
  getVendorsByUserId,
  getVendorById,
  slugify,
} from "@/lib/posts";
import { resolveActiveBooth } from "@/lib/activeBooth";
import { compressImage, uploadPostImageViaServer } from "@/lib/imageUpload";
import { postStore, type PostDraft } from "@/lib/postStore";
import { safeStorage } from "@/lib/safeStorage";
import { getSession, isAdmin } from "@/lib/auth";
import {
  LOCAL_VENDOR_KEY,
  type LocalVendorProfile,
  type Vendor,
} from "@/types/treehouse";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import AmberNotice from "@/components/AmberNotice";
import TagBadge from "@/components/TagBadge";
import StickyMasthead from "@/components/StickyMasthead";
import AddFindSheet from "@/components/AddFindSheet";

const FEED_SCROLL_KEY = "treehouse_feed_scroll";

async function compressForUpload(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.78,
): Promise<string> {
  const first = await compressImage(dataUrl, maxWidth, quality);
  if (first.length <= 1_000_000) return first;
  return compressImage(first, Math.round(maxWidth * 0.75), 0.72);
}

interface CaptionResult {
  title: string;
  caption: string;
  aiSucceeded: boolean;
}

async function generateTitleAndCaption(
  imageDataUrl: string,
): Promise<CaptionResult> {
  try {
    const thumb = await compressForUpload(imageDataUrl, 800, 0.7);
    const res = await fetch("/api/post-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: thumb }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.source !== "claude") {
      console.warn("[preview] caption API returned mock fallback:", data.reason ?? "unknown");
      return { title: "", caption: "", aiSucceeded: false };
    }
    const title   = data.title ?? "";
    const caption = data.caption ?? "";
    return { title, caption, aiSucceeded: !!(title || caption) };
  } catch (err) {
    console.error("[preview] generateTitleAndCaption failed:", err);
    return { title: "", caption: "", aiSucceeded: false };
  }
}

// "loading"    — caption API pending
// "edit"       — form is editable; publish button active
// "publishing" — upload + createPost in progress
// "error"      — error screen with Try again + Go back
//
// Session 94: "done" stage retired (D12). On publish success the page
// navigates directly to /my-shelf via router.replace.
type Stage = "loading" | "edit" | "publishing" | "error";

function PostPreviewInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Preserve `?vendor=<id>` so admin lands back on the booth-of-origin.
  const originVendorId = searchParams.get("vendor");
  const myShelfHref    = originVendorId ? `/my-shelf?vendor=${originVendorId}` : "/my-shelf";

  const [image,         setImage]         = useState<string | null>(null);
  const [vendor,        setVendor]        = useState<Vendor | null>(null);
  const [localProfile,  setLocalProfile]  = useState<LocalVendorProfile | null>(null);
  const [stage,         setStage]         = useState<Stage>("loading");
  const [errorDetail,   setErrorDetail]   = useState<string>("");
  const [aiFailed,      setAiFailed]      = useState(false);

  const [tagFailed,     setTagFailed]     = useState(false);
  const [titleFromTag,  setTitleFromTag]  = useState(false);
  const [priceFromTag,  setPriceFromTag]  = useState(false);
  const [priceMissing,  setPriceMissing]  = useState(false);

  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");

  // Find retake (session 94) — sheet open + file input refs
  const [retakeOpen, setRetakeOpen] = useState(false);
  const retakeCameraRef  = useRef<HTMLInputElement | null>(null);
  const retakeLibraryRef = useRef<HTMLInputElement | null>(null);

  // Auto-grow caption textarea
  const captionRef = useRef<HTMLTextAreaElement | null>(null);

  const started = useRef(false);

  // ── Mount: resolve identity + hydrate image + kick off caption ───────────
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const draft = postStore.get();
      if (!draft) {
        router.replace("/my-shelf");
        return;
      }
      setImage(draft.imageDataUrl);

      const session   = await getSession();
      const user      = session?.user ?? null;
      const admin     = user ? isAdmin(user) : false;
      const vParam    = searchParams.get("vendor");

      if (admin && vParam) {
        const v = await getVendorById(vParam);
        if (v) {
          setVendor(v);
          hydrateFields(draft);
          return;
        }
      }

      if (user) {
        const vendors = await getVendorsByUserId(user.id);
        const active  = resolveActiveBooth(vendors);
        if (active) {
          setVendor(active);
          hydrateFields(draft);
          return;
        }
        router.replace("/my-shelf");
        return;
      }

      const raw = safeStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) {
        try {
          const p = JSON.parse(raw) as LocalVendorProfile;
          setLocalProfile(p);
          hydrateFields(draft);
          return;
        } catch {}
      }

      router.replace("/login?next=/my-shelf");
    })();

    function hydrateFields(d: PostDraft) {
      if (d.extractionRan === "success" || d.extractionRan === "error") {
        const extTitle    = d.extractedTitle ?? "";
        const extPrice    = d.extractedPrice ?? null;
        const capText     = d.captionText ?? "";
        const ranSuccess  = d.extractionRan === "success";
        const fullyFailed = !ranSuccess || (extTitle === "" && extPrice == null);

        if (fullyFailed) {
          setTitle("");
          setCaption(capText);
          setPrice("");
          setTagFailed(true);
        } else {
          setTitle(extTitle);
          setCaption(capText);
          setPrice(extPrice != null ? String(extPrice) : "");
          setTitleFromTag(extTitle !== "");
          setPriceFromTag(extPrice != null);
          setPriceMissing(extPrice == null);
        }
        setStage("edit");
        return;
      }

      generateTitleAndCaption(d.imageDataUrl).then(({ title: t, caption: c, aiSucceeded }) => {
        setTitle(t);
        setCaption(c);
        setAiFailed(!aiSucceeded);
        setStage("edit");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow the caption — recompute height on every value change.
  // Reset to "auto" first so the box can SHRINK when text is deleted; without
  // the reset, scrollHeight stays at the historical max.
  useEffect(() => {
    const el = captionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [caption, stage]);

  // ── Find retake (session 94) — no AI calls ──────────────────────────────
  async function handleFindRetake(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
      console.error("[preview] find retake reader error:", err);
      return;
    }

    const draft = postStore.get();
    if (!draft) {
      router.replace("/my-shelf");
      return;
    }

    // Update postStore + local image. Hard rule: NO /api/post-caption call,
    // NO /api/extract-tag call. Title / Caption / Price preserved verbatim.
    postStore.set({ ...draft, imageDataUrl: dataUrl });
    setImage(dataUrl);
    setRetakeOpen(false);
  }

  // ── Publish ──────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!image || !title.trim()) return;
    if (stage !== "edit") return;

    setStage("publishing");
    setErrorDetail("");

    try {
      const activeMallId     = vendor?.mall_id      ?? localProfile?.mall_id      ?? null;
      const activeVendorId   = vendor?.id           ?? localProfile?.vendor_id    ?? null;
      const activeDispName   = vendor?.display_name ?? localProfile?.display_name ?? null;
      const activeBoothNum   = vendor?.booth_number ?? localProfile?.booth_number ?? null;
      const userIdFromVendor = vendor?.user_id      ?? localProfile?.user_id      ?? null;

      if (!activeMallId || !activeDispName) {
        setErrorDetail("Missing vendor identity. Return to /my-shelf and try again.");
        throw new Error("missing identity");
      }

      let uploadImage: string;
      try {
        uploadImage = await compressForUpload(image, 1200, 0.78);
      } catch (err) {
        setErrorDetail(
          "Couldn't process that image.\n" +
          (err instanceof Error ? err.message : String(err)),
        );
        throw err;
      }

      let vendorId = activeVendorId;
      if (!vendorId) {
        const baseSlug = slugify(activeDispName);
        const slug     = baseSlug + "-" + Date.now().toString(36);

        const { data: newVendor, error: vendorErr } = await createVendor({
          mall_id:      activeMallId,
          display_name: activeDispName,
          booth_number: activeBoothNum || undefined,
          slug,
          user_id:      userIdFromVendor ?? undefined,
        });
        if (!newVendor) {
          setErrorDetail(
            `Couldn't create vendor profile.\n` +
            `mall_id: "${activeMallId}"\n` +
            `Supabase error: ${vendorErr ?? "null"}`,
          );
          throw new Error("vendor null");
        }
        vendorId = newVendor.id;

        if (localProfile) {
          const updated: LocalVendorProfile = {
            ...localProfile,
            vendor_id: newVendor.id,
            slug:      newVendor.slug,
          };
          safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated));
          setLocalProfile(updated);
        }
      }

      let imageUrl: string;
      try {
        imageUrl = await uploadPostImageViaServer(uploadImage, vendorId);
      } catch (err) {
        setErrorDetail(
          "Image upload failed.\n" +
          (err instanceof Error ? err.message : String(err)) +
          "\nYour post was NOT saved — try again.",
        );
        throw err;
      }

      const priceNum = price.trim()
        ? parseFloat(price.replace(/[^0-9.]/g, ""))
        : null;

      const { data: post, error: postErr } = await createPost({
        vendor_id:      vendorId,
        mall_id:        activeMallId,
        title:          title.trim(),
        caption:        caption.trim() || undefined,
        image_url:      imageUrl,
        price_asking:   priceNum != null && !isNaN(priceNum) ? priceNum : null,
        location_label: activeBoothNum ? `Booth ${activeBoothNum}` : undefined,
      });
      if (!post) {
        setErrorDetail(
          `Couldn't save to shelf.\n` +
          `Supabase error: ${postErr ?? "null"}`,
        );
        throw new Error("post null");
      }

      postStore.clear();
      try { sessionStorage.removeItem(FEED_SCROLL_KEY); } catch {}

      // Session 94 (D12) — drop the post-publish interstitial. Land directly
      // on /my-shelf so vendors see the new post in context with the rest of
      // their shelf. Admin ?vendor=<id> impersonation preserved through
      // myShelfHref.
      router.replace(myShelfHref);
    } catch (err) {
      console.error("[preview] publish failed:", err);
      setStage("error");
    }
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
        }}
      >
        {image && (
          <div style={{ width: "62%" }}>
            <PolaroidPreview imageUrl={image} dim />
          </div>
        )}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMuted,
          }}
        >
          Reading your find…
        </motion.div>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 22,
            color: v1.inkPrimary,
            textAlign: "center",
          }}
        >
          Something went wrong.
        </div>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          The post couldn&rsquo;t be saved.
        </div>
        {errorDetail && (
          <div
            style={{
              fontFamily: FONT_SYS,
              fontSize: 11,
              color: v1.inkMuted,
              textAlign: "left",
              lineHeight: 1.7,
              background: v1.inkWash,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${v1.inkHairline}`,
              width: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {errorDetail}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button
            onClick={() => setStage("edit")}
            style={{
              padding: "13px 24px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: v1.green,
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => router.push(myShelfHref)}
            style={{
              padding: "11px 24px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 13,
              color: v1.inkMuted,
              background: "transparent",
              border: `1px solid ${v1.inkHairline}`,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Back to my shelf
          </button>
        </div>
      </div>
    );
  }

  // ── Render: edit ──────────────────────────────────────────────────────────
  // After the early returns above, TS narrows `stage` to `"edit"`. The
  // publishing-disabled UI is keyed off the runtime cast.
  const isPublishing = (stage as Stage) === "publishing";
  const canPublish   = title.trim().length >= 2 && !!image && !isPublishing;

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
      {/* Hidden file inputs for Find retake */}
      <input
        ref={retakeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFindRetake}
        style={{ display: "none" }}
      />
      <input
        ref={retakeLibraryRef}
        type="file"
        accept="image/*"
        onChange={handleFindRetake}
        style={{ display: "none" }}
      />

      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <StickyMasthead
        left={
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} strokeWidth={2} style={{ color: v1.inkPrimary }} />
          </button>
        }
      />

      {/* ── Middle band — vertically centered when content fits ────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflowY: "auto",
          paddingTop: 18,
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 96px))",
        }}
      >
        {/* Title block — D15 extra top spacing for the slight shift-down */}
        <div style={{ textAlign: "center", padding: "14px 22px 18px" }}>
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
            Review your find
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
            Make sure everything looks right before publishing.
          </div>
        </div>

        {/* Fields ABOVE the photo (D7) */}
        <div
          style={{
            padding: "0 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {aiFailed && (
            <AmberNotice>
              Couldn&rsquo;t read this image automatically — fill in the title and details below.
            </AmberNotice>
          )}

          {tagFailed && (
            <AmberNotice>
              Couldn&rsquo;t read this tag — fill in the title and price below.
            </AmberNotice>
          )}

          {priceMissing && !tagFailed && (
            <AmberNotice>
              Couldn&rsquo;t read the price on the tag — fill it in below.
            </AmberNotice>
          )}

          {/* Title */}
          <FieldGroup label="Title" badge={titleFromTag ? <TagBadge /> : undefined}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this?"
              style={inputStyle}
            />
          </FieldGroup>

          {/* Caption — auto-grow */}
          <FieldGroup label="Caption" optional>
            <textarea
              ref={captionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="A short description or story about this piece…"
              rows={2}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.5,
                overflow: "hidden",
              }}
            />
          </FieldGroup>

          {/* Price */}
          <FieldGroup label="Price" optional badge={priceFromTag ? <TagBadge /> : undefined}>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: FONT_SYS,
                  fontSize: 16,
                  color: v1.inkMuted,
                  pointerEvents: "none",
                }}
              >
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </FieldGroup>
        </div>

        {/* Polaroid photo — below the fields, centered, retake link below */}
        {image && (
          <div
            style={{
              padding: "20px 22px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: "62%" }}>
              <PolaroidPreview imageUrl={image} />
            </div>
            <button
              onClick={() => setRetakeOpen(true)}
              style={{
                marginTop: 8,
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
          </div>
        )}
      </div>

      {/* ── Sticky save bar ─────────────────────────────────────────────── */}
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
        }}
      >
        <button
          onClick={handlePublish}
          disabled={!canPublish || isPublishing}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 14,
            fontFamily: FONT_SYS,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.2px",
            color: "#fff",
            background: canPublish ? v1.green : "rgba(30, 77, 43, 0.40)",
            border: "none",
            cursor: canPublish && !isPublishing ? "pointer" : "default",
            boxShadow: canPublish ? "0 2px 12px rgba(30,77,43,0.25)" : "none",
            transition: "background 0.18s ease",
          }}
        >
          {isPublishing ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontFamily: FONT_LORA, fontStyle: "italic" }}
            >
              Publishing…
            </motion.span>
          ) : !title.trim() ? (
            "Add a title to publish"
          ) : (
            "Publish"
          )}
        </button>
      </div>

      {/* ── Find retake sheet ───────────────────────────────────────────── */}
      <AddFindSheet
        open={retakeOpen}
        onClose={() => setRetakeOpen(false)}
        onTakePhoto={() => retakeCameraRef.current?.click()}
        onChooseFromLibrary={() => retakeLibraryRef.current?.click()}
        title="Replace photo"
      />
    </div>
  );
}

// ── PolaroidPreview — inline polaroid wrapper for the find photo ──────────
// Replaces the v1.2 <PhotographPreview /> on this page (D8). PhotographPreview
// itself is preserved for /post/edit/[id]. Polaroid pattern (warm cream paper
// mat, 4px corner radius, dual warm shadow) carved out of the session-83
// "browse-only" rule per docs/capture-flow-refinement-design.md deviation.
function PolaroidPreview({
  imageUrl,
  dim = false,
}: {
  imageUrl: string;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        background: "#faf2e0",
        padding: "7px 7px 8px",
        borderRadius: 4,
        boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 5",
          borderRadius: 4,
          overflow: "hidden",
          background: v1.paperCream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Your find"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
            filter:       TREEHOUSE_LENS_FILTER,
            WebkitFilter: TREEHOUSE_LENS_FILTER,
          }}
        />
      </div>
    </div>
  );
}

// ── FieldGroup helper ─────────────────────────────────────────────────────────
function FieldGroup({
  label,
  optional,
  badge,
  children,
}: {
  label: string;
  optional?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "normal",
          fontSize: 13,
          color: v1.inkMid,
          lineHeight: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>
          {label}
          {optional && (
            <span style={{ color: v1.inkFaint, fontStyle: "italic", fontSize: 12, marginLeft: 5 }}>
              (optional)
            </span>
          )}
        </span>
        {badge}
      </label>
      {children}
    </div>
  );
}

// Shared input style — D9: bg flips inkWash → postit (matches /login/email).
const inputStyle: React.CSSProperties = {
  fontFamily: FONT_SYS,
  fontSize: 16,
  color: v1.inkPrimary,
  background: v1.postit,
  border: `1px solid ${v1.inkHairline}`,
  borderRadius: 14,
  padding: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  lineHeight: 1.4,
  WebkitTapHighlightColor: "transparent",
};

export default function PostPreviewPage() {
  return (
    <Suspense>
      <PostPreviewInner />
    </Suspense>
  );
}
