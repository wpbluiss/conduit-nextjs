"use client";

import "./globals.css";

interface Props {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

// global-error.tsx renders outside the normal layout (no CSS vars / fonts from layout.tsx).
// Uses hardcoded brand tokens for reliability. Framer-motion omitted here to keep
// the fallback lean — if we're in global-error, the JS bundle may be partially broken.
export default function GlobalError({ unstable_retry }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0908",
          color: "#F5F1EA",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        {/* Ember aura */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,138,61,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: 360 }}>
          {/* Praxis mark — inline to avoid next/image outside layout */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/praxis-mark.png"
            alt="Praxis"
            width={24}
            height={36}
            style={{ display: "block", margin: "0 auto 40px" }}
          />

          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#8C8884",
              marginBottom: "16px",
            }}
          >
            Unexpected error
          </p>

          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#8C8884",
              maxWidth: "300px",
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Reload to try again — your work is
            safe.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={unstable_retry}
              style={{
                background: "#FF8A3D",
                color: "#0A0908",
                border: "none",
                borderRadius: "14px",
                padding: "13px 28px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 24px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "14px",
                color: "#F5F1EA",
                textDecoration: "none",
                letterSpacing: "-0.005em",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
