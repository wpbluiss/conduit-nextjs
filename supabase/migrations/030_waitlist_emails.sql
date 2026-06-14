-- R18 (2026-06-14): Public landing-page waitlist.
--
-- Separate from conduit_waitlist (which is product-specific with a
-- `product` discriminator). This table is intentionally minimal —
-- unauthenticated email capture only, no PII beyond address.
-- No RLS needed: there are no per-user rows to isolate.

CREATE TABLE IF NOT EXISTS waitlist_emails (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
