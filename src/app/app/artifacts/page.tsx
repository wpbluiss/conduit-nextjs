import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { FileText } from "lucide-react";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  EmployeeAvatar,
  employeeLabel,
} from "@/components/conduit/EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";
import { ArtifactShareButton } from "@/components/conduit/ArtifactShareButton";

export const dynamic = "force-dynamic";

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
];

function asEmployee(s: string): EmployeeKey {
  return (VALID_EMPLOYEES.includes(s as EmployeeKey)
    ? s
    : "jarvis") as EmployeeKey;
}

export default async function ArtifactsPage() {
  const current = await getCurrentAccount();
  if (!current) return null;
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { data: artifacts } = await supabase
    .from("conduit_artifacts")
    .select(
      "id, type, title, produced_by, created_at, conversation_id, content, share_token",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const empty = !artifacts || artifacts.length === 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="serif text-3xl mb-2">Artifacts</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Everything your team has produced.
        </p>
        {empty ? (
          <div className="conduit-card p-8 flex items-center gap-4 max-w-md">
            <EmployeeAvatar employee="marketing" size={42} />
            <div>
              <p className="text-[var(--color-text)]">
                Nothing here yet. Marketing&apos;s ready when you are.
              </p>
              <Link
                href="/app"
                className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
              >
                Start a conversation →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(artifacts ?? []).map((a) => {
              const emp = asEmployee(a.produced_by);
              const preview = (a.content as string).slice(0, 100);
              return (
                <div
                  key={a.id}
                  style={{
                    ["--dept" as string]: DEPT_COLOR[emp],
                    borderLeftColor: DEPT_COLOR[emp],
                  }}
                  className="conduit-card border-l-[3px] px-4 py-4 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: DEPT_COLOR_SOFT[emp] }}
                    >
                      <FileText size={13} style={{ color: DEPT_COLOR[emp] }} />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] flex-1 min-w-0">
                      {(a.type as string).replace("_", " ")} ·{" "}
                      <span style={{ color: DEPT_COLOR[emp] }}>
                        {employeeLabel(emp)}
                      </span>
                    </span>
                    <ArtifactShareButton
                      artifactId={a.id}
                      initialShareToken={(a as { share_token?: string | null }).share_token ?? null}
                    />
                  </div>
                  <Link
                    href={`/app?c=${a.conversation_id}`}
                    className="flex flex-col gap-2 group"
                  >
                    <div className="serif text-lg leading-snug group-hover:text-[var(--color-accent)] transition-colors">
                      {a.title}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                      {preview}…
                    </p>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-auto pt-2">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
