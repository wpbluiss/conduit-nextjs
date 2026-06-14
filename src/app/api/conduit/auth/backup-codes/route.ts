import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const CODE_COUNT = 8;
// 10 random bytes → 16 hex chars → readable as groups "abcd1234 efgh5678"
const CODE_BYTES = 5;

interface StoredCode {
  hash: string;
  used: boolean;
}

function hashCode(code: string): string {
  // High-entropy random codes (80 bits from 10 random hex chars) make
  // SHA-256 acceptable here — rainbow tables and dictionary attacks don't
  // apply to random secrets of this length.
  return createHash("sha256").update(code).digest("hex");
}

function generateCodes(): { plaintext: string[]; stored: StoredCode[] } {
  const plaintext: string[] = [];
  const stored: StoredCode[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    const code = randomBytes(CODE_BYTES).toString("hex"); // 10 hex chars
    plaintext.push(code);
    stored.push({ hash: hashCode(code), used: false });
  }
  return { plaintext, stored };
}

// POST /api/conduit/auth/backup-codes/generate
// Generates 8 backup codes, stores hashes in conduit_accounts.mfa_backup_codes.
// Requires the user to have a verified TOTP factor.
// Returns { codes: string[] } — shown once, never retrievable again.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Confirm TOTP factor is enrolled
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const hasTOTP = mfaData?.totp.some(
    (f: { status: string }) => f.status === "verified",
  );
  if (!hasTOTP) {
    return NextResponse.json(
      { error: "mfa_not_enrolled" },
      { status: 403 },
    );
  }

  const { plaintext, stored } = generateCodes();
  const account = await getOrCreateAccount(supabase, user);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("conduit_accounts")
    .update({ mfa_backup_codes: stored })
    .eq("id", account.id);

  if (error) {
    console.error("[backup-codes] store error:", error);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  return NextResponse.json({ codes: plaintext });
}

// DELETE /api/conduit/auth/backup-codes
// Clears backup codes (called when MFA is disabled).
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const admin = createSupabaseAdminClient();
  await admin
    .from("conduit_accounts")
    .update({ mfa_backup_codes: null })
    .eq("id", account.id);

  return NextResponse.json({ ok: true });
}

// PATCH /api/conduit/auth/backup-codes/verify
// Verifies a backup code during the MFA challenge.
// If valid: marks code used, deletes the TOTP factor so session proceeds.
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const raw = (body.code ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (!raw) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("conduit_accounts")
    .select("mfa_backup_codes")
    .eq("id", account.id)
    .single();

  const stored = (row?.mfa_backup_codes ?? []) as StoredCode[];
  if (!stored.length) {
    return NextResponse.json({ error: "no_backup_codes" }, { status: 403 });
  }

  const inputHash = hashCode(raw);
  const idx = stored.findIndex((c) => !c.used && c.hash === inputHash);
  if (idx === -1) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }

  // Mark code used
  const updated = stored.map((c, i) => (i === idx ? { ...c, used: true } : c));
  await admin
    .from("conduit_accounts")
    .update({ mfa_backup_codes: updated })
    .eq("id", account.id);

  // Delete the TOTP factor so the session proceeds without MFA redirect.
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const factor = mfaData?.totp.find(
    (f: { id: string; status: string }) => f.status === "verified",
  );
  if (factor) {
    await admin.auth.admin.mfa.deleteFactor({
      userId: user.id,
      id: factor.id,
    });
  }

  const remaining = updated.filter((c) => !c.used).length;
  return NextResponse.json({ ok: true, remaining });
}
