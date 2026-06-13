import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSettingsData } from "@/lib/conduit/settings-data";
import { BillingReturnBanner } from "@/components/conduit/BillingReturnBanner";
import { BillingDashboard } from "@/components/conduit/BillingDashboard";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; topup?: string; upgrade?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/billing");

  const [data, params] = await Promise.all([
    loadSettingsData(supabase, user),
    searchParams,
  ]);

  const currentTier = data.account.tier_id ?? "free";
  const showUpgradePro =
    params.upgrade === "pro" && currentTier === "free";
  const showUpgradeEnterprise =
    params.upgrade === "enterprise" && currentTier !== "enterprise";

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-2">Billing</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Manage your subscription, tokens, and payment method.
        </p>
        {showUpgradePro && (
          <BillingReturnBanner type="upgrade_intent_pro" />
        )}
        {showUpgradeEnterprise && (
          <BillingReturnBanner type="upgrade_intent_enterprise" />
        )}
        {params.checkout === "success" && (
          <BillingReturnBanner type="checkout_success" />
        )}
        {params.checkout === "canceled" && (
          <BillingReturnBanner type="checkout_canceled" />
        )}
        {params.topup === "success" && (
          <BillingReturnBanner type="topup_success" />
        )}
        <BillingDashboard account={data.account} usage={data.usage} />
      </div>
    </div>
  );
}
