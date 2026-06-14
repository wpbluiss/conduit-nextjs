import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const runtime = "nodejs";

const VALID_IDS = new Set(EMPLOYEE_ORDER);
const VALID_LENGTHS = new Set(["short", "balanced", "detailed"]);

// POST /api/conduit/settings/specialist-prefs
// Body: { prefs: Record<string, { response_length?: string }> }
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

  const raw = (body as { prefs?: unknown }).prefs;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "invalid_prefs" }, { status: 400 });
  }

  const sanitized: Record<string, { response_length?: string }> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_IDS.has(key as never)) continue;
    if (typeof val !== "object" || val === null) continue;
    const pref: { response_length?: string } = {};
    const rl = (val as { response_length?: unknown }).response_length;
    if (typeof rl === "string" && VALID_LENGTHS.has(rl) && rl !== "balanced") {
      pref.response_length = rl;
    }
    if (Object.keys(pref).length > 0) sanitized[key] = pref;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("conduit_accounts")
    .update({ specialist_prefs: Object.keys(sanitized).length > 0 ? sanitized : null } as never)
    .eq("id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prefs: sanitized });
}
