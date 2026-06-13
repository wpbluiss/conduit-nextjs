import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "signup_started",
  "signup_completed",
  "first_ai_message_sent",
  "paywall_viewed",
  "checkout_clicked",
  "upgrade_initiated",
  "downgrade_clicked",
  "portal_opened",
]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : null;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: "unknown_event" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 200) : null;

  // Strip any accidental PII — only allow a safe subset of property keys.
  const SAFE_PROP_KEYS = new Set(["tier_id", "topup_id", "from_tier", "to_tier", "reason", "employee", "referrer"]);
  const rawProps = body.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
    ? body.properties as Record<string, unknown>
    : {};
  const properties: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawProps)) {
    if (SAFE_PROP_KEYS.has(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      properties[k] = v;
    }
  }

  // Resolve account_id from session if available (best-effort, nullable).
  let accountId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) accountId = user.id;
  } catch {
    // unauthenticated requests are fine
  }

  const admin = createSupabaseAdminClient();
  await admin.from("conduit_analytics_events").insert({
    event,
    account_id: accountId,
    path,
    properties: Object.keys(properties).length > 0 ? properties : null,
  });

  return NextResponse.json({ ok: true });
}
