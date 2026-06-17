CREATE TABLE IF NOT EXISTS users (
  square_customer_id TEXT,
  square_subscription_id TEXT,
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  email_verified_at TIMESTAMPTZ,
  email_verification_token_hash TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('venue','artist','city','admin')),
  location TEXT NOT NULL,
  genre TEXT,
  country TEXT,
  enlive_uid TEXT UNIQUE,
  settings_json TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
ON users (email_verification_token_hash)
WHERE email_verification_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('venue','artist','city')),
  category_1_score DOUBLE PRECISION NOT NULL,
  category_2_score DOUBLE PRECISION NOT NULL,
  category_3_score DOUBLE PRECISION NOT NULL,
  category_4_score DOUBLE PRECISION,
  overall_score DOUBLE PRECISION NOT NULL,
  location TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role_location ON users(role, location);
CREATE INDEX IF NOT EXISTS idx_ratings_target_created ON ratings(target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('artist','venue')),
  price_monthly_cents INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false
);
