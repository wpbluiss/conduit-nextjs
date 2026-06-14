import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

// /join/[code] — referral entry point. Sets the referral code as a query
// param and sends the user to sign-up. The sign-up page threads it through
// the email confirmation callback so the app can claim the referral on first
// login.
export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const safe = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  redirect(`/auth/sign-up?ref=${safe}`);
}
