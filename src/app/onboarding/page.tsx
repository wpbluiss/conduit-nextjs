import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getUserHouseholdId } from "@/lib/finance/data";
import { OnboardingWizard } from "@/components/conduit/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your household — Praxis",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?next=/onboarding");

  // Already has a household → go straight to the app
  const householdId = await getUserHouseholdId();
  if (householdId) redirect("/app");

  return <OnboardingWizard />;
}
