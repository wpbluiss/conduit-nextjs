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
          background: "#0A0908",
          color: "#F5F1EA",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
          /* Soft ember gradient to maintain brand identity without image assets */
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,138,61,0.12), transparent 70%)",
        }}
      >
        {/* Wordmark — inline text since next/image is unavailable at this level */}
        <p
          style={{
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#FF8A3D",
            marginBottom: "32px",
          }}
        >
          Praxis
        </p>

        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8C8884",
            marginBottom: "16px",
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
          An unexpected error occurred. Reload to try again — your work is
          safe.
        </p>

        <button
          onClick={reset}
          style={{
            background: "#FF8A3D",
            color: "#0A0908",
            border: "none",
            borderRadius: "12px",
            padding: "12px 28px",
            fontSize: "14px",
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
