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

  // Load saved profile from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as LocalVendorProfile;
        setProfile(saved);
        setDisplayName(saved.display_name);
        setBoothNumber(saved.booth_number ?? "");
        // Don't open setup — they already have a profile
      } else {
        // First time — open setup automatically
        setShowSetup(true);
      }
    } catch {
      setShowSetup(true);
    }

    getAllMalls().then(data => {
      setMalls(data);
      setMallsLoading(false);
    });
  }, []);

  // Once malls load, restore the vendor's saved mall selection
  useEffect(() => {
    if (!selectedMall && profile && malls.length > 0) {
      const match = malls.find(m => m.id === profile.mall_id);
      if (match) setSelectedMall(match);
    }
  }, [malls, profile]);

  // ── Profile completeness ────────────────────────────────────────────────────
  // For the form: needs name + mall selected
  const formComplete = displayName.trim().length >= 2 && selectedMall !== null;

  // For capture: either a saved profile exists (already has mall_id stored),
  // OR they've just filled the form and selected a mall in this session.
  // A saved profile with a mall_id is sufficient — we don't need the mall
  // object loaded to proceed; uploadPostImage only needs the mall_id string.
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

  return (
    <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={galleryRef} type="file" accept="image/*"                        className="hidden" onChange={onFileChange} />

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, maxWidth: 430, margin: "0 auto", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(200,180,126,0.04) 0%, transparent 60%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 14px" }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.1)", cursor: "pointer" }}
          >
            <ArrowLeft size={15} style={{ color: "#7a6535" }} />
          </button>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: "#f5f0e8", lineHeight: 1 }}>Post a find</div>
            <div style={{ fontSize: 9, color: "#3a2e18", textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>Share with your community</div>
          </div>
        </header>

        <div style={{ flex: 1, padding: "0 15px", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Vendor identity card ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ borderRadius: 14, background: "rgba(13,31,13,0.55)", border: "1px solid rgba(109,188,109,0.1)", overflow: "hidden" }}
          >
            <button
              onClick={() => setShowSetup(s => !s)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: showSetup ? "1px solid rgba(109,188,109,0.07)" : "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                <div style={{ fontSize: 8, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px" }}>Your vendor profile</div>
                {profile
                  ? <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#d4c9b0", fontWeight: 600 }}>
                      {[profile.display_name, profile.booth_number ? `Booth ${profile.booth_number}` : null, profile.mall_name].filter(Boolean).join(" · ")}
                    </div>
                  : <div style={{ fontSize: 12, color: "#4a3a1e" }}>Set up your profile to post</div>
                }
              </div>
              {showSetup
                ? <ChevronUp   size={14} style={{ color: "#3a2e18", flexShrink: 0 }} />
                : <ChevronDown size={14} style={{ color: "#3a2e18", flexShrink: 0 }} />
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

                    {/* Display name */}
                    <div>
                      <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px", display: "block", marginBottom: 6 }}>Vendor name</label>
                      <input
                        type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                        placeholder="e.g. Magnolia & Co."
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(5,13,5,0.8)", border: "1px solid rgba(109,188,109,0.12)", color: "#f5f0e8", fontSize: 14, outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Booth number */}
                    <div>
                      <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px", display: "block", marginBottom: 6 }}>
                        Booth number <span style={{ color: "#1e1808", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <input
                        type="text" value={boothNumber} onChange={e => setBoothNumber(e.target.value)}
                        placeholder="e.g. 42B"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(5,13,5,0.8)", border: "1px solid rgba(109,188,109,0.12)", color: "#f5f0e8", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Mall selector */}
                    <div>
                      <label style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "1.8px", display: "block", marginBottom: 6 }}>Your mall</label>

                      {mallsLoading ? (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: "#2a2010" }}>Loading malls…</div>
                      ) : malls.length === 0 ? (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: "#3a2e18", lineHeight: 1.5 }}>
                          No malls listed yet. Contact your mall manager to get added.
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowMallPick(s => !s)}
                            style={{
                              width: "100%", padding: "10px 12px", borderRadius: 9, boxSizing: "border-box",
                              background: "rgba(5,13,5,0.8)",
                              border: `1px solid ${selectedMall ? "rgba(200,180,126,0.2)" : "rgba(109,188,109,0.12)"}`,
                              color: selectedMall ? "#d4c9b0" : "#3a2e18",
                              fontSize: 14, textAlign: "left",
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              cursor: "pointer",
                              fontFamily: selectedMall ? "Georgia, serif" : "inherit",
                            }}
                          >
                            <span>{selectedMall ? `${selectedMall.name} · ${selectedMall.city}` : "Select your mall"}</span>
                            <ChevronDown size={13} style={{ color: "#3a2e18", flexShrink: 0 }} />
                          </button>

                          <AnimatePresence>
                            {showMallPick && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden", marginTop: 4 }}
                              >
                                <div style={{ borderRadius: 9, border: "1px solid rgba(109,188,109,0.12)", overflow: "hidden", background: "rgba(8,20,8,0.97)", maxHeight: 200, overflowY: "auto" }}>
                                  {malls.map(mall => (
                                    <button
                                      key={mall.id}
                                      onClick={() => { setSelectedMall(mall); setShowMallPick(false); }}
                                      style={{ width: "100%", padding: "11px 14px", background: selectedMall?.id === mall.id ? "rgba(200,180,126,0.08)" : "none", border: "none", borderBottom: "1px solid rgba(109,188,109,0.06)", cursor: "pointer", textAlign: "left" }}
                                    >
                                      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#d4c9b0", lineHeight: 1.2 }}>{mall.name}</div>
                                      <div style={{ fontSize: 10, color: "#3a2e18", marginTop: 2 }}>{mall.city}, {mall.state}</div>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>

                    {/* Save button */}
                    <button
                      onClick={saveProfile}
                      disabled={!formComplete}
                      style={{
                        width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        letterSpacing: "0.2px", cursor: formComplete ? "pointer" : "default",
                        color: formComplete ? "#f5f0e8" : "#1e1808",
                        background: formComplete ? "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))" : "rgba(13,31,13,0.4)",
                        border: "1px solid rgba(109,188,109,0.14)",
                        transition: "all 0.2s",
                      }}
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
            <div style={{ fontSize: 9, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px", paddingLeft: 2 }}>
              Photograph your find
            </div>

            {/* Primary camera tap zone */}
            <motion.button
              onClick={() => canCapture && cameraRef.current?.click()}
              disabled={!canCapture}
              style={{
                width: "100%", padding: "48px 22px", borderRadius: 16,
                cursor: canCapture ? "pointer" : "default",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                background: canCapture ? "rgba(13,31,13,0.6)" : "rgba(8,18,8,0.3)",
                border: `1px dashed ${canCapture ? "rgba(109,188,109,0.22)" : "rgba(109,188,109,0.07)"}`,
                transition: "all 0.2s",
              }}
              whileTap={canCapture ? { scale: 0.98 } : {}}
            >
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: canCapture ? "rgba(46,110,46,0.18)" : "rgba(13,31,13,0.35)",
                border: `1px solid ${canCapture ? "rgba(109,188,109,0.22)" : "rgba(109,188,109,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              }}>
                <Camera size={22} style={{ color: canCapture ? "#6dbc6d" : "#1e1808" }} />
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, lineHeight: 1.2, color: canCapture ? "#d4c9b0" : "#1e1808", transition: "color 0.2s" }}>
                {capturing ? "Opening camera…" : "Take a photo"}
              </div>
              {!hasValidProfile && (
                <div style={{ fontSize: 11, color: "#2a2010", textAlign: "center", maxWidth: 210, lineHeight: 1.5 }}>
                  Complete your vendor profile above to continue
                </div>
              )}
            </motion.button>

            {/* Gallery fallback */}
            <button
              onClick={() => canCapture && galleryRef.current?.click()}
              disabled={!canCapture}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, border: "none",
                color: canCapture ? "rgba(168,144,78,0.5)" : "rgba(106,85,40,0.18)",
                background: "transparent", cursor: canCapture ? "pointer" : "default", transition: "color 0.2s",
              }}
            >
              Choose from library
            </button>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ borderRadius: 12, background: "rgba(8,20,8,0.4)", border: "1px solid rgba(200,180,126,0.05)", padding: "12px 14px" }}
          >
            <div style={{ fontSize: 8, color: "#1e1808", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>Posting tips</div>
            {[
              "Good light goes a long way — natural is best",
              "Get close enough to show the character of the piece",
              "One item per photo reads better than a crowded shelf",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <span style={{ fontSize: 9, color: "#2a2010", marginTop: 1, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 11, color: "#2a2010", lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
