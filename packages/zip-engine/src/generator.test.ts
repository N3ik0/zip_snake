import { Rng } from '@games/core';
import { describe, expect, it } from 'vitest';
import { createBoard, isSolution } from './board';
import { generatePuzzle } from './generator';
import { solve } from './solver';

function generateMany(width: number, height: number, seeds: number[], extraCheckpoints = 0) {
  return seeds.map((seed) =>
    generatePuzzle({ width, height, rng: new Rng(seed), extraCheckpoints }),
  );
}

describe('generatePuzzle', () => {
  it.each([
    [4, 4],
    [5, 5],
    [6, 6],
  ])('produces %ix%i puzzles whose stored solution is the only one', (width, height) => {
    const results = generateMany(width, height, [1, 2, 3, 4, 5, 6]);
    const generated = results.filter((r) => r !== null);
    expect(generated.length).toBeGreaterThanOrEqual(4);

    for (const { puzzle, solution, difficulty } of generated) {
      const board = createBoard(puzzle);
      expect(isSolution(board, solution)).toBe(true);
      const proof = solve(board, { maxSolutions: 2 });
      expect(proof.complete).toBe(true);
      expect(proof.solutions).toEqual([solution]);
      expect(difficulty).toBeGreaterThan(0);
      expect(puzzle.checkpoints[0]).toBe(solution[0]);
      expect(puzzle.checkpoints[puzzle.checkpoints.length - 1]).toBe(solution.at(-1));
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generatePuzzle({ width: 5, height: 5, rng: new Rng(11) });
    const b = generatePuzzle({ width: 5, height: 5, rng: new Rng(11) });
    expect(a).toEqual(b);
  });

  it('adds hint numbers when asked, keeping uniqueness', () => {
    const [plain] = generateMany(5, 5, [21]);
    const [hinted] = generateMany(5, 5, [21], 4);
    expect(plain).not.toBeNull();
    expect(hinted).not.toBeNull();
    expect(hinted!.puzzle.checkpoints.length).toBe(plain!.puzzle.checkpoints.length + 4);
    expect(solve(createBoard(hinted!.puzzle)).solutions).toHaveLength(1);
  });

  it('only builds walls that the solution never crosses', () => {
    const generated = generateMany(6, 6, [1, 2, 3, 4, 5, 6, 7, 8]).filter((r) => r !== null);
    for (const { puzzle, solution } of generated) {
      const used = new Set(
        solution.slice(1).map((cell, i) => [cell, solution[i]].sort((x, y) => x! - y!).join('-')),
      );
      for (const [a, b] of puzzle.walls) expect(used.has(`${a}-${b}`)).toBe(false);
    }
  });
});
