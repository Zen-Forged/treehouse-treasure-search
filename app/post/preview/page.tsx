// app/post/preview/page.tsx
// v1.2 — "Review your find" page.
// See docs/design-system-v1.2-build-spec.md §4 and the approved mockup
// docs/mockups/review-page-v1-2.html.
//
// The vendor lands here from /my-shelf's <AddFindSheet> after picking a
// photo. The photograph is shown exactly as shoppers will see it on Find
// Detail (via <PhotographPreview>'s photo truth rule — no crop, paper fills
// letterbox). The vendor edits Title / Caption / Price inline (no Edit/Done
// pill — fields are always editable) and taps Publish.
//
// Layout (top-to-bottom):
//   1. Masthead (Mode C) — 38px paper back-bubble + stacked "Review your find"
//      IM Fell 24px title + italic 14px muted subhead
//   2. <PhotographPreview> with vendor booth post-it
//   3. 22px spacer (clears post-it overhang)
//   4. <PostingAsBlock> attribution row
//   5. Fields section: Title → Caption → Price
//      - AmberNotice above the Title when AI caption failed
//      - Labels: IM Fell italic 13px muted
//      - Inputs: v1.inkWash bg, 14px radius, FONT_SYS 16px
//      - Price has $ prefix, 28px padding-left
//   6. Sticky save bar: filled green "Publish" button
//
// Behavior preserved from v0.2:
//   - Auto-generate title + caption on mount via /api/post-caption
//   - Session-27 `source: "claude" | "mock"` check — non-claude responses
//     leave fields blank and surface an AmberNotice instead of populating
//     with generic mock strings
//   - identity resolution via getVendorByUserId(user.id) FIRST, fallback to
//     LOCAL_VENDOR_KEY ONLY for unauth users (KI-003 guard, session 9)
//   - uploadPostImageViaServer throws on any upload failure, surfacing as
//     error screen rather than orphan post with image_url: null
//
// Success screen (stage === "done") is separate below — paper-wash check
// bubble + IM Fell 22px "Saved to shelf." + three stacked actions.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Camera } from "lucide-react";
import {
  createPost,
  createVendor,
  getVendorByUserId,
  getVendorById,
  slugify,
} from "@/lib/posts";
import { compressImage, uploadPostImageViaServer } from "@/lib/imageUpload";
import { postStore } from "@/lib/postStore";
import { safeStorage } from "@/lib/safeStorage";
import { getSession, isAdmin } from "@/lib/auth";
import {
  LOCAL_VENDOR_KEY,
  type LocalVendorProfile,
  type Vendor,
} from "@/types/treehouse";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import PhotographPreview from "@/components/PhotographPreview";
import PostingAsBlock from "@/components/PostingAsBlock";
import AmberNotice from "@/components/AmberNotice";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/KentuckyTreehouse";
const FEED_SCROLL_KEY   = "treehouse_feed_scroll";

// ── Caption API ──────────────────────────────────────────────────────────────
// Re-uses the v0.2 compressForUpload + two-pass pattern so phone photos don't
// balloon the request body. Session-27 `source` field is still the truth test.

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
    // Session 27: mock responses are generic hardcoded strings, NOT
    // descriptions of the photographed item. Non-claude source means we
    // should leave the fields blank and show the amber notice rather than
    // populate with misleading generic text.
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

// ── Stage machine ────────────────────────────────────────────────────────────
// "loading"    — caption API pending, photograph shown at reduced opacity
// "edit"       — form is editable; publish button active
// "publishing" — upload + createPost in progress
// "done"       — success screen visible
// "error"      — error screen with Try again + Go back
type Stage = "loading" | "edit" | "publishing" | "done" | "error";

// ══════════════════════════════════════════════════════════════════════════════
// Inner page (wrapped in Suspense below for useSearchParams)
// ══════════════════════════════════════════════════════════════════════════════

function PostPreviewInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [image,         setImage]         = useState<string | null>(null);
  const [vendor,        setVendor]        = useState<Vendor | null>(null);
  const [localProfile,  setLocalProfile]  = useState<LocalVendorProfile | null>(null);
  const [stage,         setStage]         = useState<Stage>("loading");
  const [errorDetail,   setErrorDetail]   = useState<string>("");
  const [aiFailed,      setAiFailed]      = useState(false);

  const [title,   setTitle]   = useState("");
  const [caption, setCaption] = useState("");
  const [price,   setPrice]   = useState("");

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

      // Identity: mirror /post's resolution order. Admin `?vendor=id` beats
      // self-lookup; self-lookup beats localStorage; localStorage ONLY if
      // unauth (KI-003 guard).
      const session   = await getSession();
      const user      = session?.user ?? null;
      const admin     = user ? isAdmin(user) : false;
      const vParam    = searchParams.get("vendor");

      if (admin && vParam) {
        const v = await getVendorById(vParam);
        if (v) {
          setVendor(v);
          startCaption(draft.imageDataUrl);
          return;
        }
      }

      if (user) {
        const v = await getVendorByUserId(user.id);
        if (v) {
          setVendor(v);
          startCaption(draft.imageDataUrl);
          return;
        }
        // Signed-in user with no linked vendor — route them back to /my-shelf
        // which runs the self-heal lookup-vendor path.
        router.replace("/my-shelf");
        return;
      }

      // Unauth fallback to localStorage (legacy support; the v1.2 flow
      // originates from /my-shelf which is auth-gated, so this path is
      // only reached by direct deep-link).
      const raw = safeStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) {
        try {
          const p = JSON.parse(raw) as LocalVendorProfile;
          setLocalProfile(p);
          startCaption(draft.imageDataUrl);
          return;
        } catch {}
      }

      router.replace("/login?next=/my-shelf");
    })();

    function startCaption(imageDataUrl: string) {
      generateTitleAndCaption(imageDataUrl).then(({ title: t, caption: c, aiSucceeded }) => {
        setTitle(t);
        setCaption(c);
        setAiFailed(!aiSucceeded);
        setStage("edit");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Publish ──────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!image || !title.trim()) return;
    if (stage !== "edit") return;

    setStage("publishing");
    setErrorDetail("");

    try {
      // Resolve active identity fields from whichever source populated them.
      const activeMallId     = vendor?.mall_id      ?? localProfile?.mall_id      ?? null;
      const activeVendorId   = vendor?.id           ?? localProfile?.vendor_id    ?? null;
      const activeDispName   = vendor?.display_name ?? localProfile?.display_name ?? null;
      const activeBoothNum   = vendor?.booth_number ?? localProfile?.booth_number ?? null;
      const userIdFromVendor = vendor?.user_id      ?? localProfile?.user_id      ?? null;

      if (!activeMallId || !activeDispName) {
        setErrorDetail("Missing vendor identity. Return to /my-shelf and try again.");
        throw new Error("missing identity");
      }

      // Compress once more for the upload (defensive; phone-photo sizes can
      // still be multi-MB even after an earlier pass).
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

      // If we don't yet have a vendor row (unauth/localStorage path), create
      // one. This preserves v0.2 behavior and the 23505 recovery in
      // createVendor.
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

      // Upload — throws on any failure; we never write a post row with
      // image_url: null.
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
      // Clear feed scroll cache so Home lands at top showing the new post.
      try { sessionStorage.removeItem(FEED_SCROLL_KEY); } catch {}
      setStage("done");
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
          <div style={{ width: "78%", borderRadius: v1.imageRadius, overflow: "hidden", opacity: 0.55 }}>
            <img src={image} alt="" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
          </div>
        )}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{
            fontFamily: FONT_IM_FELL,
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

  // ── Render: done ──────────────────────────────────────────────────────────
  if (stage === "done") {
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
          padding: "0 24px",
        }}
      >
        {/* Paper-wash check bubble (v1.1k primitive) */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: v1.iconBubble,
            border: `1px solid ${v1.inkHairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={24} strokeWidth={1.8} style={{ color: v1.green }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 22,
              color: v1.inkPrimary,
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Saved to shelf.
          </div>
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1.6,
            }}
          >
            It&rsquo;s live in the Treehouse feed.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30 }}
          style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}
        >
          <button
            onClick={() => router.push("/my-shelf")}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: v1.green,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(30,77,43,0.25)",
              letterSpacing: "0.2px",
            }}
          >
            View my shelf
          </button>

          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "13px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 13,
              fontWeight: 500,
              color: v1.inkMid,
              background: v1.iconBubble,
              border: `1px solid ${v1.inkHairline}`,
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Visit us on Facebook
          </a>

          <button
            onClick={() => router.push("/my-shelf?openAdd=1")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 14,
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Camera size={13} style={{ color: v1.inkMuted }} />
            Add another find
          </button>
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
            fontFamily: FONT_IM_FELL,
            fontSize: 22,
            color: v1.inkPrimary,
            textAlign: "center",
          }}
        >
          Something went wrong.
        </div>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
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
            onClick={() => router.push("/my-shelf")}
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
  // TypeScript narrows `stage` to `"edit"` after the three early returns
  // above, which makes any `stage === "publishing"` check in the JSX below
  // look unreachable. At runtime it IS reachable — handlePublish() calls
  // setStage("publishing") and React re-renders synchronously into this
  // branch. Cast once to the full Stage union via `as Stage` so the JSX
  // comparisons typecheck without suppressing the runtime check.
  const isPublishing = (stage as Stage) === "publishing";

  // Resolve the display identity for PostingAsBlock. If we have a real
  // Vendor row, pass it straight through. If we only have a LocalVendorProfile
  // (unauth fallback), shim it into a Vendor-shaped object with the minimal
  // fields PostingAsBlock reads. This keeps that primitive strict about its
  // Vendor type without us spreading conditional rendering through the page.
  const postingVendor: Vendor | null = vendor
    ? vendor
    : localProfile
    ? ({
        id:             localProfile.vendor_id ?? "",
        created_at:     "",
        updated_at:     "",
        user_id:        localProfile.user_id ?? null,
        mall_id:        localProfile.mall_id,
        display_name:   localProfile.display_name,
        booth_number:   localProfile.booth_number || null,
        bio:            null,
        avatar_url:     null,
        slug:           localProfile.slug ?? "",
        facebook_url:   null,
        hero_image_url: null,
        mall: {
          id:         localProfile.mall_id,
          created_at: "",
          updated_at: "",
          name:       localProfile.mall_name,
          city:       localProfile.mall_city,
          state:      "",
          slug:       "",
          address:    null,
        },
      } as Vendor)
    : null;

  const boothNumber = vendor?.booth_number ?? localProfile?.booth_number ?? null;
  const canPublish  = title.trim().length >= 2 && !!image && !isPublishing;

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
      {/* Scroll container covers the masthead + fields; save bar sits
          outside the scroll context pinned to the bottom. */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(108px, calc(env(safe-area-inset-bottom, 0px) + 96px))",
        }}
      >
        {/* ── 1. Masthead (Mode C) ─────────────────────────────────────── */}
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
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
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
              Review your find
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
              Here&rsquo;s how shoppers will see it.
            </div>
          </div>
        </div>

        {/* ── 2. Photograph ────────────────────────────────────────────── */}
        {image && (
          <PhotographPreview
            imageUrl={image}
            boothNumber={boothNumber}
          />
        )}

        {/* ── 3. Post-it overhang spacer ───────────────────────────────── */}
        <div style={{ height: 22 }} aria-hidden="true" />

        {/* ── 4. Posting-as attribution row ────────────────────────────── */}
        {postingVendor && <PostingAsBlock vendor={postingVendor} />}

        {/* ── 5. Fields ────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "18px 22px 20px",
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

          {/* Title */}
          <FieldGroup label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this?"
              style={inputStyle}
            />
          </FieldGroup>

          {/* Caption */}
          <FieldGroup label="Caption" optional>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="A short description or story about this piece…"
              rows={3}
              style={{
                ...inputStyle,
                minHeight: 78,
                resize: "none",
                lineHeight: 1.5,
              }}
            />
          </FieldGroup>

          {/* Price */}
          <FieldGroup label="Price" optional>
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
      </div>

      {/* ── 6. Sticky save bar ─────────────────────────────────────────── */}
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
            color: canPublish ? "#fff" : v1.inkFaint,
            background: canPublish ? v1.green : v1.inkWash,
            border: "none",
            cursor: canPublish && !isPublishing ? "pointer" : "default",
            boxShadow: canPublish ? "0 2px 12px rgba(30,77,43,0.25)" : "none",
            transition: "background 0.18s ease, color 0.18s ease",
          }}
        >
          {isPublishing ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic" }}
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
    </div>
  );
}

// ── FieldGroup helper ─────────────────────────────────────────────────────────
// Encapsulates the label + input pair so the markup above stays scannable.
function FieldGroup({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          lineHeight: 1.3,
        }}
      >
        {label}
        {optional && (
          <span style={{ color: v1.inkFaint, fontStyle: "italic", marginLeft: 4 }}>
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// Shared input style — v1.2 inkWash bg, 14px radius, FONT_SYS 16px inkPrimary.
const inputStyle: React.CSSProperties = {
  fontFamily: FONT_SYS,
  fontSize: 16,
  color: v1.inkPrimary,
  background: v1.inkWash,
  border: `1px solid ${v1.inkHairline}`,
  borderRadius: 14,
  padding: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  lineHeight: 1.4,
  WebkitTapHighlightColor: "transparent",
};

// ══════════════════════════════════════════════════════════════════════════════
export default function PostPreviewPage() {
  return (
    <Suspense>
      <PostPreviewInner />
    </Suspense>
  );
}
