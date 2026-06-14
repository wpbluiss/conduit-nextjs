import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export interface NotificationPrefs {
  product_updates: boolean;
  weekly_digest: boolean;
  build_completion_alerts: boolean;
  low_balance_warning: boolean;
}

const DEFAULTS: NotificationPrefs = {
  product_updates: true,
  weekly_digest: true,
  build_completion_alerts: true,
  low_balance_warning: true,
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);
  const prefs: NotificationPrefs = { ...DEFAULTS, ...account.notification_prefs };

  return NextResponse.json({ prefs });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Partial<NotificationPrefs>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const patch: Partial<NotificationPrefs> = {};
  if (typeof body.product_updates === "boolean") patch.product_updates = body.product_updates;
  if (typeof body.weekly_digest === "boolean") patch.weekly_digest = body.weekly_digest;
  if (typeof body.build_completion_alerts === "boolean") patch.build_completion_alerts = body.build_completion_alerts;
  if (typeof body.low_balance_warning === "boolean") patch.low_balance_warning = body.low_balance_warning;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const merged: NotificationPrefs = { ...DEFAULTS, ...account.notification_prefs, ...patch };

  const { error } = await supabase
    .from("conduit_accounts")
    .update({ notification_prefs: merged, updated_at: new Date().toISOString() })
    .eq("id", account.id);

  if (error) {
    const msg = typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
    // Column may not exist yet if migration 030 hasn't run — soft success.
    if (msg.includes("notification_prefs") || msg.includes("column")) {
      return NextResponse.json({ ok: true, persisted: "pending_migration" });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prefs: merged });
}
