import { describe, expect, it } from 'vitest';
import { createBoard } from './board';
import {
  dragTo,
  EMPTY_PLAY_STATE,
  hint,
  isDeadEnd,
  isSolved,
  reachedCheckpoints,
  undo,
} from './game';
import type { PlayState } from './game';

// 3x3 grid, numbers on 0 (1), 2 (2) and 8 (3).
// 0 1 2
// 3 4 5
// 6 7 8
const board = createBoard({ width: 3, height: 3, checkpoints: [0, 2, 8], walls: [] });
const play = (cells: number[], from: PlayState = EMPTY_PLAY_STATE) =>
  cells.reduce((state, cell) => dragTo(board, state, cell), from);

describe('dragTo', () => {
  it('only starts on number 1', () => {
    expect(dragTo(board, EMPTY_PLAY_STATE, 4)).toBe(EMPTY_PLAY_STATE);
    expect(dragTo(board, EMPTY_PLAY_STATE, 0).path).toEqual([0]);
  });

  it('grows the snake on adjacent free cells and counts eaten numbers', () => {
    const state = play([0, 1, 2]);
    expect(state.path).toEqual([0, 1, 2]);
    expect(reachedCheckpoints(board, state.path)).toBe(2);
  });

  it('ignores illegal moves and returns the same state object', () => {
    const state = play([0, 3]);
    expect(dragTo(board, state, 8)).toBe(state); // not adjacent, not aligned
    expect(dragTo(board, state, 99)).toBe(state); // outside the grid
    expect(dragTo(board, state, 3)).toBe(state); // already the head
  });

  it('refuses to eat numbers out of order', () => {
    const state = play([0, 3, 4, 5]);
    expect(dragTo(board, state, 8).path).toEqual([0, 3, 4, 5]);
  });

  it('shrinks back when the finger returns onto the snake', () => {
    expect(play([0, 1, 2, 5, 4, 1]).path).toEqual([0, 1]);
  });

  it('interpolates fast straight drags and stops at the first blocked cell', () => {
    expect(play([0, 2]).path).toEqual([0, 1, 2]);
    // From 3, a drag to 5 passes 4 then 5; both free, so the snake takes the whole line.
    expect(play([0, 3, 5]).path).toEqual([0, 3, 4, 5]);
    // A drag through a not-yet-allowed number stops just before it.
    expect(play([0, 3, 6, 8]).path).toEqual([0, 3, 6, 7]);
  });

  it('cannot continue past the last number', () => {
    const state = play([0, 1, 2, 5, 8]);
    expect(dragTo(board, state, 7)).toBe(state);
    expect(isDeadEnd(board, state)).toBe(true);
  });
});

describe('undo / isSolved', () => {
  it('undo removes the head and is a no-op on an empty snake', () => {
    expect(undo(play([0, 1])).path).toEqual([0]);
    expect(undo(EMPTY_PLAY_STATE)).toBe(EMPTY_PLAY_STATE);
  });

  it('detects a solved board', () => {
    const solved = play([0, 1, 2, 5, 4, 3, 6, 7, 8]);
    expect(isSolved(board, solved)).toBe(true);
    expect(isDeadEnd(board, solved)).toBe(false);
    expect(isSolved(board, play([0, 1, 2]))).toBe(false);
  });
});

describe('hint', () => {
  const solution = [0, 1, 2, 5, 4, 3, 6, 7, 8];

  it('starts the snake on number 1 when nothing is drawn', () => {
    expect(hint(board, EMPTY_PLAY_STATE, solution).path).toEqual([0]);
  });

  it('extends a correct snake by one cell', () => {
    expect(hint(board, play([0, 1]), solution).path).toEqual([0, 1, 2]);
  });

  it('cuts a wrong turn back to the last correct cell, then adds the right one', () => {
    expect(hint(board, play([0, 3, 4]), solution).path).toEqual([0, 1]);
  });

  it('leaves a solved board untouched', () => {
    const solved = play(solution);
    expect(hint(board, solved, solution)).toBe(solved);
  });
});
