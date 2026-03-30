// app/decide/page.tsx
// Phase 3: removed price-entry screen — analysis starts immediately from discover
// Phase 4: DecisionDial added above market intel
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { useFinds, SavedFind } from "@/hooks/useFinds";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { AnalysisFeed } from "@/components/AnalysisFeed";
import { Comp } from "@/types";
import { OpportunityMeter } from "@/components/OpportunityMeter";
import { AnalysisSheet } from "@/components/AnalysisSheet";

type AppState = "analyzing" | "done";

interface SoldSummary {
  recommendedPrice:  number;
  priceRangeLow:     number;
  priceRangeHigh:    number;
  marketVelocity:    string;
  demandLevel:       string;
  quickTake:         string;
  confidence:        string;
  avgDaysToSell:     number;
  competitionCount:  number;
  competitionLevel:  "low" | "moderate" | "high";
}

function formatSoldDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recent";
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

// ── Treehouse photo filter (same as share/enhance flow) ─────────────────────
function applyTreehouseFilter(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d  = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        // Boost reds slightly, pull down blues (warm earthy tone)
        px[i]     = Math.min(255, px[i]     * 1.06);
        px[i + 2] = Math.max(0,   px[i + 2] * 0.92);
        // Contrast boost
        px[i]     = Math.min(255, (px[i]     - 128) * 1.08 + 128);
        px[i + 1] = Math.min(255, (px[i + 1] - 128) * 1.08 + 128);
        px[i + 2] = Math.min(255, (px[i + 2] - 128) * 1.08 + 128);
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(src); // fall back to original on error
    img.src = src;
  });
}

