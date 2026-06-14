import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const runtime = "nodejs";

const VALID_IDS = new Set(EMPLOYEE_ORDER);
const MAX_LEN = 32;

// POST /api/conduit/settings/specialist-nicknames
// Body: { nicknames: Record<string, string> }
// Saves custom display names for the 9 Praxis specialists.
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

  const raw = (body as { nicknames?: unknown }).nicknames;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ error: "invalid_nicknames" }, { status: 400 });
  }

  // Sanitize: only keep known employee keys, trim, enforce max length.
  const sanitized: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_IDS.has(key as never)) continue;
    const trimmed = typeof val === "string" ? val.trim().slice(0, MAX_LEN) : "";
    if (trimmed) sanitized[key] = trimmed;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("conduit_accounts")
    .update({ specialist_nicknames: sanitized } as never)
    .eq("id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nicknames: sanitized });
}
