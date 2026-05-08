// GET /api/engineering/usage — current tier's daily build + spend usage.
// The /app/builds banner uses this to render "X of Y builds today".

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { loadDailyEngineeringUsage } from "@/lib/engineering/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);
  const usage = await loadDailyEngineeringUsage(supabase, account.id, account);
  return NextResponse.json({ usage });
}
