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

WITH username_candidates AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        lower(
          regexp_replace(
            CASE
              WHEN role = 'admin' THEN 'admin'
              ELSE COALESCE(enlive_uid, id)
            END,
            '[^a-zA-Z0-9_-]+',
            '_',
            'g'
          )
        ),
        ''
      ),
      'enlive_user'
    ) AS base_username
  FROM users
  WHERE username IS NULL OR username = ''
),
deduped_usernames AS (
  SELECT
    id,
    base_username,
    row_number() OVER (
      PARTITION BY lower(base_username)
      ORDER BY id
    ) AS duplicate_index
  FROM username_candidates
)
UPDATE users
SET username = CASE
  WHEN duplicate_index = 1 THEN left(base_username, 30)
  ELSE left(base_username, 30 - length(duplicate_index::text) - 1) || '-' || duplicate_index::text
END
FROM deduped_usernames
WHERE users.id = deduped_usernames.id;

UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

WITH duplicated_usernames AS (
  SELECT
    id,
    username,
    row_number() OVER (
      PARTITION BY lower(username)
      ORDER BY
        CASE WHEN role = 'admin' AND lower(username) = 'admin' THEN 0 ELSE 1 END,
        id
    ) AS duplicate_index
  FROM users
  WHERE username IS NOT NULL AND username <> ''
)
UPDATE users
SET username = left(duplicated_usernames.username, 21) || '-' || substr(md5(users.id), 1, 8)
FROM duplicated_usernames
WHERE users.id = duplicated_usernames.id
  AND duplicated_usernames.duplicate_index > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
ON users (email_verification_token_hash)
WHERE email_verification_token_hash IS NOT NULL;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;
