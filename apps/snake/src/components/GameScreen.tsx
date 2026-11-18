import type { LevelDefinition } from '@games/zip-engine';
import { useEffect } from 'react';
import { COPY } from '../copy';
import type { Feedback } from '../feedback/feedback';
import { starRating } from '../game/rating';
import { useArrowKeys } from '../game/useArrowKeys';
import { useGameFeedback } from '../game/useGameFeedback';
import { useZipGame } from '../game/useZipGame';
import { BoardView } from './board/BoardView';
import { BackIcon, BulbIcon, RestartIcon, UndoIcon } from './icons';
import { WinDialog } from './WinDialog';

interface GameScreenProps {
  readonly level: LevelDefinition;
  readonly levelNumber: number;
  readonly feedback: Feedback;
  readonly onSolved: (levelId: string, stars: number) => void;
  readonly onBack: () => void;
  /** Undefined on the very last level. */
  readonly onNext?: () => void;
}

export function GameScreen({
  level,
  levelNumber,
  feedback,
  onSolved,
  onBack,
  onNext,
}: GameScreenProps) {
  const game = useZipGame(level);
  const stars = starRating(game.hintsUsed);
  useGameFeedback(game, feedback);
  useArrowKeys(game.move, game.undo);

  useEffect(() => {
    if (game.solved) onSolved(level.id, stars);
  }, [game.solved, level.id, stars, onSolved]);

  return (
    <main className={`screen game zone--${level.tier}`}>
      <header className="hud">
        <button type="button" className="round-button" onClick={onBack} aria-label={COPY.back}>
          <BackIcon />
        </button>
        <div className="hud__title">
          <span className="hud__zone">{COPY.zones[level.tier]}</span>
          <h1 className="hud__level">{COPY.level(levelNumber)}</h1>
        </div>
        <button
          type="button"
          className="round-button round-button--gold"
          onClick={game.showHint}
          disabled={game.solved}
          aria-label={COPY.hint}
        >
          <BulbIcon />
        </button>
      </header>

      <div
        className="meter"
        role="progressbar"
        aria-label={COPY.squares(game.path.length, game.board.cellCount)}
        aria-valuemin={0}
        aria-valuemax={game.board.cellCount}
        aria-valuenow={game.path.length}
      >
        <div
          className="meter__fill"
          style={{ width: `${(game.path.length / game.board.cellCount) * 100}%` }}
        />
        <span className="meter__label">{COPY.squares(game.path.length, game.board.cellCount)}</span>
      </div>

      <div className="game__board">
        <BoardView
          board={game.board}
          path={game.path}
          reached={game.reached}
          solved={game.solved}
          onDrag={game.drag}
        />
      </div>

      <p className={`tip${game.deadEnd ? ' tip--warning' : ''}`} role="status">
        {game.deadEnd ? COPY.deadEnd : COPY.howTo}
      </p>

      <div className="game__actions">
        <button type="button" className="button" onClick={game.undo} disabled={game.solved}>
          <UndoIcon /> {COPY.undo}
        </button>
        <button type="button" className="button" onClick={game.restart}>
          <RestartIcon /> {COPY.restart}
        </button>
      </div>

      {game.solved && <WinDialog stars={stars} onNext={onNext} onBack={onBack} />}
    </main>
  );
}
