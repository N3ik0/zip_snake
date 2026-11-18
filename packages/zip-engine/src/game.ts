import { areAdjacent, straightSegment } from '@games/core';
import { canStep, endCell, isSolution, startCell } from './board';
import type { Board } from './board';

/** What the player has drawn so far: the snake, from tail (number 1) to head. */
export interface PlayState {
  readonly path: readonly number[];
}

export const EMPTY_PLAY_STATE: PlayState = { path: [] };

/** Number of checkpoints already eaten by the snake. */
export function reachedCheckpoints(board: Board, path: readonly number[]): number {
  return path.reduce((count, cell) => (board.checkpointOrder[cell] === -1 ? count : count + 1), 0);
}

/**
 * Applies a drag of the finger onto `cell`:
 * - nothing drawn yet: the snake can only start on number 1;
 * - a cell already in the snake: the snake shrinks back to it (natural undo while dragging);
 * - a free cell in line with the head: the snake grows cell by cell as far as the rules allow,
 *   which keeps fast swipes responsive.
 */
export function dragTo(board: Board, state: PlayState, cell: number): PlayState {
  if (!Number.isInteger(cell) || cell < 0 || cell >= board.cellCount) return state;
  const { path } = state;

  if (path.length === 0) return cell === startCell(board) ? { path: [cell] } : state;

  const existing = path.indexOf(cell);
  if (existing !== -1) {
    return existing === path.length - 1 ? state : { path: path.slice(0, existing + 1) };
  }

  const head = path[path.length - 1] as number;
  const steps = areAdjacent(board.size, head, cell)
    ? [cell]
    : straightSegment(board.size, head, cell);
  if (!steps) return state;

  const grown = extend(board, path, steps);
  return grown.length === path.length ? state : { path: grown };
}

function extend(board: Board, path: readonly number[], steps: readonly number[]): number[] {
  const visited = new Set(path);
  const result = [...path];
  let reached = reachedCheckpoints(board, path);
  for (const next of steps) {
    const head = result[result.length - 1] as number;
    if (!canStep(board, head, next, (c) => visited.has(c), reached)) break;
    result.push(next);
    visited.add(next);
    if (board.checkpointOrder[next] !== -1) reached++;
  }
  return result;
}

/** Removes the head of the snake (one step back). */
export function undo(state: PlayState): PlayState {
  return state.path.length === 0 ? state : { path: state.path.slice(0, -1) };
}

export function isSolved(board: Board, state: PlayState): boolean {
  return isSolution(board, state.path);
}

/** True when the head sits on the last number but empty cells remain. */
export function isDeadEnd(board: Board, state: PlayState): boolean {
  const head = state.path[state.path.length - 1];
  return head === endCell(board) && state.path.length < board.cellCount;
}

/**
 * Hint: keeps the part of the snake that matches the solution and adds the next correct cell.
 * Returns the same state when the puzzle is already solved.
 */
export function hint(board: Board, state: PlayState, solution: readonly number[]): PlayState {
  if (isSolution(board, state.path)) return state;
  let correct = 0;
  while (correct < state.path.length && state.path[correct] === solution[correct]) correct++;
  const next = solution.slice(0, Math.min(correct + 1, solution.length));
  return { path: next };
}
