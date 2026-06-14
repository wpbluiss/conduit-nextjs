import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNotionOAuthUrl, isNotionConfigured } from "@/lib/connectors/notion";

export const runtime = "nodejs";

export async function GET() {
  if (!isNotionConfigured()) {
    return NextResponse.json({ error: "notion_not_configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("notion_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getNotionOAuthUrl(state));
}
