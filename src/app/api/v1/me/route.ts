import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { account, user } = current;
  const tier = tierById(account.tier_id);
  return NextResponse.json({
    id: user.id,
    email: user.email ?? null,
    plan: tier.name,
  });
}
