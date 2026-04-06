// lib/postStore.ts
// Simple in-memory store for the vendor post flow.
// Survives client-side navigation (router.push) without the size limits
// or Safari quirks of sessionStorage. Cleared after publish.

interface PostDraft {
  imageDataUrl: string;
}

let draft: PostDraft | null = null;

export const postStore = {
  set(imageDataUrl: string) {
    draft = { imageDataUrl };
  },
  get(): PostDraft | null {
    return draft;
  },
  clear() {
    draft = null;
  },
};
