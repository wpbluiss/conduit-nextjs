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
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-8">Settings</h1>
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
