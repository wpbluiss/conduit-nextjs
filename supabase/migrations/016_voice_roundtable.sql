-- R12.5: Voice Round-Table — multi-employee live voice conversations.
-- This migration ships the data plumbing only. The worker rewrite (one
-- OpenAI Realtime + ElevenLabs WS per participant + Haiku routing) and
-- the multi-avatar UI redesign are intentionally deferred — the
-- architectural choices around Realtime fan-out and routing latency
-- need a hands-on call.

CREATE TYPE conduit_voice_session_mode AS ENUM ('solo', 'roundtable');

ALTER TABLE conduit_voice_sessions
  ADD COLUMN IF NOT EXISTS mode conduit_voice_session_mode
    NOT NULL DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS participants jsonb
    NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: every existing session was solo with one participant.
UPDATE conduit_voice_sessions
SET participants = jsonb_build_array(employee_id)
WHERE jsonb_array_length(participants) = 0;


-- Link a voice session back to the originating text conversation, when
-- one exists. /app/page.tsx's "Voice mode" button will pass the active
-- conversation_id; the worker writes it on session create.
ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS voice_session_id uuid
    REFERENCES conduit_voice_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conduit_conversations_voice_session_idx
  ON conduit_conversations(voice_session_id)
  WHERE voice_session_id IS NOT NULL;
