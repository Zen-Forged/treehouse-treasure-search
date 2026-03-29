// app/finds/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useFinds, SavedFind } from "@/hooks/useFinds";

type Filter = "all" | "purchased" | "passed";

function getRecColor(rec?: string): string {
  if (rec === "strong-buy") return "#6dbc6d";
  if (rec === "maybe")      return "#a8904e";
  return "#9a7a5a";
}

function FindCard({ find, index }: { find: SavedFind; index: number }) {
  const router      = useRouter();
  const isPurchased = find.decision === "purchased";
  const isPassed    = find.decision === "passed";

  return (
    <motion.button
      onClick={() => router.push(`/finds/${find.id}`)}
      className="relative rounded-2xl overflow-hidden w-full"
      style={{
        aspectRatio: "3/4",
        border: `1px solid ${
          isPurchased ? "rgba(109,188,109,0.18)" :
          isPassed    ? "rgba(154,122,90,0.12)"  :
                        "rgba(109,188,109,0.08)"
        }`,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }}>

      {/* Photo */}
      <img
        src={find.imageEnhanced ?? find.imageOriginal}
        alt={find.title ?? "Find"}
        className="w-full h-full object-cover"
        style={{
          filter: isPassed
            ? "brightness(0.65) saturate(0.45)"
            : "brightness(0.85) saturate(0.75)",
        }}
      />

      {/* Decision badge — top left */}
      <div className="absolute top-2 left-2">
        <div style={{
          padding: "3px 8px", borderRadius: 10,
          fontSize: 8, fontWeight: 600, letterSpacing: "0.5px",
          textTransform: "uppercase",
          color:      isPurchased ? "#9fd49f" : "#9a7a5a",
          background: isPurchased ? "rgba(13,31,13,0.8)" : "rgba(9,9,9,0.7)",
          border:     `1px solid ${isPurchased ? "rgba(109,188,109,0.3)" : "rgba(154,122,90,0.25)"}`,
          backdropFilter: "blur(8px)",
        }}>
          {isPurchased ? "Picked up" : isPassed ? "Passed" : "Shared"}
        </div>
      </div>

      {/* Recommendation dot — top right */}
      {find.recommendation && (
        <div className="absolute top-2 right-2">
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: getRecColor(find.recommendation),
            boxShadow: `0 0 6px ${getRecColor(find.recommendation)}88`,
          }} />
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2.5"
        style={{ background: "linear-gradient(to top, rgba(5,15,5,0.95) 55%, transparent)" }}>

        {/* Title */}
        {find.title && (
          <p style={{ fontSize: 10, color: "#d4c9b0", lineHeight: 1.35, marginBottom: 5, fontWeight: 500 }}
            className="line-clamp-2 text-left">
            {find.title}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center gap-1.5">
          {find.medianSoldPrice ? (
            <>
              <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#f5f0e8" }}>
                ${Math.round(find.medianSoldPrice)}
              </span>
              {find.priceRangeLow && find.priceRangeHigh && (
                <span style={{ fontSize: 9, color: "#6a5528" }}>
                  ${Math.round(find.priceRangeLow)}–${Math.round(find.priceRangeHigh)}
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 9, color: "#6a5528", fontStyle: "italic" }}>No price data</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function FindsPage() {
  const router     = useRouter();
  const { finds }  = useFinds();
  const [filter, setFilter] = useState<Filter>("all");

  const purchasedCount = finds.filter(f => f.decision === "purchased").length;
  const passedCount    = finds.filter(f => f.decision === "passed").length;

  const filtered = finds.filter(f => {
    if (filter === "all")       return true;
    if (filter === "purchased") return f.decision === "purchased";
    if (filter === "passed")    return f.decision === "passed";
    return true;
  });

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: finds.length },
    { key: "purchased", label: "Picked up", count: purchasedCount },
    { key: "passed",    label: "Passed",    count: passedCount },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={16} height={16} style={{ opacity: 0.7 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0" }}>My Picks</span>
        </div>
        <div className="w-9" />
      </header>

      {/* ── Filter tabs ── */}
      {finds.length > 0 && (
        <div className="flex gap-2 px-4 pt-4 pb-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                border: `1px solid ${filter === tab.key ? "rgba(200,180,126,0.35)" : "rgba(109,188,109,0.08)"}`,
                background: filter === tab.key ? "rgba(200,180,126,0.1)" : "rgba(13,31,13,0.4)",
                color: filter === tab.key ? "#c8b47e" : "#6a5528",
                transition: "all 0.2s",
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ marginLeft: 5, fontSize: 9, opacity: 0.7 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty"
              className="flex flex-col items-center justify-center h-64 gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ opacity: 0.4 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#d4c9b0" }}>
                {finds.length === 0 ? "No picks yet" : "Nothing here"}
              </span>
              <span style={{ fontSize: 13, color: "#6a5528" }}>
                {finds.length === 0
                  ? "Start by capturing something"
                  : `No items marked as ${filter === "purchased" ? "picked up" : "passed"}`}
              </span>
            </motion.div>
          ) : (
            <motion.div key={filter}
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              {filtered.map((find, i) => (
                <FindCard key={find.id} find={find} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── New find FAB ── */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-5">
        <motion.button onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 font-semibold text-[#f5f0e8]"
          style={{
            padding: "14px 32px", borderRadius: 50, fontSize: 14,
            background: "linear-gradient(135deg, rgba(46,110,46,0.96), rgba(33,82,33,1))",
            border: "1px solid rgba(109,188,109,0.2)",
            boxShadow: "0 4px 24px rgba(5,15,5,0.6), 0 0 40px rgba(45,125,45,0.15)",
          }}
          whileTap={{ scale: 0.97 }}>
          New find
        </motion.button>
      </div>
    </div>
  );
}
