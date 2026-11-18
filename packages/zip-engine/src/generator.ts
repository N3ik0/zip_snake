import type { Rng } from '@games/core';
import { createBoard } from './board';
import type { ZipPuzzle } from './board';
import { randomHamiltonianPath } from './hamiltonian';
import { hasUniqueSolution, solve } from './solver';

export interface GenerateOptions {
  readonly width: number;
  readonly height: number;
  readonly rng: Rng;
  /** Probability of removing an ambiguity with a wall rather than a new number. */
  readonly wallChance?: number;
  /** Extra numbers added after minimisation; more numbers = easier puzzle. */
  readonly extraCheckpoints?: number;
  /** Solver budget per uniqueness check; puzzles that exceed it are discarded. */
  readonly maxNodes?: number;
  /** Safety cap on the number of clues added while removing ambiguities. */
  readonly maxRefinements?: number;
}

export interface GeneratedPuzzle {
  readonly puzzle: ZipPuzzle;
  readonly solution: number[];
  /** Solver effort to prove uniqueness; higher means harder to deduce. */
  readonly difficulty: number;
}

type Wall = readonly [number, number];

/**
 * Generates a puzzle with exactly one solution, or `null` if the random path
 * could not be turned into a unique puzzle within the budget (just try again).
 *
 * 1. Draw a random Hamiltonian path: it will be the solution.
 * 2. Put numbers on its two ends, then, while the solver finds another
 *    solution, add a number or a wall exactly where that solution diverges.
 * 3. Remove every wall, then every number, not needed for uniqueness (harder puzzle).
 * 4. Optionally give back a few numbers as hints (easier puzzle).
 */
export function generatePuzzle(options: GenerateOptions): GeneratedPuzzle | null {
  const { width, height, rng } = options;
  const wallChance = options.wallChance ?? 0.15;
  const maxNodes = options.maxNodes;
  const maxRefinements = options.maxRefinements ?? 400;

  const solution = randomHamiltonianPath({ width, height }, rng);
  const lastIndex = solution.length - 1;
  const clueIndices = new Set<number>([0, lastIndex]);
  let walls: Wall[] = [];

  const build = (): ZipPuzzle => buildPuzzle(width, height, solution, clueIndices, walls);

  let unique = false;
  for (let i = 0; i < maxRefinements && !unique; i++) {
    const result = solve(createBoard(build()), { maxSolutions: 2, maxNodes });
    if (!result.complete) return null;
    const alternative = result.solutions.find((s) => !samePath(s, solution));
    if (!alternative) {
      unique = true;
      break;
    }
    const diverge = firstDifference(alternative, solution);
    if (!clueIndices.has(diverge) && !rng.chance(wallChance)) {
      clueIndices.add(diverge);
    } else {
      // The alternative leaves solution[diverge - 1] towards a cell the real path does not use
      // at this point, so this edge is never part of the real solution: blocking it is safe.
      walls.push([solution[diverge - 1] as number, alternative[diverge] as number]);
    }
  }
  if (!unique) return null;

  const isUnique = () => hasUniqueSolution(createBoard(build()), maxNodes);

  // Walls first: Zip-style puzzles read best with numbers and only a few walls.
  for (const wall of rng.shuffle(walls)) {
    const previous = walls;
    walls = walls.filter((w) => w !== wall);
    if (!isUnique()) walls = previous;
  }
  for (const index of rng.shuffle([...clueIndices].filter((i) => i !== 0 && i !== lastIndex))) {
    clueIndices.delete(index);
    if (!isUnique()) clueIndices.add(index);
  }

  addHints(clueIndices, lastIndex, options.extraCheckpoints ?? 0, rng);

  const puzzle = build();
  const proof = solve(createBoard(puzzle), { maxSolutions: 2, maxNodes });
  if (!proof.complete || proof.solutions.length !== 1) return null;
  return { puzzle, solution, difficulty: proof.nodes };
}

function buildPuzzle(
  width: number,
  height: number,
  solution: readonly number[],
  clueIndices: ReadonlySet<number>,
  walls: readonly Wall[],
): ZipPuzzle {
  const checkpoints = [...clueIndices].sort((a, b) => a - b).map((i) => solution[i] as number);
  const normalizedWalls = walls
    .map(([a, b]) => (a < b ? ([a, b] as const) : ([b, a] as const)))
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return { width, height, checkpoints, walls: normalizedWalls };
}

/** Adding numbers taken from the solution can only remove other solutions, never the real one. */
function addHints(clueIndices: Set<number>, lastIndex: number, count: number, rng: Rng): void {
  const candidates = rng.shuffle(
    Array.from({ length: lastIndex - 1 }, (_, i) => i + 1).filter((i) => !clueIndices.has(i)),
  );
  for (const index of candidates.slice(0, count)) clueIndices.add(index);
}

function samePath(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((cell, i) => cell === b[i]);
}

function firstDifference(a: readonly number[], b: readonly number[]): number {
  const index = a.findIndex((cell, i) => cell !== b[i]);
  return index === -1 ? a.length : index;
}
