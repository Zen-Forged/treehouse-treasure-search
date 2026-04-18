// lib/imageUpload.ts
// Canonical image-upload helpers for the ecosystem layer.
// This is the SINGLE SOURCE OF TRUTH — do not duplicate these helpers.
//
// CONTRACTS (per CLAUDE.md session-13 commitments):
//
//   compressImage(dataUrl, maxWidth?, quality?) — resize + JPEG re-encode a
//     base64 data URL in the browser via canvas. Safe for large photos from
//     iPhone camera rolls. On any error (decode failure, canvas blocked),
//     returns the original dataUrl unchanged — non-fatal.
//
//   uploadPostImageViaServer(base64DataUrl, vendorId) — POST to
//     /api/post-image (service-role, bypasses RLS). THROWS on failure.
//     Callers MUST wrap in try/catch and abort the post/update on throw —
//     NEVER write a post row with image_url: null. See the deprecation
//     banner on lib/posts.ts:uploadPostImage for the original bug.
//
// Related server route: app/api/post-image/route.ts — accepts
//   { base64DataUrl, vendorId }, returns { url } on 200 or { error } on 4xx/5xx.

// ─── compressImage ────────────────────────────────────────────────────────────
// Resizes the longest edge to maxWidth while preserving aspect ratio, then
// re-encodes as JPEG at the given quality. Runs entirely in the browser.
//
// Defaults match the proven settings used on /my-shelf hero upload:
//   maxWidth = 1400, quality = 0.82 — yields ~150–400 KB for typical iPhone
//   photos, well under the 12 MB server guard.

export function compressImage(
  dataUrl: string,
  maxWidth: number = 1400,
  quality:  number = 0.82,
): Promise<string> {
  return new Promise(resolve => {
    try {
      const img = new window.Image();
      img.onload = () => {
        try {
          const scale  = Math.min(1, maxWidth / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

// ─── uploadPostImageViaServer ─────────────────────────────────────────────────
// Uploads a base64 data URL to Supabase Storage via the server route
// /api/post-image (which uses the service role key to bypass the anon-role
// bucket visibility issue that makes lib/posts.ts:uploadPostImage silently
// fail). Returns the public URL on success.
//
// THROWS on any failure path — HTTP non-200, missing url in response body,
// network error, malformed inputs. Callers MUST try/catch and abort the
// post/update write on throw. See CLAUDE.md "Image uploads" section.

export async function uploadPostImageViaServer(
  base64DataUrl: string,
  vendorId:      string,
): Promise<string> {
  if (!base64DataUrl) {
    throw new Error("uploadPostImageViaServer: base64DataUrl is required");
  }
  if (!vendorId) {
    throw new Error("uploadPostImageViaServer: vendorId is required");
  }

  let res: Response;
  try {
    res = await fetch("/api/post-image", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ base64DataUrl, vendorId }),
    });
  } catch (networkErr) {
    throw new Error(
      `uploadPostImageViaServer: network error — ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  let body: { url?: string; error?: string } = {};
  try {
    body = await res.json();
  } catch {
    // Fall through — we'll raise with the status code below.
  }

  if (!res.ok) {
    const reason = body?.error ?? `HTTP ${res.status}`;
    throw new Error(`uploadPostImageViaServer: upload failed — ${reason}`);
  }

  if (!body?.url) {
    throw new Error("uploadPostImageViaServer: server returned 200 without a url field");
  }

  return body.url;
}
