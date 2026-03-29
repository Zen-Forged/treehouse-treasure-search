// app/decide/page.tsx
// Phase 3: removed price-entry screen — analysis starts immediately from discover
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

function getBadge(recommendation: string) {
  if (recommendation === "strong-buy")
    return { label: "Strong find",         color: "#c8b47e", border: "rgba(200,180,126,0.35)", bg: "rgba(200,180,126,0.08)" };
  if (recommendation === "maybe")
    return { label: "Worth a closer look", color: "#a0a0a8", border: "rgba(160,160,168,0.35)", bg: "rgba(160,160,168,0.08)" };
  return       { label: "Marginal",        color: "#9a7a5a", border: "rgba(154,122,90,0.35)",  bg: "rgba(154,122,90,0.08)"  };
}

function getIntelColor(level: string): string {
  const l = level.toLowerCase();
  if (l === "high" || l === "fast") return "#6dbc6d";
  if (l === "moderate")             return "#a8904e";
  return "#9a7a5a";
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

export default function DecidePage() {
  const router = useRouter();
  const { session: findSession } = useFindSession();
  const { saveFind } = useFinds();

  const sessionData = findSession
    ? { imageDataUrl: findSession.imageOriginal }
    : null;

  const searchQuery     = findSession?.refinedQuery ?? findSession?.identification?.searchQuery ?? "thrift store item";
  const identifiedTitle = findSession?.identification?.title;

  const [appState, setAppState]       = useState<AppState>("analyzing");
  const [soldComps, setSoldComps]     = useState<Comp[]>([]);
  const [activeComps, setActiveComps] = useState<Comp[]>([]);
  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(null);
  const [usingMock, setUsingMock]     = useState(false);
  const [deciding, setDeciding]       = useState(false);
  const analysisStarted               = useRef(false);

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

    runAnalysis({
      imageDataUrl: sessionData.imageDataUrl,
      costStr:      "0",
      searchQuery,
      identifiedTitle,
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
  const badge        = getBadge(pricing.recommendation);

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

    // Build the find directly — don't depend on findSession being non-null
    // Pull everything we need from what we have in scope
    const find: SavedFind = {
      id:            findSession?.id            ?? `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt:     findSession?.createdAt     ?? new Date().toISOString(),
      imageOriginal: findSession?.imageOriginal ?? "",
      imageEnhanced: findSession?.imageEnhanced,

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

  // ── ANALYZING ────────────────────────────────────────────────────────────────
  if (appState === "analyzing") {
    return (
      <div className="flex flex-col min-h-screen bg-[#050f05]">
        <NavBar />
        <main className="flex-1 flex flex-col px-5 py-6 pb-8 gap-6 overflow-y-auto">
          <motion.div className="flex gap-3 items-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="rounded-xl overflow-hidden flex-shrink-0"
              style={{ width: 52, height: 52, border: "1px solid rgba(109,188,109,0.1)" }}>
              <img src={sessionData.imageDataUrl} alt="Item" className="w-full h-full object-cover"
                style={{ filter: "brightness(0.8) saturate(0.65)" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 2 }}>
                Looking it up
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: "#d4c9b0" }}>
                {identifiedTitle ?? "Your find"}
              </div>
            </div>
          </motion.div>

          <div style={{ height: 1, background: "rgba(200,180,126,0.05)" }} />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <AnalysisFeed state={analysisState} />
          </motion.div>

          <AnimatePresence>
            {analysisState.priceRange && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(13,31,13,0.45)", border: "1px solid rgba(109,188,109,0.1)" }}>
                <div style={{ fontSize: 9, color: "#7a6535", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>
                  Price range found
                </div>
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#d4c9b0" }}>
                    ${analysisState.priceRange.low.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 11, color: "#6a5528" }}>to</span>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#f5f0e8" }}>
                    ${analysisState.priceRange.high.toFixed(0)}
                  </span>
                </div>
                {analysisState.compCount != null && (
                  <div style={{ fontSize: 11, color: "#6a5528", marginTop: 4 }}>
                    Based on {analysisState.compCount} recent sales
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
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
          <motion.div className="absolute bottom-4 right-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ padding: "5px 11px", borderRadius: 20, fontSize: 10, fontWeight: 500, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
              {badge.label}
            </div>
          </motion.div>
        </motion.div>

        <div className="px-5 flex flex-col gap-6 pt-2 pb-4">

          {/* ── Resell price hero ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 6 }}>
              Resell price
            </div>
            <div className="flex items-start gap-1" style={{ fontFamily: "Georgia, serif" }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: "#a8904e", paddingTop: 8, lineHeight: 1 }}>$</span>
              <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: -2, color: "#f5f0e8" }}>
                {pricing.medianSoldPrice > 0 ? Math.round(pricing.medianSoldPrice) : "—"}
              </span>
            </div>
            {soldSummary && soldSummary.priceRangeLow > 0 && (
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6a5528", marginTop: 6 }}>
                ${Math.round(soldSummary.priceRangeLow)} — ${Math.round(soldSummary.priceRangeHigh)} range
              </div>
            )}
          </motion.div>

          <div style={{ height: 1, background: "rgba(200,180,126,0.06)" }} />

          {/* ── Market intelligence — 2×2 card grid ── */}
          {soldSummary && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}>
              <div style={{ fontSize: 9, color: "#a8904e", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 12 }}>
                Market intelligence
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { key: "Demand",      val: soldSummary.demandLevel,     sub: `${soldComps.length} sold comps` },
                  { key: "Velocity",    val: soldSummary.marketVelocity,  sub: soldSummary.avgDaysToSell > 0 ? `~${soldSummary.avgDaysToSell} days to sell` : "" },
                  { key: "Confidence",  val: soldSummary.confidence,      sub: `${soldComps.length} data points` },
                  { key: "Competition", val: soldSummary.competitionLevel, sub: `${soldSummary.competitionCount} active listings` },
                ].map(card => (
                  <div key={card.key}
                    style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.08)", borderRadius: 14, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 5 }}>
                      {card.key}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: getIntelColor(card.val), textTransform: "capitalize" }}>
                      {card.val}
                    </div>
                    {card.sub && (
                      <div style={{ fontSize: 10, color: "#6a5528", marginTop: 2 }}>{card.sub}</div>
                    )}
                  </div>
                ))}
              </div>
              {soldSummary.quickTake && (
                <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(13,31,13,0.35)", border: "1px solid rgba(200,180,126,0.06)" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#a8904e", lineHeight: 1.7, fontStyle: "italic" }}>
                    "{soldSummary.quickTake}"
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Sold comps — 3-per-row grid ── */}
          {soldComps.length > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(200,180,126,0.06)" }} />
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
                  {soldComps.slice(0, 9).map((comp, i) => (
                    <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                      style={{ borderRadius: 12, overflow: "hidden", background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.07)", display: "block", textDecoration: "none" }}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: 0.28 + i * 0.03 }}
                      whileTap={{ scale: 0.97 }}>
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
                        <div style={{ display: "inline-block", fontSize: 8, background: "rgba(45,125,45,0.08)", color: "#7a6535", padding: "1px 4px", borderRadius: 3, marginTop: 3 }}>
                          {comp.condition}
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
                <p style={{ textAlign: "center", fontSize: 10, color: "#2e2410", paddingTop: 8 }}>
                  {usingMock ? "Estimated data" : "Real eBay sold listings"}
                </p>
              </motion.div>
            </>
          )}

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
                          <div style={{ display: "inline-block", fontSize: 8, background: "rgba(168,144,78,0.1)", color: "#a8904e", padding: "1px 5px", borderRadius: 3, marginTop: 3 }}>
                            Active
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
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.05)", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <div className="flex flex-col gap-2">
          <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
            className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
            style={{ padding: "16px 22px", borderRadius: 16, fontSize: 15, letterSpacing: "0.2px", background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.15)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
            Pick it up
          </motion.button>
          <motion.button onClick={() => handleDecision("passed")} disabled={deciding}
            className="w-full flex items-center justify-center disabled:opacity-40"
            style={{ padding: "13px", borderRadius: 12, fontSize: 12, color: "rgba(106,85,40,0.35)", border: "none", background: "none", letterSpacing: "0.3px" }}
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            Leave it
          </motion.button>
        </div>
      </motion.div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}