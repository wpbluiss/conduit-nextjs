import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// POST /api/conduit/chat/feedback
// Body: { message_id: string; rating: 1 | -1 }
// Upserts a feedback row for the authenticated account.
// Sending the same rating a second time acts as a toggle (removes it).
export async function POST(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { message_id, rating } = body as { message_id?: unknown; rating?: unknown };

  if (typeof message_id !== "string" || !message_id) {
    return NextResponse.json({ error: "missing_message_id" }, { status: 400 });
  }
  if (rating !== 1 && rating !== -1) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Check if a row already exists for this message + account.
  const { data: existing } = await supabase
    .from("conduit_message_feedback")
    .select("id, rating")
    .eq("message_id", message_id)
    .eq("account_id", account.id)
    .maybeSingle();

  // Toggle: if clicking the same rating already stored, remove it.
  if (existing && existing.rating === rating) {
    const { error } = await supabase
      .from("conduit_message_feedback")
      .delete()
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    return NextResponse.json({ action: "removed" });
  }

  // Upsert: insert or update to the new rating.
  const { error } = await supabase
    .from("conduit_message_feedback")
    .upsert(
      { message_id, account_id: account.id, rating },
      { onConflict: "message_id,account_id" },
    );

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ action: "saved", rating });
}
