-- Referral system: unique invite code per account + referral tracking.
-- Code is 8 uppercase alphanumeric chars derived from a uuid for uniqueness.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE
    DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

CREATE INDEX IF NOT EXISTS conduit_accounts_referral_code_idx
  ON conduit_accounts (referral_code);

CREATE TABLE conduit_referrals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  referee_account_id  uuid NOT NULL UNIQUE REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  code                text NOT NULL,
  tokens_granted      integer NOT NULL DEFAULT 50,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX conduit_referrals_referrer_idx ON conduit_referrals (referrer_account_id);

ALTER TABLE conduit_referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own referrals
CREATE POLICY "referrer_read" ON conduit_referrals
  FOR SELECT USING (
    referrer_account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
