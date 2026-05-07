// R8: time-aware system prompt wrapper. Injected at the chat-route layer
// AFTER the per-employee body + tone block, so every employee gets the
// same fresh time signal per turn.

export interface TimeAwareOpts {
  timezone: string;
}

export function timeAwareBlock(opts: TimeAwareOpts): string {
  const tz = opts.timezone || "America/New_York";
  const now = new Date();
  let localTime: string;
  let hour = 12;
  try {
    localTime = now.toLocaleString("en-US", {
      timeZone: tz,
      hour12: true,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const hourStr = now.toLocaleString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      hour12: false,
    });
    hour = parseInt(hourStr, 10);
  } catch {
    localTime = now.toUTCString();
    hour = now.getUTCHours();
  }
  const partOfDay =
    hour >= 5 && hour < 12
      ? "morning"
      : hour >= 12 && hour < 17
        ? "afternoon"
        : hour >= 17 && hour < 21
          ? "evening"
          : "night";

  return `CURRENT TIME: ${localTime} (${tz}). Time of day: ${partOfDay}.
- Match greetings and references to the actual time of day. Don't say "good morning" if it's afternoon, evening, or night.
- Most of the time, skip greetings entirely (per brevity rules) and lead with action.

`;
}

export function withTimeAware(systemBody: string, opts: TimeAwareOpts): string {
  return timeAwareBlock(opts) + systemBody;
}
