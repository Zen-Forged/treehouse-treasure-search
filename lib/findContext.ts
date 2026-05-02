// lib/findContext.ts
//
// Phase A (session 100) — context handoff between feed-style entry paths
// (Home / /flagged / /shelf/[slug] / detail-page carousel) and /find/[id].
// /find/[id] reads this on mount to expose prevId/nextId so the user can
// swipe between nearby finds within the same context they were browsing
// (Phase B). Single sessionStorage key, overwritten on each entry tap.
// Per-tab lifetime — sessionStorage scoping is the right shape; the
// context dies with the tab and never leaks across tabs.
//
// Phase A writes + reads only. Phase B uses the prevId/nextId for the
// swipe gesture; Phase C extends write sites to /flagged, /shelf/[slug],
// and the More-from-this-booth carousel.
//
// Phase B QA fix #2 (session 100) — module-scope post cache. Source
// surfaces (Home, eventually /flagged + /shelf/[slug]) populate this on
// data load so /find/[id] can render metadata (post-it, save bubble,
// title, caption, share airplane) synchronously on tap or swipe. Cache
// lifetime = page session (module-scope, lost on full reload). Cleared
// per-id by the edit pages on successful PATCH so the next view sees
// fresh data.

import type { Post } from "@/types/treehouse";

const STORAGE_KEY = "treehouse_find_context";

export type FindRef = {
  id: string;
  image_url: string | null;
  title: string | null;
};

export type FindContext = {
  // Where the user came FROM. Currently informational; Phase B uses
  // it as a sanity check (warn-only) when computing prev/next.
  originPath: string;
  // The ordered list of finds in the user's browsing context, e.g.
  // feed order on Home, save order on /flagged, shelf order on
  // /shelf/[slug]. Carries image_url + title so /find/[id] can
  // pre-warm the preview cache for adjacent ids on first mount
  // without an extra fetch.
  findRefs: FindRef[];
  // Index in findRefs of the find the user just tapped — i.e. the
  // current /find/[id]. prevId/nextId are derived from this.
  cursorIndex: number;
};

export function writeFindContext(ctx: FindContext): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx)); } catch {}
}

export function readFindContext(): FindContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed
      && typeof parsed.originPath === "string"
      && Array.isArray(parsed.findRefs)
      && typeof parsed.cursorIndex === "number"
    ) return parsed as FindContext;
    return null;
  } catch { return null; }
}

// ── Post cache (Phase B QA fix #2) ───────────────────────────────────────
// Module-scope; survives across the swipe-driven router.replace boundary
// (page stays mounted in App Router) AND across feed→detail→back→detail
// trips within a session. Populated by Home loadFeed (whole visible feed
// at once) and /find/[id]'s own fetch effect (per-id on cache miss).
// Cleared per-id by edit pages on successful PATCH.
//
// Source: requires the FULL Post shape (vendor.user_id + vendor.bio +
// mall.address) — see getFeedPosts in lib/posts.ts which was extended to
// match getPost's SELECT for this reason. A partially-populated cache
// entry would cause /find/[id]'s detectOwnershipAsync + maps link to
// silently misfire.

const postCache = new Map<string, Post>();

export function getPostCache(id: string): Post | undefined {
  return postCache.get(id);
}

export function setPostCache(post: Post): void {
  if (post && post.id) postCache.set(post.id, post);
}

export function clearPostCache(id: string): void {
  postCache.delete(id);
}
