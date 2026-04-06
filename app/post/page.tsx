// app/post/page.tsx
// Vendor post flow — Step 1.
// Capture a photo and set up (or recall) vendor identity.
// Profile persists to localStorage so repeat vendors don't re-enter their info.

"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { getAllMalls } from "@/lib/posts";
import { postStore } from "@/lib/postStore";
import type { Mall } from "@/types/treehouse";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

// ── Palette ───────────────────────────────────────────────────────────────────
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

function compressImage(dataUrl: string, maxWidth = 1400, quality = 0.84): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / img.width);
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

export default function PostCapturePage() {
  const router     = useRouter();
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [profile,      setProfile]      = useState<LocalVendorProfile | null>(null);
  const [malls,        setMalls]        = useState<Mall[]>([]);
  const [mallsLoading, setMallsLoading] = useState(true);
  const [showSetup,    setShowSetup]    = useState(false);
  const [showMallPick, setShowMallPick] = useState(false);

  const [displayName,  setDisplayName]  = useState("");
  const [boothNumber,  setBoothNumber]  = useState("");
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);
  const [capturing,    setCapturing]    = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as LocalVendorProfile;
        setProfile(saved);
        setDisplayName(saved.display_name);
        setBoothNumber(saved.booth_number ?? "");
      } else {
        setShowSetup(true);
      }
    } catch {
      setShowSetup(true);
    }
    getAllMalls().then(data => { setMalls(data); setMallsLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedMall && profile && malls.length > 0) {
      const match = malls.find(m => m.id === profile.mall_id);
      if (match) setSelectedMall(match);
    }
  }, [malls, profile]);

  const formComplete = displayName.trim().length >= 2 && selectedMall !== null;
  const hasValidProfile =
    (profile !== null && profile.mall_id.length > 0 && profile.display_name.trim().length >= 2) ||
    formComplete;
  const canCapture = hasValidProfile && !capturing;

  function saveProfile() {
    if (!selectedMall) return;
    const p: LocalVendorProfile = {
      display_name: displayName.trim(),
      booth_number: boothNumber.trim(),
      mall_id:      selectedMall.id,
      mall_name:    selectedMall.name,
      mall_city:    selectedMall.city,
      vendor_id:    profile?.vendor_id,
      slug:         profile?.slug,
    };
    try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(p)); } catch {}
    setProfile(p);
    setShowSetup(false);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setCapturing(true);
    const reader = new FileReader();
    reader.onload = async e => {
      const raw        = e.target?.result as string;
      const compressed = await compressImage(raw);
      postStore.set(compressed);
      router.push("/post/preview");
    };
    reader.readAsDataURL(file);
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    background: C.input, border: `1px solid ${C.inputBorder}`,
    color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: C.textMuted, textTransform: "uppercase",
    letterSpacing: "1.8px", display: "block", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={galleryRef} type="file" accept="image/*"                        className="hidden" onChange={onFileChange} />

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}
          >
            <ArrowLeft size={15} style={{ color: C.textMid }} />
          </button>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1 }}>Post a find</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>Share with your community</div>
          </div>
        </header>

        <div style={{ flex: 1, padding: "16px 15px", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Vendor identity card ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}
          >
            <button
              onClick={() => setShowSetup(s => !s)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: showSetup ? `1px solid ${C.border}` : "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px" }}>Your vendor profile</div>
                {profile
                  ? <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: C.textPrimary, fontWeight: 600 }}>
                      {[profile.display_name, profile.booth_number ? `Booth ${profile.booth_number}` : null, profile.mall_name].filter(Boolean).join(" · ")}
                    </div>
                  : <div style={{ fontSize: 12, color: C.textMuted }}>Set up your profile to post</div>
                }
              </div>
              {showSetup
                ? <ChevronUp   size={14} style={{ color: C.textMuted, flexShrink: 0 }} />
                : <ChevronDown size={14} style={{ color: C.textMuted, flexShrink: 0 }} />
              }
            </button>

            <AnimatePresence>
              {showSetup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>

                    <div>
                      <label style={labelStyle}>Vendor name</label>
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Magnolia & Co." style={{ ...inputStyle, fontFamily: "Georgia, serif" }} />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Booth number <span style={{ color: C.textFaint, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <input type="text" value={boothNumber} onChange={e => setBoothNumber(e.target.value)} placeholder="e.g. 42B" style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>Your mall</label>
                      {mallsLoading ? (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: C.textMuted }}>Loading malls…</div>
                      ) : malls.length === 0 ? (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>No malls listed yet. Contact your mall manager to get added.</div>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowMallPick(s => !s)}
                            style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${selectedMall ? C.greenBorder : C.inputBorder}`, background: C.input, cursor: "pointer", fontFamily: selectedMall ? "Georgia, serif" : "inherit", color: selectedMall ? C.textPrimary : C.textMuted }}
                          >
                            <span>{selectedMall ? `${selectedMall.name} · ${selectedMall.city}` : "Select your mall"}</span>
                            <ChevronDown size={13} style={{ color: C.textMuted, flexShrink: 0 }} />
                          </button>

                          <AnimatePresence>
                            {showMallPick && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden", marginTop: 4 }}
                              >
                                <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden", background: "#fff", maxHeight: 200, overflowY: "auto" }}>
                                  {malls.map(mall => (
                                    <button
                                      key={mall.id}
                                      onClick={() => { setSelectedMall(mall); setShowMallPick(false); }}
                                      style={{ width: "100%", padding: "11px 14px", background: selectedMall?.id === mall.id ? C.greenLight : "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left" }}
                                    >
                                      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: C.textPrimary, lineHeight: 1.2 }}>{mall.name}</div>
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

                    <button
                      onClick={saveProfile}
                      disabled={!formComplete}
                      style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600, letterSpacing: "0.2px", cursor: formComplete ? "pointer" : "default", color: formComplete ? "#fff" : C.textFaint, background: formComplete ? C.green : C.surfaceDeep, border: "none", transition: "all 0.2s" }}
                    >
                      {profile ? "Update profile" : "Save profile"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Photo capture area ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", paddingLeft: 2 }}>
              Photograph your find
            </div>

            <motion.button
              onClick={() => canCapture && cameraRef.current?.click()}
              disabled={!canCapture}
              style={{ width: "100%", padding: "48px 22px", borderRadius: 16, cursor: canCapture ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: canCapture ? C.surface : C.surfaceDeep, border: `1px dashed ${canCapture ? "rgba(30,77,43,0.3)" : C.border}`, transition: "all 0.2s" }}
              whileTap={canCapture ? { scale: 0.98 } : {}}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: canCapture ? C.greenLight : C.surfaceDeep, border: `1px solid ${canCapture ? C.greenBorder : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <Camera size={22} style={{ color: canCapture ? C.green : C.textFaint }} />
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, lineHeight: 1.2, color: canCapture ? C.textPrimary : C.textFaint, transition: "color 0.2s" }}>
                {capturing ? "Opening camera…" : "Take a photo"}
              </div>
              {!hasValidProfile && (
                <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", maxWidth: 210, lineHeight: 1.5 }}>
                  Complete your vendor profile above to continue
                </div>
              )}
            </motion.button>

            <button
              onClick={() => canCapture && galleryRef.current?.click()}
              disabled={!canCapture}
              style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, border: "none", color: canCapture ? C.green : C.textFaint, background: "transparent", cursor: canCapture ? "pointer" : "default", transition: "color 0.2s", textDecoration: canCapture ? "underline" : "none", textDecorationColor: "rgba(30,77,43,0.3)" }}
            >
              Choose from library
            </button>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, padding: "12px 14px" }}
          >
            <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>Posting tips</div>
            {[
              "Good light goes a long way — natural is best",
              "Get close enough to show the character of the piece",
              "One item per photo reads better than a crowded shelf",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <span style={{ fontSize: 9, color: C.textFaint, marginTop: 1, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 11, color: C.textMid, lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
