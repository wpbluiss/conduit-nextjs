-- R-Brand-4: waitlist capture for product pages where the product hasn't
-- shipped yet (Praxis Mobile, Praxis HQ, future surfaces).
-- One row per (product, email). Public table — anyone can insert their own
-- row but reads are restricted to service role.

CREATE TABLE IF NOT EXISTS conduit_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  email text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product, email)
);

ALTER TABLE conduit_waitlist ENABLE ROW LEVEL SECURITY;

-- Anonymous + authenticated visitors can sign up. The endpoint validates
-- the product slug + email shape before it gets here, but RLS gives one
-- more line of defense.
CREATE POLICY "anyone can join waitlist"
  ON conduit_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    product IN ('praxis-mobile', 'praxis-hq')
    AND email IS NOT NULL
    AND length(email) <= 254
    AND email LIKE '%@%.%'
  );

-- Reads stay service-role only (no SELECT policy for anon/authenticated).
CREATE INDEX IF NOT EXISTS idx_conduit_waitlist_product
  ON conduit_waitlist (product, created_at DESC);
