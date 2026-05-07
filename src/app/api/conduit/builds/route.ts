import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const includeArchived =
    request.nextUrl.searchParams.get("archived") === "1";

  let q = supabase
    .from("conduit_builds")
    .select(
      "id, template_id, build_name, build_slug, status, github_repo_url, vercel_project_id, vercel_deployment_id, live_url, error_message, created_at, archived_at, conversation_id",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (!includeArchived) q = q.is("archived_at", null);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ builds: data });
}
