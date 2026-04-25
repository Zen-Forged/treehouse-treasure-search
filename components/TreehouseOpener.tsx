// components/TreehouseOpener.tsx
//
// "The Window Opens" — first-visit cinematic threshold opener for Treehouse
// Finds. Web port of the original React Native / Expo intent doc, rebuilt as a
// framer-motion + CSS overlay. Same 4-phase beat structure as the RN version:
//   Phase 1 — Stillness   (0.0 → 0.8s)   ambient warm-paper fade-in
//   Phase 2 — Frame in    (0.8 → 1.6s)   wooden window appears centered
//   Phase 3 — Light sweep (1.6 → 2.5s)   warm gold streak across the glass +
//                                        blur clears like wiping condensation
//   Phase 4 — Reveal      (2.5 → 3.2s)   frame + overlay dissolve, onFinish
//
// Tap anywhere mid-animation to skip. Defaults to a static skeleton-style
// preview behind the glass (matches the RN DefaultHomePreview); a future v2
// can swap to a transparent cutout + live backdrop-filter blur to show the
// real feed beneath.
//
// Consumer is responsible for the gating (localStorage flag + viewport check
// for mobile-only). See app/page.tsx for the wired-up site usage and
// app/opener-preview/page.tsx for the dev preview route.

"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = {
  cream:       "#F4EFE6",
  creamDeep:   "#EAE2D2",
  forest:      "#1F3D2B",
  gold:        "#E6C27A",
  goldBright:  "#FFEBBE",
  woodLight:   "#8B6F47",
  woodMid:     "#6B502E",
  woodDark:    "#3E2C18",
} as const;

// Phase durations in seconds — match RN intent doc.
const T = {
  stillness: 0.8,
  frameIn:   0.8,
  sweep:     0.9,
  reveal:    0.7,
} as const;

const TOTAL_MS = (T.stillness + T.frameIn + T.sweep + T.reveal) * 1000;

const EASE     = [0.32, 0.72, 0.24, 1] as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface TreehouseOpenerProps {
  onFinish: () => void;
  showMicrocopy?: boolean;
}

