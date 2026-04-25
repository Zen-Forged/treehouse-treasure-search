// app/post/tag/page.tsx
//
// 🧪 TESTBED PHASE — session 62.
//
// This page is a standalone tag-extraction testbed. It is NOT yet wired into
// the Add Find flow — /my-shelf still redirects to /post/preview and that
// path is undisturbed. Navigate here directly (e.g. /post/tag) to point your
// camera at real mall tags and validate the /api/extract-tag prompt before
// we commit to the full integration.
//
// What it does:
//   - Camera input (capture="environment") + library input
//   - Compresses image, POSTs to /api/extract-tag
//   - Surfaces full response on screen: title, price, source, reason, elapsed ms
//   - Shows raw JSON in an expandable block
//   - "Try another" resets state
//
// What it does NOT do (yet):
//   - Read or write postStore
//   - Redirect to /post/preview
//   - Touch the real Add Find flow in any way
//
// Once the prompt validates against real tags, this page evolves (not
// replaces) into the production /post/tag step per docs/add-find-tag-design.md.
// Strip the testbed banner, wire up postStore, fire post-caption in parallel,
// redirect to /post/preview on success.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ImagePlus, RotateCcw, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { compressImage } from "@/lib/imageUpload";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";

type Stage = "ready" | "loading" | "result" | "error";

interface ExtractResult {
  title: string;
  price: number | null;
  source: "claude" | "mock";
  reason?: "no-key" | "error" | "parse";
}

async function compressForUpload(dataUrl: string, maxWidth = 1200, quality = 0.78): Promise<string> {
  const first = await compressImage(dataUrl, maxWidth, quality);
  if (first.length <= 1_000_000) return first;
  return compressImage(first, Math.round(maxWidth * 0.75), 0.72);
}

