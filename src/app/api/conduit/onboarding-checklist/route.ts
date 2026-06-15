import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const VALID_KEYS = new Set([
  "meet_team",
  "first_project",
  "connect_integration",
  "invite_teammate",
  "command_palette",
  "dismissed",
  // Getting-started sidebar checklist keys
  "gs_msg",
  "gs_connector",
  "gs_template",
  "gs_invite",
  "gs_dismissed",
]);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);
  return NextResponse.json({ checklist: account.onboarding_checklist ?? {} });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, boolean>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const filtered = Object.fromEntries(
    Object.entries(body).filter(([k, v]) => VALID_KEYS.has(k) && typeof v === "boolean"),
  );

  const account = await getOrCreateAccount(supabase, user);
  const next = { ...(account.onboarding_checklist ?? {}), ...filtered };

  const { error } = await supabase
    .from("conduit_accounts")
    .update({ onboarding_checklist: next })
    .eq("id", account.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checklist: next });
}
