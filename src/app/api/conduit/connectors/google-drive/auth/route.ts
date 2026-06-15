import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { getGoogleDriveOAuthUrl, isGoogleDriveConfigured } from "@/lib/connectors/google-drive";

export const runtime = "nodejs";

// GET /api/conduit/connectors/google-drive/auth
// Redirects the user to Google's OAuth consent screen for Drive readonly access.
export async function GET(request: NextRequest) {
  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      { error: "google_drive_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Google Drive is a Pro feature — block free-tier accounts from connecting.
  const account = await getOrCreateAccount(supabase, user);
  if (!account.internal_account && (account.tier_id ?? "free") === "free") {
    const settingsUrl = new URL("/app/settings?tab=billing", request.nextUrl.origin);
    return NextResponse.redirect(settingsUrl);
  }

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("gdrive_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getGoogleDriveOAuthUrl(state));
}
