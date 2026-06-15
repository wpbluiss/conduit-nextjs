import { getSnapshot } from "@/lib/finance/data";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function esc(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const snap = await getSnapshot();
  if (!snap) return new Response("No data", { status: 404 });

  const rows: (string | number)[][] = [["type", "date", "who", "description", "amount"]];
  for (const p of snap.paychecks)
    rows.push(["paycheck", p.pay_date, p.person_tag, p.job || "paycheck", Number(p.take_home) + Number(p.mileage_reimbursement || 0)]);
  for (const i of snap.inflows)
    rows.push(["inflow", i.date, i.person_tag, i.source || "inflow", Number(i.amount)]);
  for (const e of snap.expenses)
    rows.push(["expense", e.paid_date || e.due_date || e.date, e.person_tag, `${e.name} (${e.category})${e.paid ? "" : " [unpaid]"}`, -Number(e.amount)]);
  for (const pm of snap.payments)
    rows.push(["payment", pm.date, "shared", pm.label || pm.kind, -Number(pm.amount)]);
  for (const r of snap.savingsLog)
    rows.push(["savings", r.date, "shared", r.note || "to goal", Number(r.amount)]);

  rows.sort((a, b) => (a[0] === "type" ? -1 : String(a[1]) < String(b[1]) ? 1 : -1));
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cadence-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
