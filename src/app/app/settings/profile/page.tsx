import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsTabs } from "@/components/conduit/SettingsTabs";
import { PraxisDangerZone } from "@/components/conduit/PraxisDangerZone";
import { loadSettingsData } from "@/lib/conduit/settings-data";

export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/settings/profile");
  const data = await loadSettingsData(supabase, user);

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
          defaultTab="profile"
        />
        <PraxisDangerZone />
      </div>
    </div>
  );
}
