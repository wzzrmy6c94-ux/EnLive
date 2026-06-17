ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

UPDATE users
SET username = CASE
  WHEN role = 'admin' THEN 'admin'
  ELSE lower(regexp_replace(COALESCE(enlive_uid, id), '[^a-zA-Z0-9_-]+', '_', 'g'))
END
WHERE username IS NULL OR username = '';

UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
ON users (email_verification_token_hash)
WHERE email_verification_token_hash IS NOT NULL;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;
