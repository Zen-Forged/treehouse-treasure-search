// app/vendors-test/page.tsx
// Arc 4 of login refactor — admin Vendors tab smoke-test page.
//
// Mounts <VendorsTab /> in isolation against paperCream chrome so the
// component can be tap-tested on Vercel preview against real seeded data
// before integration into app/admin/page.tsx (Arc 3.1).
//
// Pattern mirrors /postcard-test (R10) + /search-bar-test (R16) +
// /geolocation-test (R17) — primitive-isolated validation first, integration
// after iPhone QA passes.
//
// Auth: GET /api/admin/vendors is admin-gated server-side; non-admin users
// will see the API's 401/403 error rendered inline by VendorsTab's error
// state. No separate client-side gate needed for a smoke route.
//
// Delete or repurpose once Arc 3.1 mounts <VendorsTab> on /admin under the
// new "Vendors" tab.

"use client";

import * as React from "react";
import Link from "next/link";
import { VendorsTab } from "@/components/admin/VendorsTab";
import { v1 } from "@/lib/tokens";

export default function VendorsTestPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        paddingBottom: 80,
      }}
    >
      {/* Smoke-route header — minimal back link + label */}
      <div
        style={{
          padding: "max(20px, env(safe-area-inset-top, 20px)) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${v1.inkHairline}`,
        }}
      >
        <Link
          href="/admin"
          style={{
            fontSize: 12,
            color: v1.green,
            textDecoration: "none",
          }}
        >
          ← Admin
        </Link>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 14,
            fontWeight: 500,
            color: v1.inkPrimary,
          }}
        >
          Vendors tab — smoke test
        </div>
        <div style={{ width: 56 }} />
      </div>

      <VendorsTab />

      {/* Footer note for smoke-test context */}
      <div
        style={{
          padding: "20px 16px",
          marginTop: 40,
          fontSize: 11,
          color: v1.inkMuted,
          fontStyle: "italic",
          fontFamily: "Lora, Georgia, serif",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Smoke-test surface for Arc 4 (admin Vendors tab). Retires post-Arc-3.1
        once integrated into /admin tab strip.
      </div>
    </div>
  );
}
