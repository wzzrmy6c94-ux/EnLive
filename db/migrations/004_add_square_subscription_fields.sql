ALTER TABLE users
ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS square_subscription_id TEXT;
