-- R4: Stripe billing — pricing tiers, account billing fields, stripe events,
-- token top-up log. Owner stays on internal_account=true (no charge, full
-- access) on Enterprise tier so creator_mode_v2 routing keeps working.

CREATE TABLE conduit_pricing_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  monthly_price_cents integer NOT NULL,
  monthly_token_allowance integer NOT NULL,
  model_ceiling text NOT NULL,
  allowed_employees text[] NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  stripe_price_id text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0
);
ALTER TABLE conduit_pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_active" ON conduit_pricing_tiers FOR SELECT USING (active = true);

INSERT INTO conduit_pricing_tiers (id, name, monthly_price_cents, monthly_token_allowance, model_ceiling, allowed_employees, features, display_order)
VALUES
  ('free', 'Free', 0, 50000, 'haiku', ARRAY['jarvis','marketing'], '{"creator_mode": false}'::jsonb, 1),
  ('pro', 'Pro', 2900, 1000000, 'sonnet', ARRAY['jarvis','marketing','sales','engineering'], '{"creator_mode": false, "priority_routing": true}'::jsonb, 2),
  ('enterprise', 'Enterprise', 19900, 5000000, 'opus', ARRAY['jarvis','marketing','sales','engineering','finance','compliance','hr','ops','legal'], '{"creator_mode": true, "priority_routing": true, "multi_user": true, "dedicated_phone": true}'::jsonb, 3);

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS tier_id text REFERENCES conduit_pricing_tiers(id) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS bonus_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_account boolean DEFAULT false;

CREATE TABLE conduit_stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES conduit_accounts(id) ON DELETE SET NULL
);
CREATE INDEX ON conduit_stripe_events (event_type, processed_at DESC);
ALTER TABLE conduit_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE conduit_token_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  tokens_granted integer NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_token_topups (account_id, created_at DESC);
ALTER TABLE conduit_token_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_token_topups
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

UPDATE conduit_accounts
SET tier_id = 'enterprise',
    internal_account = true,
    subscription_status = 'active'
WHERE owner_user_id IN (SELECT id FROM auth.users WHERE email = 'luisinvestments101@gmail.com');
