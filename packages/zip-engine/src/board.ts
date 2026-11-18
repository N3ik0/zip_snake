import { areAdjacent, cellCount, edgeKey, neighbors } from '@games/core';
import type { GridSize } from '@games/core';

/**
 * Serializable description of a Zip puzzle.
 * - `checkpoints[k]` is the cell holding the number k + 1.
 *   The path starts on the first checkpoint and must end on the last one.
 * - `walls` are blocked edges between two orthogonally adjacent cells.
 */
export interface ZipPuzzle {
  readonly width: number;
  readonly height: number;
  readonly checkpoints: readonly number[];
  readonly walls: ReadonlyArray<readonly [number, number]>;
}

/** Pre-computed lookup structure shared by the game rules and the solver. */
export interface Board {
  readonly size: GridSize;
  readonly cellCount: number;
  readonly checkpoints: readonly number[];
  /** checkpointOrder[cell] = k for the cell holding number k + 1, -1 otherwise. */
  readonly checkpointOrder: Int16Array;
  /** openNeighbors[cell] = adjacent cells not separated by a wall. */
  readonly openNeighbors: readonly (readonly number[])[];
  readonly walls: ReadonlyArray<readonly [number, number]>;
}

export class InvalidPuzzleError extends Error {}

export function createBoard(puzzle: ZipPuzzle): Board {
  const size: GridSize = { width: puzzle.width, height: puzzle.height };
  const count = cellCount(size);
  assertPuzzleShape(puzzle, size, count);

  const checkpointOrder = new Int16Array(count).fill(-1);
  puzzle.checkpoints.forEach((cell, order) => {
    checkpointOrder[cell] = order;
  });

  const walls = new Set(puzzle.walls.map(([a, b]) => edgeKey(a, b)));
  const openNeighbors = Array.from({ length: count }, (_, cell) =>
    neighbors(size, cell).filter((n) => !walls.has(edgeKey(cell, n))),
  );

  return {
    size,
    cellCount: count,
    checkpoints: puzzle.checkpoints,
    checkpointOrder,
    openNeighbors,
    walls: puzzle.walls,
  };
}

function assertPuzzleShape(puzzle: ZipPuzzle, size: GridSize, count: number): void {
  if (!Number.isInteger(size.width) || !Number.isInteger(size.height) || count < 2) {
    throw new InvalidPuzzleError('Grid must be at least 2 cells with integer dimensions');
  }
  if (puzzle.checkpoints.length < 2) {
    throw new InvalidPuzzleError('A puzzle needs at least a start and an end checkpoint');
  }
  const isCell = (c: number) => Number.isInteger(c) && c >= 0 && c < count;
  if (!puzzle.checkpoints.every(isCell)) {
    throw new InvalidPuzzleError('Checkpoint outside of the grid');
  }
  if (new Set(puzzle.checkpoints).size !== puzzle.checkpoints.length) {
    throw new InvalidPuzzleError('Two checkpoints share the same cell');
  }
  for (const [a, b] of puzzle.walls) {
    if (!isCell(a) || !isCell(b) || !areAdjacent(size, a, b)) {
      throw new InvalidPuzzleError(`Wall ${a}-${b} is not between two adjacent cells`);
    }
  }
}

export function startCell(board: Board): number {
  return board.checkpoints[0] as number;
}

export function endCell(board: Board): number {
  return board.checkpoints[board.checkpoints.length - 1] as number;
}

/**
 * The single movement rule of the game, shared by the player state and the solver:
 * the path may go from `from` to `to` if they are connected (adjacent, no wall),
 * `to` is not visited yet, `from` is not the final checkpoint (the path ends there),
 * and `to` is either a plain cell or exactly the next expected checkpoint.
 *
 * @param reached number of checkpoints already visited by the path
 */
export function canStep(
  board: Board,
  from: number,
  to: number,
  isVisited: (cell: number) => boolean,
  reached: number,
): boolean {
  if (from === endCell(board)) return false;
  if (isVisited(to)) return false;
  if (!board.openNeighbors[from]?.includes(to)) return false;
  const order = board.checkpointOrder[to] as number;
  return order === -1 || order === reached;
}

/** True when `path` is a complete, legal solution of the board. */
export function isSolution(board: Board, path: readonly number[]): boolean {
  if (path.length !== board.cellCount || path[0] !== startCell(board)) return false;
  const visited = new Uint8Array(board.cellCount);
  visited[path[0]] = 1;
  let reached = 1;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1] as number;
    const to = path[i] as number;
    if (!canStep(board, from, to, (c) => visited[c] === 1, reached)) return false;
    visited[to] = 1;
    if (board.checkpointOrder[to] !== -1) reached++;
  }
  return reached === board.checkpoints.length && path[path.length - 1] === endCell(board);
}
