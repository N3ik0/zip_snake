import { describe, expect, it } from 'vitest';
import { CELL, cellAtPoint, cellCenter, FRAME, gridRect, wallSegment } from './geometry';

const size = { width: 5, height: 4 };
const rect = { left: 10, top: 20, width: 500, height: 400 };

describe('geometry', () => {
  it('maps screen points to cells, including scaled boards', () => {
    expect(cellAtPoint(rect, size, 10, 20)).toBe(0);
    expect(cellAtPoint(rect, size, 509, 419)).toBe(19);
    expect(cellAtPoint(rect, size, 260, 170)).toBe(7); // x=2, y=1 on a 5-wide grid
    const half = { ...rect, width: 250, height: 200 };
    expect(cellAtPoint(half, size, 10 + 125, 20 + 100)).toBe(12); // x=2, y=2
  });

  it('returns null outside the board or for an unmeasured board', () => {
    expect(cellAtPoint(rect, size, 9, 30)).toBeNull();
    expect(cellAtPoint(rect, size, 30, 420)).toBeNull();
    expect(cellAtPoint({ left: 0, top: 0, width: 0, height: 0 }, size, 0, 0)).toBeNull();
  });

  it('centres cells', () => {
    expect(cellCenter(size, 6)).toEqual({ x: CELL * 1.5, y: CELL * 1.5 });
  });

  it('draws walls on the shared border', () => {
    expect(wallSegment(size, 0, 1)).toEqual({ x1: CELL, y1: 0, x2: CELL, y2: CELL });
    expect(wallSegment(size, 6, 1)).toEqual({ x1: CELL, y1: CELL, x2: 2 * CELL, y2: CELL });
  });

  it('finds the grid inside the framed SVG at any scale', () => {
    const fullWidth = size.width * CELL + 2 * FRAME;
    const svgRect = { left: 0, top: 0, width: fullWidth / 2, height: 0 };
    expect(gridRect(svgRect, size)).toEqual({
      left: FRAME / 2,
      top: FRAME / 2,
      width: (size.width * CELL) / 2,
      height: (size.height * CELL) / 2,
    });
  });
});
