import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const runtime = "nodejs";

const VALID_RANGES = new Set(["7", "30", "90", "all"]);

// GET /api/conduit/specialists/metrics?range=7|30|90|all
// Returns message-count metrics per specialist for the authenticated account.
export async function GET(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  const range = request.nextUrl.searchParams.get("range") ?? "30";
  if (!VALID_RANGES.has(range)) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Step 1: get all conversation IDs for this account (indexed on account_id)
  const { data: convRows, error: convErr } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id)
    .limit(2000);

  if (convErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const convIds = (convRows ?? []).map((r: { id: string }) => r.id);
  if (convIds.length === 0) {
    return NextResponse.json({ metrics: [] });
  }

  // Build date cutoffs for range filter and "this month" count
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let rangeSince: string | null = null;
  if (range !== "all") {
    const days = parseInt(range, 10);
    rangeSince = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  // Step 2a: fetch assistant messages for range (indexed on conversation_id + created_at)
  let rangeQuery = supabase
    .from("conduit_messages")
    .select("employee, content")
    .in("conversation_id", convIds)
    .eq("role", "assistant")
    .not("employee", "is", null)
    .limit(10000);

  if (rangeSince) {
    rangeQuery = rangeQuery.gte("created_at", rangeSince);
  }

  // Step 2b: fetch this-month counts (lightweight — only need employee + id)
  let monthQuery = supabase
    .from("conduit_messages")
    .select("employee")
    .in("conversation_id", convIds)
    .eq("role", "assistant")
    .not("employee", "is", null)
    .gte("created_at", monthStart)
    .limit(10000);

  const [rangeResult, monthResult] = await Promise.all([
    rangeQuery,
    monthQuery,
  ]);

  if (rangeResult.error || monthResult.error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Aggregate range metrics in memory
  const validEmployees = new Set<string>(EMPLOYEE_ORDER);
  const rangeAgg: Record<string, { total: number; wordSum: number }> = {};
  for (const msg of rangeResult.data ?? []) {
    const emp = msg.employee as string;
    if (!validEmployees.has(emp)) continue;
    const wordCount = (msg.content as string)
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (!rangeAgg[emp]) rangeAgg[emp] = { total: 0, wordSum: 0 };
    rangeAgg[emp].total += 1;
    rangeAgg[emp].wordSum += wordCount;
  }

  // Aggregate this-month counts
  const monthAgg: Record<string, number> = {};
  for (const msg of monthResult.data ?? []) {
    const emp = msg.employee as string;
    if (!validEmployees.has(emp)) continue;
    monthAgg[emp] = (monthAgg[emp] ?? 0) + 1;
  }

  const metrics = EMPLOYEE_ORDER
    .filter((emp) => rangeAgg[emp] || monthAgg[emp])
    .map((emp) => {
      const r = rangeAgg[emp] ?? { total: 0, wordSum: 0 };
      return {
        employee: emp,
        totalMessages: r.total,
        thisMonth: monthAgg[emp] ?? 0,
        avgWordCount: r.total > 0 ? Math.round(r.wordSum / r.total) : 0,
      };
    })
    .sort((a, b) => b.totalMessages - a.totalMessages);

  return NextResponse.json({ metrics });
}
