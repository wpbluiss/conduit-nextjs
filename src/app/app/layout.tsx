import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { Sidebar } from "@/components/conduit/Sidebar";
import { OnboardingModal } from "@/components/conduit/OnboardingModal";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/app");
  }

  const account = await getOrCreateAccount(supabase, user);
  const onboarded = Boolean(
    account.business_type && account.business_description,
  );

  const { data: convos } = await supabase
    .from("conduit_conversations")
    .select("id, title, updated_at")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  // Last activity per employee (for team status dots)
  const { data: latestPerEmployee } = await supabase
    .from("conduit_messages")
    .select("employee, created_at")
    .eq("role", "assistant")
    .in(
      "conversation_id",
      (convos ?? []).map((c) => c.id),
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const lastActiveMap: Record<string, string> = {};
  for (const m of latestPerEmployee ?? []) {
    const e = m.employee as string | null;
    if (e && !lastActiveMap[e]) lastActiveMap[e] = m.created_at as string;
  }
  const team = (["jarvis", "marketing", "sales", "engineering"] as const).map(
    (emp) => ({
      employee: emp,
      last_active_at: lastActiveMap[emp] ?? null,
    }),
  );

  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "you";

  return (
    <div className="h-screen flex bg-[var(--color-surface)] text-[var(--color-text)]">
      <Sidebar
        userEmail={user.email ?? ""}
        accountName={account.name}
        conversations={convos ?? []}
        team={team}
      />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
      {!onboarded && <OnboardingModal defaultName={userName} />}
    </div>
  );
}
