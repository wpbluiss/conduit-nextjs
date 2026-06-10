import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getUserHouseholdId } from "@/lib/finance/data";
import { NavSidebar } from "@/components/finance/NavSidebar";
import { PwaInstaller } from "@/components/finance/PwaInstaller";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/finance/sign-in");
  const hh = await getUserHouseholdId();
  if (!hh) redirect("/finance/onboarding");

  return (
    <div>
      <NavSidebar />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {children}
        </div>
      </main>
      <PwaInstaller />
    </div>
  );
}
