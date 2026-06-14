import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

// /r/[code] — short referral URL. Redirects to sign-up with the code as a
// query param so the sign-up page can thread it through email confirmation.
export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;
  const safe = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!safe) redirect("/auth/sign-up");
  redirect(`/auth/sign-up?ref=${safe}`);
}
