import { areAdjacent, Rng } from '@games/core';
import { describe, expect, it } from 'vitest';
import { randomHamiltonianPath } from './hamiltonian';

describe('randomHamiltonianPath', () => {
  it.each([
    [2, 2],
    [5, 5],
    [6, 7],
    [8, 8],
  ])('visits every cell of a %ix%i grid exactly once with adjacent steps', (width, height) => {
    for (let seed = 0; seed < 20; seed++) {
      const size = { width, height };
      const path = randomHamiltonianPath(size, new Rng(seed));
      expect(path).toHaveLength(width * height);
      expect(new Set(path).size).toBe(width * height);
      for (let i = 1; i < path.length; i++) {
        expect(areAdjacent(size, path[i - 1] as number, path[i] as number)).toBe(true);
      }
    }
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const size = { width: 6, height: 6 };
    const a = randomHamiltonianPath(size, new Rng(5));
    expect(randomHamiltonianPath(size, new Rng(5))).toEqual(a);
    expect(randomHamiltonianPath(size, new Rng(6))).not.toEqual(a);
  });
});
