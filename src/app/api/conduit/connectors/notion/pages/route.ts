import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { getNotionToken, searchNotionPages } from "@/lib/connectors/notion";

export const runtime = "nodejs";

// GET /api/conduit/connectors/notion/pages?q=...
// Lists Notion pages accessible by the connected integration.
export async function GET(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const token = await getNotionToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const pages = await searchNotionPages(token.access_token, query);
  const meta = (token.meta as Record<string, unknown>) ?? {};
  const selectedPages = (meta.selected_pages as Array<{ id: string; title: string }>) ?? [];

  return NextResponse.json({ pages, selected_pages: selectedPages });
}
