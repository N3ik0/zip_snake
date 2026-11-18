import { describe, expect, it } from 'vitest';
import {
  areAdjacent,
  cellCount,
  directionBetween,
  edgeKey,
  neighbors,
  stepToward,
  straightSegment,
  toIndex,
  toPoint,
} from './grid';

const size = { width: 4, height: 3 };

describe('grid', () => {
  it('converts between index and point', () => {
    expect(cellCount(size)).toBe(12);
    expect(toIndex(size, { x: 3, y: 2 })).toBe(11);
    expect(toPoint(size, 6)).toEqual({ x: 2, y: 1 });
  });

  it('lists only in-bounds orthogonal neighbours', () => {
    expect(neighbors(size, 0).sort()).toEqual([1, 4]);
    expect(neighbors(size, 5).sort((a, b) => a - b)).toEqual([1, 4, 6, 9]);
    // Right edge must not wrap to the next row.
    expect(neighbors(size, 3)).not.toContain(4);
  });

  it('detects adjacency without row wrapping', () => {
    expect(areAdjacent(size, 0, 1)).toBe(true);
    expect(areAdjacent(size, 0, 4)).toBe(true);
    expect(areAdjacent(size, 3, 4)).toBe(false);
    expect(areAdjacent(size, 0, 5)).toBe(false);
  });

  it('builds order-independent edge keys', () => {
    expect(edgeKey(2, 7)).toBe(edgeKey(7, 2));
  });

  it('returns straight segments only on a shared row or column', () => {
    expect(straightSegment(size, 0, 3)).toEqual([1, 2, 3]);
    expect(straightSegment(size, 9, 1)).toEqual([5, 1]);
    expect(straightSegment(size, 0, 5)).toBeNull();
    expect(straightSegment(size, 2, 2)).toEqual([]);
  });

  it('steps in a direction and stops at borders', () => {
    expect(stepToward(size, 5, 'right')).toBe(6);
    expect(stepToward(size, 5, 'up')).toBe(1);
    expect(stepToward(size, 3, 'right')).toBeNull();
    expect(stepToward(size, 0, 'up')).toBeNull();
  });

  it('finds the direction between adjacent cells', () => {
    expect(directionBetween(size, 5, 9)).toBe('down');
    expect(directionBetween(size, 5, 4)).toBe('left');
    expect(directionBetween(size, 0, 5)).toBeNull();
  });
});
