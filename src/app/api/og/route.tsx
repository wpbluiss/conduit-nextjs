import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 630;

const BG = "#0A0908";
const EMBER = "#ff8a3d";
const TEXT_PRIMARY = "#F5F1EE";
const TEXT_MUTED = "#8A8480";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Praxis — Your AI-powered business team";
  const description =
    searchParams.get("description") ??
    "Voice, sales, engineering, ops, finance — running 24/7.";

  let fontData: ArrayBuffer;
  try {
    const buf = await readFile(
      join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf"),
    );
    fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return new Response("Font load failed", { status: 500 });
  }

  let semiBoldData: ArrayBuffer | undefined;
  try {
    const buf = await readFile(
      join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf"),
    );
    semiBoldData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    semiBoldData = undefined;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: BG,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "Geist",
        }}
      >
        {/* Top ember accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: EMBER,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: EMBER,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: TEXT_PRIMARY,
            }}
          >
            PRAXIS
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: TEXT_MUTED,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 16, color: TEXT_MUTED, letterSpacing: "0.04em" }}>
            conduitai.io
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,138,61,0.12)",
              borderRadius: 20,
              padding: "8px 18px",
              border: `1px solid rgba(255,138,61,0.25)`,
            }}
          >
            <span style={{ fontSize: 14, color: EMBER, fontWeight: 600 }}>
              AI workforce platform
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        {
          name: "Geist",
          data: fontData,
          style: "normal" as const,
          weight: 400 as const,
        },
        ...(semiBoldData
          ? [
              {
                name: "Geist",
                data: semiBoldData,
                style: "normal" as const,
                weight: 600 as const,
              },
            ]
          : []),
      ],
    },
  );
}
