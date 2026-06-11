// GET /api/health — liveness smoke test. Returns 200 with a timestamp.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
