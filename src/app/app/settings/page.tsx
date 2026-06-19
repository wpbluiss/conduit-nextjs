import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsTabs, type SettingsTabKey } from "@/components/conduit/SettingsTabs";
import { loadSettingsData } from "@/lib/conduit/settings-data";

export const dynamic = "force-dynamic";

const VALID_TABS: SettingsTabKey[] = ["profile", "workspace", "business", "specialists", "voice", "team", "usage", "billing", "security", "notifications", "integrations", "appearance", "api", "referrals", "labels"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/settings");
  const data = await loadSettingsData(supabase, user);
  const { tab } = await searchParams;
  const defaultTab = VALID_TABS.includes(tab as SettingsTabKey)
    ? (tab as SettingsTabKey)
    : "profile";

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 pb-6 border-b border-[var(--cx-border)]">
          <h1 className="cx-heading-2xl">Settings</h1>
          <p className="cx-type-sm mt-1 cx-text-muted">
            Manage your account, workspace, and billing preferences.
          </p>
        </div>
        <SettingsTabs
          email={data.email}
          fullName={data.fullName}
          account={data.account}
          usage={data.usage}
          defaultTab={defaultTab}
        />
      </div>
    </div>
  );
}
