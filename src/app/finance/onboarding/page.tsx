import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getUserHouseholdId } from "@/lib/finance/data";
import { OnboardingFlow } from "@/components/finance/OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/finance/sign-in");
  const hh = await getUserHouseholdId();
  if (hh) redirect("/finance");
  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <OnboardingFlow firstName={firstName} />
    </main>
  );
}
