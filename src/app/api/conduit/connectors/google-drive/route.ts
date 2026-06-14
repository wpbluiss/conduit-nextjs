import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import {
  getGoogleDriveToken,
  getSelectedFiles,
  syncSelectedFiles,
} from "@/lib/connectors/google-drive";

export const runtime = "nodejs";

// DELETE /api/conduit/connectors/google-drive
// Disconnects Google Drive by removing the stored token row.
export async function DELETE() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("conduit_connector_tokens")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "google_drive");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/conduit/connectors/google-drive
// Returns the current selected files and their sync status.
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const token = await getGoogleDriveToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const files = getSelectedFiles(token).map(({ id, name, mimeType, cachedAt }) => ({
    id,
    name,
    mimeType,
    cachedAt: cachedAt ?? null,
  }));

  return NextResponse.json({ files, last_fetched_at: token.last_fetched_at });
}

// POST /api/conduit/connectors/google-drive
// Syncs (re-fetches) the cached text for all selected files.
export async function POST(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: { file_ids?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const supabase = await createSupabaseServerClient();
  const token = await getGoogleDriveToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const existingFiles = getSelectedFiles(token);
  const fileIdsToSync = body.file_ids ?? existingFiles.map((f) => f.id);

  if (fileIdsToSync.length === 0) {
    return NextResponse.json({ ok: true, files: [] });
  }

  try {
    const synced = await syncSelectedFiles(supabase, token, fileIdsToSync, existingFiles);

    // Merge synced files with any retained existing files not in the sync set.
    const syncedIds = new Set(synced.map((f) => f.id));
    const retained = existingFiles.filter((f) => !syncedIds.has(f.id));
    const allFiles = [...synced, ...retained].slice(0, 5);

    const now = new Date().toISOString();
    await supabase
      .from("conduit_connector_tokens")
      .update({
        meta: { selected_files: allFiles },
        fetch_count: (token.fetch_count ?? 0) + 1,
        last_fetched_at: now,
        updated_at: now,
      })
      .eq("id", token.id);

    return NextResponse.json({
      ok: true,
      files: allFiles.map(({ id, name, mimeType, cachedAt }) => ({ id, name, mimeType, cachedAt })),
    });
  } catch {
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
