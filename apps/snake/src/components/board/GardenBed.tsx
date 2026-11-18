import type { GridSize } from '@games/core';
import { CELL, FRAME } from './geometry';

const TILE_GAP = 4;

/** Wooden planter with a checkerboard of grass tiles. */
export function GardenBed({ size }: { size: GridSize }) {
  const width = size.width * CELL;
  const height = size.height * CELL;
  return (
    <g>
      <rect
        x={-FRAME}
        y={-FRAME + 8}
        width={width + 2 * FRAME}
        height={height + 2 * FRAME}
        rx={38}
        className="bed__shadow"
      />
      <rect
        x={-FRAME}
        y={-FRAME}
        width={width + 2 * FRAME}
        height={height + 2 * FRAME}
        rx={38}
        fill="url(#frame-wood)"
      />
      <rect x={-8} y={-8} width={width + 16} height={height + 16} rx={24} className="bed__soil" />
      {Array.from({ length: size.width * size.height }, (_, cell) => {
        const x = cell % size.width;
        const y = Math.floor(cell / size.width);
        return (
          <rect
            key={cell}
            x={x * CELL + TILE_GAP}
            y={y * CELL + TILE_GAP}
            width={CELL - 2 * TILE_GAP}
            height={CELL - 2 * TILE_GAP}
            rx={16}
            fill={(x + y) % 2 === 0 ? 'url(#tile-light)' : 'url(#tile-dark)'}
          />
        );
      })}
    </g>
  );
}
