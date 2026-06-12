// Atlas (Vapi) server endpoint — proxies to the canonical vapi-context logic.
// The Vapi assistant is configured to call https://www.conduitai.io/api/vapi;
// this keeps that URL working while both routes share one implementation.
import { type NextRequest } from "next/server";
import { checkVapiSecret, getVapiContext, vapiUnauthorized } from "@/lib/praxis/vapi-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkVapiSecret(req)) return vapiUnauthorized();
  return getVapiContext();
}

// Vapi also POSTs server-message webhooks to the configured server URL.
// Acknowledge all events so Vapi does not retry and block the call.
export async function POST(_req: NextRequest) {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
