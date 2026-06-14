import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import {
  getGoogleDriveToken,
  getSelectedFiles,
  searchGoogleDriveFiles,
  syncSelectedFiles,
} from "@/lib/connectors/google-drive";

export const runtime = "nodejs";

// GET /api/conduit/connectors/google-drive/files?q=<query>
// Searches the connected Drive for Docs/Sheets matching the query.
export async function GET(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const supabase = await createSupabaseServerClient();
  const token = await getGoogleDriveToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  try {
    const files = await searchGoogleDriveFiles(supabase, token, query);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}

// PATCH /api/conduit/connectors/google-drive/files
// Updates the selected file list and triggers a sync.
export async function PATCH(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: { file_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const fileIds = (body.file_ids ?? []).slice(0, 5);

  const supabase = await createSupabaseServerClient();
  const token = await getGoogleDriveToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const existingFiles = getSelectedFiles(token);

  // Sync only the newly selected files (fetch their content).
  let allFiles = existingFiles;
  if (fileIds.length > 0) {
    try {
      const synced = await syncSelectedFiles(supabase, token, fileIds, existingFiles);
      // Keep only selected files in the final list (remove deselected).
      const selectedSet = new Set(fileIds);
      allFiles = synced.filter((f) => selectedSet.has(f.id));
    } catch {
      return NextResponse.json({ error: "sync_failed" }, { status: 500 });
    }
  } else {
    allFiles = [];
  }

  const now = new Date().toISOString();
  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .update({
      meta: { selected_files: allFiles },
      fetch_count: (token.fetch_count ?? 0) + 1,
      last_fetched_at: now,
      updated_at: now,
    })
    .eq("id", token.id);

  if (dbError) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    files: allFiles.map(({ id, name, mimeType, cachedAt }) => ({ id, name, mimeType, cachedAt })),
  });
}
