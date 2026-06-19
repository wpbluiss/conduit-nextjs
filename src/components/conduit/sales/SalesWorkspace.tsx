import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmployeeAvatar } from "@/components/conduit/EmployeeBadge";
import type { ConduitAccount } from "@/lib/conduit/account";
import { EMPLOYEES } from "@/lib/conduit/employees";
import VoiceModeButton from "@/components/conduit/voice/VoiceModeButton";
import EmployeeRightRail from "@/components/conduit/EmployeeRightRail";
import LeadsTableClient from "./LeadsTableClient";

interface Props {
  supabase: SupabaseClient;
  account: ConduitAccount;
}

export default async function SalesWorkspace({ supabase, account }: Props) {
  const employee = EMPLOYEES.sales;

  const [leadsQ, totalQ, withIntentQ] = await Promise.all([
    supabase
      .from("sales_leads")
      .select(
        "id, source, business_name, vertical, city, state, phone, website, address, lat, lng, rating, review_count, intent_signal_text, intent_signal_score, status, enriched, created_at, updated_at",
      )
      .eq("account_id", account.id)
      .order("intent_signal_score", { ascending: false })
      .order("business_name", { ascending: true })
      .limit(100),
    supabase
      .from("sales_leads")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id),
    supabase
      .from("sales_leads")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .gt("intent_signal_score", 0),
  ]);

  const leads = leadsQ.data ?? [];
  const total = totalQ.count ?? 0;
  const withIntent = withIntentQ.count ?? 0;
  const cities = Array.from(
    new Set((leads as Array<{ city: string }>).map((l) => l.city).filter(Boolean)),
  ).sort();

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
      {/* Header band — matches other employee workspaces */}
      <div
        className="px-4 md:px-8 py-8 md:py-10 border-b border-[var(--color-border)]"
        style={{
          background: `linear-gradient(135deg, ${employee.colorSoft}, transparent 60%)`,
        }}
      >
        <div className="mx-auto max-w-5xl flex flex-wrap items-center gap-4 md:gap-6">
          <EmployeeAvatar employee="sales" size={56} />
          <div className="min-w-0 flex-1">
            <div
              className="cx-type-xs uppercase tracking-[0.2em]"
              style={{ color: employee.color }}
            >
              {employee.role}
            </div>
            <h1
              className="cx-type-2xl md:cx-type-3xl font-semibold mt-1"
              style={{ color: employee.color }}
            >
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-xl">
              {employee.tagline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VoiceModeButton
              employeeId="sales"
              employeeName={employee.name}
              employeeInitial={employee.initial}
              deptColor={employee.color}
            />
            <Link
              href="/app?pin=sales"
              className="btn-primary btn-sz-sm"
              style={{ background: employee.color, color: "var(--cx-canvas)" }}
            >
              Talk to Sales <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="mx-auto max-w-5xl px-4 md:px-8 pt-6 md:pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Leads in pipeline" value={String(total)} />
          <Stat label="With intent signal" value={String(withIntent)} />
          <Stat
            label="Sources"
            value="3"
            sub="OSM · Reddit · Maps"
          />
        </div>
      </div>

      <LeadsTableClient
        initialLeads={leads as never[]}
        cities={cities}
        deptColor={employee.color}
        deptColorSoft={employee.colorSoft}
      />
      </div>
      <div className="hidden lg:block">
        <EmployeeRightRail
          supabase={supabase}
          accountId={account.id}
          employeeId="sales"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="conduit-card px-4 py-3">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="cx-mono cx-type-xl font-semibold mt-1">{value}</div>
      {sub && (
        <div className="cx-type-xs text-[var(--color-text-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
