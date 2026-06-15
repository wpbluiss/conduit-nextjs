import type { Metadata } from "next";
import "@/styles/engineering-cinema.css";
import "@/styles/memory-canvas.css";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { Sidebar } from "@/components/conduit/Sidebar";
import { OnboardingModal } from "@/components/conduit/OnboardingModal";
import { UpgradeNudge } from "@/components/conduit/UpgradeNudge";
import { TokenBudgetNudge } from "@/components/conduit/TokenBudgetNudge";
import { RouteProgress } from "@/components/conduit/RouteProgress";
import { PraxisCanvasTintProvider } from "@/components/conduit/praxis/PraxisCanvasTintProvider";
import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";
import { tierById } from "@/lib/billing/tiers";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";
import { getInFlightBuilds } from "@/lib/engineering/in-flight";
import { PostOnboardingNudge } from "@/components/conduit/PostOnboardingNudge";
import { FirstRunTour } from "@/components/conduit/FirstRunTour";
import { KeyboardShortcutsOverlay } from "@/components/conduit/KeyboardShortcutsOverlay";
import { CommandPalette } from "@/components/conduit/CommandPalette";
import { WelcomeChecklist } from "@/components/conduit/WelcomeChecklist";
import { Suspense } from "react";
import { ReferralClaimer } from "@/components/conduit/ReferralClaimer";
import { NicknameProvider } from "@/context/NicknameContext";
import { PostHogIdentify } from "@/components/PostHogIdentify";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  openGraph: {
    title: "Praxis Workspace",
    description: "Your AI-powered business team — voice, sales, engineering, ops, finance.",
    images: [
      {
        url: "/api/og?title=Praxis+Workspace&description=Your+AI-powered+business+team",
        width: 1200,
        height: 630,
        alt: "Praxis Workspace",
      },
    ],
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentAccount();
  if (!current) {
    const reqHeaders = await headers();
    const pathname = reqHeaders.get("x-next-pathname") ?? "/app";
    redirect(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
  }
  const { account, user } = current;

  // Email verification guard — only active when Supabase email confirmation
  // is enabled. If email_confirmed_at is null the user has not yet verified
  // their email; send them to the holding page so they can resend the link.
  if (user.email && !user.email_confirmed_at) {
    redirect(
      `/auth/check-your-email?email=${encodeURIComponent(user.email)}`,
    );
  }
  const supabase = await createSupabaseServerClient();
  const onboarded = Boolean(
    account.business_type && account.business_description,
  );

  const [{ data: convos }, inFlightBuildsInitial] = await Promise.all([
    supabase
      .from("conduit_conversations")
      .select("id, title, updated_at, dominant_employee")
      .eq("account_id", account.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    getInFlightBuilds(supabase, account.id),
  ]);

  // Last activity per employee (for team status dots) + last message preview (for sidebar quick-peek)
  const { data: latestPerEmployee } = await supabase
    .from("conduit_messages")
    .select("employee, created_at, content, conversation_id")
    .eq("role", "assistant")
    .in(
      "conversation_id",
      (convos ?? []).map((c) => c.id),
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const lastActiveMap: Record<string, string> = {};
  const previewMap: Record<string, string> = {};
  for (const m of latestPerEmployee ?? []) {
    const e = m.employee as string | null;
    if (e && !lastActiveMap[e]) lastActiveMap[e] = m.created_at as string;
    const cid = m.conversation_id as string | null;
    if (cid && !previewMap[cid]) previewMap[cid] = (m.content as string) ?? "";
  }
  const team = (EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => ({
    employee: emp,
    last_active_at: lastActiveMap[emp] ?? null,
  }));

  const allowedEmployees = (
    account.internal_account
      ? (EMPLOYEE_ORDER as EmployeeKey[])
      : (tierById(account.tier_id).allowedEmployees as EmployeeKey[])
  ) as EmployeeKey[];

  const tier = tierById(account.tier_id);
  const effectiveAllowance = account.internal_account
    ? Math.max(tier.monthlyTokenAllowance, account.monthly_token_cap)
    : tier.monthlyTokenAllowance + (account.bonus_tokens ?? 0);

  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "you";

  // Show welcome checklist only to accounts created within the last 7 days.
  const accountAgeMs = Date.now() - new Date(account.created_at).getTime();
  const isNewAccount = accountAgeMs < 7 * 24 * 60 * 60 * 1000;
  const checklistDismissed = Boolean(
    (account.onboarding_checklist as Record<string, boolean> | null)?.dismissed,
  );

  const initialUser = {
    id: user.id,
    email: user.email ?? "",
    plan: account.tier_id,
  };

  const specialistNicknames = (
    (account as unknown as { specialist_nicknames?: Record<string, string> })
      .specialist_nicknames ?? {}
  ) as Partial<Record<EmployeeKey, string>>;

  return (
    <div className="praxis-root h-screen flex bg-[var(--color-surface)] text-[var(--color-text)]">
      <a href="#app-main" className="conduit-skip-link">Skip to main content</a>
      <UserProvider initialUser={initialUser}>
      <NicknameProvider initialNicknames={specialistNicknames}>
      <ToastProvider>
      <PraxisCanvasTintProvider>
        <RouteProgress />
        <Sidebar
          userEmail={user.email ?? ""}
          accountName={account.name}
          workspaceName={(account as unknown as { workspace_name?: string | null }).workspace_name ?? null}
          conversations={(convos ?? []).map((c) => ({ ...c, last_message: previewMap[c.id] ?? null }))}
          team={team}
          allowedEmployees={allowedEmployees}
          tierName={
            account.internal_account
              ? "Internal"
              : tierById(account.tier_id).name
          }
          accountId={account.id}
          inFlightBuildsInitial={inFlightBuildsInitial}
          avatarUrl={account.avatar_url ?? null}
          displayName={account.display_name ?? null}
        />
        <main id="app-main" className="conduit-canvas praxis-canvas-tint flex-1 flex flex-col min-w-0 pt-12 md:pt-0">
          <UpgradeNudge
            tierId={account.tier_id ?? "free"}
            internalAccount={Boolean(account.internal_account)}
          />
          <TokenBudgetNudge
            tokensUsed={account.monthly_tokens_used}
            tokensAllowance={effectiveAllowance}
            tierId={account.tier_id ?? "free"}
            internalAccount={Boolean(account.internal_account)}
          />
          {children}
        </main>
        {!onboarded && <OnboardingModal defaultName={userName} />}
        <PostOnboardingNudge />
        {onboarded && (
          <FirstRunTour
            isFirstRun={(account as unknown as { onboarded_at?: string | null }).onboarded_at == null}
          />
        )}
        <PostHogIdentify userId={user.id} />
        <KeyboardShortcutsOverlay />
        <CommandPalette recentConvos={(convos ?? []).slice(0, 5)} />
        {onboarded && isNewAccount && !checklistDismissed && (
          <WelcomeChecklist hasConversations={(convos ?? []).length > 0} />
        )}
        <Suspense>
          <ReferralClaimer />
        </Suspense>
      </PraxisCanvasTintProvider>
      </ToastProvider>
      </NicknameProvider>
      </UserProvider>
    </div>
  );
}
