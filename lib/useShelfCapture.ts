// lib/useShelfCapture.ts
//
// Session 197 Arc 2 C2 — multi-card off-screen capture pipeline.
//
// Per session-196 design record §6 Arc 2 (wrapper UX + html2canvas-pro
// multi-card capture). Composes 5 cards (hero + 3 finds + CTA) into a Map
// keyed by stable card ID, with blob URLs for the carousel preview and
// Blob objects for navigator.share({ files: [...] }) in Arc 2 C4.
//
// Design choices:
//   - Parallel capture via Promise.all (session-152 single-card pattern
//     scaled to 5; html2canvas-pro is the hot path on mobile, parallelism
//     dominates).
//   - 300ms post-mount delay before capture so off-screen img decode
//     completes (session-152 used 250ms; slightly higher for 5-card load).
//   - Capture trigger via captureKey number — bump to re-run (used by Arc
//     2 C5 regenerate + C6 reorder). useRef + queryselectorAll bridges the
//     wrapper's DOM mount to the hook's capture lifecycle (one stable ref
//     instead of 5 refs that would re-fire the effect every render).
//   - Blob URL lifecycle: prior URLs revoked when new capture lands;
//     unmount revokes the last-ready URLs; in-flight URLs revoked on abort.
//   - D13 capture trigger (progressive vs upfront) deferred per design
//     record. This hook = upfront-all-5. If iPhone QA shows >4s latency on
//     iPhone 12+, escalate to D13-progressive — mount + capture lazily as
//     user swipes the carousel. Escalation path documented for round-2 fix
//     per feedback_cap_speculative_patching_at_3_rounds ✅ Promoted.
//
// Wrapper contract:
//   - Wraps 5 Arc 1 components in a container div with `containerRef`
//   - Each card gets `data-shelf-card="hero"|"find:0"|"find:1"|"find:2"|"cta"`
//   - Container positioned off-screen (left: -99999) so capture sees painted
//     DOM without occupying viewport
//   - Hook returns state machine; wrapper reads state.cards Map for preview
//     + share path
//
// Sample wrapper composition (Arc 2 C3):
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [captureKey, setCaptureKey] = useState(0);
//   const capture = useShelfCapture({ containerRef, captureKey, enabled: posts !== null });
//   ...
//   <div ref={containerRef} style={{ position:"fixed", left:-99999, top:0 }}>
//     <div data-shelf-card="hero"><StoryHeroCard ... /></div>
//     <div data-shelf-card="find:0"><StoryFindCard post={picks[0]} ... /></div>
//     ...
//   </div>

"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";

/** Stable IDs for the 5 cards in a Story sequence + Feed companion is
 *  captured separately (own hook call OR same hook with 6 keys). For MVP
 *  the same 5 cards drive Story; Feed = single-card-repurposed per D6
 *  and is captured in its own pass when the wrapper toggles format. */
export type ShelfCardId = "hero" | "find:0" | "find:1" | "find:2" | "cta";

export interface CapturedCard {
  blob: Blob;
  /** Object URL — lifetime managed by hook; do NOT URL.revokeObjectURL
   *  externally. Hook revokes on regenerate + on unmount. */
  url:  string;
}

export type ShelfCaptureState =
  | { status: "idle" }
  | { status: "rendering" }
  | { status: "ready"; cards: Map<ShelfCardId, CapturedCard> }
  | { status: "error"; message: string };

export interface UseShelfCaptureOptions {
  /** Ref to the off-screen container div that holds the 5 marked cards. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Bump this number to trigger a fresh capture pass. Each unique value
   *  runs once. Used by regenerate (Arc 2 C5) + reorder (Arc 2 C6). */
  captureKey:   number;
  /** Gate: don't run capture until posts are loaded + cards are mounted. */
  enabled:      boolean;
}

export function useShelfCapture(opts: UseShelfCaptureOptions): ShelfCaptureState {
  const { containerRef, captureKey, enabled } = opts;
  const [state, setState] = useState<ShelfCaptureState>({ status: "idle" });

  // Track currently-active blob URLs across renders so we can revoke them
  // when capture re-runs OR the component unmounts. State changes don't
  // expose prior URLs (setState is async), so a ref is the canonical
  // lifecycle owner.
  const activeUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;
    const nodes = container.querySelectorAll<HTMLElement>("[data-shelf-card]");
    if (nodes.length !== 5) {
      // Expected 5 cards but found different count — wrapper not fully
      // mounted yet. Stay idle; effect re-runs when captureKey bumps.
      return;
    }

    setState({ status: "rendering" });
    let alive = true;
    const inflightUrls: string[] = [];

    // 300ms delay so off-screen img decode completes before capture. The
    // 3 find cards each load 1 Supabase storage photo via crossOrigin=
    // "anonymous"; native image decoding fires on mount but completion is
    // unobservable without a load promise per <img>. 300ms covers the
    // long-tail decode on mid-range mobile. If iPhone QA on Vercel preview
    // surfaces a race (blank photos in capture), bump to 500ms OR add
    // explicit per-img onload promises before kicking off Promise.all.
    const t = window.setTimeout(async () => {
      if (!alive) return;
      try {
        const captures = Array.from(nodes).map(async (node) => {
          const id = node.dataset.shelfCard as ShelfCardId;
          const canvas = await html2canvas(node, {
            scale:            1,
            backgroundColor:  null, // cards own their bg
            useCORS:          true,
            allowTaint:       false,
            logging:          false,
          });
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              b => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
              "image/png",
              0.95,
            );
          });
          const url = URL.createObjectURL(blob);
          inflightUrls.push(url);
          return [id, { blob, url }] as const;
        });

        const results = await Promise.all(captures);

        if (!alive) {
          // Lost race; revoke URLs we just minted
          results.forEach(([, c]) => URL.revokeObjectURL(c.url));
          return;
        }

        // Success — revoke previously-active URLs, swap to new
        activeUrlsRef.current.forEach(URL.revokeObjectURL);
        activeUrlsRef.current = results.map(([, c]) => c.url);

        const cards = new Map<ShelfCardId, CapturedCard>();
        for (const [id, c] of results) cards.set(id, c);
        setState({ status: "ready", cards });
      } catch (err) {
        if (!alive) return;
        // Revoke partial URLs minted before the failure
        inflightUrls.forEach(URL.revokeObjectURL);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ status: "error", message: `Capture failed: ${msg.slice(0, 80)}` });
      }
    }, 300);

    return () => {
      alive = false;
      window.clearTimeout(t);
      // Note: do NOT revoke inflightUrls or activeUrlsRef here — abort
      // path is handled inside the async block (above), and unmount
      // cleanup lives in its own effect (below) so it survives re-runs.
    };
  }, [captureKey, enabled, containerRef]);

  // Unmount-only cleanup. Empty deps so this fires once when the consumer
  // unmounts — at that point activeUrlsRef holds the URLs the wrapper is
  // still showing in the carousel preview, and they need revoking after
  // the last paint.
  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach(URL.revokeObjectURL);
      activeUrlsRef.current = [];
    };
  }, []);

  return state;
}
