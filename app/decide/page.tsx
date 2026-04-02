// app/decide/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { useFinds, SavedFind } from "@/hooks/useFinds";
import { generateMockEvaluation } from "@/lib/mockIntelligence";
import { calculatePricing } from "@/lib/pricingLogic";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { Comp } from "@/types";
import { AnalysisSheet } from "@/components/AnalysisSheet";

type AppState = "analyzing" | "done";
type CompTab  = "sold" | "active";

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
        px[i]     = Math.min(255, px[i]     * 1.06);
        px[i + 2] = Math.max(0,   px[i + 2] * 0.92);
        px[i]     = Math.min(255, (px[i]     - 128) * 1.08 + 128);
        px[i + 1] = Math.min(255, (px[i + 1] - 128) * 1.08 + 128);
        px[i + 2] = Math.min(255, (px[i + 2] - 128) * 1.08 + 128);
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function calcBreakEven(median: number, feeRate = 0.13): number {
  return Math.round(median * (1 - feeRate));
}

// ── Velocity bar — 5 segments, fills based on sell speed ──────────────────────
function VelocityBar({ avgDaysToSell, velocity }: { avgDaysToSell: number; velocity: string }) {
  // lit segments: fast=5, moderate=3, slow=1
  const lit = velocity === "fast" ? 5 : velocity === "moderate" ? 3 : 1;
  const label = velocity === "fast" ? "fast" : velocity === "moderate" ? "moderate" : "slow";
  const color = velocity === "fast" ? "#6dbc6d" : velocity === "moderate" ? "#c8b47e" : "#9a7a5a";
  const sellStr = avgDaysToSell <= 7
    ? `${avgDaysToSell}d`
    : `${Math.round(avgDaysToSell / 7)}wk`;

  return (
    <div>
      <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 5 }}>
        Sell speed
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: i <= lit ? color : "rgba(255,255,255,0.07)",
            transition: "background 0.2s ease",
          }} />
        ))}
        <span style={{ fontSize: 10, color, marginLeft: 5, fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 9, color: "#6a5528" }}>
        avg {sellStr} to sell
      </div>
    </div>
  );
}

function DecidePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isReview     = searchParams.get("review") === "1";

  const { session: findSession, updateSession } = useFindSession();
  const { saveFind } = useFinds();

  const sessionData = findSession
    ? { imageDataUrl: findSession.imageOriginal }
    : null;

  const searchQuery     = findSession?.refinedQuery ?? findSession?.identification?.searchQuery ?? "";
  const identifiedTitle = findSession?.identification?.title;
  const primaryColor    = findSession?.identification?.attributes?.primaryColor ?? undefined;

  const [appState, setAppState] = useState<AppState>(isReview ? "done" : "analyzing");
  const [soldComps, setSoldComps]     = useState<Comp[]>([]);
  const [activeComps, setActiveComps] = useState<Comp[]>([]);

  const reviewSummary: SoldSummary | null = isReview && findSession?.savedFindData
    ? {
        recommendedPrice:  findSession.savedFindData.medianSoldPrice ?? 0,
        priceRangeLow:     findSession.savedFindData.priceRangeLow   ?? 0,
        priceRangeHigh:    findSession.savedFindData.priceRangeHigh  ?? 0,
        marketVelocity:    findSession.savedFindData.avgDaysToSell != null
                             ? (findSession.savedFindData.avgDaysToSell <= 7 ? "fast" : findSession.savedFindData.avgDaysToSell <= 21 ? "moderate" : "slow")
                             : "moderate",
        demandLevel:       "Moderate",
        quickTake:         "",
        confidence:        "Moderate",
        avgDaysToSell:     findSession.savedFindData.avgDaysToSell    ?? 0,
        competitionCount:  findSession.savedFindData.competitionCount ?? 0,
        competitionLevel:  findSession.savedFindData.competitionLevel ?? "moderate",
      }
    : null;

  const [soldSummary, setSoldSummary] = useState<SoldSummary | null>(reviewSummary);
  const [usingMock, setUsingMock]     = useState(false);
  const [deciding, setDeciding]       = useState(false);
  const [reporting, setReporting]     = useState(false);
  const [reportSent, setReportSent]   = useState(false);
  const [reportSheet, setReportSheet] = useState(false);
  const [askingPrice, setAskingPrice] = useState<number>(0);
  const [compTab, setCompTab]         = useState<CompTab>("sold");

  const [displayImage, setDisplayImage] = useState<string>(
    findSession?.imageEnhanced ?? findSession?.imageOriginal ?? ""
  );

  const analysisStarted   = useRef(false);
  const enhancedImageRef  = useRef<string | undefined>(findSession?.imageEnhanced);
  const soldCompsRef      = useRef<Comp[]>([]);
  const activeCompsRef    = useRef<Comp[]>([]);
  const summaryRef        = useRef<SoldSummary | null>(null);
  const identificationRef = useRef(findSession?.identification);

  const { state: analysisState, run: runAnalysis, reset } = useAnalysisFlow();

  useEffect(() => {
    if (findSession?.identification) {
      identificationRef.current = findSession.identification;
    }
  }, [findSession?.identification]);

  useEffect(() => {
    if (!sessionData) { router.replace("/"); return; }
    if (isReview) return;
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    if (!findSession?.imageEnhanced) {
      applyTreehouseFilter(sessionData.imageDataUrl).then(enhanced => {
        enhancedImageRef.current = enhanced;
        updateSession({ imageEnhanced: enhanced });
        setDisplayImage(enhanced);
      });
    }

    runAnalysis({
      imageDataUrl:    sessionData.imageDataUrl,
      costStr:         "0",
      searchQuery:     searchQuery || undefined,
      identifiedTitle: identifiedTitle || undefined,
      primaryColor,
      objectType:      findSession?.identification?.attributes?.objectType ?? undefined,
      setType:         findSession?.identification?.attributes?.setType    ?? undefined,
      onIdentified: (result) => {
        updateSession({
          identification: {
            title:       result.title,
            description: result.description,
            confidence:  result.confidence,
            searchQuery: result.searchQuery,
            attributes:  result.attributes,
          },
        });
      },
      onCompsReady: (fetchedSold, fetchedActive, fetchedSummary) => {
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

  useEffect(() => {
    if (pricing.medianSoldPrice > 0 && askingPrice === 0) {
      setAskingPrice(calcBreakEven(pricing.medianSoldPrice));
    }
  }, [pricing.medianSoldPrice]);

  const handleDecision = useCallback(async (decision: "purchased" | "passed") => {
    if (deciding) return;
    setDeciding(true);

    const currentSold    = soldCompsRef.current;
    const currentActive  = activeCompsRef.current;
    const currentSummary = summaryRef.current;
    const pricingData    = calculatePricing(
      currentSold.length > 0 ? currentSold : currentActive,
      0
    );

    const find: SavedFind = {
      id:            findSession?.id            ?? `find_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt:     findSession?.createdAt     ?? new Date().toISOString(),
      imageOriginal: findSession?.imageOriginal ?? sessionData?.imageDataUrl ?? "",
      imageEnhanced: enhancedImageRef.current   ?? findSession?.imageEnhanced,
      title:         identificationRef.current?.title,
      description:   identificationRef.current?.description,
      brand:         identificationRef.current?.attributes?.brand    ?? null,
      material:      identificationRef.current?.attributes?.material ?? null,
      era:           identificationRef.current?.attributes?.era      ?? null,
      origin:        identificationRef.current?.attributes?.origin   ?? null,
      category:      identificationRef.current?.attributes?.category ?? null,
      decision,
      medianSoldPrice:  pricingData.medianSoldPrice,
      priceRangeLow:    currentSummary?.priceRangeLow,
      priceRangeHigh:   currentSummary?.priceRangeHigh,
      avgDaysToSell:    currentSummary?.avgDaysToSell,
      competitionCount: currentSummary?.competitionCount,
      competitionLevel: currentSummary?.competitionLevel,
      recommendation:   pricingData.recommendation,
    };

    await saveFind(find);
    await new Promise(r => setTimeout(r, 150));
    router.push("/finds");
  }, [deciding, findSession, saveFind, router, sessionData]);

  const handleReport = useCallback(async (issue: string) => {
    if (reporting) return;
    setReporting(true);
    try {
      await fetch("/api/report-comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemTitle:           identificationRef.current?.title ?? "Unknown",
          searchQuery:         findSession?.identification?.searchQuery ?? "",
          objectType:          identificationRef.current?.attributes?.objectType,
          material:            identificationRef.current?.attributes?.material,
          primaryColor:        identificationRef.current?.attributes?.primaryColor,
          distinctiveFeatures: identificationRef.current?.attributes?.distinctiveFeatures,
          soldCompsCount:      soldCompsRef.current.length,
          activeCompsCount:    activeCompsRef.current.length,
          issue,
        }),
      });
    } finally {
      setReporting(false);
      setReportSent(true);
      setReportSheet(false);
    }
  }, [reporting, findSession]);

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

  // ── Derived values ─────────────────────────────────────────────────────────
  const median      = pricing.medianSoldPrice;
  const sliderMin   = 1;
  const sliderMax   = median > 0 ? Math.round(median) : 100;
  const feeRate     = 0.13;
  const netProceeds = median * (1 - feeRate);
  const profit      = askingPrice > 0 ? netProceeds - askingPrice : 0;
  const roi         = askingPrice > 0 && profit > 0 ? (profit / askingPrice) * 100 : 0;
  const pct         = sliderMax > sliderMin
    ? Math.max(0, Math.min(1, (askingPrice - sliderMin) / (sliderMax - sliderMin)))
    : 0;

  const profitColor =
    profit <= 0  ? "#c05a4a" :
    roi < 10     ? "#c07a2a" :
    roi < 40     ? "#c8b47e" : "#6dbc6d";

  const profitLabel =
    profit <= 0  ? "break even" :
    roi < 10     ? "thin margin" :
    roi < 40     ? "decent flip" : "strong flip";

  const profitStr =
    profit > 0  ? `+$${profit.toFixed(2)}` :
    profit < 0  ? `-$${Math.abs(profit).toFixed(2)}` : "$0.00";

  const velocity = (soldSummary?.marketVelocity ?? "moderate") as "fast" | "moderate" | "slow";

  // Scout analysis copy derived from live data
  const competitionNote =
    soldSummary?.competitionLevel === "high"     ? `High competition — ${soldSummary.competitionCount} active listings.` :
    soldSummary?.competitionLevel === "moderate" ? `Moderate competition — ${soldSummary.competitionCount} active listings.` :
    soldSummary?.competitionCount               ? `Low competition — only ${soldSummary.competitionCount} active listings.` : "";

  const demandNote =
    (soldComps.length >= 8) ? `Strong demand with ${soldComps.length} recent sales.` :
    (soldComps.length >= 4) ? `${soldComps.length} recent sales — moderate demand.` :
    (soldComps.length > 0)  ? `${soldComps.length} recent sales found — limited data.` : "";

  const scoutCopy = soldSummary?.quickTake
    ? soldSummary.quickTake
    : [demandNote, competitionNote].filter(Boolean).join(" ");

  // Comp ordering
  const byPrice     = [...soldComps].sort((a, b) => a.price - b.price);
  const lowestComp  = byPrice[0];
  const highestComp = byPrice[byPrice.length - 1];
  const orderedSold = soldComps.length > 0
    ? [lowestComp, highestComp, ...soldComps.filter(c => c !== lowestComp && c !== highestComp)]
    : [];

  // ── Signal card shared styles ─────────────────────────────────────────────
  const signalCard: React.CSSProperties = {
    borderRadius: 14,
    background: "rgba(13,31,13,0.55)",
    border: "1px solid rgba(109,188,109,0.1)",
    overflow: "hidden",
  };

  const signalHead: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px 7px",
    borderBottom: "1px solid rgba(109,188,109,0.07)",
  };

  const signalStep: React.CSSProperties = {
    fontSize: 8,
    fontWeight: 700,
    color: "#4a3a1e",
    textTransform: "uppercase",
    letterSpacing: "2px",
  };

  const signalBody: React.CSSProperties = {
    padding: "12px 14px",
  };

  // ── RESULTS ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <NavBar />

      <main className="flex-1 overflow-y-auto pb-28">

        {/* Photo strip */}
        <motion.div className="relative w-full flex-shrink-0" style={{ height: 160 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <img src={displayImage} alt="Item" className="w-full h-full object-cover"
            style={{ filter: "brightness(0.78) saturate(0.72) sepia(0.08)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(5,15,5,0.4) 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: 100, background: "linear-gradient(to bottom, transparent, #050f05)" }} />
          {identifiedTitle && (
            <motion.div className="absolute left-0 right-0" style={{ bottom: 12, padding: "0 18px", zIndex: 2 }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700,
                color: "#f5f0e8", lineHeight: 1.2, textShadow: "0 1px 14px rgba(5,15,5,0.9)",
              }}>
                {identifiedTitle}
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="flex flex-col gap-3 px-4 pt-3 pb-4">

          {/* ── Signal 01: Resell value + sell speed ─────────────────────── */}
          {median > 0 && (
            <motion.div style={signalCard}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.1 }}>
              <div style={signalHead}>
                <span style={signalStep}>01 — Resell value</span>
                <span style={{ fontSize: 9, color: "#6a5528", fontFamily: "monospace" }}>
                  {soldComps.length > 0 ? `${soldComps.length} sold comps` : activeComps.length > 0 ? `${activeComps.length} active` : ""}
                </span>
              </div>
              <div style={signalBody}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                  {/* Big price */}
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 2, fontFamily: "Georgia, serif" }}>
                      <span style={{ fontSize: 13, color: "#a8904e", paddingTop: 5, lineHeight: 1 }}>$</span>
                      <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, letterSpacing: -1.5, color: "#f5f0e8" }}>
                        {median.toFixed(0)}
                      </span>
                    </div>
                    {soldSummary && soldSummary.priceRangeLow > 0 && (
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5528", marginTop: 3 }}>
                        ${soldSummary.priceRangeLow.toFixed(0)} – ${soldSummary.priceRangeHigh.toFixed(0)} range
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: "#3a2e18", marginTop: 3 }}>
                      {usingMock ? "Estimated data" : "Real eBay sold listings"}
                    </div>
                  </div>
                  {/* Sell speed — right side */}
                  {soldSummary && soldSummary.avgDaysToSell > 0 && (
                    <div style={{ flexShrink: 0, minWidth: 100 }}>
                      <VelocityBar
                        avgDaysToSell={soldSummary.avgDaysToSell}
                        velocity={velocity}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Signal 02: What did you pay? → profit outcome ────────────── */}
          {median > 0 && (
            <motion.div
              style={{ ...signalCard, border: `1px solid rgba(109,188,109,0.16)` }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.18 }}>
              <div style={signalHead}>
                <span style={signalStep}>02 — What did you pay?</span>
              </div>
              <div style={signalBody}>

                {/* Cost input — the primary focal point */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                    Your cost
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#f5f0e8", letterSpacing: -0.5 }}>
                    ${askingPrice}
                  </span>
                </div>

                {/* Slider — touch-action none is critical for mobile */}
                <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center", touchAction: "none", marginBottom: 4 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
                  <div style={{
                    position: "absolute", left: 0, height: 4, borderRadius: 2,
                    width: `${pct * 100}%`,
                    background: `linear-gradient(90deg, rgba(109,188,109,0.4), ${profitColor})`,
                    transition: "background 0.25s ease",
                  }} />
                  <div style={{
                    position: "absolute",
                    left: `calc(${pct * 100}% - 13px)`,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#0a1a0a",
                    border: `2.5px solid ${profitColor}`,
                    boxShadow: `0 0 0 4px ${profitColor}22, 0 2px 8px rgba(0,0,0,0.5)`,
                    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                    pointerEvents: "none",
                    zIndex: 1,
                  }} />
                  <input
                    type="range"
                    className="tts-slider"
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    value={askingPrice}
                    onChange={e => setAskingPrice(Number(e.target.value))}
                    style={{ position: "absolute", left: 0, right: 0, width: "100%", height: "100%", margin: 0, padding: 0, zIndex: 2 }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 9, color: "#3a2e18", fontFamily: "monospace" }}>${sliderMin}</span>
                  <span style={{ fontSize: 9, color: "#3a2e18", fontFamily: "monospace" }}>${sliderMax}</span>
                </div>

                {/* Profit + ROI — outcome of the slider above, separated by hairline */}
                <div style={{
                  display: "flex",
                  alignItems: "stretch",
                  borderTop: "1px solid rgba(200,180,126,0.07)",
                  paddingTop: 12,
                  gap: 0,
                }}>
                  {/* Est. profit */}
                  <div style={{ flex: 1, paddingRight: 12, borderRight: "1px solid rgba(200,180,126,0.07)" }}>
                    <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 4 }}>
                      Est. profit
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{
                        fontFamily: "monospace", fontSize: 20, fontWeight: 700,
                        color: profitColor, letterSpacing: -0.5,
                        transition: "color 0.25s ease",
                      }}>
                        {profitStr}
                      </span>
                      {/* ROI chip — tight to profit, clearly related */}
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 7px", borderRadius: 5,
                        fontFamily: "monospace",
                        color: profitColor,
                        background: `${profitColor}18`,
                        border: `1px solid ${profitColor}30`,
                        transition: "all 0.25s ease",
                        whiteSpace: "nowrap",
                      }}>
                        {profit <= 0 ? "0%" : `${Math.round(roi)}%`}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: profitColor, marginTop: 3, transition: "color 0.25s ease" }}>
                      {profitLabel}
                    </div>
                  </div>
                  {/* After-fee note */}
                  <div style={{ flex: 1, paddingLeft: 12, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 4 }}>
                      After fees
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 13, color: "#6a5528" }}>
                      ~${netProceeds.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 9, color: "#3a2e18", marginTop: 2 }}>
                      net proceeds (~13%)
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Signal 03: Scout analysis ─────────────────────────────────── */}
          {scoutCopy && (
            <motion.div
              style={{ ...signalCard }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.26 }}>
              <div style={signalHead}>
                <span style={signalStep}>03 — Scout analysis</span>
                {soldSummary?.confidence && (
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 4,
                    textTransform: "uppercase", letterSpacing: "1px",
                    color: soldSummary.confidence === "High" ? "#6dbc6d" : soldSummary.confidence === "Moderate" ? "#c8b47e" : "#9a7a5a",
                    background: soldSummary.confidence === "High" ? "rgba(109,188,109,0.1)" : soldSummary.confidence === "Moderate" ? "rgba(200,180,126,0.1)" : "rgba(154,122,90,0.1)",
                  }}>
                    {soldSummary.confidence} confidence
                  </span>
                )}
              </div>
              <div style={{ ...signalBody, paddingTop: 10 }}>
                <p style={{ fontSize: 12, color: "#7a6535", lineHeight: 1.65, margin: 0 }}>
                  {scoutCopy}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Comp tabs + scrollable listings ──────────────────────────── */}
          {(soldComps.length > 0 || activeComps.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.34 }}>

              {/* Tab row */}
              <div style={{
                display: "flex", borderRadius: 10, overflow: "hidden",
                border: "1px solid rgba(200,180,126,0.12)", marginBottom: 12,
              }}>
                {(["sold", "active"] as CompTab[]).map((tab, i) => {
                  const active = compTab === tab;
                  const count  = tab === "sold" ? soldComps.length : activeComps.length;
                  return (
                    <button key={tab} onClick={() => setCompTab(tab)} style={{
                      flex: 1, padding: "9px 0",
                      background: active ? "rgba(10,24,10,0.9)" : "rgba(5,12,5,0.4)",
                      border: "none", cursor: "pointer",
                      borderLeft: i > 0 ? "1px solid rgba(200,180,126,0.12)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <span style={{
                        fontFamily: "Georgia, serif", fontSize: 11,
                        color: active ? "#d4c9b0" : "#4a3a1e",
                        fontWeight: active ? 600 : 400,
                      }}>
                        {tab === "sold" ? "Sold" : "Active"}
                      </span>
                      {count > 0 && (
                        <span style={{
                          fontFamily: "monospace", fontSize: 9,
                          padding: "1px 6px", borderRadius: 5,
                          background: active ? "rgba(200,180,126,0.1)" : "rgba(200,180,126,0.05)",
                          color: active ? "#6a5528" : "#3a2e18",
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sold comps carousel */}
              {compTab === "sold" && soldComps.length > 0 && (
                <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -16px", padding: "0 16px 4px" }}
                  className="hide-scrollbar">
                  <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                    {orderedSold.map((comp, i) => {
                      const isLowest  = comp === lowestComp;
                      const isHighest = comp === highestComp;
                      return (
                        <motion.a key={comp.url ?? i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                          style={{
                            width: 108, flexShrink: 0, borderRadius: 11, overflow: "hidden",
                            background: "rgba(13,31,13,0.5)",
                            border: `1px solid ${isLowest ? "rgba(109,188,109,0.22)" : isHighest ? "rgba(200,180,126,0.22)" : "rgba(109,188,109,0.07)"}`,
                            display: "block", textDecoration: "none", position: "relative", isolation: "isolate",
                          }}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22, delay: i * 0.025 }}
                          whileTap={{ scale: 0.97 }}>
                          {(isLowest || isHighest) && (
                            <div style={{
                              position: "absolute", top: 5, left: 5, zIndex: 2,
                              fontSize: 7, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
                              padding: "2px 5px", borderRadius: 4,
                              color:      isLowest ? "#6dbc6d" : "#a8904e",
                              background: "rgba(8,20,8,0.92)",
                              border:     `1px solid ${isLowest ? "rgba(109,188,109,0.3)" : "rgba(200,180,126,0.3)"}`,
                            }}>
                              {isLowest ? "Low" : "High"}
                            </div>
                          )}
                          {comp.imageUrl ? (
                            <img src={comp.imageUrl} alt={comp.title}
                              style={{ width: "100%", height: 86, objectFit: "cover", display: "block", filter: "brightness(0.82) saturate(0.7)" }} />
                          ) : (
                            <div style={{ width: "100%", height: 86, background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.1)" strokeWidth="1">
                                <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                              </svg>
                            </div>
                          )}
                          <div style={{ padding: "5px 8px 8px" }}>
                            <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#f5f0e8", marginBottom: 2 }}>
                              ${comp.price.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 9, color: "#6a5528" }}>
                              {comp.soldDate ? formatSoldDate(comp.soldDate) : comp.daysAgo > 0 ? `${comp.daysAgo}d ago` : "Recent"}
                            </div>
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active comps carousel */}
              {compTab === "active" && activeComps.length > 0 && (
                <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -16px", padding: "0 16px 4px" }}
                  className="hide-scrollbar">
                  <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                    {activeComps.map((comp, i) => (
                      <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                        style={{
                          width: 116, flexShrink: 0, borderRadius: 11, overflow: "hidden",
                          background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.07)",
                          display: "block", textDecoration: "none",
                        }}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: i * 0.025 }}
                        whileTap={{ scale: 0.97 }}>
                        {comp.imageUrl ? (
                          <img src={comp.imageUrl} alt={comp.title}
                            style={{ width: "100%", height: 86, objectFit: "cover", display: "block", filter: "brightness(0.78) saturate(0.65)" }} />
                        ) : (
                          <div style={{ width: "100%", height: 86, background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.1)" strokeWidth="1">
                              <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ padding: "5px 8px 8px" }}>
                          <div style={{
                            fontSize: 9, color: "#d4c9b0", lineHeight: 1.4, marginBottom: 3,
                            overflow: "hidden", display: "-webkit-box",
                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          } as React.CSSProperties}>
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
              )}

              {compTab === "sold"   && soldComps.length   === 0 && (
                <div style={{ fontSize: 12, color: "#3a2e18", textAlign: "center", padding: "20px 0" }}>No sold listings found</div>
              )}
              {compTab === "active" && activeComps.length === 0 && (
                <div style={{ fontSize: 12, color: "#3a2e18", textAlign: "center", padding: "20px 0" }}>No active listings found</div>
              )}
            </motion.div>
          )}

          {/* ── Report bad comps ─────────────────────────────────────────── */}
          {!isReview && (
            <div style={{ textAlign: "center", paddingTop: 4, paddingBottom: 8 }}>
              {reportSent ? (
                <span style={{ fontSize: 11, color: "#6a5528" }}>Thanks — logged for review ✓</span>
              ) : (
                <button
                  onClick={() => setReportSheet(true)}
                  style={{ fontSize: 11, color: "rgba(106,85,40,0.4)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                >
                  Comps look off?
                </button>
              )}
            </div>
          )}

          {/* ── Report sheet — slides up ──────────────────────────────────── */}
          {reportSheet && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
                maxWidth: 448, margin: "0 auto",
                background: "rgba(8,20,8,0.98)", backdropFilter: "blur(28px)",
                borderTop: "1px solid rgba(200,180,126,0.12)",
                borderRadius: "18px 18px 0 0",
                padding: "20px 20px",
                paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#d4c9b0", fontFamily: "Georgia, serif", fontWeight: 600 }}>What was off?</span>
                <button onClick={() => setReportSheet(false)} style={{ background: "none", border: "none", color: "#4a3a1e", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  "No comps returned",
                  "Wrong items",
                  "Price range way off",
                  "Lot filter too aggressive",
                  "Color filter too aggressive",
                ] as const).map(issue => (
                  <button
                    key={issue}
                    onClick={() => handleReport(issue)}
                    disabled={reporting}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10,
                      background: "rgba(13,31,13,0.7)",
                      border: "1px solid rgba(109,188,109,0.12)",
                      color: "#c8b47e", fontSize: 13, textAlign: "left",
                      cursor: "pointer", letterSpacing: "0.1px",
                    }}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Fixed action bar */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4"
        style={{
          background: "rgba(5,13,5,0.98)",
          backdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(200,180,126,0.07)",
          paddingTop: 10,
          paddingBottom: "max(14px, env(safe-area-inset-bottom, 14px))",
          zIndex: 50,
        }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
        <div className="absolute top-0 left-[15%] right-[15%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.15), transparent)" }} />
        <motion.button onClick={() => handleDecision("purchased")} disabled={deciding}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
          style={{
            padding: "15px 22px", borderRadius: 14, fontSize: 16, letterSpacing: "0.3px",
            background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)",
            border: "1px solid rgba(109,188,109,0.15)",
            boxShadow: "0 4px 20px rgba(5,15,5,0.5), 0 0 32px rgba(45,125,45,0.08)",
          }}
          whileTap={{ scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          Pick
        </motion.button>
        <button onClick={() => handleDecision("passed")} disabled={deciding}
          style={{
            width: "100%", marginTop: 6, padding: "6px",
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "rgba(160,130,90,0.45)", letterSpacing: "0.2px",
          }}>
          Leave it
        </button>
      </motion.div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
        .tts-slider { -webkit-appearance: none; appearance: none; background: transparent; outline: none; }
        .tts-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 44px; height: 44px; border-radius: 50%; background: transparent; cursor: pointer; }
        .tts-slider::-moz-range-thumb { width: 44px; height: 44px; border-radius: 50%; background: transparent; border: none; cursor: pointer; }
        .tts-slider::-webkit-slider-runnable-track { background: transparent; }
        .tts-slider::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
}

export default function DecidePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#050f05]">
        <div style={{ color: "#3d3018", fontSize: 13 }}>Loading...</div>
      </div>
    }>
      <DecidePageInner />
    </Suspense>
  );
}