export default function DecidePage() {
  const router = useRouter();
  const { session: findSession, updateSession } = useFindSession();
  const { saveFind } = useFinds();

  const sessionData = findSession
    ? { imageDataUrl: findSession.imageOriginal }
    : null;

  const searchQuery     = findSession?.refinedQuery ?? findSession?.identification?.searchQuery ?? "thrift store item";
  const identifiedTitle = findSession?.identification?.title;
  const primaryColor    = findSession?.identification?.attributes?.primaryColor ?? undefined;

  const [appState, setAppState]       = useState<AppState>("analyzing");
  const [soldComps, setSoldComps]     = useState<Comp[]>([]);
  const [activeComps, setActiveComps] = useState<Comp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [usingMock, setUsingMock]     = useState(false);
  const [deciding, setDeciding]       = useState(false);
  const [showAllSoldComps, setShowAllSoldComps] = useState(false);

  const SOLD_COMPS_INITIAL = 12;
  const analysisStarted  = useRef(false);
  const compsRef         = useRef<HTMLDivElement>(null);
  const enhancedImageRef = useRef<string | undefined>(findSession?.imageEnhanced);

  // ── Store latest comp data in refs so handleDecision always has current values
  // regardless of React closure staleness
  const soldCompsRef   = useRef<Comp[]>([]);
  const activeCompsRef = useRef<Comp[]>([]);
  const summaryRef     = useRef<SoldSummary | null>(null);

  const { state: analysisState, run: runAnalysis, reset } = useAnalysisFlow();

  useEffect(() => {
    if (!sessionData) { router.replace("/"); return; }
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    // Run photo filter concurrently with comp fetch — store in ref + session
    if (!findSession?.imageEnhanced) {
      applyTreehouseFilter(sessionData.imageDataUrl).then(enhanced => {
        enhancedImageRef.current = enhanced;
        updateSession({ imageEnhanced: enhanced });
      });
    }

    runAnalysis({
      imageDataUrl: sessionData.imageDataUrl,
      costStr:      "0",
      searchQuery,
      identifiedTitle,
      primaryColor,
      onCompsReady: (fetchedSold, fetchedActive, fetchedSummary) => {
        // Update both state (for rendering) and refs (for handleDecision)
        setSoldComps(fetchedSold);
        setActiveComps(fetchedActive);
        setSoldSummary(fetchedSummary);
        soldCompsRef.current   = fetchedSold;
        activeCompsRef.current = fetchedActive;
        summaryRef.current     = fetchedSummary;
      },
      onComplete:           () => setAppState("done"),
      generateMockEvaluation,
      setUsingMock,
    });
  }, []);

  useEffect(() => () => reset(), [reset]);

  const pricingComps = soldComps.length > 0 ? soldComps : activeComps;
  const pricing      = calculatePricing(pricingComps, 0);

  const handleDecision = useCallback((decision: "purchased" | "passed") => {
    if (deciding) return;
    setDeciding(true);

    // Read latest comp data from refs — avoids stale closure values
    const currentSold    = soldCompsRef.current;
    const currentActive  = activeCompsRef.current;
    const currentSummary = summaryRef.current;
    const pricingData    = calculatePricing(
      currentSold.length > 0 ? currentSold : currentActive,
      0
    );

    // Build the find — use sessionData.imageDataUrl as reliable fallback for imageOriginal
    // Use enhancedImageRef for imageEnhanced (may have finished during analysis)
    const find: SavedFind = {
      id:            findSession?.id            ?? `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt:     findSession?.createdAt     ?? new Date().toISOString(),
      imageOriginal: findSession?.imageOriginal ?? sessionData?.imageDataUrl ?? "",
      imageEnhanced: enhancedImageRef.current   ?? findSession?.imageEnhanced,

      // Identity
      title:         findSession?.identification?.title,
      description:   findSession?.identification?.description,

      // Attributes
      brand:         findSession?.identification?.attributes?.brand    ?? null,
      material:      findSession?.identification?.attributes?.material ?? null,
      era:           findSession?.identification?.attributes?.era      ?? null,
      origin:        findSession?.identification?.attributes?.origin   ?? null,
      category:      findSession?.identification?.attributes?.category ?? null,

      // Transaction
      decision,

      // Market data from refs
      medianSoldPrice:  pricingData.medianSoldPrice,
      priceRangeLow:    currentSummary?.priceRangeLow,
      priceRangeHigh:   currentSummary?.priceRangeHigh,
      avgDaysToSell:    currentSummary?.avgDaysToSell,
      competitionCount: currentSummary?.competitionCount,
      competitionLevel: currentSummary?.competitionLevel,
      recommendation:   pricingData.recommendation,
    };

    console.log("[decide] saving find:", find.id, find.title, decision);
    saveFind(find);
    router.push("/finds");
  }, [deciding, findSession, saveFind, router]);

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050f05]">
        <div style={{ color: "#3d3018", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  const NavBar = () => (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
      style={{ background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(200,180,126,0.06)" }}>
      <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
        style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
        <ArrowLeft size={15} style={{ color: "#7a6535" }} />
      </button>
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={18} height={18}
          style={{ opacity: 0.8, filter: "drop-shadow(0 0 4px rgba(200,180,126,0.3))" }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: "#d4c9b0", letterSpacing: "0.3px" }}>
          Treehouse Search
        </span>
      </div>
      <div className="w-9" />
    </header>
  );

  // ── ANALYZING — bottom sheet overlay ─────────────────────────────────────────
  if (appState === "analyzing") {
    return (
      <AnalysisSheet
        state={analysisState}
        imageDataUrl={sessionData.imageDataUrl}
        itemTitle={identifiedTitle}
        isComplete={analysisState.isComplete}
      />
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <NavBar />

      <main className="flex-1 overflow-y-auto pb-36">

        {/* ── Photo — full bleed 320px ── */}
        <motion.div className="relative w-full flex-shrink-0" style={{ height: 320 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
            style={{ filter: "brightness(0.82) saturate(0.75) sepia(0.08)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(5,15,5,0.4) 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: 120, background: "linear-gradient(to bottom, transparent, #050f05)" }} />
        </motion.div>

        <div className="px-5 flex flex-col gap-5 pt-3 pb-4">

          {/* ── Item title ── */}
          {identifiedTitle && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: "#d4c9b0", lineHeight: 1.25 }}>
                {identifiedTitle}
              </div>
            </motion.div>
          )}

          {/* ── Opportunity Meter — verdict first ── */}
          {soldSummary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
              <OpportunityMeter
                input={{
                  demandLevel:      soldSummary.demandLevel,
                  marketVelocity:   soldSummary.marketVelocity,
                  confidence:       soldSummary.confidence,
                  competitionLevel: soldSummary.competitionLevel,
                  competitionCount: soldSummary.competitionCount,
                  avgDaysToSell:    soldSummary.avgDaysToSell,
                  priceRangeLow:    soldSummary.priceRangeLow,
                  priceRangeHigh:   soldSummary.priceRangeHigh,
                  medianSoldPrice:  pricing.medianSoldPrice,
                  compCount:        soldComps.length,
                }}
                onScrollToComps={() => compsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              />
            </motion.div>
          )}

          {/* ── Resell price ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}
            style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div>
              <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>
                Resell price
              </div>
              <div className="flex items-start gap-0.5" style={{ fontFamily: "Georgia, serif" }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "#a8904e", paddingTop: 6, lineHeight: 1 }}>$</span>
                <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, letterSpacing: -1.5, color: "#f5f0e8" }}>
                  {pricing.medianSoldPrice > 0 ? Math.round(pricing.medianSoldPrice) : "—"}
                </span>
              </div>
            </div>
            {soldSummary && soldSummary.priceRangeLow > 0 && (
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>Range</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6a5528", lineHeight: 1.4 }}>
                  <div>${Math.round(soldSummary.priceRangeLow)}</div>
                  <div>${Math.round(soldSummary.priceRangeHigh)}</div>
                </div>
              </div>
            )}
          </motion.div>



          {/* ── Sold comps — 3-per-row grid ── */}
          {soldComps.length > 0 && (() => {
            // Pin lowest + highest price comps to the front, tag them
            const byPrice      = [...soldComps].sort((a, b) => a.price - b.price);
            const lowestComp   = byPrice[0];
            const highestComp  = byPrice[byPrice.length - 1];
            const rest         = soldComps.filter(c => c !== lowestComp && c !== highestComp);
            const orderedComps = [lowestComp, highestComp, ...rest];
            const displayComps = showAllSoldComps ? orderedComps : orderedComps.slice(0, SOLD_COMPS_INITIAL);

            return (
            <>
              <div ref={compsRef} style={{ height: 1, background: "rgba(200,180,126,0.06)" }} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px" }}>
                    Sold listings
                  </div>
                  <span style={{ fontSize: 10, color: "#6dbc6d", background: "rgba(45,125,45,0.12)", padding: "1px 8px", borderRadius: 8 }}>
                    {soldComps.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {displayComps.map((comp, i) => {
                    const isLowest  = comp === lowestComp;
                    const isHighest = comp === highestComp;
                    return (
                    <motion.a key={comp.url ?? i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                      style={{ borderRadius: 12, overflow: "hidden", background: "rgba(13,31,13,0.5)", border: `1px solid ${isLowest ? "rgba(109,188,109,0.18)" : isHighest ? "rgba(200,180,126,0.18)" : "rgba(109,188,109,0.07)"}`, display: "block", textDecoration: "none", position: "relative", isolation: "isolate" }}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: i < SOLD_COMPS_INITIAL ? 0.28 + i * 0.03 : 0 }}
                      whileTap={{ scale: 0.97 }}>
                      {/* Low / High tag — no backdropFilter to avoid escaping stacking context */}
                      {(isLowest || isHighest) && (
                        <div style={{
                          position: "absolute", top: 5, left: 5, zIndex: 2,
                          fontSize: 7, fontWeight: 700, letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          padding: "2px 5px", borderRadius: 4,
                          color:      isLowest ? "#6dbc6d" : "#a8904e",
                          background: isLowest ? "rgba(8,20,8,0.92)" : "rgba(8,20,8,0.92)",
                          border:     `1px solid ${isLowest ? "rgba(109,188,109,0.3)" : "rgba(200,180,126,0.3)"}`,
                        }}>
                          {isLowest ? "Low" : "High"}
                        </div>
                      )}
                      {comp.imageUrl ? (
                        <img src={comp.imageUrl} alt={comp.title}
                          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", filter: "brightness(0.82) saturate(0.7)" }} />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1", background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.12)" strokeWidth="1">
                            <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                          </svg>
                        </div>
                      )}
                      <div style={{ padding: "7px 8px 9px" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#f5f0e8", marginBottom: 2 }}>
                          ${comp.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 9, color: "#6a5528" }}>
                          {comp.soldDate
                            ? formatSoldDate(comp.soldDate)
                            : comp.daysAgo > 0
                              ? `${comp.daysAgo}d ago`
                              : "No date"}
                        </div>
                      </div>
                    </motion.a>
                    );
                  })}
                </div>

                {/* Show more / less */}
                {soldComps.length > SOLD_COMPS_INITIAL && (
                  <button
                    onClick={() => setShowAllSoldComps(v => !v)}
                    style={{ width: "100%", marginTop: 10, padding: "9px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#6a5528", letterSpacing: "0.3px" }}>
                    {showAllSoldComps
                      ? `Show fewer`
                      : `Show ${soldComps.length - SOLD_COMPS_INITIAL} more`}
                  </button>
                )}

                <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", paddingTop: 4 }}>
                  {usingMock ? "Estimated data" : "Real eBay sold listings"}
                </p>
              </motion.div>
            </>
            );
          })()}

          {/* ── Active comps — horizontal scroll ── */}
          {activeComps.length > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(200,180,126,0.06)" }} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px" }}>
                    Active listings
                  </div>
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, background: "rgba(168,144,78,0.1)", color: "#a8904e", border: "1px solid rgba(168,144,78,0.2)" }}>
                    {activeComps.length} competitors
                  </span>
                </div>
                <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -20px", padding: "0 20px 4px" }}
                  className="hide-scrollbar">
                  <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                    {activeComps.map((comp, i) => (
                      <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                        style={{ width: 130, flexShrink: 0, borderRadius: 12, overflow: "hidden", background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.07)", display: "block", textDecoration: "none" }}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.36 + i * 0.04 }}
                        whileTap={{ scale: 0.97 }}>
                        {comp.imageUrl ? (
                          <img src={comp.imageUrl} alt={comp.title}
                            style={{ width: "100%", height: 100, objectFit: "cover", display: "block", filter: "brightness(0.78) saturate(0.65)" }} />
                        ) : (
                          <div style={{ width: "100%", height: 100, background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.12)" strokeWidth="1">
                              <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ padding: "8px 9px 10px" }}>
                          <div style={{ fontSize: 10, color: "#d4c9b0", lineHeight: 1.4, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                            {comp.title}
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#f5f0e8" }}>
                            ${comp.price.toFixed(2)}
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}

        </div>
      </main>

      {/* ── Fixed decision bar ── */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4"
        style={{
          background: "rgba(5,13,5,0.98)",
          backdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(200,180,126,0.07)",
          paddingTop: 12,
          paddingBottom: "max(18px, env(safe-area-inset-bottom, 18px))",
        }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
        <div className="absolute top-0 left-[15%] right-[15%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.15), transparent)" }} />
        <div className="flex gap-3">
          {/* Leave it — now a visible outlined button, not ghost text */}
          <motion.button onClick={() => handleDecision("passed")} disabled={deciding}
            className="flex items-center justify-center disabled:opacity-40"
            style={{
              flex: "0 0 auto",
              padding: "15px 18px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(160,130,90,0.7)",
              border: "1px solid rgba(200,180,126,0.1)",
              background: "rgba(13,31,13,0.3)",
              letterSpacing: "0.2px",
            }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            Leave it
          </motion.button>
          {/* Pick it up — primary */}
          <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="flex-1 flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
            style={{
              padding: "15px 22px",
              borderRadius: 14,
              fontSize: 15,
              letterSpacing: "0.2px",
              background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
              border: "1px solid rgba(109,188,109,0.15)",
              boxShadow: "0 4px 20px rgba(5,15,5,0.5), 0 0 32px rgba(45,125,45,0.08)",
            }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            Pick it up
          </motion.button>
        </div>
      </motion.div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}