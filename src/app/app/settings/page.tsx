import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsTabs, type SettingsTabKey } from "@/components/conduit/SettingsTabs";
import { loadSettingsData } from "@/lib/conduit/settings-data";

export const dynamic = "force-dynamic";

const VALID_TABS: SettingsTabKey[] = ["profile", "business", "voice", "team", "usage", "billing", "security", "notifications", "integrations", "appearance", "api"];

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
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-8">Settings</h1>
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
