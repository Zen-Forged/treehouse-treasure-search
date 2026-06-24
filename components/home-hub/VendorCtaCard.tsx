// components/home-hub/VendorCtaCard.tsx
// Home Hub — vendor-acquisition CTA card (Arc 2; docs/home-hub-design.md D12).
// Gold-accented promo card linking to the vendor request form. Gold ties it to
// the Vendors column in the Advantage grid. Shares copy lineage with the
// session-201 empty-mall "Request a digital booth →" CTA. project_vendor_value_
// first_prioritization — vendors are the paying audience.

"use client";

import Link from "next/link";
import { PiStorefrontBold } from "react-icons/pi";
import { v2, FONT_CORMORANT, FONT_LORA, FONT_INTER } from "@/lib/tokens";
import { HUB_GOLD, HUB_GOLD_TEXT } from "./palette";

interface Props {
  href?: string;
  photoUrl?: string | null;
}

export default function VendorCtaCard({ href = "/vendor-request", photoUrl }: Props) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        display:        "flex",
        alignItems:     "stretch",
        background:     "linear-gradient(100deg, rgba(176,137,44,0.12), rgba(176,137,44,0.03))",
        border:         "1px solid rgba(176,137,44,0.28)",
        borderRadius:   16,
        overflow:       "hidden",
      }}
    >
      <div style={{ flex: 1, padding: "16px 16px 16px 17px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 42, height: 42, borderRadius: 12, flex: "none",
            background: HUB_GOLD, color: "#FBF4E2", fontSize: 19,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <PiStorefrontBold />
        </div>
        <div>
          <h4 style={{ fontFamily: FONT_CORMORANT, fontWeight: 600, fontSize: 18, color: v2.text.primary, margin: 0 }}>
            Have a booth? Join Treehouse.
          </h4>
          <p style={{ fontFamily: FONT_LORA, fontSize: 11.5, color: v2.text.secondary, lineHeight: 1.4, margin: "3px 0 0" }}>
            List your finds and reach local shoppers before they visit the mall.
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontFamily: FONT_INTER, fontSize: 12, fontWeight: 700, color: HUB_GOLD_TEXT }}>
            Request a digital booth <span style={{ fontSize: 14 }}>→</span>
          </span>
        </div>
      </div>
      {photoUrl && (
        <div style={{ width: 104, flex: "none", position: "relative", overflow: "hidden", background: "linear-gradient(150deg,#c9b27e,#9c8654)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
    </Link>
  );
}
