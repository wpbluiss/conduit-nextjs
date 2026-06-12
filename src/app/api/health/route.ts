import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Explicitly no-cache: smoke tests must probe the live deployment, not a CDN edge cache.
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      // NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA is injected by Vercel at build time.
      // Useful for confirming which commit is actually live when a smoke test fires.
      sha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
