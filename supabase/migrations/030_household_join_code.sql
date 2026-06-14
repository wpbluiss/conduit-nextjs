-- Add join_code to fin_household if not already present (nullable; generated on
-- household creation by the app). Idempotent via IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fin_household' AND column_name = 'join_code'
  ) THEN
    ALTER TABLE fin_household ADD COLUMN join_code text;
  END IF;
END;
$$;

-- Index for fast code lookups on the invite join flow.
CREATE INDEX IF NOT EXISTS fin_household_join_code_idx ON fin_household (join_code)
  WHERE join_code IS NOT NULL;

-- Security-definer helper: return the household name for a given share code.
-- Used by the public /join landing page so unauthenticated visitors can see
-- what they're about to join before signing in. Returns NULL if the code is
-- unknown or already used.
CREATE OR REPLACE FUNCTION fin_get_household_by_code(p_code text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT name FROM fin_household WHERE join_code = upper(trim(p_code)) LIMIT 1;
$$;

-- Security-definer RPC: link the calling auth user to a household via share
-- code. Creates the membership row and clears the code (single-use). Returns
-- the household uuid on success, NULL if the code is invalid/already used.
-- Raises an exception if the user already belongs to a household.
CREATE OR REPLACE FUNCTION fin_join_household(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id uuid;
  v_caller       uuid := auth.uid();
BEGIN
  -- Guard: caller must be authenticated.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Guard: caller must not already be a member of any household.
  IF EXISTS (
    SELECT 1 FROM fin_household_members WHERE user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  -- Atomically find and claim the code.
  UPDATE fin_household
     SET join_code = NULL              -- single-use: clear on claim
   WHERE join_code = upper(trim(p_code))
  RETURNING id INTO v_household_id;

  IF v_household_id IS NULL THEN
    RETURN NULL;                       -- code not found or already used
  END IF;

  -- Insert membership row.
  INSERT INTO fin_household_members (user_id, household_id)
  VALUES (v_caller, v_household_id)
  ON CONFLICT DO NOTHING;

  RETURN v_household_id;
END;
$$;
