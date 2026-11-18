import type { GridSize } from '@games/core';
import { wallSegment } from './geometry';

/** Walls drawn as little wooden fences sitting on the tile borders. */
export function Fences({
  size,
  walls,
}: {
  size: GridSize;
  walls: ReadonlyArray<readonly [number, number]>;
}) {
  return (
    <g>
      {walls.map(([a, b]) => {
        const s = wallSegment(size, a, b);
        return (
          <g key={`${a}-${b}`} className="fence">
            <line {...s} className="fence__rail" />
            <line {...s} className="fence__shine" />
            <circle cx={s.x1} cy={s.y1} r={10} className="fence__post" />
            <circle cx={s.x2} cy={s.y2} r={10} className="fence__post" />
          </g>
        );
      })}
    </g>
  );
}
