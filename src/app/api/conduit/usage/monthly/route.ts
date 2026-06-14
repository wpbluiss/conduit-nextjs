import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // Parse and validate month param (YYYY-MM)
  const month = request.nextUrl.searchParams.get("month");
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);

  // Allow current month + 2 prior months only
  const allowed = new Set(
    Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return d.toISOString().slice(0, 7);
    }),
  );
  const target = month && allowed.has(month) ? month : currentMonthStr;

  const [year, mon] = target.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const { data: rows } = await supabase
    .from("conduit_usage_events")
    .select("employee, input_tokens, output_tokens, estimated_cost_cents, created_at")
    .eq("account_id", account.id)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true })
    .limit(5000);

  const usage = rows ?? [];

  const totals = usage.reduce(
    (acc, r) => {
      acc.input += (r.input_tokens as number) ?? 0;
      acc.output += (r.output_tokens as number) ?? 0;
      acc.cost += (r.estimated_cost_cents as number) ?? 0;
      return acc;
    },
    { input: 0, output: 0, cost: 0 },
  );

  const byEmployee = usage.reduce(
    (acc, r) => {
      const k = r.employee as string;
      if (!acc[k]) acc[k] = { input: 0, output: 0, cost: 0 };
      acc[k].input += (r.input_tokens as number) ?? 0;
      acc[k].output += (r.output_tokens as number) ?? 0;
      acc[k].cost += (r.estimated_cost_cents as number) ?? 0;
      return acc;
    },
    {} as Record<string, { input: number; output: number; cost: number }>,
  );

  // Build per-day map for every day in the month
  const daysCount = new Date(year, mon, 0).getDate();
  const byDay: Record<string, number> = {};
  for (let d = 1; d <= daysCount; d++) {
    const key = `${target}-${String(d).padStart(2, "0")}`;
    byDay[key] = 0;
  }
  for (const r of usage) {
    const d = new Date(r.created_at as string).toISOString().slice(0, 10);
    if (d in byDay) {
      byDay[d] += ((r.input_tokens as number) ?? 0) + ((r.output_tokens as number) ?? 0);
    }
  }

  // Count AI turns this month (one usage event = one AI message)
  const messageCount = usage.length;

  return NextResponse.json({
    month: target,
    totals,
    byEmployee,
    byDay,
    messageCount,
    employeeOrder: EMPLOYEE_ORDER,
  });
}
