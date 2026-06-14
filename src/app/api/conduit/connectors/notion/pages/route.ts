import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import {
  getNotionToken,
  searchNotionPages,
  syncNotionPages,
  getNotionCachedPages,
} from "@/lib/connectors/notion";

export const runtime = "nodejs";

// GET — search accessible Notion pages + return currently-selected IDs.
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const token = await getNotionToken(supabase, account.id);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 404 });

  const query = request.nextUrl.searchParams.get("q") ?? "";

  const [pages, cached] = await Promise.all([
    searchNotionPages(token.access_token, query),
    getNotionCachedPages(supabase, account.id),
  ]);

  const selectedIds = ((token.meta as Record<string, unknown>).page_ids as string[] | undefined) ?? [];

  return NextResponse.json({
    pages,
    selectedIds,
    cachedCount: cached.length,
  });
}

// POST — save selected page IDs and trigger a sync.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  let body: { page_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const pageIds = (body.page_ids ?? []).slice(0, 5);

  const token = await getNotionToken(supabase, account.id);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 404 });

  const existingMeta = (token.meta as Record<string, unknown>) ?? {};
  const newMeta = { ...existingMeta, page_ids: pageIds };

  await supabase
    .from("conduit_connector_tokens")
    .update({ meta: newMeta, updated_at: new Date().toISOString() })
    .eq("id", token.id);

  // Delete cache rows for deselected pages.
  const removed = ((existingMeta.page_ids as string[] | undefined) ?? []).filter(
    (id) => !pageIds.includes(id),
  );
  if (removed.length > 0) {
    await supabase
      .from("conduit_connector_cache")
      .delete()
      .eq("account_id", account.id)
      .eq("provider", "notion")
      .in("cache_key", removed);
  }

  // Sync newly-selected pages.
  const toSync = pageIds.filter(
    (id) =>
      !((existingMeta.page_ids as string[] | undefined) ?? []).includes(id),
  );
  if (toSync.length > 0) {
    await syncNotionPages(supabase, account.id, token.access_token, toSync);
  }

  return NextResponse.json({ ok: true, selectedIds: pageIds });
}
