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
  // R12.5: round-table mode. When mode === 'roundtable', `participants`
  // is the full set of employees in the room. employee_id stays as the
  // primary/visible employee (matters for the workspace deeplink, the
  // initial focused avatar in the UI, and the daily-cap accounting).
  mode?: "solo" | "roundtable";
  participants?: string[];
  // R12.5: link a voice session back to its originating text
  // conversation. Worker uses this when writing transcript turns back.
  conversation_id?: string;
}

const MAX_PARTICIPANTS_BY_TIER: Record<string, number> = {
  free: 2,
  pro: 4,
  enterprise: 8,
};

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

  // R12.5: validate roundtable mode. Jarvis is always a participant
  // (moderator) in v1; the route silently ensures it's in the list.
  const requestedMode: "solo" | "roundtable" =
    body.mode === "roundtable" ? "roundtable" : "solo";
  let participants: string[];
  if (requestedMode === "roundtable") {
    const incoming = Array.isArray(body.participants) ? body.participants : [];
    const cleaned = Array.from(
      new Set(
        incoming
          .map((p) => (typeof p === "string" ? p.trim() : ""))
          .filter((p) => p && isValidEmployee(p)),
      ),
    );
    if (!cleaned.includes("jarvis")) cleaned.unshift("jarvis");
    if (!cleaned.includes(employeeId)) cleaned.push(employeeId);
    const tierMax = account.internal_account
      ? Number.MAX_SAFE_INTEGER
      : MAX_PARTICIPANTS_BY_TIER[tier.id] ?? 2;
    if (cleaned.length > tierMax) {
      return NextResponse.json(
        {
          error: "too_many_participants",
          message: `Round-table caps at ${tierMax} employees on your plan.`,
          tier_id: tier.id,
          requested: cleaned.length,
          max: tierMax,
        },
        { status: 403 },
      );
    }
    if (!account.internal_account) {
      const allowedSet = new Set<string>(tier.allowedEmployees);
      const blocked = cleaned.filter((p) => !allowedSet.has(p));
      if (blocked.length > 0) {
        return NextResponse.json(
          {
            error: "participant_locked",
            blocked,
            tier_id: tier.id,
          },
          { status: 403 },
        );
      }
    }
    participants = cleaned;
  } else {
    participants = [employeeId];
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

  // R12.5: resolve a voice for each participant up-front so the worker
  // doesn't pay one Supabase round-trip per participant on join.
  const participantVoices: Record<
    string,
    { voice_id: string | null; voice_locale: string }
  > = {};
  if (requestedMode === "roundtable") {
    const resolved = await Promise.all(
      participants.map(async (p) => {
        const v = await resolveVoiceId(supabase, account.id, p);
        return [p, v] as const;
      }),
    );
    for (const [p, v] of resolved) participantVoices[p] = v;
  } else {
    participantVoices[employeeId] = voiceConfig;
  }

  const roomName = `conduit-${account.id.slice(0, 8)}-${requestedMode === "roundtable" ? "rt" : employeeId}-${randomBytes(4).toString("hex")}`;

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
      // R12.5 additions — worker reads these on participant join.
      mode: requestedMode,
      participants,
      participant_voices: participantVoices,
      conversation_id: body.conversation_id ?? null,
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
    // R12.5: mode + participants echo so the client can render the
    // multi-avatar layout without a second round-trip.
    mode: requestedMode,
    participants,
    participant_voices: participantVoices,
    conversation_id: body.conversation_id ?? null,
  });
}
