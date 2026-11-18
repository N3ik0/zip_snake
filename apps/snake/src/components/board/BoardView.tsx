import type { Board } from '@games/zip-engine';
import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { BoardDefs } from './BoardDefs';
import { Burst } from './Burst';
import { Fences } from './Fences';
import { Fruits } from './Fruits';
import { GardenBed } from './GardenBed';
import { boardViewBox, cellAtPoint, cellCenter, gridRect } from './geometry';
import { Snake } from './Snake';

interface BoardViewProps {
  readonly board: Board;
  readonly path: readonly number[];
  readonly reached: number;
  readonly solved: boolean;
  readonly onDrag: (cell: number) => void;
}

/** Interactive puzzle board: input handling here, drawing delegated to the board pieces. */
export function BoardView({ board, path, reached, solved, onDrag }: BoardViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const { size } = board;

  const handle = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = gridRect(svg.getBoundingClientRect(), size);
    const cell = cellAtPoint(rect, size, event.clientX, event.clientY);
    if (cell !== null) onDrag(cell);
  };

  const lastEaten = reached > 0 ? board.checkpoints[reached - 1] : undefined;

  return (
    <svg
      ref={svgRef}
      className={`board${solved ? ' board--solved' : ''}`}
      viewBox={boardViewBox(size)}
      role="img"
      aria-label={`Puzzle board, ${path.length} of ${board.cellCount} squares filled`}
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        handle(event);
      }}
      onPointerMove={(event) => {
        if (dragging.current) handle(event);
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <BoardDefs />
      <GardenBed size={size} />
      <Snake size={size} path={path} target={board.checkpoints[reached]} happy={solved} />
      <Fruits size={size} checkpoints={board.checkpoints} eaten={reached} />
      <Fences size={size} walls={board.walls} />
      {lastEaten !== undefined && reached > 1 && (
        <Burst key={reached} at={cellCenter(size, lastEaten)} />
      )}
    </svg>
  );
}
