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
  // Voice Room v1 — Story 5: continue from a prior voice session. When
  // present, the route validates ownership + age (<= 14 days) +
  // non-empty transcript_summary and propagates the id into LiveKit
  // room metadata so the worker can bootstrap the new agent's
  // first-turn context.
  parent_session_id?: string;
}

const MAX_PARTICIPANTS_BY_TIER: Record<string, number> = {
  free: 2,
  pro: 4,
  // Polish 2026-05-07: 8 → 9. The full team is 9 (1 Atlas + 8 specialists);
  // capping at 8 silently locked enterprise out of the "Enter the room" hero.
  enterprise: 9,
};

// Voice Room v1 — Story 5 (continuation) validation constants. Contract
// at specs/voice-room-for-ai-employees/contracts/voice-token-extension.md.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTINUATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

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

  // R12.5: validate roundtable mode. Atlas (id: "jarvis") is always a
  // participant (moderator) in v1; the route silently ensures it's in the
  // list.
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

  // Story 5 (FR-007 / FR-008 / FR-015): optional "continue from a prior
  // voice session" mode. Validate ownership + recency + summary-presence
  // before minting the JWT. The worker (W6) reads parent_session_id from
  // LiveKit room metadata on join and fetches the prior session's
  // transcript_summary + last 6 turn pairs via its admin Supabase
  // client — metadata stays small here.
  let parentSessionId: string | null = null;
  let parentSessionStartedAt: string | null = null;
  if (body.parent_session_id !== undefined) {
    const raw =
      typeof body.parent_session_id === "string"
        ? body.parent_session_id.trim()
        : "";
    if (!raw || !UUID_RE.test(raw)) {
      return NextResponse.json(
        { error: "parent_session_invalid", message: "Bad parent_session_id." },
        { status: 400 },
      );
    }
    // Owner-scoped lookup. RLS already filters by account ownership; the
    // explicit account_id eq is defense in depth. On any miss — uuid that
    // doesn't exist OR is owned by someone else — return 403 without
    // distinguishing, so existence isn't leaked to other accounts.
    const { data: parent, error: parentErr } = await supabase
      .from("conduit_voice_sessions")
      .select("id, started_at, created_at, transcript_summary")
      .eq("id", raw)
      .eq("account_id", account.id)
      .maybeSingle();
    if (parentErr || !parent) {
      return NextResponse.json(
        { error: "parent_session_forbidden" },
        { status: 403 },
      );
    }
    const summary =
      typeof parent.transcript_summary === "string"
        ? parent.transcript_summary.trim()
        : "";
    if (summary.length === 0) {
      return NextResponse.json(
        {
          error: "parent_session_unavailable",
          message: "That session has no summary to continue from.",
        },
        { status: 400 },
      );
    }
    const createdAtMs = parent.created_at
      ? new Date(parent.created_at as string).getTime()
      : 0;
    if (createdAtMs < Date.now() - CONTINUATION_WINDOW_MS) {
      return NextResponse.json(
        {
          error: "parent_session_too_old",
          message: "Sessions older than 14 days can't be continued.",
        },
        { status: 400 },
      );
    }
    parentSessionId = parent.id as string;
    parentSessionStartedAt = (parent.started_at as string) ?? null;
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
      // Voice Room v1 — Story 5: when non-null, worker (W6) fetches the
      // prior session's transcript_summary + last 6 turn pairs from
      // Supabase via its admin client and primes the new agent's first
      // turn. Kept as just the id so JWT metadata stays small.
      parent_session_id: parentSessionId,
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
    // Voice Room v1 — Story 5: echoed so the client can render
    // ContinuationBadge ("Continuing your conversation from <relative
    // time>") without a second round-trip. Both null when no
    // parent_session_id was requested or it failed validation.
    parent_session_id: parentSessionId,
    parent_session_started_at: parentSessionStartedAt,
  });
}
