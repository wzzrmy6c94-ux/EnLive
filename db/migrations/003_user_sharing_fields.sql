ALTER TABLE users
ADD COLUMN IF NOT EXISTS enlive_uid TEXT UNIQUE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS settings_json TEXT;

UPDATE users
SET enlive_uid = id
WHERE enlive_uid IS NULL;

UPDATE users
SET settings_json = CASE
  WHEN settings_json IS NULL AND role = 'artist' THEN '{"genre":"Unknown","showcaseEnabled":true,"socialLinks":false}'
  WHEN settings_json IS NULL AND role = 'venue' THEN '{"capacity":null,"bookingOpen":true,"wheelchairAccess":false}'
  ELSE settings_json
END;

ALTER TABLE users
ALTER COLUMN enlive_uid SET NOT NULL;
