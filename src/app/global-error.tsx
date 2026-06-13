"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          background: "#0C0B09",
          color: "#F5F1EA",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Ember radial — hardcoded because global-error renders before layout CSS */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,138,61,0.12) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Praxis mark — plain img tag, next/image unavailable in global-error */}
        <img
          src="/praxis-mark.png"
          alt=""
          aria-hidden
          style={{
            width: 32,
            height: 49,
            marginBottom: 24,
            opacity: 0.85,
            filter: "drop-shadow(0 0 16px rgba(255,138,61,0.4))",
          }}
        />

        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8C8884",
            marginBottom: 12,
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Unexpected error
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#8C8884",
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          An unexpected error occurred. Reload to try again — your work is
          safe.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#FF8A3D",
            color: "#0A0908",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
