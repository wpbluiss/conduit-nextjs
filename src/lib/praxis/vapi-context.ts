import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function vapiUnauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function checkVapiSecret(req: NextRequest): boolean {
  const secret = process.env.PRAXIS_CRON_SECRET;
  return !!secret && req.headers.get("x-praxis-secret") === secret;
}

export async function getVapiContext() {
  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [tasksRes, dispRes, briefRes] = await Promise.all([
    admin.from("praxis_tasks").select("status,updated_at"),
    admin.from("praxis_cross_repo_dispatches").select("id", { count: "exact", head: true }),
    admin
      .from("praxis_briefs")
      .select("summary,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let done = 0, doneToday = 0, inflight = 0;
  for (const t of tasksRes.data ?? []) {
    if (t.status === "done") {
      done++;
      if (String(t.updated_at).slice(0, 10) === today) doneToday++;
    }
    if (["queued", "assigned", "in_progress"].includes(t.status)) inflight++;
  }

  return NextResponse.json({
    ok: true,
    date: today,
    tasks: {
      done_today: doneToday,
      inflight,
      done_all_time: done,
    },
    cross_repo_dispatches: dispRes.count ?? 0,
    latest_brief: briefRes.data?.summary ?? null,
  });
}
