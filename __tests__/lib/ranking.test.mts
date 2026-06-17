import assert from "node:assert/strict";
import test from "node:test";
import {
  decayFactor,
  halfLifeDaysForRole,
  nextRatingAggregate,
} from "../../lib/ranking.ts";

test("decayFactor halves weight after one half-life", () => {
  const oneHalfLifeMs = 120 * 24 * 60 * 60 * 1000;
  assert.equal(decayFactor(oneHalfLifeMs, 120), 0.5);
});

test("nextRatingAggregate initializes the first score directly", () => {
  const next = nextRatingAggregate(
    { currentScore: null, denominator: 0, lastRatingTimestamp: null, ratingCount: 0 },
    82,
    "2026-06-17T12:00:00.000Z",
    120,
  );

  assert.deepEqual(next, {
    currentScore: 82,
    denominator: 1,
    lastRatingTimestamp: "2026-06-17T12:00:00.000Z",
    ratingCount: 1,
  });
});

test("nextRatingAggregate gives a newer rating more influence after one half-life", () => {
  const next = nextRatingAggregate(
    {
      currentScore: 100,
      denominator: 1,
      lastRatingTimestamp: "2026-01-01T00:00:00.000Z",
      ratingCount: 1,
    },
    0,
    "2026-04-01T00:00:00.000Z",
    90,
  );

  assert.equal(next.denominator, 1.5);
  assert.equal(Math.round(next.currentScore * 100) / 100, 33.33);
  assert.equal(next.ratingCount, 2);
});

test("halfLifeDaysForRole reads env overrides with defaults", () => {
  assert.equal(halfLifeDaysForRole("artist", {}), 120);
  assert.equal(halfLifeDaysForRole("venue", { ENLIVE_VENUE_HALF_LIFE_DAYS: "300" }), 300);
  assert.equal(halfLifeDaysForRole("city", { ENLIVE_CITY_HALF_LIFE_DAYS: "bad" }), 365);
});
