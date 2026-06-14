import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/conduit/push/vapid-key — returns the VAPID public key for
// the browser to use when creating a PushSubscription.
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}
