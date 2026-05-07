import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { VERTICALS } from "@/lib/lead-sources/types";

export const runtime = "nodejs";

const VALID_STATUSES = ["new", "contacted", "qualified", "dead"];

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const allowed =
    Boolean(account.internal_account) || tier.allowedEmployees.includes("sales");
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const vertical = sp.get("vertical");
  const city = sp.get("city");
  const status = sp.get("status");
  const minIntent = parseInt(sp.get("min_intent_score") ?? "0", 10) || 0;

  let q = supabase
    .from("sales_leads")
    .select(
      "id, source, business_name, vertical, city, state, phone, website, address, lat, lng, rating, review_count, intent_signal_text, intent_signal_score, status, enriched, created_at, updated_at",
    )
    .eq("account_id", account.id)
    .gte("intent_signal_score", minIntent)
    .order("intent_signal_score", { ascending: false })
    .order("business_name", { ascending: true })
    .limit(200);

  if (vertical && (VERTICALS as string[]).includes(vertical)) {
    q = q.eq("vertical", vertical);
  }
  if (city) q = q.eq("city", city);
  if (status && VALID_STATUSES.includes(status)) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ leads: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const { error } = await supabase
    .from("sales_leads")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("account_id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
