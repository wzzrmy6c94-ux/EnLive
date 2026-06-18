import assert from "node:assert/strict";
import test from "node:test";
import { isCeilingSweepRating } from "../../lib/rating-quality.ts";

test("isCeilingSweepRating detects all-near-perfect scorecards", () => {
  assert.equal(isCeilingSweepRating([100, 100, 100, 100]), true);
  assert.equal(isCeilingSweepRating([99.2, 99, 100, 99.9]), true);
});

test("isCeilingSweepRating allows high ratings with some variation", () => {
  assert.equal(isCeilingSweepRating([100, 100, 100, 95]), false);
  assert.equal(isCeilingSweepRating([98.9, 100, 100, 100]), false);
  assert.equal(isCeilingSweepRating([80, 90, 100, 95]), false);
});
