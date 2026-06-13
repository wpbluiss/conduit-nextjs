"use client";

// Root-level layout error fallback. Replaces <html>+<body> so it CANNOT
// import global CSS, next/font, or anything that depends on the normal
// document structure. Inline styles only. No next/image (requires Image
// optimization infra that may be broken when this fires).

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
          background: "#0A0908",
          color: "#F5F1EA",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        {/* Ember mark — inline img avoids next/image dependency */}
        <img
          src="/praxis-mark.png"
          alt="Praxis"
          width={22}
          height={33}
          style={{ marginBottom: "32px", opacity: 0.9 }}
        />

        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8C8884",
            marginBottom: "12px",
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "#F5F1EA",
            marginBottom: "12px",
          }}
        >
          Unexpected error
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#8C8884",
            maxWidth: "320px",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          An unexpected error occurred. Reload to try again — your work is safe.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#5B63E8",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
