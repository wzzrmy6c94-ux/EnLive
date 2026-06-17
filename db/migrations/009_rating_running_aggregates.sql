ALTER TABLE users
  ADD COLUMN IF NOT EXISTS current_score DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS denominator DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rating_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

UPDATE users
SET
  denominator = COALESCE(denominator, 0),
  rating_count = COALESCE(rating_count, 0);

ALTER TABLE users
  ALTER COLUMN denominator SET DEFAULT 0,
  ALTER COLUMN denominator SET NOT NULL,
  ALTER COLUMN rating_count SET DEFAULT 0,
  ALTER COLUMN rating_count SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_current_score_range'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_current_score_range
      CHECK (current_score IS NULL OR (current_score >= 0 AND current_score <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_denominator_nonnegative'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_denominator_nonnegative
      CHECK (denominator >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_rating_count_nonnegative'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_rating_count_nonnegative
      CHECK (rating_count >= 0);
  END IF;
END $$;

UPDATE users
SET
  current_score = NULL,
  denominator = 0,
  last_rating_timestamp = NULL,
  rating_count = 0
WHERE role IN ('venue', 'artist', 'city');

DO $$
DECLARE
  rating_row RECORD;
  target_state RECORD;
  role_half_life_days DOUBLE PRECISION;
  age_days DOUBLE PRECISION;
  factor DOUBLE PRECISION;
  decayed_denominator DOUBLE PRECISION;
  new_denominator DOUBLE PRECISION;
  new_score DOUBLE PRECISION;
BEGIN
  FOR rating_row IN
    SELECT r.target_id, r.overall_score, r.created_at, u.role
    FROM ratings r
    JOIN users u ON u.id = r.target_id
    WHERE u.role IN ('venue', 'artist', 'city')
    ORDER BY r.target_id, r.created_at, r.id
  LOOP
    SELECT current_score, denominator, last_rating_timestamp, rating_count
    INTO target_state
    FROM users
    WHERE id = rating_row.target_id
    FOR UPDATE;

    IF target_state.rating_count = 0
      OR target_state.current_score IS NULL
      OR target_state.denominator <= 0
      OR target_state.last_rating_timestamp IS NULL
    THEN
      UPDATE users
      SET
        current_score = rating_row.overall_score,
        denominator = 1,
        last_rating_timestamp = rating_row.created_at,
        rating_count = target_state.rating_count + 1
      WHERE id = rating_row.target_id;
    ELSE
      role_half_life_days = CASE rating_row.role
        WHEN 'artist' THEN 120
        WHEN 'venue' THEN 240
        ELSE 365
      END;

      age_days = GREATEST(
        0,
        EXTRACT(EPOCH FROM (rating_row.created_at - target_state.last_rating_timestamp)) / 86400.0
      );
      factor = POWER(0.5, age_days / role_half_life_days);
      decayed_denominator = target_state.denominator * factor;
      new_denominator = 1 + decayed_denominator;
      new_score = (
        rating_row.overall_score +
        (decayed_denominator * target_state.current_score)
      ) / new_denominator;

      UPDATE users
      SET
        current_score = new_score,
        denominator = new_denominator,
        last_rating_timestamp = rating_row.created_at,
        rating_count = target_state.rating_count + 1
      WHERE id = rating_row.target_id;
    END IF;
  END LOOP;
END $$;
