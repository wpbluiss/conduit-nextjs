import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";

export const dynamic = "force-dynamic";

const MAX_CUSTOM_SPECIALISTS = 10;

export interface CustomSpecialist {
  id: string;
  name: string;
  role: string;
  color: string;
  system_prompt: string;
  created_at: string;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_custom_specialists")
    .select("id, name, role, color, system_prompt, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ specialists: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // Gate: custom specialists require pro+ tier
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  if (!internal && tier.id === "free") {
    return NextResponse.json(
      { error: "upgrade_required", message: "Custom specialists require a Pro or Enterprise plan." },
      { status: 403 },
    );
  }

  let body: { name?: string; role?: string; color?: string; system_prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = body.name?.trim();
  const role = body.role?.trim() ?? "";
  const color = body.color?.trim() ?? "#6366f1";
  const system_prompt = body.system_prompt?.trim();

  if (!name || name.length > 64) {
    return NextResponse.json({ error: "name_invalid", message: "Name must be 1–64 characters." }, { status: 422 });
  }
  if (!system_prompt || system_prompt.length > 5000) {
    return NextResponse.json({ error: "prompt_invalid", message: "System prompt must be 1–5000 characters." }, { status: 422 });
  }
  if (role.length > 128) {
    return NextResponse.json({ error: "role_invalid" }, { status: 422 });
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: "color_invalid" }, { status: 422 });
  }

  // Enforce per-account cap
  const { count } = await supabase
    .from("conduit_custom_specialists")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);

  if ((count ?? 0) >= MAX_CUSTOM_SPECIALISTS) {
    return NextResponse.json(
      { error: "limit_reached", message: `Maximum of ${MAX_CUSTOM_SPECIALISTS} custom specialists per workspace.` },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("conduit_custom_specialists")
    .insert({ account_id: account.id, name, role, color, system_prompt })
    .select("id, name, role, color, system_prompt, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ specialist: data }, { status: 201 });
}
