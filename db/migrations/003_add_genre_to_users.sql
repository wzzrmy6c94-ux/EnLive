-- Add genre column to users table
ALTER TABLE users ADD COLUMN genre TEXT;

-- Update existing records with default values based on role
UPDATE users SET genre = 'Live Music Venue' WHERE role = 'venue' AND genre IS NULL;
UPDATE users SET genre = 'City' WHERE role = 'city' AND genre IS NULL;
UPDATE users SET genre = 'Admin' WHERE role = 'admin' AND genre IS NULL;
UPDATE users SET genre = 'Unknown' WHERE role = 'artist' AND genre IS NULL;
