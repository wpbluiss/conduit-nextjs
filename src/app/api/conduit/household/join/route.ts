import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let code: string;
  try {
    const body = await request.json();
    code = String(body?.code ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  // Call the security-definer RPC — it handles membership dedup and
  // single-use code invalidation atomically.
  const { data, error } = await supabase.rpc("fin_join_household", {
    p_code: code,
  });

  if (error) {
    if (error.message.includes("already_member")) {
      return NextResponse.json(
        { error: "already_member", message: "You already belong to a household." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "join_failed", message: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "invalid_code", message: "This invite code is invalid or has already been used." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, household_id: data });
}
