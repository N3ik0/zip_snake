import { Rng } from '@games/core';
import { isSolution } from './board';
import type { Board, ZipPuzzle } from './board';
import { randomHamiltonianPath } from './hamiltonian';

/**
 * Reference implementation for tests: enumerate every simple path from the start
 * using only adjacency, then keep the legal solutions. Slow but obviously correct.
 */
export function bruteForceSolutions(board: Board): number[][] {
  const start = board.checkpoints[0] as number;
  const solutions: number[][] = [];
  const path = [start];
  const visited = new Set(path);
  const walk = (): void => {
    if (path.length === board.cellCount) {
      if (isSolution(board, path)) solutions.push([...path]);
      return;
    }
    for (const n of board.openNeighbors[path[path.length - 1] as number] as number[]) {
      if (visited.has(n)) continue;
      visited.add(n);
      path.push(n);
      walk();
      path.pop();
      visited.delete(n);
    }
  };
  walk();
  return solutions;
}

/** Random puzzle built on a random Hamiltonian path, so it always has at least one solution. */
export function randomSolvablePuzzle(
  width: number,
  height: number,
  seed: number,
): { puzzle: ZipPuzzle; path: number[] } {
  const rng = new Rng(seed);
  const path = randomHamiltonianPath({ width, height }, rng);
  const indices = new Set([0, path.length - 1]);
  const extra = rng.int(3);
  for (let i = 0; i < extra; i++) indices.add(1 + rng.int(path.length - 2));
  const checkpoints = [...indices].sort((a, b) => a - b).map((i) => path[i] as number);
  return { puzzle: { width, height, checkpoints, walls: [] }, path };
}
