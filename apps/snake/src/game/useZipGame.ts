import { stepToward } from '@games/core';
import type { Direction } from '@games/core';
import {
  createBoard,
  dragTo,
  EMPTY_PLAY_STATE,
  hint,
  isDeadEnd,
  isSolved,
  reachedCheckpoints,
  startCell,
  undo,
} from '@games/zip-engine';
import type { Board, LevelDefinition, PlayState } from '@games/zip-engine';
import { useCallback, useMemo, useState } from 'react';

export interface ZipGame {
  readonly board: Board;
  readonly path: readonly number[];
  readonly reached: number;
  readonly solved: boolean;
  readonly deadEnd: boolean;
  readonly hintsUsed: number;
  drag(cell: number): void;
  move(direction: Direction): void;
  undo(): void;
  restart(): void;
  /** Reveals the next correct cell (and fixes a wrong turn). */
  showHint(): void;
}

/**
 * React adapter over the pure engine: all rules live in @games/zip-engine,
 * this hook only holds the current state. Remount (key={level.id}) to change level.
 */
export function useZipGame(level: LevelDefinition): ZipGame {
  const board = useMemo(() => createBoard(level), [level]);
  const [state, setState] = useState<PlayState>(EMPTY_PLAY_STATE);
  const [hintsUsed, setHintsUsed] = useState(0);
  const solved = isSolved(board, state);

  /** Applies a transition unless the board is already solved (the snake is frozen then). */
  const play = useCallback(
    (transition: (current: PlayState) => PlayState) =>
      setState((current) => (isSolved(board, current) ? current : transition(current))),
    [board],
  );

  const drag = useCallback((cell: number) => play((s) => dragTo(board, s, cell)), [board, play]);

  const move = useCallback(
    (direction: Direction) =>
      play((s) => {
        if (s.path.length === 0) return dragTo(board, s, startCell(board));
        const target = stepToward(board.size, s.path[s.path.length - 1] as number, direction);
        return target === null ? s : dragTo(board, s, target);
      }),
    [board, play],
  );

  const undoStep = useCallback(() => play(undo), [play]);
  const restart = useCallback(() => setState(EMPTY_PLAY_STATE), []);
  const showHint = useCallback(() => {
    if (solved) return;
    setHintsUsed((n) => n + 1);
    play((s) => hint(board, s, level.solution));
  }, [board, level.solution, play, solved]);

  return {
    board,
    path: state.path,
    reached: reachedCheckpoints(board, state.path),
    solved,
    deadEnd: isDeadEnd(board, state),
    hintsUsed,
    drag,
    move,
    undo: undoStep,
    restart,
    showHint,
  };
}
