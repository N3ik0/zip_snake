import { toIndex, toPoint } from '@games/core';
import type { GridSize, Point } from '@games/core';

/** Size of one cell in SVG user units; the SVG scales to the screen via its viewBox. */
export const CELL = 100;
/** Width of the wooden frame drawn around the grid, in SVG units. */
export const FRAME = 26;

/** viewBox covering the grid plus its frame. */
export function boardViewBox(size: GridSize): string {
  return `${-FRAME} ${-FRAME} ${size.width * CELL + 2 * FRAME} ${size.height * CELL + 2 * FRAME}`;
}

export function cellCenter(size: GridSize, cell: number): Point {
  const p = toPoint(size, cell);
  return { x: p.x * CELL + CELL / 2, y: p.y * CELL + CELL / 2 };
}

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Screen rectangle of the playable grid inside an SVG that also draws the frame. */
export function gridRect(svgRect: Rect, size: GridSize): Rect {
  const scale = svgRect.width / (size.width * CELL + 2 * FRAME);
  return {
    left: svgRect.left + FRAME * scale,
    top: svgRect.top + FRAME * scale,
    width: size.width * CELL * scale,
    height: size.height * CELL * scale,
  };
}

/** Grid cell under a screen point, or `null` outside the board. */
export function cellAtPoint(
  rect: Rect,
  size: GridSize,
  clientX: number,
  clientY: number,
): number | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = Math.floor(((clientX - rect.left) / rect.width) * size.width);
  const y = Math.floor(((clientY - rect.top) / rect.height) * size.height);
  if (x < 0 || y < 0 || x >= size.width || y >= size.height) return null;
  return toIndex(size, { x, y });
}

export interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** The shared border between two adjacent cells, in SVG units. */
export function wallSegment(size: GridSize, a: number, b: number): Segment {
  const pa = toPoint(size, a);
  const pb = toPoint(size, b);
  if (pa.y === pb.y) {
    const x = Math.max(pa.x, pb.x) * CELL;
    return { x1: x, y1: pa.y * CELL, x2: x, y2: (pa.y + 1) * CELL };
  }
  const y = Math.max(pa.y, pb.y) * CELL;
  return { x1: pa.x * CELL, y1: y, x2: (pa.x + 1) * CELL, y2: y };
}
