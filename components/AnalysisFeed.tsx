// components/AnalysisFeed.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisMessage, AnalysisState } from "@/types/analysis";

interface AnalysisFeedProps {
  state: AnalysisState;
}

export function AnalysisFeed({ state }: AnalysisFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state.messages.length]);

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      <AnimatePresence initial={false}>
        {state.messages.map((msg, i) => (
          <FeedItem key={msg.id} msg={msg} isLast={i === state.messages.length - 1} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

function FeedItem({
  msg,
  isLast,
}: {
  msg: AnalysisMessage;
  isLast: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex gap-3 py-3"
      style={{
        borderBottom: !isLast ? "1px solid rgba(200,180,126,0.05)" : "none",
        opacity: msg.status === "active" ? 1 : msg.status === "complete" && !isLast ? 0.55 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center gap-0 pt-1 flex-shrink-0">
        <StatusDot status={msg.status} />
        {!isLast && (
          <div style={{ width: 1, flex: 1, marginTop: 6, background: "rgba(200,180,126,0.06)", minHeight: 16 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div style={{ fontSize: 14, fontWeight: 500, color: msg.status === "active" ? "#d4c9b0" : "#f5f0e8", lineHeight: 1.3, letterSpacing: "0.05px" }}>
          {msg.title}
          {msg.status === "active" && <PulsingDots />}
        </div>
        {msg.detail && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ fontSize: 12, color: "#7a6535", marginTop: 3, lineHeight: 1.5, letterSpacing: "0.05px" }}
          >
            {msg.detail}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: AnalysisMessage["status"] }) {
  if (status === "complete") {
    return (
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: "rgba(168,144,78,0.6)",
        boxShadow: "0 0 6px rgba(168,144,78,0.2)",
      }} />
    );
  }
  if (status === "active") {
    return (
      <motion.div
        style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: "rgba(109,188,109,0.7)",
        }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: "rgba(50,50,50,0.5)",
    }} />
  );
}

function PulsingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, marginLeft: 6, verticalAlign: "middle" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 3, height: 3, borderRadius: "50%", display: "inline-block", background: "#6a5528" }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
