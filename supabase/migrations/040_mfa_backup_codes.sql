-- TOTP backup codes: 8 one-time codes stored as SHA-256 hashes.
-- NULL when MFA is not enrolled or codes have been exhausted.
-- Each code is a JSON object { hash: string, used: boolean }.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS mfa_backup_codes jsonb DEFAULT NULL;
