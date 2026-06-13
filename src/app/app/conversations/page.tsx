import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const dynamic = "force-dynamic";

const TEAM = new Set<string>(EMPLOYEE_ORDER);

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function ConversationsPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/conversations");
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("conduit_conversations")
    .select("id, title, updated_at, dominant_employee")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  const conversations = rows ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-2 flex items-center gap-2">
          <MessageSquare size={22} /> Conversations
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Your full chat history — click any conversation to continue it.
        </p>

        {conversations.length === 0 ? (
          <div className="conduit-card p-8 text-center text-sm text-[var(--color-text-muted)]">
            No conversations yet.{" "}
            <Link
              href="/app"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
            >
              Start one →
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => {
              const dom = c.dominant_employee as string | null;
              const isTeam = dom === "team";
              const empKey = (
                dom && TEAM.has(dom) ? dom : "jarvis"
              ) as EmployeeKey;
              const RecentIcon = EMPLOYEE_ICON[empKey];
              const color = DEPT_COLOR[empKey];

              return (
                <Link
                  key={c.id}
                  href={`/app?c=${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg conduit-card hover:border-[var(--color-accent)] transition-colors group"
                >
                  {isTeam ? (
                    <span
                      aria-hidden
                      className="inline-block w-5 h-5 rounded-full shrink-0"
                      style={{
                        background:
                          "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                      }}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-md"
                      style={{
                        background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
                        color,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 60%, transparent)`,
                      }}
                    >
                      <RecentIcon size={11} strokeWidth={2.5} />
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm">
                    {c.title || "Untitled chat"}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                    {relativeDate(c.updated_at as string)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
