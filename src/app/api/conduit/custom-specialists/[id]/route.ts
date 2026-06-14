import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  let body: { name?: string; role?: string; color?: string; system_prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 64) {
      return NextResponse.json({ error: "name_invalid" }, { status: 422 });
    }
    updates.name = name;
  }
  if (body.role !== undefined) {
    const role = body.role.trim();
    if (role.length > 128) return NextResponse.json({ error: "role_invalid" }, { status: 422 });
    updates.role = role;
  }
  if (body.color !== undefined) {
    const color = body.color.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "color_invalid" }, { status: 422 });
    }
    updates.color = color;
  }
  if (body.system_prompt !== undefined) {
    const system_prompt = body.system_prompt.trim();
    if (!system_prompt || system_prompt.length > 5000) {
      return NextResponse.json({ error: "prompt_invalid" }, { status: 422 });
    }
    updates.system_prompt = system_prompt;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conduit_custom_specialists")
    .update(updates)
    .eq("id", id)
    .eq("account_id", account.id)
    .select("id, name, role, color, system_prompt, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ specialist: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_custom_specialists")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
