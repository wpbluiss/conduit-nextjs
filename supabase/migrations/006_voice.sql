-- R5: voice mode — per-account toggles + per-employee voice overrides.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_speed numeric(3,2) DEFAULT 1.00
    CHECK (voice_speed BETWEEN 0.50 AND 2.00),
  ADD COLUMN IF NOT EXISTS voice_auto_play boolean DEFAULT true;

CREATE TABLE conduit_employee_voices (
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  employee text NOT NULL,
  elevenlabs_voice_id text NOT NULL,
  PRIMARY KEY (account_id, employee)
);
ALTER TABLE conduit_employee_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_employee_voices
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
