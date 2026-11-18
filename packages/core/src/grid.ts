/**
 * Rectangular grid geometry. Cells are addressed by a single index
 * `y * width + x`, which keeps puzzles compact and JSON-friendly.
 */
export interface GridSize {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function cellCount(size: GridSize): number {
  return size.width * size.height;
}

export function isInside(size: GridSize, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size.width && p.y < size.height;
}

export function toIndex(size: GridSize, p: Point): number {
  return p.y * size.width + p.x;
}

export function toPoint(size: GridSize, index: number): Point {
  return { x: index % size.width, y: Math.floor(index / size.width) };
}

export type Direction = 'right' | 'left' | 'down' | 'up';

const OFFSETS: Readonly<Record<Direction, Point>> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
};

const DIRECTIONS: readonly Point[] = Object.values(OFFSETS);

/** Orthogonal neighbours that are inside the grid. */
export function neighbors(size: GridSize, index: number): number[] {
  const p = toPoint(size, index);
  const result: number[] = [];
  for (const d of DIRECTIONS) {
    const n = { x: p.x + d.x, y: p.y + d.y };
    if (isInside(size, n)) result.push(toIndex(size, n));
  }
  return result;
}

/** The cell one step away in `direction`, or `null` at the border. */
export function stepToward(size: GridSize, index: number, direction: Direction): number | null {
  const p = toPoint(size, index);
  const d = OFFSETS[direction];
  const n = { x: p.x + d.x, y: p.y + d.y };
  return isInside(size, n) ? toIndex(size, n) : null;
}

/** Direction of the move from `from` to an adjacent `to`, or `null` if not adjacent. */
export function directionBetween(size: GridSize, from: number, to: number): Direction | null {
  const a = toPoint(size, from);
  const b = toPoint(size, to);
  const match = (Object.keys(OFFSETS) as Direction[]).find(
    (dir) => OFFSETS[dir].x === b.x - a.x && OFFSETS[dir].y === b.y - a.y,
  );
  return match ?? null;
}

export function areAdjacent(size: GridSize, a: number, b: number): boolean {
  const pa = toPoint(size, a);
  const pb = toPoint(size, b);
  return Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) === 1;
}

/** Order-independent key for the edge between two cells. */
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Cells strictly after `from` up to and including `to` when both are on the
 * same row or column; `null` otherwise. Used to interpolate fast drags.
 */
export function straightSegment(size: GridSize, from: number, to: number): number[] | null {
  const a = toPoint(size, from);
  const b = toPoint(size, to);
  if (a.x !== b.x && a.y !== b.y) return null;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  const cells: number[] = [];
  let x = a.x;
  let y = a.y;
  while (x !== b.x || y !== b.y) {
    x += dx;
    y += dy;
    cells.push(toIndex(size, { x, y }));
  }
  return cells;
}
