// app/login/email/page.tsx
// Redirect alias to /login. Shape A (session 115) folded the OTP form into
// /login itself — this route stays as a 30-day alias so existing magic-link
// emails in the wild (which were generated with /login/email/?confirmed=1
// callback URLs) keep working until those emails age out.
//
// Query params (?confirmed=1, ?next=, ?redirect=, ?role=shopper) are
// preserved across the redirect so post-magic-link routing lands correctly.
//
// Retire this file ~30 days after Shape A ships. Tracked as session-115 D6.

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v2 } from "@/lib/tokens";

function LoginEmailRedirectInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/login?${qs}` : "/login");
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v2.bg.main,
        maxWidth: 430,
        margin: "0 auto",
      }}
    />
  );
}

export default function LoginEmailRedirectPage() {
  return (
    <Suspense>
      <LoginEmailRedirectInner />
    </Suspense>
  );
}