export default function TreehouseOpener({
  onFinish,
  showMicrocopy = true,
}: TreehouseOpenerProps) {
  const [hidden, setHidden] = useState(false);
  const [blurPx, setBlurPx] = useState(24);

  // Natural completion at ~3.2s.
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  // Blur clears during sweep — kick off via state change so the CSS
  // transition handles the actual interpolation.
  useEffect(() => {
    const t = setTimeout(
      () => setBlurPx(0),
      (T.stillness + T.frameIn + 0.2) * 1000,
    );
    return () => clearTimeout(t);
  }, []);

  // After the exit animation completes, fire onFinish.
  useEffect(() => {
    if (!hidden) return;
    const t = setTimeout(onFinish, 500);
    return () => clearTimeout(t);
  }, [hidden, onFinish]);

  function handleSkip() {
    if (hidden) return;
    setHidden(true);
  }

  const sweepStartDelay = T.stillness + T.frameIn;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="opener"
          onClick={handleSkip}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          aria-label="Tap to skip intro"
          role="button"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "pointer",
            overflow: "hidden",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* ── Phase 1: Stillness — warm-paper ambient fade-in ─────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              position: "absolute",
              inset: 0,
              background: COLORS.cream,
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(230,194,122,0.10) 0%, rgba(244,239,230,0) 55%, rgba(62,44,24,0.06) 100%)",
            }}
          />
          {/* Vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(62,44,24,0.18) 0%, rgba(62,44,24,0) 50%, rgba(62,44,24,0.22) 100%)",
            }}
          />

          {/* ── Phase 2: Frame in — wooden window centered ──────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: T.frameIn,
                delay: T.stillness,
                ease: EASE_OUT,
              }}
              style={{
                position: "relative",
                width: "min(78vw, 320px)",
                aspectRatio: "1 / 1.3",
                borderRadius: 16,
                overflow: "hidden",
                background: `linear-gradient(135deg, ${COLORS.woodLight} 0%, ${COLORS.woodMid} 40%, ${COLORS.woodDark} 75%, ${COLORS.woodMid} 100%)`,
                boxShadow:
                  "0 12px 24px rgba(42, 26, 8, 0.28), 0 4px 10px rgba(42, 26, 8, 0.16)",
              }}
            >
              {/* Bevel highlight — top edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "rgba(255, 240, 210, 0.35)",
                  pointerEvents: "none",
                }}
              />

              {/* Inner window — the "glass" with the home preview behind */}
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  left: 22,
                  right: 22,
                  bottom: 22,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: COLORS.cream,
                }}
              >
                {/* The home-screen-behind-the-glass stand-in */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: T.stillness + 0.2,
                    ease: EASE,
                  }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <DefaultHomePreview />
                </motion.div>

                {/* Glass blur — clears during sweep phase. State-driven
                    pixel value paired with a CSS transition so the browser
                    handles the interpolation natively. */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backdropFilter: `blur(${blurPx}px)`,
                    WebkitBackdropFilter: `blur(${blurPx}px)`,
                    transition: `backdrop-filter ${T.sweep}s cubic-bezier(0.32, 0.72, 0.24, 1), -webkit-backdrop-filter ${T.sweep}s cubic-bezier(0.32, 0.72, 0.24, 1)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Glass tint — faint warm wash, static */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(230, 194, 122, 0.08)",
                    pointerEvents: "none",
                  }}
                />

                {/* Light sweep — warm-gold diagonal streak */}
                <motion.div
                  initial={{ x: "-130%", opacity: 0 }}
                  animate={{ x: "130%", opacity: [0, 1, 1, 0] }}
                  transition={{
                    x: {
                      duration: T.sweep,
                      delay: sweepStartDelay,
                      ease: EASE,
                    },
                    opacity: {
                      duration: T.sweep,
                      delay: sweepStartDelay,
                      times: [0, 0.2, 0.8, 1],
                      ease: EASE,
                    },
                  }}
                  style={{
                    position: "absolute",
                    top: "-30%",
                    left: 0,
                    width: "60%",
                    height: "160%",
                    background:
                      "linear-gradient(90deg, rgba(230,194,122,0) 0%, rgba(230,194,122,0.35) 40%, rgba(255,235,190,0.55) 50%, rgba(230,194,122,0.35) 60%, rgba(230,194,122,0) 100%)",
                    transform: "rotate(12deg)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </motion.div>

            {/* Microcopy — fades in during sweep, out before reveal */}
            {showMicrocopy && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0] }}
                transition={{
                  duration: 1.5,
                  delay: sweepStartDelay + 0.1,
                  times: [0, 0.33, 0.7, 1],
                  ease: EASE,
                }}
                style={{
                  position: "absolute",
                  bottom: 80,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  color: COLORS.forest,
                  fontStyle: "italic",
                  textTransform: "lowercase",
                  fontFamily: "Georgia, serif",
                  pointerEvents: "none",
                }}
              >
                Embrace the search.
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── DefaultHomePreview ─────────────────────────────────────────────────────
// Lightweight stand-in for the home screen behind the glass — mirrors the RN
// version's skeleton shapes (header bar + 2-column tile grid). Replace with
// a real preview component or live cutout in a future iteration.
function DefaultHomePreview() {
  return (
    <div
      style={{
        height: "100%",
        background: COLORS.cream,
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 28,
          width: "55%",
          background: COLORS.forest,
          opacity: 0.85,
          borderRadius: 4,
          marginBottom: 18,
        }}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 130,
              background: COLORS.creamDeep,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <div
            style={{
              height: 90,
              background: COLORS.creamDeep,
              borderRadius: 8,
            }}
          />
        </div>
        <div style={{ flex: 1, paddingTop: 24 }}>
          <div
            style={{
              height: 100,
              background: COLORS.creamDeep,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <div
            style={{
              height: 140,
              background: COLORS.creamDeep,
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    </div>
  );
}
