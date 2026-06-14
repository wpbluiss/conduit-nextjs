import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { JoinClient } from "./JoinClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join a household — Praxis Finance",
  description: "Accept your partner's invite to share a household view in Praxis Finance.",
  robots: { index: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const rawCode = (code ?? "").trim().toUpperCase();

  // Look up household name via service-role client (bypasses RLS for preview).
  // We only expose the household NAME — no financial data — to unauthenticated visitors.
  let householdName: string | null = null;
  if (rawCode) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.rpc("fin_get_household_by_code", {
      p_code: rawCode,
    });
    householdName = (data as string | null) ?? null;
  }

  // Check if the visitor is already signed in (used to show join vs. sign-in CTA).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="conduit-bg-inverse min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="conduit-mesh" aria-hidden />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <PraxisLogo />
        </div>

        {/* Card */}
        <div
          className="conduit-card p-8 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-elevated)), var(--color-surface-elevated))",
          }}
        >
          <JoinClient
            code={rawCode}
            householdName={householdName}
            isAuthenticated={Boolean(user)}
          />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          By joining you agree to Praxis{" "}
          <a href="/legal/terms" className="underline hover:text-[var(--color-text)]">
            Terms
          </a>{" "}
          and{" "}
          <a href="/legal/privacy" className="underline hover:text-[var(--color-text)]">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
