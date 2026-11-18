import type { CSSProperties } from 'react';
import type { Point } from '@games/core';

const PARTICLES = 10;

/** One-shot juice when a fruit is eaten. Remount (change `key`) to replay. */
export function Burst({ at }: { at: Point }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`} className="burst" aria-hidden="true">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2;
        const style = {
          '--dx': `${Math.cos(angle) * 58}px`,
          '--dy': `${Math.sin(angle) * 58}px`,
        } as CSSProperties;
        return (
          <circle
            key={i}
            r={i % 2 ? 7 : 5}
            className={`burst__dot burst__dot--${i % 3}`}
            style={style}
          />
        );
      })}
      <circle r={30} className="burst__ring" />
    </g>
  );
}
