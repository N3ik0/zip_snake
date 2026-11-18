import { canStep, endCell, startCell } from './board';
import type { Board } from './board';

export interface SolveOptions {
  /** Stop after finding this many solutions (2 is enough to prove non-uniqueness). */
  readonly maxSolutions?: number;
  /** Search budget; when exceeded the result is reported as incomplete. */
  readonly maxNodes?: number;
}

export interface SolveResult {
  readonly solutions: number[][];
  /** True if the search space was fully explored or `maxSolutions` was reached. */
  readonly complete: boolean;
  /** Number of search nodes visited: a rough proxy for how hard the puzzle is to deduce. */
  readonly nodes: number;
}

const DEFAULT_MAX_SOLUTIONS = 2;
const DEFAULT_MAX_NODES = 500_000;

/**
 * Depth-first search for Hamiltonian paths that respect checkpoint order.
 * Two prunings keep it fast on phone-sized grids:
 * - every unvisited cell must stay reachable from the head;
 * - an unvisited cell with fewer than two free sides can only be the end of the path,
 *   so if it is not the final checkpoint the branch is dead.
 */
export function solve(board: Board, options: SolveOptions = {}): SolveResult {
  const maxSolutions = options.maxSolutions ?? DEFAULT_MAX_SOLUTIONS;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const end = endCell(board);
  const visited = new Uint8Array(board.cellCount);
  const path: number[] = [startCell(board)];
  const solutions: number[][] = [];
  const isVisited = (c: number) => visited[c] === 1;
  let nodes = 0;
  let aborted = false;

  visited[path[0] as number] = 1;

  const search = (head: number, reached: number): void => {
    if (aborted || solutions.length >= maxSolutions) return;
    if (++nodes > maxNodes) {
      aborted = true;
      return;
    }
    if (path.length === board.cellCount) {
      if (head === end && reached === board.checkpoints.length) solutions.push([...path]);
      return;
    }
    if (!remainingCellsAreViable(board, visited, head, end)) return;

    for (const next of board.openNeighbors[head] as readonly number[]) {
      if (!canStep(board, head, next, isVisited, reached)) continue;
      visited[next] = 1;
      path.push(next);
      search(next, board.checkpointOrder[next] === -1 ? reached : reached + 1);
      path.pop();
      visited[next] = 0;
    }
  };

  search(path[0] as number, 1);
  return { solutions, complete: !aborted, nodes };
}

function remainingCellsAreViable(
  board: Board,
  visited: Uint8Array,
  head: number,
  end: number,
): boolean {
  // Flood fill the unvisited region from the head and check dead ends on the way.
  const seen = new Uint8Array(board.cellCount);
  const stack = [head];
  seen[head] = 1;
  let reachedUnvisited = 0;
  let unvisited = 0;
  for (let c = 0; c < board.cellCount; c++) if (visited[c] === 0) unvisited++;

  while (stack.length > 0) {
    const cell = stack.pop() as number;
    for (const n of board.openNeighbors[cell] as readonly number[]) {
      if (seen[n] === 1 || visited[n] === 1) continue;
      seen[n] = 1;
      reachedUnvisited++;
      stack.push(n);
      if (n !== end && freeSides(board, visited, n, head) < 2) return false;
    }
  }
  return reachedUnvisited === unvisited;
}

function freeSides(board: Board, visited: Uint8Array, cell: number, head: number): number {
  let count = 0;
  for (const n of board.openNeighbors[cell] as readonly number[]) {
    if (visited[n] === 0 || n === head) count++;
  }
  return count;
}

/** Convenience wrapper: does the board have exactly one solution within the budget? */
export function hasUniqueSolution(board: Board, maxNodes?: number): boolean {
  const result = solve(board, { maxSolutions: 2, maxNodes });
  return result.complete && result.solutions.length === 1;
}
