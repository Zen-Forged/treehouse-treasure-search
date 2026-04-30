// app/contact/page.tsx
// R7 (Wave 1 Task 6, session 91) — Contact us page, v0 minimal.
//
// Three category rows (Question / Feedback / Bug report) — each is a
// `mailto:` link with a subject prefix. No backend, no form. iOS hands off
// to Mail.app instantly; Android to the default mail client; desktop
// depends on the user's mail-handler config (silent fallback acceptable
// for the mobile-first audience).
//
// Frame C (minimal text rows) per design pick — see
// docs/mockups/contact-page-v1.html.
//
// Discoverability: linked from /login below the "First time? An account…"
// line. Footer-everywhere placement is post-Wave-1 polish.

"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import StickyMasthead from "@/components/StickyMasthead";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

// Public-facing contact address. Kept distinct from NEXT_PUBLIC_ADMIN_EMAIL,
// which gates admin authentication and must continue to match the actor's
// sign-in email — conflating the two would lock the admin out of /admin.
const CONTACT_EMAIL = "info@kentuckytreehouse.com";

const categories = [
  { label: "Ask a question",  subject: "Question: " },
  { label: "Send feedback",   subject: "Feedback: " },
  { label: "Report a bug",    subject: "Bug report: " },
] as const;

function buildMailto(subjectPrefix: string): string {
  const params = new URLSearchParams({ subject: subjectPrefix });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

export default function ContactPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StickyMasthead
        left={
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </button>
        }
        right={null}
      />

      <div style={{ flex: 1, padding: "40px 28px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Mail size={44} strokeWidth={1.4} style={{ color: v1.inkPrimary }} />
        </div>

        <h1
          style={{
            fontFamily: FONT_LORA,
            fontSize: 28,
            color: v1.inkPrimary,
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "0 0 8px",
          }}
        >
          Reach out
        </h1>
        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMuted,
            textAlign: "center",
            lineHeight: 1.55,
            margin: "0 auto 28px",
            maxWidth: 300,
          }}
        >
          Pick the option that fits and we&apos;ll get back to you.
        </p>

        <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column" }}>
          {categories.map((cat, idx) => (
            <a
              key={cat.label}
              href={buildMailto(cat.subject)}
              aria-label={`${cat.label} — opens your email app`}
              style={{
                padding: "16px 4px",
                borderTop: idx === 0 ? `1px solid ${v1.inkHairline}` : "none",
                borderBottom: `1px solid ${v1.inkHairline}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_LORA,
                  fontSize: 17,
                  color: v1.inkPrimary,
                }}
              >
                {cat.label}
              </span>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: FONT_LORA,
                  fontSize: 17,
                  color: v1.inkFaint,
                }}
              >
                →
              </span>
            </a>
          ))}
        </div>

        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 12,
            color: v1.inkFaint,
            textAlign: "center",
            lineHeight: 1.6,
            margin: "24px auto 0",
            maxWidth: 280,
          }}
        >
          Opens your email app with our address pre-filled.
        </p>
      </div>
    </div>
  );
}
