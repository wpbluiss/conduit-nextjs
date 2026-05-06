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
      />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
      {!onboarded && <OnboardingModal defaultName={userName} />}
    </div>
  );
}
