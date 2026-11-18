import type { CSSProperties } from 'react';
import { COPY } from '../copy';
import { Star } from './icons';

const CONFETTI = 28;

interface WinDialogProps {
  readonly stars: number;
  readonly onNext?: () => void;
  readonly onBack: () => void;
}

export function WinDialog({ stars, onNext, onBack }: WinDialogProps) {
  return (
    <div className="win" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: CONFETTI }, (_, i) => (
          <span
            key={i}
            className={`confetti__piece confetti__piece--${i % 4}`}
            style={
              {
                '--x': `${(i * 37) % 100}%`,
                '--delay': `${(i % 7) * 70}ms`,
                '--spin': `${(i % 2 ? 1 : -1) * (180 + i * 23)}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="win__card">
        <h2 id="win-title" className="win__title">
          {COPY.solvedTitle}
        </h2>
        <p className="win__stars" aria-label={COPY.starsLabel(stars)}>
          {[1, 2, 3].map((s) => (
            <span key={s} className="win__star" style={{ '--i': s } as CSSProperties}>
              <Star filled={s <= stars} size={54} />
            </span>
          ))}
        </p>
        {onNext ? (
          <button type="button" className="button button--primary" onClick={onNext}>
            {COPY.next}
          </button>
        ) : (
          <p className="win__note">{COPY.allDone}</p>
        )}
        <button type="button" className="button button--quiet" onClick={onBack}>
          {COPY.back}
        </button>
      </div>
    </div>
  );
}
