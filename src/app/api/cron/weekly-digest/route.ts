import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { weeklyDigestEmail } from "@/lib/email/templates/weekly-digest";
import type { DigestSpecialist } from "@/lib/email/templates/weekly-digest";

export const runtime = "nodejs";
// Allow up to 5 minutes — iterating many accounts may take time
export const maxDuration = 300;

// Dept colors as hex for email clients (no CSS variable support)
const DEPT_EMAIL_COLOR: Record<string, string> = {
  jarvis: "#C8C5BD",
  marketing: "#FF8A3D",
  sales: "#34D399",
  engineering: "#6190D8",
  finance: "#EAB308",
  compliance: "#A855F7",
  hr: "#EC4899",
  ops: "#14B8A6",
  legal: "#3B82F6",
};

const SPECIALIST_NAMES: Record<string, string> = {
  jarvis: "Atlas",
  marketing: "Marketing",
  sales: "Sales",
  engineering: "Engineering",
  finance: "Finance",
  compliance: "Compliance",
  hr: "HR",
  ops: "Operations",
  legal: "Legal",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function GET(request: NextRequest) {
  return runDigest(request);
}

export async function POST(request: NextRequest) {
  return runDigest(request);
}

async function runDigest(request: NextRequest) {
  // Vercel sets Authorization: Bearer $CRON_SECRET for scheduled cron runs
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createSupabaseAdminClient();

  // Fetch accounts that have not explicitly disabled the weekly digest
  // (null or true means enabled; only false = disabled)
  const { data: accounts, error: accountsErr } = await admin
    .from("conduit_accounts")
    .select("id, owner_user_id, display_name, digest_unsubscribe_token, notification_prefs");

  if (accountsErr) {
    console.error("[weekly-digest] accounts fetch error:", accountsErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  const now = new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartISO = weekStart.toISOString();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://conduitai.io/app";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/app$/, "")
    : "https://conduitai.io";

  let sent = 0;
  let skipped = 0;

  for (const account of accounts) {
    const prefs = account.notification_prefs as { weekly_digest?: boolean } | null;
    if (prefs?.weekly_digest === false) {
      skipped++;
      continue;
    }

    if (!account.owner_user_id || !account.digest_unsubscribe_token) {
      skipped++;
      continue;
    }

    // Resolve the owner's email via auth admin
    const { data: userResp } = await admin.auth.admin.getUserById(
      account.owner_user_id as string,
    );
    const email = userResp?.user?.email;
    if (!email) {
      skipped++;
      continue;
    }

    // Aggregate last 7 days: conversations by specialist
    const { data: conversations } = await admin
      .from("conduit_conversations")
      .select("dominant_employee")
      .eq("account_id", account.id)
      .gte("created_at", weekStartISO);

    // Aggregate last 7 days: artifacts by specialist
    const { data: artifacts } = await admin
      .from("conduit_artifacts")
      .select("produced_by")
      .eq("account_id", account.id)
      .gte("created_at", weekStartISO);

    const convByEmp = new Map<string, number>();
    for (const c of conversations ?? []) {
      const emp = (c.dominant_employee as string) || "jarvis";
      convByEmp.set(emp, (convByEmp.get(emp) ?? 0) + 1);
    }

    const artifactsByEmp = new Map<string, number>();
    for (const a of artifacts ?? []) {
      const emp = (a.produced_by as string) || "jarvis";
      artifactsByEmp.set(emp, (artifactsByEmp.get(emp) ?? 0) + 1);
    }

    const activeEmps = new Set([...convByEmp.keys(), ...artifactsByEmp.keys()]);
    const specialists: DigestSpecialist[] = Array.from(activeEmps)
      .map((emp) => ({
        name: SPECIALIST_NAMES[emp] ?? emp,
        conversationCount: convByEmp.get(emp) ?? 0,
        artifactCount: artifactsByEmp.get(emp) ?? 0,
        color: DEPT_EMAIL_COLOR[emp] ?? "#847A6E",
      }))
      .sort((a, b) => b.conversationCount - a.conversationCount);

    const totalConversations = conversations?.length ?? 0;
    const totalArtifacts = artifacts?.length ?? 0;

    const unsubscribeUrl = `${baseUrl}/api/conduit/digest/unsubscribe?t=${account.digest_unsubscribe_token}`;

    const { subject, html } = weeklyDigestEmail({
      displayName: (account.display_name as string | null) ?? null,
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      specialists,
      totalConversations,
      totalArtifacts,
      appUrl,
      unsubscribeUrl,
    });

    try {
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (err) {
      console.error("[weekly-digest] send error for account", account.id, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
