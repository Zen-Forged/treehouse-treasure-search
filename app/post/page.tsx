// app/post/page.tsx
// v1.2 — /post retires as a standalone capture page. It now exists only as a
// redirect shim to /my-shelf?openAdd=1, which preserves any inbound links
// (email templates, bookmarks, older docs) that still point at /post.
//
// Admin impersonation (`?vendor=id` used to hand /my-shelf a different
// identity to post against) is preserved by forwarding the param.
//
// The real capture flow now lives in /my-shelf as a bottom-sheet picker
// (<AddFindSheet>) that hands off to /post/preview once a photo is chosen.
// See docs/design-system-v1.2-build-spec.md §3.
//
// Post-beta this file can be deleted entirely once a sweep confirms no
// production references to /post remain. Keeping it as a thin shim costs
// ~15 lines and avoids 404s during the transition.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PostRedirect() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const vendor = searchParams.get("vendor");
    const qs     = vendor ? `?vendor=${vendor}&openAdd=1` : "?openAdd=1";
    router.replace(`/my-shelf${qs}`);
  }, [router, searchParams]);

  return null;
}

export default function PostPage() {
  return (
    <Suspense>
      <PostRedirect />
    </Suspense>
  );
}
