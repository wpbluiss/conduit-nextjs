import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/conduit/digest/unsubscribe?t=<uuid>
// Token-based unsubscribe — no auth required.
// Sets notification_prefs.weekly_digest = false for the matching account.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?status=invalid", request.url));
  }

  const admin = createSupabaseAdminClient();

  const { data: account, error } = await admin
    .from("conduit_accounts")
    .select("id, notification_prefs")
    .eq("digest_unsubscribe_token", token)
    .maybeSingle();

  if (error || !account) {
    return NextResponse.redirect(new URL("/unsubscribed?status=invalid", request.url));
  }

  const currentPrefs = (account.notification_prefs as Record<string, boolean> | null) ?? {};
  const merged = { ...currentPrefs, weekly_digest: false };

  await admin
    .from("conduit_accounts")
    .update({ notification_prefs: merged })
    .eq("id", account.id);

  redirect("/unsubscribed?status=ok");
}
