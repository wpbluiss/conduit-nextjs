-- R12: Voice Room schema.
-- Three tables. Account-scoped sessions match the R10 RLS pattern.
-- conduit_system_config is the Conduit-namespaced config table — the
-- public.system_config table belongs to unrelated projects in this DB.

-- Global default voice per employee. Per-account overrides (R5) still
-- live in conduit_employee_voices.
CREATE TABLE conduit_employee_default_voices (
  employee text PRIMARY KEY,
  voice_id text,
  voice_provider text NOT NULL DEFAULT 'elevenlabs',
  voice_locale text NOT NULL DEFAULT 'en-US',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conduit_employee_default_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY conduit_employee_default_voices_read
  ON conduit_employee_default_voices
  FOR SELECT USING (true);


-- Voice session log. The Railway worker writes via service role; users
-- can SELECT their own sessions for the transcript history page.
CREATE TYPE conduit_voice_end_reason AS ENUM (
  'user_left',
  'timeout',
  'error',
  'interrupted'
);

CREATE TABLE conduit_voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  room_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  end_reason conduit_voice_end_reason,
  total_input_ms integer NOT NULL DEFAULT 0,
  total_output_ms integer NOT NULL DEFAULT 0,
  transcript_summary text,
  raw_transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_voice_sessions_account_idx
  ON conduit_voice_sessions(account_id, created_at DESC);

-- Hot path for the daily-ceiling check (in-progress sessions count too).
CREATE INDEX conduit_voice_sessions_today_idx
  ON conduit_voice_sessions(account_id, started_at DESC);

ALTER TABLE conduit_voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY conduit_voice_sessions_owner_select
  ON conduit_voice_sessions
  FOR SELECT USING (account_id IN (
    SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
  ));
-- No INSERT/UPDATE policies: writes are service-role-only (worker).


-- Conduit-namespaced system config. The existing public.system_config is
-- shared with unrelated projects (RLS off, dangerous to mutate).
CREATE TABLE conduit_system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conduit_system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY conduit_system_config_read
  ON conduit_system_config
  FOR SELECT USING (true);

INSERT INTO conduit_system_config (key, value, description) VALUES
  ('voice_session_max_seconds',       '300',
    'R12: hard ceiling for a single voice session, in seconds'),
  ('voice_session_warn_seconds',      '240',
    'R12: emit warning audio when the session reaches this'),
  ('voice_daily_minutes_per_account', '30',
    'R12: per-account daily voice ceiling (internal_account bypasses)')
ON CONFLICT (key) DO NOTHING;


-- Seed default voices for the 9 existing employees. voice_id stays NULL
-- until you fill in via the ElevenLabs dashboard. The voice/token route
-- falls back to Jarvis's voice for any employee whose voice_id is null.
INSERT INTO conduit_employee_default_voices (employee, voice_id) VALUES
  ('jarvis',      NULL),
  ('marketing',   NULL),
  ('sales',       NULL),
  ('engineering', NULL),
  ('finance',     NULL),
  ('compliance',  NULL),
  ('hr',          NULL),
  ('ops',         NULL),
  ('legal',       NULL)
ON CONFLICT (employee) DO NOTHING;
