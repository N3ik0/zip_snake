import { describe, expect, it } from 'vitest';
import { canStep, createBoard, endCell, InvalidPuzzleError, isSolution, startCell } from './board';

// 3x3 grid:
// 0 1 2
// 3 4 5
// 6 7 8
const serpentine = [0, 1, 2, 5, 4, 3, 6, 7, 8];

describe('createBoard', () => {
  it('indexes checkpoints and open neighbours', () => {
    const board = createBoard({ width: 3, height: 3, checkpoints: [0, 4, 8], walls: [[0, 1]] });
    expect(startCell(board)).toBe(0);
    expect(endCell(board)).toBe(8);
    expect(board.checkpointOrder[4]).toBe(1);
    expect(board.checkpointOrder[5]).toBe(-1);
    expect(board.openNeighbors[0]).toEqual([3]);
    expect(board.openNeighbors[1]).not.toContain(0);
  });

  it.each([
    [{ width: 3, height: 3, checkpoints: [0], walls: [] }, 'start and an end'],
    [{ width: 3, height: 3, checkpoints: [0, 9], walls: [] }, 'outside'],
    [{ width: 3, height: 3, checkpoints: [0, 0], walls: [] }, 'same cell'],
    [{ width: 3, height: 3, checkpoints: [0, 8], walls: [[2, 3] as const] }, 'adjacent'],
    [{ width: 1, height: 1, checkpoints: [0, 0], walls: [] }, 'at least 2 cells'],
  ])('rejects malformed puzzles (%#)', (puzzle, message) => {
    expect(() => createBoard(puzzle)).toThrow(InvalidPuzzleError);
    expect(() => createBoard(puzzle)).toThrow(message);
  });
});

describe('canStep', () => {
  const board = createBoard({ width: 3, height: 3, checkpoints: [0, 2, 8], walls: [[4, 5]] });
  const none = () => false;

  it('allows a move to a free adjacent cell', () => {
    expect(canStep(board, 0, 1, none, 1)).toBe(true);
  });

  it('refuses visited cells, non-adjacent cells and walls', () => {
    expect(canStep(board, 0, 1, (c) => c === 1, 1)).toBe(false);
    expect(canStep(board, 0, 4, none, 1)).toBe(false);
    expect(canStep(board, 4, 5, none, 1)).toBe(false);
  });

  it('enforces checkpoint order', () => {
    expect(canStep(board, 1, 2, none, 1)).toBe(true); // number 2 is next
    expect(canStep(board, 5, 8, none, 1)).toBe(false); // number 3 before number 2
    expect(canStep(board, 5, 8, none, 2)).toBe(true);
  });

  it('never leaves the final checkpoint', () => {
    expect(canStep(board, 8, 7, none, 3)).toBe(false);
  });
});

describe('isSolution', () => {
  const board = createBoard({ width: 3, height: 3, checkpoints: [0, 2, 8], walls: [] });

  it('accepts a complete legal path', () => {
    expect(isSolution(board, serpentine)).toBe(true);
  });

  it('rejects incomplete, wrongly started or illegal paths', () => {
    expect(isSolution(board, serpentine.slice(0, -1))).toBe(false);
    expect(isSolution(board, [...serpentine].reverse())).toBe(false);
    expect(isSolution(board, [0, 1, 2, 5, 8, 7, 4, 3, 6])).toBe(false); // ends off the last number
    expect(isSolution(board, [0, 3, 6, 7, 4, 1, 2, 5, 8])).toBe(true); // other legal route
  });
});
