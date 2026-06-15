import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Praxis — Nine AI Specialists, Zero Payroll";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C0B09",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ember radial bottom */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 420,
            background:
              "radial-gradient(ellipse at center bottom, rgba(255,138,61,0.22) 0%, transparent 65%)",
            filter: "blur(60px)",
            display: "flex",
          }}
        />

        {/* Indigo top-right accent */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 480,
            height: 360,
            background:
              "radial-gradient(ellipse at top right, rgba(91,99,232,0.16) 0%, transparent 65%)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Noise texture overlay (subtle grain) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 1,
            padding: "0 80px",
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 48,
            }}
          >
            {/* Praxis mark — two overlapping circles */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="15" cy="22" r="13" fill="#FF8A3D" fillOpacity="0.9" />
              <circle cx="29" cy="22" r="13" fill="#5B63E8" fillOpacity="0.9" />
              <ellipse
                cx="22"
                cy="22"
                rx="7"
                ry="13"
                fill="#7C6ED8"
                fillOpacity="0.85"
              />
            </svg>
            <span
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "#F5EFE6",
              }}
            >
              Praxis
            </span>
            <span
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 13,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#847A6E",
                marginLeft: 4,
                marginTop: 2,
              }}
            >
              by Conduit AI
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "system-ui, -apple-system, Georgia, serif",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "#F5EFE6",
              textAlign: "center",
              margin: 0,
              maxWidth: 900,
            }}
          >
            Nine AI Specialists.
            <br />
            <span style={{ color: "#FF8A3D" }}>Zero Payroll.</span>
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 22,
              color: "#8C8884",
              marginTop: 28,
              marginBottom: 0,
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            Your AI workforce — marketing, sales, engineering, finance, and more —
            running 24/7.
          </p>

          {/* Divider dot row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 48,
              alignItems: "center",
            }}
          >
            {["Marketing", "Sales", "Engineering", "Finance", "Legal"].map(
              (dept) => (
                <div
                  key={dept}
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#5A5248",
                    padding: "4px 12px",
                    border: "1px solid #2A2520",
                    borderRadius: 99,
                    display: "flex",
                  }}
                >
                  {dept}
                </div>
              ),
            )}
            <div
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#5A5248",
                padding: "4px 12px",
                display: "flex",
              }}
            >
              + 4 more
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 14,
            color: "#5A5248",
            letterSpacing: "0.04em",
            display: "flex",
          }}
        >
          conduitai.io
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
