// components/MastheadShareButton.tsx
// Share-this-page button for the masthead right slot (session 90).
//
// Lives as the default StickyMasthead right-slot affordance so every page
// in the app carries a "share this URL for sign-up" entry point. Pages
// that pass their own `right` prop opt out — /find/[id], /shelf/[slug],
// /my-shelf already have context-specific share affordances and keep
// theirs.
//
// Behavior:
//   - Tap → navigator.share() with current URL + page title
//   - Fallback when navigator.share unavailable → clipboard write + brief
//     "Copied" confirmation toast on the button
//   - User dismissal of the share sheet is silent (not an error)

"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { v1 } from "@/lib/tokens";

export default function MastheadShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = document.title || "Treehouse Finds";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title });
        return;
      } catch (err) {
        // AbortError = user dismissed the share sheet — silent.
        const name = (err as { name?: string } | null)?.name;
        if (name === "AbortError") return;
        // Fall through to clipboard fallback on any other error.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked — surface nothing; the user can copy manually.
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this page"
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: v1.iconBubble,
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Send
        size={22}
        strokeWidth={1.7}
        style={{ color: copied ? "#1e4d2b" : v1.green }}
      />
    </button>
  );
}
