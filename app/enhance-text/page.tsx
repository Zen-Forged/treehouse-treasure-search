// app/enhance-text/page.tsx
// Story generation screen — replaces the old caption-refinement screen.
// Generates a Kentucky Treehouse–style post from item + user note.
// Uses staged loading language ("Bringing it into the Treehouse…") not a spinner.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFindSession } from "@/hooks/useSession";
import { StoryOutput } from "@/types/find";

const ease = [0.25, 0.1, 0.25, 1] as const;

// Staged loading phrases — appear sequentially, one at a time
const LOADING_STAGES = [
  "Bringing it into the Treehouse…",
  "Identifying the piece…",
  "Setting the scene…",
  "Writing the story…",
];

function useLoadingStage(active: boolean) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) { setStage(0); return; }
    const interval = setInterval(() => {
      setStage(s => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [active]);

  return LOADING_STAGES[stage];
}

export default function EnhanceTextPage() {
  const router = useRouter();
  const { session, updateSession } = useFindSession();

  const [generating, setGenerating] = useState(!session?.story);
  const [story, setStory]           = useState<StoryOutput | null>(session?.story ?? null);

  const loadingPhrase = useLoadingStage(generating);

  useEffect(() => {
    if (!session?.imageOriginal) { router.replace("/"); return; }
    // Already have a story — skip generation
    if (session.story) { setGenerating(false); return; }

    const run = async () => {
      try {
        const res = await fetch("/api/story", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            itemName:  session.identification?.title  ?? "an interesting find",
            material:  session.identification?.attributes?.material ?? null,
            condition: session.identification?.attributes?.condition ?? null,
            status:    session.storyStatus ?? "Available",
            userNote:  session.intentText ?? "",
          }),
        });

        const result: StoryOutput = await res.json();
        setStory(result);
        updateSession({ story: result, captionRefined: result.caption });
      } catch (err) {
        console.error("[enhance-text] story generation failed:", err);
        // Graceful fallback so user isn't stuck
        const fallback: StoryOutput = {
          postType:    "Found in the Wild",
          caption:     session.intentText?.trim() || "Found this today. Something about it stood out.",
          altCaption:  "Still here.",
          scene:       "forest floor",
          imagePrompt: `Photorealistic cinematic still of a ${session.identification?.title?.toLowerCase() ?? "found object"} resting on a forest floor. Natural light, earthy tones, no people.`,
        };
        setStory(fallback);
        updateSession({ story: fallback, captionRefined: fallback.caption });
      } finally {
        setGenerating(false);
      }
    };

    run();
  }, []);

  const handleContinue = () => {
    if (!story) return;
    router.push("/share");
  };

  const image = session?.imageEnhanced ?? session?.imageOriginal;

  return (
    <div className="flex flex-col min-h-screen bg-[#050f05]">

      {/* ── Header ── */}
      <header className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(200,180,126,0.06)", background: "rgba(5,15,5,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)" }}>
          <ArrowLeft size={15} style={{ color: "#7a6535" }} />
        </button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", marginLeft: 14 }}>
          {generating ? "Building the story" : "The story"}
        </span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-5 pb-36 overflow-y-auto">

        {/* ── Item photo ── */}
        <motion.div className="w-full rounded-2xl overflow-hidden flex-shrink-0"
          style={{ height: 200, border: "1px solid rgba(109,188,109,0.08)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {image && (
            <img src={image} alt="Your find" className="w-full h-full object-cover"
              style={{ filter: "brightness(0.82) saturate(0.75) sepia(0.06)" }} />
          )}
        </motion.div>

        {/* ── Staged loading overlay ── */}
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div key="loading"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease }}
              className="flex flex-col gap-4 py-4">

              {/* Animated phrase */}
              <AnimatePresence mode="wait">
                <motion.div key={loadingPhrase}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease }}
                  style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 600, color: "#d4c9b0", lineHeight: 1.3 }}>
                  {loadingPhrase}
                </motion.div>
              </AnimatePresence>

              {/* Stage progress dots */}
              <div className="flex gap-2" style={{ paddingTop: 4 }}>
                {LOADING_STAGES.map((s, i) => {
                  const active = s === loadingPhrase;
                  const done   = LOADING_STAGES.indexOf(loadingPhrase) > i;
                  return (
                    <motion.div key={s}
                      animate={{ opacity: done ? 0.3 : active ? 1 : 0.15, scale: active ? 1.15 : 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: active ? 20 : 6, height: 6, borderRadius: 3,
                        background: active ? "#a8904e" : "#3d3018", transition: "width 0.3s ease" }} />
                  );
                })}
              </div>

              <p style={{ fontSize: 13, color: "#4a3a1e", fontWeight: 300 }}>
                This takes just a moment.
              </p>
            </motion.div>

          ) : story ? (
            <motion.div key="story"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col gap-5">

              {/* Post type badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  padding: "4px 12px", borderRadius: 20, display: "inline-block",
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
                  color: "#a8904e", background: "rgba(168,144,78,0.1)", border: "1px solid rgba(200,180,126,0.2)",
                }}>
                  {story.postType}
                </div>
                <div style={{ fontSize: 10, color: "#3d3018" }}>
                  {story.scene}
                </div>
              </div>

              {/* Primary caption */}
              <div className="flex flex-col gap-2">
                <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2.5px" }}>
                  Caption
                </div>
                <textarea
                  value={story.caption}
                  onChange={e => setStory(prev => prev ? { ...prev, caption: e.target.value } : prev)}
                  rows={4}
                  className="w-full resize-none focus:outline-none"
                  style={{
                    fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0",
                    lineHeight: 1.7, background: "rgba(13,31,13,0.5)",
                    border: "1px solid rgba(200,180,126,0.1)", borderRadius: 14,
                    padding: "14px 16px",
                  }}
                />
              </div>

              {/* Alt caption */}
              <div className="flex flex-col gap-2">
                <div style={{ fontSize: 9, color: "#6a5528", textTransform: "uppercase", letterSpacing: "2.5px" }}>
                  Alternate caption
                </div>
                <textarea
                  value={story.altCaption}
                  onChange={e => setStory(prev => prev ? { ...prev, altCaption: e.target.value } : prev)}
                  rows={2}
                  className="w-full resize-none focus:outline-none"
                  style={{
                    fontFamily: "Georgia, serif", fontSize: 14, color: "#a8906a",
                    lineHeight: 1.65, background: "rgba(13,31,13,0.4)",
                    border: "1px solid rgba(200,180,126,0.07)", borderRadius: 12,
                    padding: "12px 14px", fontStyle: "italic",
                  }}
                />
              </div>

              {/* Image prompt */}
              <div className="flex flex-col gap-2">
                <div style={{ fontSize: 9, color: "#3d3018", textTransform: "uppercase", letterSpacing: "2.5px" }}>
                  Image prompt
                </div>
                <div style={{
                  padding: "12px 14px", borderRadius: 12, fontSize: 12,
                  color: "#4a3a1e", lineHeight: 1.65,
                  background: "rgba(5,12,5,0.5)", border: "1px solid rgba(200,180,126,0.05)",
                }}>
                  {story.imagePrompt}
                </div>
              </div>

            </motion.div>
          ) : null}
        </AnimatePresence>

      </main>

      {/* ── CTA ── */}
      <motion.div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 py-4"
        style={{ background: "rgba(5,15,5,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)", paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}>
        <div className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(200,180,126,0.12), transparent)" }} />
        <motion.button
          onClick={handleContinue}
          disabled={generating || !story}
          className="w-full flex items-center justify-center font-semibold text-[#f5f0e8] relative overflow-hidden disabled:opacity-40"
          style={{ padding: "17px 22px", borderRadius: 16, fontSize: 15, background: "linear-gradient(175deg, rgba(46,110,46,0.96) 0%, rgba(33,82,33,1) 100%)", border: "1px solid rgba(109,188,109,0.16)", boxShadow: "0 4px 24px rgba(5,15,5,0.55), 0 0 40px rgba(45,125,45,0.1)" }}
          whileTap={{ scale: 0.97 }}>
          <span style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
          {generating ? "Writing…" : "Ready to share"}
        </motion.button>
      </motion.div>
    </div>
  );
}
