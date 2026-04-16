// lib/authFetch.ts
// Frontend helper — wraps fetch() to attach the Supabase access token
// as `Authorization: Bearer <token>` on outgoing requests.
//
// Used by any client component calling a gated API route (`/api/admin/*`,
// `/api/setup/*`). Matches the requireAuth/requireAdmin pattern in
// `lib/adminAuth.ts` (Option B — bearer header, no cookie bridge).
//
// Usage:
//   const res = await authFetch("/api/admin/vendor-requests");
//   const res = await authFetch("/api/admin/vendor-requests", {
//     method: "POST",
//     body: JSON.stringify({ action: "approve", requestId }),
//   });

import { supabase } from "./supabase";

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
