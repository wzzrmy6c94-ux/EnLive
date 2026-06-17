-- Convert legacy category scores from the old 1-5 scale to the formula-ready 0-100 scale.
-- Overall scores are recomputed from the normalized category scores so historical data stays comparable.
UPDATE ratings
SET
  category_1_score = ROUND(((((LEAST(GREATEST(category_1_score, 1), 5) - 1) / 4) * 100)::numeric), 2)::double precision,
  category_2_score = ROUND(((((LEAST(GREATEST(category_2_score, 1), 5) - 1) / 4) * 100)::numeric), 2)::double precision,
  category_3_score = ROUND(((((LEAST(GREATEST(category_3_score, 1), 5) - 1) / 4) * 100)::numeric), 2)::double precision,
  category_4_score = CASE
    WHEN category_4_score IS NULL THEN NULL
    ELSE ROUND(((((LEAST(GREATEST(category_4_score, 1), 5) - 1) / 4) * 100)::numeric), 2)::double precision
  END,
  overall_score = ROUND((
    (
      (((LEAST(GREATEST(category_1_score, 1), 5) - 1) / 4) * 100) +
      (((LEAST(GREATEST(category_2_score, 1), 5) - 1) / 4) * 100) +
      (((LEAST(GREATEST(category_3_score, 1), 5) - 1) / 4) * 100) +
      CASE
        WHEN category_4_score IS NULL THEN 0
        ELSE (((LEAST(GREATEST(category_4_score, 1), 5) - 1) / 4) * 100)
      END
    ) / CASE WHEN category_4_score IS NULL THEN 3 ELSE 4 END
  )::numeric, 2)::double precision
WHERE
  category_1_score BETWEEN 1 AND 5
  AND category_2_score BETWEEN 1 AND 5
  AND category_3_score BETWEEN 1 AND 5
  AND (category_4_score IS NULL OR category_4_score BETWEEN 1 AND 5);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_category_1_score_range'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_category_1_score_range
      CHECK (category_1_score >= 0 AND category_1_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_category_2_score_range'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_category_2_score_range
      CHECK (category_2_score >= 0 AND category_2_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_category_3_score_range'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_category_3_score_range
      CHECK (category_3_score >= 0 AND category_3_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_category_4_score_range'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_category_4_score_range
      CHECK (category_4_score IS NULL OR (category_4_score >= 0 AND category_4_score <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_overall_score_range'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_overall_score_range
      CHECK (overall_score >= 0 AND overall_score <= 100);
  END IF;
END $$;
