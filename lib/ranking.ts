export type RankingRole = "artist" | "venue" | "city";

export type RatingAggregate = {
  currentScore: number | null;
  denominator: number | null;
  lastRatingTimestamp: Date | string | null;
  ratingCount: number | null;
};

export type UpdatedRatingAggregate = {
  currentScore: number;
  denominator: number;
  lastRatingTimestamp: string;
  ratingCount: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_HALF_LIFE_DAYS: Record<RankingRole, number> = {
  artist: 120,
  venue: 240,
  city: 365,
};

const HALF_LIFE_ENV_KEYS: Record<RankingRole, string> = {
  artist: "ENLIVE_ARTIST_HALF_LIFE_DAYS",
  venue: "ENLIVE_VENUE_HALF_LIFE_DAYS",
  city: "ENLIVE_CITY_HALF_LIFE_DAYS",
};

function parsePositiveNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function asDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid rating timestamp.");
  }
  return date;
}

export function halfLifeDaysForRole(role: RankingRole, env: Record<string, string | undefined> = process.env) {
  return parsePositiveNumber(env[HALF_LIFE_ENV_KEYS[role]]) ?? DEFAULT_HALF_LIFE_DAYS[role];
}

export function decayFactor(ageMs: number, halfLifeDays: number) {
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
    throw new Error("Half-life must be a positive number of days.");
  }

  const ageDays = Math.max(0, ageMs) / MS_PER_DAY;
  return Math.pow(0.5, ageDays / halfLifeDays);
}

export function nextRatingAggregate(
  previous: RatingAggregate,
  newRating: number,
  newRatingTimestamp: Date | string,
  halfLifeDays: number,
): UpdatedRatingAggregate {
  if (!Number.isFinite(newRating) || newRating < 0 || newRating > 100) {
    throw new Error("Rating must be between 0 and 100.");
  }

  const ratingDate = asDate(newRatingTimestamp);
  const priorCount = Math.max(0, Math.trunc(previous.ratingCount ?? 0));
  const priorDenominator = previous.denominator ?? 0;
  const priorScore = previous.currentScore;

  if (
    priorCount === 0 ||
    previous.lastRatingTimestamp === null ||
    priorScore === null ||
    !Number.isFinite(priorScore) ||
    !Number.isFinite(priorDenominator) ||
    priorDenominator <= 0
  ) {
    return {
      currentScore: newRating,
      denominator: 1,
      lastRatingTimestamp: ratingDate.toISOString(),
      ratingCount: priorCount + 1,
    };
  }

  const previousDate = asDate(previous.lastRatingTimestamp);
  const factor = decayFactor(ratingDate.getTime() - previousDate.getTime(), halfLifeDays);
  const decayedDenominator = priorDenominator * factor;
  const denominator = 1 + decayedDenominator;

  // Brandon's running weighted average: latest rating plus decayed prior score mass.
  const currentScore = (newRating + decayedDenominator * priorScore) / denominator;

  return {
    currentScore,
    denominator,
    lastRatingTimestamp: ratingDate.toISOString(),
    ratingCount: priorCount + 1,
  };
}
