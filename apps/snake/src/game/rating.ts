/** 3 stars without hints, one less per hint, never below 1. */
export function starRating(hintsUsed: number): number {
  return Math.max(1, 3 - Math.max(0, hintsUsed));
}
