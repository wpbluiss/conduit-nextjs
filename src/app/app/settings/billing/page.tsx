import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsTabs } from "@/components/conduit/SettingsTabs";
import { BillingReturnBanner } from "@/components/conduit/BillingReturnBanner";
import { loadSettingsData } from "@/lib/conduit/settings-data";

export const dynamic = "force-dynamic";

export default async function BillingSettings({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; topup?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/settings/billing");
  const [data, params] = await Promise.all([
    loadSettingsData(supabase, user),
    searchParams,
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="cx-heading-2xl">Settings</h1>
          <p className="cx-type-sm mt-1" style={{ color: "var(--cx-text-muted)" }}>
            Manage your account, workspace, and billing preferences.
          </p>
        </div>
        {params.checkout === "success" && (
          <BillingReturnBanner type="checkout_success" />
        )}
        {params.checkout === "canceled" && (
          <BillingReturnBanner type="checkout_canceled" />
        )}
        {params.topup === "success" && (
          <BillingReturnBanner type="topup_success" />
        )}
        <SettingsTabs
          email={data.email}
          fullName={data.fullName}
          account={data.account}
          usage={data.usage}
          defaultTab="billing"
        />
      </div>
    </div>
  );
}
