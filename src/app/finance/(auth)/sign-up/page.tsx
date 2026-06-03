import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AuthForm } from "@/components/finance/AuthForm";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/finance");
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <AuthForm mode="sign-up" />
    </main>
  );
}
