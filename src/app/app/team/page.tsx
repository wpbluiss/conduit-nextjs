import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Users2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import {
  EMPLOYEE_ORDER,
  type EmployeeId,
} from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";
import { getTeamActivityBundle } from "@/lib/conduit/team-activity";
import { PraxisTeamRoster } from "@/components/conduit/praxis/PraxisTeamRoster";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/team");
  const { account } = current;

  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const allowed = (
    internal
      ? (EMPLOYEE_ORDER as EmployeeKey[])
      : (tier.allowedEmployees as EmployeeKey[])
  ) as EmployeeKey[];
  const allowedSet = new Set<EmployeeId>(allowed as EmployeeId[]);

  const bundle = await getTeamActivityBundle(supabase, account.id);

  // Most-engaged dept in last 7 days — surfaces at top of roster.
  let mostEngaged: EmployeeId | null = null;
  let mostEngagedTs = 0;
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const e of EMPLOYEE_ORDER) {
    if (e === "jarvis") continue;
    const iso = bundle.employees[e].last_active_at;
    if (!iso) continue;
    const ts = new Date(iso).getTime();
    if (ts > mostEngagedTs && ts >= sevenDaysAgo) {
      mostEngagedTs = ts;
      mostEngaged = e;
    }
  }

  const hasActivity = EMPLOYEE_ORDER.some(
    (e) => bundle.employees[e].last_active_at !== null,
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div
        style={{
          paddingLeft: "var(--space-4)",
          paddingRight: "var(--space-4)",
          paddingTop: "var(--space-10)",
          paddingBottom: "var(--space-8)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "64rem" }}>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "var(--color-surface-elevated)" }}
              aria-hidden
            >
              <Users2 size={16} style={{ color: "var(--color-text-muted)" }} />
            </span>
            <h1 className="praxis-display-1">Your team</h1>
          </div>
          <p className="praxis-body-lg" style={{ maxWidth: "36rem", color: "var(--color-text-muted)" }}>
            Nine specialists. Active status and latest output at a glance.
          </p>
        </div>
      </div>

      {/* Team roster */}
      <div
        className="mx-auto"
        style={{ maxWidth: "64rem", padding: "var(--space-8) var(--space-4)" }}
      >
        {hasActivity ? (
          <PraxisTeamRoster
            initial={bundle}
            allowedEmployees={allowedSet}
            mostEngagedDept={mostEngaged}
          />
        ) : (
          <>
            <PraxisTeamRoster
              initial={bundle}
              allowedEmployees={allowedSet}
              mostEngagedDept={null}
            />
            {/* Empty-state nudge below the roster */}
            <div
              className="mt-8 conduit-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ borderStyle: "dashed" }}
            >
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  Your team is ready — start a task
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Ask Atlas to route your first request, or pick a specialist
                  directly from the grid above.
                </p>
              </div>
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 text-sm font-medium shrink-0"
                style={{ color: "var(--color-accent)" }}
              >
                Open the console <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
