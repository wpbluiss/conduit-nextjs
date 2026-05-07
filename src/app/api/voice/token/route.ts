import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { isValidEmployee } from "@/lib/conduit/employees";
import { readVoiceCeilings, resolveVoiceId } from "@/lib/voice/config";

export const runtime = "nodejs";

interface TokenBody {
  employee_id?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: TokenBody;
  try {
    body = (await request.json()) as TokenBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const employeeId = body.employee_id?.trim();
  if (!employeeId || !isValidEmployee(employeeId)) {
    return NextResponse.json({ error: "invalid_employee" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const allowed =
    Boolean(account.internal_account) ||
    tier.allowedEmployees.includes(employeeId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      {
        error: "voice_not_configured",
        message: "Voice mode is being set up. Try again in a few minutes.",
      },
      { status: 503 },
    );
  }

  const ceilings = await readVoiceCeilings(supabase);
  const dailyMaxSec = ceilings.dailyMinutes * 60;

  let usedSec = 0;
  if (!account.internal_account) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: sessions } = await supabase
      .from("conduit_voice_sessions")
      .select("duration_seconds")
      .eq("account_id", account.id)
      .gte("started_at", today.toISOString())
      .not("duration_seconds", "is", null);
    usedSec = (sessions ?? []).reduce(
      (sum, s) => sum + ((s.duration_seconds as number | null) ?? 0),
      0,
    );

    if (usedSec >= dailyMaxSec) {
      return NextResponse.json(
        {
          error: "daily_voice_cap_reached",
          message: `You've used your ${ceilings.dailyMinutes} voice minutes for today. Resets at midnight.`,
          used_seconds: usedSec,
          max_seconds: dailyMaxSec,
        },
        { status: 429 },
      );
    }
  }

  const voiceConfig = await resolveVoiceId(supabase, account.id, employeeId);

  const roomName = `conduit-${account.id.slice(0, 8)}-${employeeId}-${randomBytes(4).toString("hex")}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: `user-${user.id}`,
    ttl: 60 * 60,
    metadata: JSON.stringify({
      account_id: account.id,
      employee_id: employeeId,
      voice_id: voiceConfig.voice_id,
      voice_locale: voiceConfig.voice_locale,
      max_seconds: ceilings.maxSeconds,
      warn_seconds: ceilings.warnSeconds,
      internal_account: Boolean(account.internal_account),
    }),
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  const token = await at.toJwt();

  return NextResponse.json({
    token,
    ws_url: wsUrl,
    room_name: roomName,
    employee_id: employeeId,
    voice_id: voiceConfig.voice_id,
    voice_locale: voiceConfig.voice_locale,
    max_seconds: ceilings.maxSeconds,
    warn_seconds: ceilings.warnSeconds,
    daily_seconds_used: usedSec,
    daily_seconds_max: dailyMaxSec,
    internal_account: Boolean(account.internal_account),
  });
}
