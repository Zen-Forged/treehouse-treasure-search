// lib/postStore.ts
// In-memory store for the vendor post flow with sessionStorage persistence.
//
// On iPhone, taking a photo can trigger a page reload that wipes in-memory state.
// We persist the draft to sessionStorage as a fallback so the preview page
// can recover it even after a navigation/reload event.
//
// Cleared explicitly after publish.
//
// Session 62 — expanded to carry tag-flow state:
//   - extractionRan: "success" | "error" | "skip" | undefined
//       undefined = legacy entry path (e.g. direct deep-link to /post/preview)
//       "skip" = vendor explicitly skipped the tag step
//       "success" = /api/extract-tag returned source:"claude"
//       "error" = /api/extract-tag returned source:"mock" (no-key/error/parse)
//   - extractedTitle / extractedPrice — from tag, used to prefill on /post/preview
//       and signal which fields wear the "from tag" badge
//   - captionTitle / captionText / captionFailed — pre-fetched in parallel
//       on /post/tag so /post/preview lands with everything ready (skip flow
//       still fires /api/post-caption on /post/preview mount as today)
//
// The expanded shape is fully backward-compatible: the v0.2 set/get pattern
// still works for the skip flow and any direct entry that only writes
// imageDataUrl. /post/preview branches on extractionRan to decide whether to
// fire /api/post-caption itself.

const SESSION_KEY = "treehouse_post_draft";

export type ExtractionStatus = "success" | "error" | "skip";

export interface PostDraft {
  imageDataUrl: string;

  // Tag flow only — populated by /post/tag before redirecting to /post/preview
  extractionRan?:   ExtractionStatus;
  extractedTitle?:  string;            // "" when title-area unreadable
  extractedPrice?:  number | null;     // null when price unreadable or absent
  tagImageDataUrl?: string;            // raw tag photo, surfaced on /post/preview

  // Caption pre-fetch (tag flow only — skip flow fires post-caption on
  // /post/preview mount as today)
  captionTitle?:   string;
  captionText?:    string;
  captionTags?:    string[];           // 5-6 lowercase tags from /api/post-caption (R16)
  captionFailed?:  boolean;            // true when post-caption returned source:"mock"
}

let draft: PostDraft | null = null;

export const postStore = {
  // ── set: full-shape write (used by /post/tag) ─────────────────────
  set(next: PostDraft) {
    draft = next;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch {}
  },

  // ── setImage: minimal-shape write (back-compat for /my-shelf path) ─
  // Writes ONLY imageDataUrl. Leaves extractionRan undefined so
  // /post/preview falls through to today's behavior. Used when /post/tag
  // is bypassed (legacy entry / direct deep-link).
  setImage(imageDataUrl: string) {
    draft = { imageDataUrl };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft)); } catch {}
  },

  get(): PostDraft | null {
    if (draft) return draft;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        // Back-compat: pre-session-62 entries were stored as a bare string
        // (the imageDataUrl). Detect and migrate on read.
        if (saved.startsWith("data:image/")) {
          draft = { imageDataUrl: saved };
          return draft;
        }
        try {
          const parsed = JSON.parse(saved) as PostDraft;
          if (parsed && typeof parsed.imageDataUrl === "string") {
            draft = parsed;
            return draft;
          }
        } catch {}
      }
    } catch {}
    return null;
  },

  clear() {
    draft = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  },
};
