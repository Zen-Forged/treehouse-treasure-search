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

// Break-even asking price: the point where net proceeds exactly equal the asking price.
// net = median * (1 - feeRate), so break-even = net = median * 0.87
function calcBreakEven(median: number, feeRate = 0.13): number {
  return Math.round(median * (1 - feeRate));
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
  // identifiedTitle reads from session reactively — it may arrive after mount
  // via onIdentified when taking the direct camera → /decide path
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
  // Slider state — 0 means "not yet initialised"; we set it once median is known
  const [askingPrice, setAskingPrice] = useState<number>(0);
  // Tabs
  const [compTab, setCompTab] = useState<CompTab>("sold");

  const [displayImage, setDisplayImage] = useState<string>(
    findSession?.imageEnhanced ?? findSession?.imageOriginal ?? ""
  );

  const analysisStarted  = useRef(false);
  const enhancedImageRef = useRef<string | undefined>(findSession?.imageEnhanced);
  const soldCompsRef     = useRef<Comp[]>([]);
  const activeCompsRef   = useRef<Comp[]>([]);
  const summaryRef       = useRef<SoldSummary | null>(null);
  // Keeps identification current for handleDecision regardless of when it arrives
  const identificationRef = useRef(findSession?.identification);

  const { state: analysisState, run: runAnalysis, reset } = useAnalysisFlow();

  // Keep identificationRef in sync whenever session updates (async identify path)
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
      imageDataUrl: sessionData.imageDataUrl,
      costStr:      "0",
      // Pass pre-identified values if coming from /discover story path.
      // If nil, useAnalysisFlow runs identification itself as step 0.
      searchQuery:     searchQuery || undefined,
      identifiedTitle: identifiedTitle || undefined,
      primaryColor,
      onIdentified: (result) => {
        // Store identification in session so it persists (e.g. for My Picks save)
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

  // Default slider to break-even point (profit = $0 after fees) when median first arrives.
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
      // Read from ref — may have arrived asynchronously on direct camera path
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

  // ── Derived values for the decision card ─────────────────────────────────────
  const median      = pricing.medianSoldPrice;
  const sliderMin   = 1;
  const sliderMax   = median > 0 ? Math.round(median) : 100; // max = resell value
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

  const profitBg =
    profit <= 0  ? "rgba(192,90,74,0.08)"    :
    roi < 10     ? "rgba(192,122,42,0.08)"   :
    roi < 40     ? "rgba(200,180,126,0.08)"  : "rgba(109,188,109,0.08)";

  const profitBorder =
    profit <= 0  ? "rgba(192,90,74,0.2)"     :
    roi < 10     ? "rgba(192,122,42,0.2)"    :
    roi < 40     ? "rgba(200,180,126,0.2)"   : "rgba(109,188,109,0.2)";

  const profitLabel =
    profit <= 0  ? "Break even" :
    roi < 10     ? "Thin margin" :
    roi < 40     ? "Decent flip" : "Strong flip";

  // Formatted strings
  const profitStr =
    profit > 0   ? "+$" + profit.toFixed(2) :
    profit < 0   ? "-$" + Math.abs(profit).toFixed(2) : "$0.00";

  // Sold comps ordered: low first, high second, rest by index
  const byPrice     = [...soldComps].sort((a, b) => a.price - b.price);
  const lowestComp  = byPrice[0];
  const highestComp = byPrice[byPrice.length - 1];
  const orderedSold = soldComps.length > 0
    ? [lowestComp, highestComp, ...soldComps.filter(c => c !== lowestComp && c !== highestComp)]
    : [];

  // ── RESULTS ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">
      <NavBar />

      {/* pb-28 = enough clearance above the fixed action bar */}
      <main className="flex-1 overflow-y-auto pb-28">

        {/* ── Photo 190px — shorter than before, name overlaid on fade ── */}
        <motion.div className="relative w-full flex-shrink-0" style={{ height: 190 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <img src={displayImage} alt="Item" className="w-full h-full object-cover"
            style={{ filter: "brightness(0.82) saturate(0.75) sepia(0.08)" }} />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(5,15,5,0.35) 100%)" }} />
          {/* Gradient fade — taller so name sits cleanly over it */}
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: 130, background: "linear-gradient(to bottom, transparent, #050f05)" }} />
          {/* Item name overlaid on the fade — always visible, never clipped */}
          {identifiedTitle && (
            <motion.div
              className="absolute left-0 right-0"
              style={{ bottom: 14, padding: "0 20px", zIndex: 2 }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}>
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700,
                color: "#f5f0e8", lineHeight: 1.2,
                textShadow: "0 1px 14px rgba(5,15,5,0.9)",
              }}>
                {identifiedTitle}
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="px-5 flex flex-col gap-4 pt-3 pb-4">

          {/* ── Resell value block: label → number → range | sell-time pill ── */}
          {median > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>

              {/* Left: label / big number / range */}
              <div>
                <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 5, fontFamily: "sans-serif" }}>
                  Avg resell value
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 2, fontFamily: "Georgia, serif" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#a8904e", paddingTop: 6, lineHeight: 1 }}>$</span>
                  <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: -2, color: "#f5f0e8" }}>
                    {median.toFixed(0)}
                  </span>
                </div>
                {soldSummary && soldSummary.priceRangeLow > 0 && (
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6a5528", marginTop: 4 }}>
                    ${soldSummary.priceRangeLow.toFixed(2)} – ${soldSummary.priceRangeHigh.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Right: avg sell time in its own pill */}
              {soldSummary && soldSummary.avgDaysToSell > 0 && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(10,24,10,0.65)",
                  border: "1px solid rgba(200,180,126,0.1)",
                  textAlign: "center",
                  flexShrink: 0,
                  marginTop: 18, // visually aligns with middle of the big number
                }}>
                  <div style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4, fontFamily: "sans-serif" }}>
                    Avg sell time
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#a8904e", lineHeight: 1 }}>
                    {soldSummary.avgDaysToSell <= 7
                      ? `${soldSummary.avgDaysToSell}d`
                      : `${Math.round(soldSummary.avgDaysToSell / 7)}wk`}
                  </div>
                  <div style={{ fontSize: 9, color: "#6a5528", marginTop: 3, fontFamily: "sans-serif" }}>
                    to sell
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Decision card: profit + ROI + asking price slider — one unified block ── */}
          {median > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              style={{
                borderRadius: 16,
                background: "rgba(10,24,10,0.65)",
                border: `1px solid ${profitBorder}`,
                overflow: "hidden",
                transition: "border-color 0.3s ease",
              }}>

              {/* Est profit (large) + ROI (smaller, right) — same visual unit */}
              <div style={{ padding: "15px 18px 0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  {/* Profit */}
                  <div>
                    <div style={{ fontSize: 8, color: "rgba(200,180,126,0.35)", textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 5, fontFamily: "sans-serif" }}>
                      Est. profit
                    </div>
                    <div style={{
                      fontFamily: "monospace", fontSize: 30, fontWeight: 700,
                      color: profitColor, letterSpacing: -0.5, lineHeight: 1,
                      transition: "color 0.25s ease",
                    }}>
                      {profitStr}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(200,180,126,0.25)", marginTop: 3 }}>
                      after ~{Math.round(feeRate * 100)}% fees
                    </div>
                  </div>
                  {/* ROI — smaller, right-aligned, clearly contextual */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 8, color: "rgba(200,180,126,0.35)", textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 5, fontFamily: "sans-serif" }}>
                      ROI
                    </div>
                    <div style={{
                      fontFamily: "monospace", fontSize: 20, fontWeight: 700,
                      color: profitColor, letterSpacing: -0.5, lineHeight: 1,
                      transition: "color 0.25s ease",
                    }}>
                      {askingPrice > 0 ? (profit <= 0 ? "0%" : `${Math.round(roi)}%`) : "—"}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 500, marginTop: 3,
                      color: profitColor, transition: "color 0.25s ease",
                    }}>
                      {profitLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Asking price + slider — same card, below a hairline divider */}
              <div style={{ padding: "13px 18px 16px", marginTop: 13, borderTop: "1px solid rgba(200,180,126,0.06)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 11 }}>
                  <div>
                    <span style={{ fontSize: 8, color: "#4a3a1e", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "sans-serif" }}>
                      Asking price
                    </span>
                    {profit <= 0 && (
                      <span style={{ fontSize: 9, color: "#3a2e18", marginLeft: 7, fontFamily: "sans-serif" }}>
                        — slide left to profit
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 700, color: "#f5f0e8" }}>
                    ${askingPrice.toFixed(2)}
                  </div>
                </div>

                {/* Slider — touch-action none on container is what makes mobile work */}
                <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center", touchAction: "none" }}>
                  {/* Track bg */}
                  <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
                  {/* Filled portion — colour transitions with profit state */}
                  <div style={{
                    position: "absolute", left: 0, height: 4, borderRadius: 2,
                    width: `${pct * 100}%`,
                    background: `linear-gradient(90deg, rgba(109,188,109,0.5), ${profitColor})`,
                    transition: "background 0.25s ease",
                  }} />
                  {/* Visual thumb — pointer-events none so the input captures all touches */}
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
                  {/* Native range — transparent, sits on top (z-index 2), captures all input */}
                  <input
                    type="range"
                    className="tts-slider"
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    value={askingPrice}
                    onChange={e => setAskingPrice(Number(e.target.value))}
                    style={{
                      position: "absolute", left: 0, right: 0,
                      width: "100%", height: "100%",
                      margin: 0, padding: 0, zIndex: 2,
                    }}
                  />
                </div>

                {/* Min / max labels — no "Max" or "Cap" prefix, just the numbers */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: "#3a2e18", fontFamily: "monospace" }}>${sliderMin}</span>
                  <span style={{ fontSize: 9, color: "#3a2e18", fontFamily: "monospace" }}>${sliderMax.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Comp tabs + scrollable listings ── */}
          {(soldComps.length > 0 || activeComps.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}>

              {/* Tab row */}
              <div style={{
                display: "flex",
                borderRadius: 11,
                overflow: "hidden",
                border: "1px solid rgba(200,180,126,0.12)",
                marginBottom: 12,
              }}>
                {/* Sold tab */}
                <button
                  onClick={() => setCompTab("sold")}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: compTab === "sold" ? "rgba(10,24,10,0.9)" : "rgba(5,12,5,0.4)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <span style={{
                    fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: "0.2px",
                    color: compTab === "sold" ? "#d4c9b0" : "#4a3a1e",
                    fontWeight: compTab === "sold" ? 600 : 400,
                  }}>
                    Sold listings
                  </span>
                  {soldComps.length > 0 && (
                    <span style={{
                      fontFamily: "monospace", fontSize: 9,
                      padding: "1px 6px", borderRadius: 6,
                      background: compTab === "sold" ? "rgba(200,180,126,0.1)" : "rgba(200,180,126,0.05)",
                      color: compTab === "sold" ? "#6a5528" : "#3a2e18",
                    }}>
                      {soldComps.length}
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div style={{ width: 1, background: "rgba(200,180,126,0.12)", flexShrink: 0 }} />

                {/* Active tab */}
                <button
                  onClick={() => setCompTab("active")}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: compTab === "active" ? "rgba(10,24,10,0.9)" : "rgba(5,12,5,0.4)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <span style={{
                    fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: "0.2px",
                    color: compTab === "active" ? "#d4c9b0" : "#4a3a1e",
                    fontWeight: compTab === "active" ? 600 : 400,
                  }}>
                    Active listings
                  </span>
                  {activeComps.length > 0 && (
                    <span style={{
                      fontFamily: "monospace", fontSize: 9,
                      padding: "1px 6px", borderRadius: 6,
                      background: compTab === "active" ? "rgba(200,180,126,0.1)" : "rgba(200,180,126,0.05)",
                      color: compTab === "active" ? "#6a5528" : "#3a2e18",
                    }}>
                      {activeComps.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ── Sold comps ── */}
              {compTab === "sold" && soldComps.length > 0 && (
                <>
                  <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -20px", padding: "0 20px 4px" }}
                    className="hide-scrollbar">
                    <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                      {orderedSold.map((comp, i) => {
                        const isLowest  = comp === lowestComp;
                        const isHighest = comp === highestComp;
                        return (
                          <motion.a key={comp.url ?? i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                            style={{
                              width: 110, flexShrink: 0, borderRadius: 12, overflow: "hidden",
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
                                style={{ width: "100%", height: 90, objectFit: "cover", display: "block", filter: "brightness(0.82) saturate(0.7)" }} />
                            ) : (
                              <div style={{ width: "100%", height: 90, background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.1)" strokeWidth="1">
                                  <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                                </svg>
                              </div>
                            )}
                            <div style={{ padding: "6px 8px 8px" }}>
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
                  <p style={{ fontSize: 10, color: "#2e2410", paddingTop: 6 }}>
                    {usingMock ? "Estimated data" : "Real eBay sold listings"}
                  </p>
                </>
              )}

              {/* ── Active comps ── */}
              {compTab === "active" && activeComps.length > 0 && (
                <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -20px", padding: "0 20px 4px" }}
                  className="hide-scrollbar">
                  <div style={{ display: "flex", gap: 10, width: "max-content" }}>
                    {activeComps.map((comp, i) => (
                      <motion.a key={i} href={comp.url ?? "#"} target="_blank" rel="noopener noreferrer"
                        style={{
                          width: 120, flexShrink: 0, borderRadius: 12, overflow: "hidden",
                          background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.07)",
                          display: "block", textDecoration: "none",
                        }}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: i * 0.025 }}
                        whileTap={{ scale: 0.97 }}>
                        {comp.imageUrl ? (
                          <img src={comp.imageUrl} alt={comp.title}
                            style={{ width: "100%", height: 90, objectFit: "cover", display: "block", filter: "brightness(0.78) saturate(0.65)" }} />
                        ) : (
                          <div style={{ width: "100%", height: 90, background: "rgba(17,37,17,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,180,126,0.1)" strokeWidth="1">
                              <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ padding: "6px 8px 8px" }}>
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

              {/* Empty tab state */}
              {compTab === "sold"   && soldComps.length   === 0 && (
                <div style={{ fontSize: 12, color: "#3a2e18", textAlign: "center", padding: "20px 0" }}>No sold listings found</div>
              )}
              {compTab === "active" && activeComps.length === 0 && (
                <div style={{ fontSize: 12, color: "#3a2e18", textAlign: "center", padding: "20px 0" }}>No active listings found</div>
              )}
            </motion.div>
          )}

        </div>
      </main>

      {/* ── Fixed action bar — Pick on top, Leave it as plain text below ── */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4"
        style={{
          background: "rgba(5,13,5,0.98)",
          backdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(200,180,126,0.07)",
          paddingTop: 10,
          paddingBottom: "max(14px, env(safe-area-inset-bottom, 14px))",
          // Ensure action bar is above slider z-index
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
