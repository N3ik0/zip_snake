import { describe, expect, it } from 'vitest';
import { starRating } from './rating';

describe('starRating', () => {
  it('removes one star per hint, keeping at least one', () => {
    expect([0, 1, 2, 3, 10].map(starRating)).toEqual([3, 2, 1, 1, 1]);
  });
});
