import { createBoard, InvalidPuzzleError, isSolution } from './board';
import type { ZipPuzzle } from './board';
import { solve } from './solver';

export const TIERS = ['easy', 'medium', 'hard'] as const;
export type Tier = (typeof TIERS)[number];

/** A puzzle as shipped inside the app, with its solution (used for hints later). */
export interface LevelDefinition extends ZipPuzzle {
  readonly id: string;
  readonly tier: Tier;
  readonly solution: readonly number[];
  readonly difficulty: number;
}

export interface LevelPack {
  readonly version: 1;
  readonly levels: readonly LevelDefinition[];
}

export type LevelCheck = { readonly ok: true } | { readonly ok: false; readonly reason: string };

/** Full integrity check: valid shape, stored solution is legal, and it is the only one. */
export function verifyLevel(level: LevelDefinition, maxNodes = 2_000_000): LevelCheck {
  let board;
  try {
    board = createBoard(level);
  } catch (error) {
    if (error instanceof InvalidPuzzleError) return { ok: false, reason: error.message };
    throw error;
  }
  if (!isSolution(board, level.solution)) {
    return { ok: false, reason: 'stored solution is not a legal path' };
  }
  const result = solve(board, { maxSolutions: 2, maxNodes });
  if (!result.complete) return { ok: false, reason: 'uniqueness could not be proven in budget' };
  if (result.solutions.length !== 1) return { ok: false, reason: 'puzzle has several solutions' };
  return { ok: true };
}

export class InvalidLevelPackError extends Error {}

/**
 * Runtime validation of untrusted JSON (shipped file, future remote packs).
 * Checks the structure only; use `verifyLevel` for puzzle correctness.
 */
export function parseLevelPack(raw: unknown): LevelPack {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.levels)) {
    throw new InvalidLevelPackError('Expected { version: 1, levels: [...] }');
  }
  return { version: 1, levels: raw.levels.map(parseLevel) };
}

function parseLevel(raw: unknown, index: number): LevelDefinition {
  const fail = (field: string): never => {
    throw new InvalidLevelPackError(`Level #${index}: invalid "${field}"`);
  };
  if (!isRecord(raw)) return fail('level');
  const { id, tier, width, height, checkpoints, walls, solution, difficulty } = raw;
  if (typeof id !== 'string') return fail('id');
  if (!TIERS.includes(tier as Tier)) return fail('tier');
  if (!isInteger(width)) return fail('width');
  if (!isInteger(height)) return fail('height');
  if (!isIntegerArray(checkpoints)) return fail('checkpoints');
  if (!isIntegerArray(solution)) return fail('solution');
  if (typeof difficulty !== 'number') return fail('difficulty');
  if (!Array.isArray(walls) || !walls.every((w) => isIntegerArray(w) && w.length === 2)) {
    return fail('walls');
  }
  return {
    id,
    tier: tier as Tier,
    width,
    height,
    checkpoints,
    walls: walls.map((w: number[]) => [w[0], w[1]] as const),
    solution,
    difficulty,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function isIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isInteger);
}
