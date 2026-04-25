// app/opener-preview/page.tsx
//
// Dev-only preview route for the TreehouseOpener animation. Accessible at
// /opener-preview. Always plays the opener (does NOT respect the
// localStorage `treehouse_opener_seen_v1` flag from the live home page).
// "Replay opener" button forces a remount via key change for iteration.

"use client";

import { useState } from "react";
import TreehouseOpener from "@/components/TreehouseOpener";

export default function OpenerPreviewPage() {
  const [opened, setOpened] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  function replay() {
    setOpened(false);
    setReplayKey((k) => k + 1);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4EFE6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily: "Georgia, serif",
        padding: 24,
      }}
    >
      <h1
        style={{
          fontSize: 32,
          color: "#1F3D2B",
          margin: 0,
          fontWeight: 500,
          letterSpacing: "-0.005em",
        }}
      >
        Treehouse Finds
      </h1>
      <p
        style={{
          color: "#1F3D2B",
          opacity: 0.6,
          margin: 0,
          fontStyle: "italic",
        }}
      >
        Welcome home.
      </p>

      <button
        onClick={replay}
        style={{
          marginTop: 24,
          padding: "12px 28px",
          background: "#1F3D2B",
          color: "#F4EFE6",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          letterSpacing: "0.1em",
          cursor: "pointer",
          fontFamily: "inherit",
          textTransform: "lowercase",
        }}
      >
        Replay opener
      </button>

      <p
        style={{
          marginTop: 8,
          color: "#1F3D2B",
          opacity: 0.45,
          fontSize: 12,
          fontFamily:
            '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif',
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Dev preview — does not respect the first-visit-only flag. Tap anywhere
        on the opener to skip mid-animation.
      </p>

      {!opened && (
        <TreehouseOpener
          key={replayKey}
          onFinish={() => setOpened(true)}
        />
      )}
    </main>
  );
}
