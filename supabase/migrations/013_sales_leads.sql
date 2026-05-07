-- R11: Free-source lead generation pipeline.
-- Three tables, all account-scoped via RLS (mirrors R10 memory pattern).
-- Discovery from OpenStreetMap Overpass (free HTTP), intent from Reddit
-- public JSON, enrichment from Maps via Playwright (cap 50/run, 3s delay).
-- No FB scraping — Meta v. Bright Data killed that path.

CREATE TYPE sales_lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'dead'
);

CREATE TABLE sales_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  source text NOT NULL,
  business_name text NOT NULL,
  vertical text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'FL',
  phone text,
  website text,
  address text,
  lat double precision,
  lng double precision,
  rating numeric(3,2),
  review_count integer,
  last_review_date timestamptz,
  intent_signal_text text,
  intent_signal_score integer NOT NULL DEFAULT 0,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status sales_lead_status NOT NULL DEFAULT 'new',
  enriched boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dedupe across discovery runs. Address can be null (Overpass nodes
-- sometimes lack addr:* tags) so coalesce keeps the unique constraint
-- meaningful for those rows.
CREATE UNIQUE INDEX sales_leads_dedupe_idx
  ON sales_leads(account_id, source, business_name, COALESCE(address, ''));

CREATE INDEX sales_leads_filter_idx
  ON sales_leads(account_id, vertical, city, intent_signal_score DESC);

CREATE INDEX sales_leads_status_idx
  ON sales_leads(account_id, status, created_at DESC);

ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_leads_owner_select ON sales_leads
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY sales_leads_owner_insert ON sales_leads
  FOR INSERT WITH CHECK (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY sales_leads_owner_update ON sales_leads
  FOR UPDATE USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY sales_leads_owner_delete ON sales_leads
  FOR DELETE USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));


-- Subreddit seed list for Reddit intent scraping. Globally readable, written
-- only by service role (no per-account scoping — sources are platform config).
CREATE TABLE reddit_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subreddit text NOT NULL,
  vertical text,
  city text,
  last_scraped_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reddit_lead_sources_subreddit_idx
  ON reddit_lead_sources(subreddit);

ALTER TABLE reddit_lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY reddit_lead_sources_read ON reddit_lead_sources
  FOR SELECT USING (true);


-- Intent signals captured per Reddit post (or future source). lead_id can be
-- null when the signal is vertical/city-level rather than business-specific
-- ("anyone know a med spa in WPB?" — boosts every WPB med spa).
CREATE TABLE lead_intent_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES sales_leads(id) ON DELETE CASCADE,
  vertical text,
  city text,
  signal_text text NOT NULL,
  signal_score integer NOT NULL,
  source_url text,
  source_type text NOT NULL DEFAULT 'reddit',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_intent_signals_account_idx
  ON lead_intent_signals(account_id, created_at DESC);
CREATE INDEX lead_intent_signals_lead_idx
  ON lead_intent_signals(lead_id) WHERE lead_id IS NOT NULL;

ALTER TABLE lead_intent_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_intent_signals_owner_select ON lead_intent_signals
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY lead_intent_signals_owner_insert ON lead_intent_signals
  FOR INSERT WITH CHECK (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY lead_intent_signals_owner_delete ON lead_intent_signals
  FOR DELETE USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));


-- Seed Reddit subs. Service-role inserts so RLS doesn't block.
INSERT INTO reddit_lead_sources (subreddit, city, vertical) VALUES
  ('WestPalmBeach', 'West Palm Beach', NULL),
  ('Boca',          'Boca Raton',      NULL),
  ('jupiterFL',     'Jupiter',         NULL),
  ('AskWPB',        'West Palm Beach', NULL)
ON CONFLICT (subreddit) DO NOTHING;
