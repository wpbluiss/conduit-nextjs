import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const TZ_RE = /^[A-Za-z]+(?:\/[A-Za-z_]+){1,3}$/;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const VALID_ACCENTS = new Set(["ember", "blue", "sage", "rose", "amber", "slate"]);

  let body: {
    timezone?: string;
    notify_voice_room_ready?: boolean;
    theme_preference?: "system" | "light" | "dark";
    display_name?: string;
    workspace_name?: string | null;
    accent_preference?: string | null;
    company_brief?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.accent_preference !== undefined) {
    const ak = body.accent_preference;
    update.accent_preference = (ak && VALID_ACCENTS.has(ak)) ? ak : null;
  }
  if (body.workspace_name !== undefined) {
    const wn = body.workspace_name === null ? null : String(body.workspace_name).slice(0, 80);
    update.workspace_name = wn || null;
  }
  if (body.company_brief !== undefined) {
    const brief = body.company_brief === null ? null : String(body.company_brief).slice(0, 500);
    update.company_brief = brief || null;
  }
  if (body.display_name !== undefined) {
    const name = body.display_name.trim().slice(0, 100);
    update.display_name = name || null;
  }
  if (body.timezone !== undefined) {
    const tz = body.timezone.trim();
    if (!tz || !TZ_RE.test(tz)) {
      return NextResponse.json(
        { error: "invalid_timezone" },
        { status: 400 },
      );
    }
    update.timezone = tz;
  }
  if (typeof body.notify_voice_room_ready === "boolean") {
    update.notify_voice_room_ready = body.notify_voice_room_ready;
  }
  if (
    body.theme_preference === "system" ||
    body.theme_preference === "light" ||
    body.theme_preference === "dark"
  ) {
    update.theme_preference = body.theme_preference;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const account = await getOrCreateAccount(supabase, user);
  const { error } = await supabase
    .from("conduit_accounts")
    .update(update)
    .eq("id", account.id);
  if (error) {
    // Theme persistence is best-effort: if migration 021 hasn't run yet
    // the theme_preference column is missing. localStorage still carries
    // the choice forward per-device. Retry without the theme field so the
    // timezone/notify keys still save, and report soft-success.
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
    const columnMissing =
      "theme_preference" in update &&
      (message.includes("theme_preference") || message.includes("column"));
    if (columnMissing) {
      const rest = { ...update };
      delete (rest as { theme_preference?: unknown }).theme_preference;
      if (Object.keys(rest).length <= 1) {
        // Only updated_at + theme were requested → soft success.
        return NextResponse.json({ ok: true, persisted: "local_only" });
      }
      const { error: retryErr } = await supabase
        .from("conduit_accounts")
        .update(rest)
        .eq("id", account.id);
      if (retryErr) {
        return NextResponse.json({ error: "db_error" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, persisted: "partial" });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