export default function PostTagTestbedPage() {
  const cameraRef  = useRef<HTMLInputElement | null>(null);
  const libraryRef = useRef<HTMLInputElement | null>(null);

  const [stage, setStage]       = useState<Stage>("ready");
  const [image, setImage]       = useState<string | null>(null);
  const [result, setResult]     = useState<ExtractResult | null>(null);
  const [elapsed, setElapsed]   = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showRaw, setShowRaw]   = useState<boolean>(false);

  function reset() {
    setStage("ready");
    setImage(null);
    setResult(null);
    setElapsed(null);
    setErrorMsg("");
    setShowRaw(false);
    if (cameraRef.current)  cameraRef.current.value  = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[tag-testbed] file selected:", { name: file.name, size: file.size, type: file.type });

    // Read as data URL
    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error("[tag-testbed] FileReader error:", err);
      setErrorMsg(`Couldn't read file: ${err instanceof Error ? err.message : String(err)}`);
      setStage("error");
      return;
    }

    setImage(dataUrl);
    setStage("loading");
    setErrorMsg("");
    setResult(null);
    setElapsed(null);

    try {
      const compressed = await compressForUpload(dataUrl, 1200, 0.78);
      console.log("[tag-testbed] compressed payload bytes:", compressed.length);

      const t0 = performance.now();
      const res = await fetch("/api/extract-tag", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ imageDataUrl: compressed }),
      });
      const elapsedMs = Math.round(performance.now() - t0);

      console.log("[tag-testbed] HTTP", res.status, "in", elapsedMs, "ms");

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        setErrorMsg(`HTTP ${res.status}: ${body || "(empty body)"}`);
        setStage("error");
        return;
      }

      const data = (await res.json()) as ExtractResult;
      console.log("[tag-testbed] response:", data);

      setResult(data);
      setElapsed(elapsedMs);
      setStage("result");
    } catch (err) {
      console.error("[tag-testbed] fetch error:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
      }}
    >
      {/* Hidden inputs (file + camera) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {/* ── Testbed banner ─────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(122, 92, 30, 0.12)",
          borderBottom: `1px solid ${v1.amberBorder}`,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: FONT_SYS,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: v1.amber,
          fontWeight: 500,
        }}
      >
        <span>🧪</span>
        <span>Tag extraction testbed — not yet wired to Add Find</span>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ padding: "22px 22px 14px" }}>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 28,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            lineHeight: 1.15,
            marginBottom: 4,
          }}
        >
          Now the tag
        </div>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            lineHeight: 1.5,
          }}
        >
          Photograph an inventory tag — Claude will read the title and price.
        </div>
      </div>

      {/* ── Photo preview (when image present) ─────────────────────── */}
      {image && (
        <div style={{ padding: "0 22px 16px" }}>
          <div
            style={{
              borderRadius: v1.imageRadius,
              overflow: "hidden",
              border: `1px solid ${v1.inkHairline}`,
              background: "#cdb88e",
              boxShadow: "0 4px 16px rgba(42,26,10,0.14)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="captured tag"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                opacity: stage === "loading" ? 0.55 : 1,
                transition: "opacity 0.18s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────── */}
      {stage === "loading" && (
        <div style={{ padding: "0 22px 24px", textAlign: "center" }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 16,
              color: v1.inkMuted,
            }}
          >
            Reading the tag…
          </motion.div>
        </div>
      )}

      {/* ── Result state ─────────────────────────────────────────── */}
      {stage === "result" && result && (
        <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: result.source === "claude" ? "rgba(30,77,43,0.10)" : v1.amberBg,
              border: `1px solid ${result.source === "claude" ? "rgba(30,77,43,0.22)" : v1.amberBorder}`,
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 12,
              color: result.source === "claude" ? v1.green : v1.amber,
            }}
          >
            <Tag size={11} />
            {result.source === "claude"
              ? `Read by Claude · ${elapsed}ms`
              : `Mock fallback · reason=${result.reason ?? "unknown"}`}
          </div>

          {/* Extracted fields */}
          <div
            style={{
              border: `1px solid ${v1.inkHairline}`,
              borderRadius: 14,
              background: v1.inkWash,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <Row label="Title" value={result.title || "—"} muted={!result.title} />
            <Row
              label="Price"
              value={result.price != null ? `$${result.price.toFixed(2)}` : "—"}
              muted={result.price == null}
            />
          </div>

          {/* Raw JSON toggle */}
          <button
            onClick={() => setShowRaw((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 0",
              background: "transparent",
              border: "none",
              fontFamily: FONT_SYS,
              fontSize: 12,
              color: v1.inkMuted,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {showRaw ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Raw response
          </button>
          {showRaw && (
            <pre
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 11,
                color: v1.inkMid,
                background: "rgba(42,26,10,0.05)",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${v1.inkHairline}`,
                lineHeight: 1.55,
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────── */}
      {stage === "error" && (
        <div style={{ padding: "0 22px 22px" }}>
          <div
            style={{
              border: `1px solid ${v1.redBorder}`,
              borderRadius: 14,
              background: v1.redBg,
              padding: "14px 18px",
              fontFamily: FONT_SYS,
              fontSize: 12,
              color: v1.red,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <div style={{ fontFamily: FONT_IM_FELL, fontSize: 15, marginBottom: 6, fontStyle: "italic" }}>
              Request failed
            </div>
            {errorMsg || "(no detail)"}
          </div>
        </div>
      )}

      {/* ── Action stack ─────────────────────────────────────────── */}
      <div
        style={{
          marginTop: "auto",
          padding: "16px 22px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {(stage === "ready" || stage === "result" || stage === "error") && (
          <>
            <button
              onClick={() => cameraRef.current?.click()}
              style={primaryButtonStyle}
            >
              <Camera size={18} strokeWidth={1.6} />
              {stage === "ready" ? "Take photo of tag" : "Try another tag"}
            </button>
            <button
              onClick={() => libraryRef.current?.click()}
              style={secondaryButtonStyle}
            >
              <ImagePlus size={16} strokeWidth={1.6} />
              Choose from library
            </button>
          </>
        )}

        {(stage === "result" || stage === "error") && (
          <button
            onClick={reset}
            style={{
              ...skipButtonStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────
function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 16,
          color: muted ? v1.inkFaint : v1.inkPrimary,
          fontStyle: muted ? "italic" : "normal",
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Button styles ──────────────────────────────────────────────────────
const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 15,
  borderRadius: 14,
  fontFamily: FONT_SYS,
  fontSize: 15,
  fontWeight: 500,
  color: "#fff",
  background: v1.green,
  border: "none",
  letterSpacing: "0.2px",
  boxShadow: "0 2px 12px rgba(30,77,43,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 13,
  borderRadius: 14,
  fontFamily: FONT_SYS,
  fontSize: 14,
  fontWeight: 500,
  color: v1.inkMid,
  background: v1.iconBubble,
  border: `1px solid ${v1.inkHairline}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};

const skipButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 11,
  borderRadius: 14,
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 14,
  color: v1.inkMuted,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};
