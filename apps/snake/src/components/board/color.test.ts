import { describe, expect, it } from 'vitest';
import { mixColor } from './color';

describe('mixColor', () => {
  it('interpolates and clamps', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColor('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColor('#000000', '#ff8800', 0.5)).toBe('#804400');
    expect(mixColor('#102030', '#203040', 2)).toBe('#203040');
  });

  it('rejects other colour formats', () => {
    expect(() => mixColor('red', '#ffffff', 0.5)).toThrow();
  });
});
