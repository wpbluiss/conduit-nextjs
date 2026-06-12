// Atlas (Vapi) server endpoint — forwards to the canonical vapi-context route.
// The Vapi assistant is configured to call https://www.conduitai.io/api/vapi;
// this keeps that URL working while the canonical implementation lives at
// /api/conduit/vapi-context.
import { NextRequest } from "next/server";
import { GET as vapiContextGet } from "@/app/api/conduit/vapi-context/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { vapiContextGet as GET };

// Vapi also POSTs server-message webhooks to the configured server URL.
// For now, acknowledge all events so Vapi does not retry and block the call.
export async function POST(_req: NextRequest) {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
