import { TIERS, verifyLevel } from '@games/zip-engine';
import { describe, expect, it } from 'vitest';
import { currentLevelIndex, isLevelUnlocked, LEVELS, levelIndexById, levelsByTier } from '.';

describe('shipped level pack', () => {
  it('contains levels for every tier with unique ids', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    for (const tier of TIERS) expect(levelsByTier(tier).length).toBeGreaterThan(0);
  });

  it('only ships valid puzzles with exactly one solution', () => {
    const failures = LEVELS.map((level) => ({ id: level.id, check: verifyLevel(level) })).filter(
      (r) => !r.check.ok,
    );
    expect(failures).toEqual([]);
  });

  it('orders levels by tier so "next level" climbs in difficulty', () => {
    const tierRank = (t: string) => TIERS.indexOf(t as (typeof TIERS)[number]);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(tierRank(LEVELS[i]!.tier)).toBeGreaterThanOrEqual(tierRank(LEVELS[i - 1]!.tier));
    }
  });

  it('finds levels by id', () => {
    expect(levelIndexById(LEVELS[3]!.id)).toBe(3);
    expect(levelIndexById('missing')).toBe(-1);
  });
});

describe('progression', () => {
  const done = (...indices: number[]) => new Map(indices.map((i) => [LEVELS[i]!.id, 3] as const));

  it('opens the first level and each level after a completed one', () => {
    expect(isLevelUnlocked(0, new Map())).toBe(true);
    expect(isLevelUnlocked(1, new Map())).toBe(false);
    expect(isLevelUnlocked(1, done(0))).toBe(true);
    expect(isLevelUnlocked(2, done(0))).toBe(false);
    expect(isLevelUnlocked(LEVELS.length, done(0))).toBe(false);
  });

  it('points to the first uncompleted level', () => {
    expect(currentLevelIndex(new Map())).toBe(0);
    expect(currentLevelIndex(done(0, 1))).toBe(2);
    expect(currentLevelIndex(done(...LEVELS.map((_, i) => i)))).toBe(LEVELS.length - 1);
  });
});
