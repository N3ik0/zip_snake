import { describe, expect, it } from 'vitest';
import { createBoard, isSolution } from './board';
import { hasUniqueSolution, solve } from './solver';
import { bruteForceSolutions, randomSolvablePuzzle } from './test-utils';

const sortPaths = (paths: number[][]) => paths.map((p) => p.join(',')).sort();

describe('solve', () => {
  it.each([
    [3, 3],
    [3, 4],
    [4, 4],
  ])('finds exactly the brute-force solutions on random %ix%i puzzles', (width, height) => {
    for (let seed = 1; seed <= 25; seed++) {
      const { puzzle, path } = randomSolvablePuzzle(width, height, seed);
      const board = createBoard(puzzle);
      const expected = bruteForceSolutions(board);
      const result = solve(board, { maxSolutions: Number.POSITIVE_INFINITY });

      expect(result.complete).toBe(true);
      expect(sortPaths(result.solutions)).toEqual(sortPaths(expected));
      expect(result.solutions.map((s) => s.join(','))).toContain(path.join(','));
      result.solutions.forEach((s) => expect(isSolution(board, s)).toBe(true));
    }
  });

  it('stops after maxSolutions', () => {
    // Corner to adjacent corner on a 4x4 grid has many solutions.
    const board = createBoard({ width: 4, height: 4, checkpoints: [0, 3], walls: [] });
    const result = solve(board, { maxSolutions: 2 });
    expect(result.solutions).toHaveLength(2);
    expect(result.complete).toBe(true);
  });

  it('reports an incomplete search when the node budget is exhausted', () => {
    const board = createBoard({ width: 6, height: 6, checkpoints: [0, 5], walls: [] });
    const result = solve(board, { maxSolutions: Number.POSITIVE_INFINITY, maxNodes: 50 });
    expect(result.complete).toBe(false);
    expect(hasUniqueSolution(board, 50)).toBe(false);
  });

  it('returns no solution for an impossible puzzle', () => {
    // On a 2x2 grid, opposite corners cannot be joined by a path through all 4 cells.
    const board = createBoard({ width: 2, height: 2, checkpoints: [0, 3], walls: [] });
    expect(solve(board).solutions).toEqual([]);
  });
});
