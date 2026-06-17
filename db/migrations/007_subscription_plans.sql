CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('artist','venue')),
  price_monthly_cents INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_role_name_lower
ON subscription_plans (role, lower(name));

INSERT INTO subscription_plans (name, role, price_monthly_cents, discount_percent)
SELECT 'Artist Starter', 'artist', 999, 15
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE role = 'artist'
);

INSERT INTO subscription_plans (name, role, price_monthly_cents, discount_percent)
SELECT 'Venue Starter', 'venue', 1399, 15
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE role = 'venue'
);
