// lib/postStore.ts
// In-memory store for the vendor post flow with sessionStorage persistence.
//
// On iPhone, taking a photo can trigger a page reload that wipes in-memory state.
// We persist the imageDataUrl to sessionStorage as a fallback so the preview page
// can recover it even after a navigation/reload event.
//
// Cleared explicitly after publish.

const SESSION_KEY = "treehouse_post_draft";

interface PostDraft {
  imageDataUrl: string;
}

let draft: PostDraft | null = null;

export const postStore = {
  set(imageDataUrl: string) {
    draft = { imageDataUrl };
    // Persist to sessionStorage as insurance against page reload (iPhone camera)
    try { sessionStorage.setItem(SESSION_KEY, imageDataUrl); } catch {}
  },

  get(): PostDraft | null {
    // Return in-memory draft if available
    if (draft) return draft;
    // Recover from sessionStorage (iPhone camera reload scenario)
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        draft = { imageDataUrl: saved };
        return draft;
      }
    } catch {}
    return null;
  },

  clear() {
    draft = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  },
};
