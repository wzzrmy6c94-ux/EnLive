export const CEILING_SWEEP_ERROR = "Please make the rating a little more specific before submitting.";

const CEILING_SWEEP_THRESHOLD = 99;
const MIN_RATING_CATEGORIES = 3;

export function isCeilingSweepRating(values: number[]) {
  if (values.length < MIN_RATING_CATEGORIES) return false;

  return values.every(
    (value) => Number.isFinite(value) && value >= CEILING_SWEEP_THRESHOLD && value <= 100,
  );
}
