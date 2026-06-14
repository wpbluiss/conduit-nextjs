import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// POST /api/conduit/push/subscribe — save a push subscription
// DELETE /api/conduit/push/subscribe — remove a push subscription

export async function POST(req: Request) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: { endpoint?: string; keys?: { p256dh: string; auth: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("conduit_push_subscriptions")
    .upsert(
      {
        account_id: account.id,
        endpoint: body.endpoint,
        keys: body.keys,
      },
      { onConflict: "account_id,endpoint", ignoreDuplicates: true },
    );

  if (error) {
    console.error("push subscribe upsert", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("conduit_push_subscriptions")
    .delete()
    .eq("account_id", account.id)
    .eq("endpoint", body.endpoint);

  return NextResponse.json({ ok: true });
}
