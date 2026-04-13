// app/post/page.tsx
// Vendor capture — auth-optional (soft gate).
//
// IDENTITY RESOLUTION (authoritative order):
//   1. If auth session + ?vendor=[id] query param (admin posting to specific booth)
//   2. If auth session exists → getVendorByUserId(user.id) → locked identity from Supabase
//   3. If no Supabase vendor found + localStorage has profile → use as pending identity
//   4. If neither → show setup form (first-time vendor)
//
// Admin fix: if ?vendor=[id] is present in URL (set by My Shelf admin switcher),
// the post is attributed to that vendor ID, not the admin's own user_id-linked vendor.
//
// After a successful save, page redirects to /my-shelf after 1.8s.

"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, ChevronDown, Check, Loader } from "lucide-react";
import { getAllMalls, createPost, createVendor, uploadPostImage, getVendorByUserId, getVendorById, slugify } from "@/lib/posts";
import { safeStorage } from "@/lib/safeStorage";
import { getSession, isAdmin } from "@/lib/auth";
import type { Mall, Vendor } from "@/types/treehouse";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

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
  greenLight:  "rgba(30,77,43,0.07)",
  greenBorder: "rgba(30,77,43,0.18)",
  input:       "rgba(255,255,255,0.7)",
  inputBorder: "rgba(26,26,24,0.14)",
};

function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.78): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function generateCaption(imageDataUrl: string): Promise<{ title: string; caption: string }> {
  try {
    const res = await fetch("/api/post-caption", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ imageDataUrl }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { title: data.title ?? "", caption: data.caption ?? "" };
  } catch (err) {
    console.error("[post] generateCaption failed:", err);
    return { title: "", caption: "" };
  }
}

type SaveStage = "idle" | "generating" | "uploading" | "done" | "error";

// ─── Inner component (needs useSearchParams) ───────────────────────────────────

function PostCaptureInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const cameraRef    = useRef<HTMLInputElement>(null);
  const galleryRef   = useRef<HTMLInputElement>(null);

  const [identityReady, setIdentityReady] = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [adminUser,     setAdminUser]     = useState(false);

  // resolvedVendor: the Supabase-confirmed vendor to post under
  // For admin: may be set from ?vendor=[id] param (the booth they're managing)
  const [resolvedVendor, setResolvedVendor] = useState<Vendor | null>(null);
  const [localProfile,   setLocalProfile]   = useState<LocalVendorProfile | null>(null);

  const [malls,        setMalls]        = useState<Mall[]>([]);
  const [mallsLoading, setMallsLoading] = useState(true);

  // First-time setup form state
  const [showMallPick, setShowMallPick] = useState(false);
  const [displayName,  setDisplayName]  = useState("");
  const [boothNumber,  setBoothNumber]  = useState("");
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);

  // Save flow
  const [saveStage,  setSaveStage]  = useState<SaveStage>("idle");
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // ── Identity resolution ──
  useEffect(() => {
    getSession().then(async s => {
      const uid   = s?.user?.id ?? null;
      const admin = s?.user ? isAdmin(s.user) : false;
      setUserId(uid);
      setAdminUser(admin);

      getAllMalls().then(data => { setMalls(data); setMallsLoading(false); });

      // Admin with ?vendor=[id] param → post to that specific vendor's booth
      const vendorParam = searchParams.get("vendor");
      if (admin && vendorParam && uid) {
        const v = await getVendorById(vendorParam);
        if (v) {
          setResolvedVendor(v);
          setIdentityReady(true);
          return;
        }
      }

      if (uid) {
        const vendor = await getVendorByUserId(uid);
        if (vendor) {
          setResolvedVendor(vendor);
          const cached: LocalVendorProfile = {
            display_name: vendor.display_name,
            booth_number: vendor.booth_number ?? "",
            mall_id:      vendor.mall_id,
            mall_name:    (vendor.mall as any)?.name ?? "",
            mall_city:    (vendor.mall as any)?.city ?? "",
            vendor_id:    vendor.id,
            slug:         vendor.slug,
            user_id:      uid,
          };
          safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(cached));
          setIdentityReady(true);
          return;
        }
      }

      const raw = safeStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) {
        try {
          const saved = JSON.parse(raw) as LocalVendorProfile;
          if (uid && !saved.user_id) {
            const updated = { ...saved, user_id: uid };
            safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated));
            setLocalProfile(updated);
          } else {
            setLocalProfile(saved);
          }
        } catch {}
      }

      setIdentityReady(true);
    });
  }, []);

  useEffect(() => {
    if (malls.length === 0 || mallsLoading || !localProfile) return;
    const match = malls.find(m => m.id === localProfile.mall_id);
    if (match) setSelectedMall(match);
  }, [malls, mallsLoading, localProfile]);

  function saveLocalProfile() {
    if (!selectedMall || displayName.trim().length < 2) return;
    const p: LocalVendorProfile = {
      display_name: displayName.trim(),
      booth_number: boothNumber.trim(),
      mall_id:      selectedMall.id,
      mall_name:    selectedMall.name,
      mall_city:    selectedMall.city,
      user_id:      userId ?? undefined,
    };
    safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(p));
    setLocalProfile(p);
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const activeVendorId = resolvedVendor?.id ?? localProfile?.vendor_id ?? null;
    const activeMallId   = resolvedVendor?.mall_id ?? localProfile?.mall_id ?? null;
    const activeBoothNum = resolvedVendor?.booth_number ?? localProfile?.booth_number ?? null;
    const activeDispName = resolvedVendor?.display_name ?? localProfile?.display_name ?? null;

    if (!activeMallId || !activeDispName) {
      setSaveError("No vendor identity found. Complete your profile first.");
      setSaveStage("error");
      return;
    }

    setSaveStage("generating");
    setSaveError(null);

    try {
      const reader  = new FileReader();
      const rawData = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(rawData);
      setPreviewImg(compressed);

      const { title, caption } = await generateCaption(compressed);

      setSaveStage("uploading");

      let vendorId = activeVendorId;

      if (!vendorId) {
        const baseSlug = slugify(activeDispName);
        const slug     = baseSlug + "-" + Date.now().toString(36);
        const { data: vendor, error: vendorErr } = await createVendor({
          mall_id:      activeMallId,
          display_name: activeDispName,
          booth_number: activeBoothNum || undefined,
          slug,
          user_id:      userId ?? undefined,
        });
        if (!vendor) {
          setSaveError("Couldn't create vendor profile. Try again.");
          setSaveStage("error");
          return;
        }
        vendorId = vendor.id;

        const updated: LocalVendorProfile = {
          ...(localProfile ?? {
            display_name: activeDispName,
            booth_number: activeBoothNum ?? "",
            mall_id:      activeMallId,
            mall_name:    selectedMall?.name ?? "",
            mall_city:    selectedMall?.city ?? "",
          }),
          vendor_id: vendor.id,
          slug:      vendor.slug,
          user_id:   userId ?? undefined,
        };
        safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(updated));
        setLocalProfile(updated);
      }

      let imageUrl: string | null = null;
      try { imageUrl = await uploadPostImage(compressed, vendorId); } catch {}

      const { data: post } = await createPost({
        vendor_id:      vendorId,
        mall_id:        activeMallId,
        title:          title.trim() || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        caption:        caption.trim() || undefined,
        image_url:      imageUrl ?? undefined,
        location_label: activeBoothNum ? `Booth ${activeBoothNum}` : undefined,
      });

      if (!post) {
        setSaveError("Couldn't save to shelf. Try again.");
        setSaveStage("error");
        return;
      }

      setSaveStage("done");

      // Redirect to My Shelf after save confirmation
      setTimeout(() => {
        router.push("/my-shelf");
      }, 1800);

    } catch (err) {
      console.error("[post] save failed:", err);
      setSaveError("Something went wrong. Try again.");
      setSaveStage("error");
    }
  }, [resolvedVendor, localProfile, userId, selectedMall]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const hasValidIdentity = !!(resolvedVendor?.mall_id || localProfile?.mall_id) &&
                           !!(resolvedVendor?.display_name?.trim() || localProfile?.display_name?.trim());

  const formComplete = displayName.trim().length >= 2 && selectedMall !== null;
  const isSaving     = saveStage === "generating" || saveStage === "uploading";
  const canCapture   = hasValidIdentity && !isSaving;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    background: C.input, border: `1px solid ${C.inputBorder}`,
    color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: C.textMuted, textTransform: "uppercase",
    letterSpacing: "1.8px", display: "block", marginBottom: 6,
  };

  if (!identityReady) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* ── Toast overlay — CENTERED in take-a-photo section ── */}
      <AnimatePresence>
        {(isSaving || saveStage === "done" || saveStage === "error") && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 100,
              maxWidth: 300,
              width: "calc(100% - 48px)",
              background: saveStage === "error"
                ? "rgba(139,32,32,0.92)"
                : saveStage === "done"
                  ? "rgba(18,34,20,0.92)"
                  : "rgba(26,24,16,0.88)",
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
              borderRadius: 20, padding: "20px 22px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
              textAlign: "center",
            }}
          >
            {previewImg && saveStage !== "error" && (
              <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.1)" }}>
                <img src={previewImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {saveStage === "done" && (
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} style={{ color: "#fff" }} />
              </div>
            )}
            {isSaving && (
              <Loader size={20} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />
            )}
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>
                {saveStage === "generating" ? "Reading your find…" :
                 saveStage === "uploading"  ? "Saving to shelf…" :
                 saveStage === "done"       ? "Added to your shelf!" :
                                             saveError ?? "Something went wrong"}
              </div>
              {isSaving && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  {saveStage === "generating" ? "Writing a caption" : "Uploading image"}
                </div>
              )}
              {saveStage === "done" && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  Taking you to your shelf…
                </div>
              )}
            </div>
            {saveStage === "error" && (
              <button onClick={() => { setSaveStage("idle"); setSaveError(null); setPreviewImg(null); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, cursor: "pointer", padding: "8px 16px" }}>
                Dismiss
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <header style={{ display: "flex", alignItems: "center", padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", marginRight: 12, WebkitTapHighlightColor: "transparent" }}>
            <ArrowLeft size={15} style={{ color: C.textMid }} />
          </button>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1 }}>Add to Shelf</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>
              {resolvedVendor ? resolvedVendor.display_name : "Share with your community"}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: "16px 15px", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Vendor identity card ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>

            {hasValidIdentity ? (
              <div style={{ padding: "13px 14px" }}>
                <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 6 }}>Posting as</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>
                  {resolvedVendor?.display_name ?? localProfile?.display_name}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {[
                    (resolvedVendor?.booth_number ?? localProfile?.booth_number) ? `Booth ${resolvedVendor?.booth_number ?? localProfile?.booth_number}` : null,
                    (resolvedVendor?.mall as any)?.name ?? localProfile?.mall_name,
                    (resolvedVendor?.mall as any)?.city ?? localProfile?.mall_city,
                  ].filter(Boolean).join(" · ")}
                </div>
              </div>
            ) : (
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>
                  Set up your vendor profile
                </div>
                <div>
                  <label style={labelStyle}>Vendor name</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Magnolia & Co." style={{ ...inputStyle, fontFamily: "Georgia, serif" }} />
                </div>
                <div>
                  <label style={labelStyle}>Booth number <span style={{ color: C.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <input type="text" value={boothNumber} onChange={e => setBoothNumber(e.target.value)} placeholder="e.g. 42B" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Your mall</label>
                  {mallsLoading ? (
                    <div style={{ padding: "10px 12px", fontSize: 12, color: C.textMuted }}>Loading malls…</div>
                  ) : (
                    <>
                      <button onClick={() => setShowMallPick(s => !s)}
                        style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${selectedMall ? C.greenBorder : C.inputBorder}`, cursor: "pointer", color: selectedMall ? C.textPrimary : C.textMuted, fontFamily: selectedMall ? "Georgia, serif" : "inherit" }}>
                        <span>{selectedMall ? `${selectedMall.name} · ${selectedMall.city}` : "Select your mall"}</span>
                        <ChevronDown size={13} style={{ color: C.textMuted, flexShrink: 0 }} />
                      </button>
                      <AnimatePresence>
                        {showMallPick && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden", marginTop: 4 }}>
                            <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden", background: "#fff", maxHeight: 200, overflowY: "auto" }}>
                              {malls.map(mall => (
                                <button key={mall.id} onClick={() => { setSelectedMall(mall); setShowMallPick(false); }}
                                  style={{ width: "100%", padding: "11px 14px", background: selectedMall?.id === mall.id ? C.greenLight : "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}>
                                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: C.textPrimary }}>{mall.name}</div>
                                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{mall.city}, {mall.state}</div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                <button onClick={saveLocalProfile} disabled={!formComplete}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: formComplete ? "pointer" : "default", color: formComplete ? "#fff" : C.textFaint, background: formComplete ? C.green : C.surfaceDeep, border: "none", transition: "all 0.2s" }}>
                  Save profile
                </button>
              </div>
            )}
          </motion.div>

          {/* ── Photo capture ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", paddingLeft: 2 }}>Photograph your find</div>

            <motion.button onClick={() => canCapture && cameraRef.current?.click()} disabled={!canCapture}
              style={{ width: "100%", padding: "48px 22px", borderRadius: 16, cursor: canCapture ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: canCapture ? C.surface : C.surfaceDeep, border: `1px dashed ${canCapture ? "rgba(30,77,43,0.3)" : C.border}`, transition: "all 0.2s" }}
              whileTap={canCapture ? { scale: 0.98 } : {}}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: canCapture ? C.greenLight : C.surfaceDeep, border: `1px solid ${canCapture ? C.greenBorder : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={22} style={{ color: canCapture ? C.green : C.textFaint }} />
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: canCapture ? C.textPrimary : C.textFaint }}>
                {isSaving ? "Saving…" : "Take a photo"}
              </div>
              {!hasValidIdentity && (
                <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", maxWidth: 210, lineHeight: 1.5 }}>
                  Complete your vendor profile above to continue
                </div>
              )}
            </motion.button>

            <button onClick={() => canCapture && galleryRef.current?.click()} disabled={!canCapture}
              style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, border: "none", color: canCapture ? C.green : C.textFaint, background: "transparent", cursor: canCapture ? "pointer" : "default", textDecoration: canCapture ? "underline" : "none", textDecorationColor: "rgba(30,77,43,0.3)" }}>
              Choose from library
            </button>

            {hasValidIdentity && (
              <button onClick={() => router.push("/my-shelf")}
                style={{ width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, border: `1px solid ${C.border}`, color: C.textMid, background: C.surface, cursor: "pointer", fontFamily: "Georgia, serif" }}>
                View my shelf →
              </button>
            )}
          </motion.div>

          {/* ── Tips ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}
            style={{ borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>Posting tips</div>
            {["Good light goes a long way — natural is best", "Get close enough to show the character of the piece", "One item per photo reads better than a crowded shelf"].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <span style={{ fontSize: 9, color: C.textFaint, marginTop: 1, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 11, color: C.textMid, lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <style>{`.hidden { display: none; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─── Page wrapper — Suspense for useSearchParams ───────────────────────────────

export default function PostCapturePage() {
  return (
    <Suspense>
      <PostCaptureInner />
    </Suspense>
  );
}
