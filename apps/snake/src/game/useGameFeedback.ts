import { useEffect, useRef } from 'react';
import type { Feedback } from '../feedback/feedback';
import type { ZipGame } from './useZipGame';

/** Turns state transitions (grew, ate a fruit, solved) into sounds and haptics. */
export function useGameFeedback(game: ZipGame, feedback: Feedback): void {
  const previous = useRef({ length: game.path.length, reached: game.reached, solved: game.solved });

  useEffect(() => {
    const before = previous.current;
    if (game.solved && !before.solved) feedback.win();
    else if (game.reached > before.reached) feedback.fruit();
    else if (game.path.length > before.length) {
      feedback.step(game.path.length / game.board.cellCount);
    }
    previous.current = { length: game.path.length, reached: game.reached, solved: game.solved };
  }, [game.path.length, game.reached, game.solved, game.board.cellCount, feedback]);
}
