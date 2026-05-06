-- R2: per-account monthly token cap (foundation for R3 Stripe billing).
-- Chat API checks monthly_tokens_used < monthly_token_cap before each completion
-- and increments by (input_tokens + output_tokens) after.
-- Cap auto-resets billing_cycle_start + 30 days.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS monthly_token_cap integer DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS monthly_tokens_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle_start timestamptz DEFAULT now();

-- Owner gets a much higher cap for testing.
UPDATE conduit_accounts
SET monthly_token_cap = 5000000
WHERE owner_user_id IN (SELECT id FROM auth.users WHERE email = 'luisinvestments101@gmail.com');
