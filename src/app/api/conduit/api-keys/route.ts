import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateKey(): { key: string; hash: string; preview: string } {
  const secret = randomBytes(32).toString("base64url");
  const key = `prx_${secret}`;
  return { key, hash: hashKey(key), preview: `prx_${secret.slice(0, 6)}…` };
}

// GET /api/conduit/api-keys — list active + revoked keys (no hashes returned)
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { data, error } = await supabase
    .from("conduit_api_keys")
    .select("id, name, key_preview, last_used_at, created_at, revoked_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ keys: data ?? [] });
}

// POST /api/conduit/api-keys — generate a new key (shown once)
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "name_too_long" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Limit to 20 active keys per account
  const { count } = await supabase
    .from("conduit_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .is("revoked_at", null);

  if ((count ?? 0) >= 20) {
    return NextResponse.json({ error: "key_limit_reached" }, { status: 409 });
  }

  const { key, hash, preview } = generateKey();

  const { data: newKey, error } = await supabase
    .from("conduit_api_keys")
    .insert({
      account_id: account.id,
      name,
      key_hash: hash,
      key_preview: preview,
    })
    .select("id, name, key_preview, created_at")
    .single();

  if (error || !newKey) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Return the plain-text key exactly once — never stored
  return NextResponse.json({ key, meta: newKey }, { status: 201 });
}
