-- R13: streaming TTS for text chat. Audio arcs in chunks alongside
-- token deltas in the same SSE stream so playback starts on the first
-- completed sentence instead of waiting for the full response.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS streaming_tts_enabled boolean NOT NULL DEFAULT true;

-- Per-call usage rows. Useful for cost analysis + the daily cap check.
CREATE TABLE conduit_voice_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL,
  employee text NOT NULL,
  voice_id text,
  characters_streamed integer NOT NULL DEFAULT 0,
  audio_bytes_emitted bigint NOT NULL DEFAULT 0,
  first_audio_latency_ms integer,
  total_duration_ms integer,
  fallback_to_batched boolean NOT NULL DEFAULT false,
  fallback_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_voice_chat_sessions_account_idx
  ON conduit_voice_chat_sessions(account_id, created_at DESC);

ALTER TABLE conduit_voice_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY conduit_voice_chat_sessions_owner_select
  ON conduit_voice_chat_sessions
  FOR SELECT USING (account_id IN (
    SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
  ));
-- Inserts/updates are service-role only.


INSERT INTO conduit_system_config (key, value, description) VALUES
  ('streaming_tts_daily_char_limit', '50000',
    'R13: per-account daily ElevenLabs character ceiling for streaming chat TTS (internal_account bypasses)')
ON CONFLICT (key) DO NOTHING;
