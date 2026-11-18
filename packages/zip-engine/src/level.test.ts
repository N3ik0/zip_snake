import { describe, expect, it } from 'vitest';
import { InvalidLevelPackError, parseLevelPack, verifyLevel } from './level';
import type { LevelDefinition } from './level';

const base: LevelDefinition = {
  id: 'test-1',
  tier: 'easy',
  width: 3,
  height: 3,
  // 0 1 2 / 3 4 5 / 6 7 8 — numbers on 0, 1, 4, 8 leave only the serpentine route.
  checkpoints: [0, 1, 4, 8],
  walls: [],
  solution: [0, 1, 2, 5, 4, 3, 6, 7, 8],
  difficulty: 1,
};

describe('verifyLevel', () => {
  it('accepts a valid unique level', () => {
    expect(verifyLevel(base)).toEqual({ ok: true });
  });

  it('rejects a wrong stored solution', () => {
    const level = { ...base, solution: [0, 1, 2, 5, 8, 7, 4, 3, 6] };
    expect(verifyLevel(level)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('legal'),
    });
  });

  it('rejects an ambiguous level', () => {
    const level = { ...base, checkpoints: [0, 8] };
    expect(verifyLevel(level)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('several'),
    });
  });

  it('rejects a malformed level without throwing', () => {
    const level = { ...base, checkpoints: [0, 42] };
    expect(verifyLevel(level)).toMatchObject({ ok: false });
  });
});

describe('parseLevelPack', () => {
  it('round-trips a valid pack', () => {
    const json: unknown = JSON.parse(JSON.stringify({ version: 1, levels: [base] }));
    expect(parseLevelPack(json)).toEqual({ version: 1, levels: [base] });
  });

  it.each([
    [null, 'version'],
    [{ version: 2, levels: [] }, 'version'],
    [{ version: 1, levels: [{ ...base, tier: 'expert' }] }, 'tier'],
    [{ version: 1, levels: [{ ...base, walls: [[1, 2, 3]] }] }, 'walls'],
    [{ version: 1, levels: [{ ...base, checkpoints: ['0'] }] }, 'checkpoints'],
    [{ version: 1, levels: [{ ...base, id: 3 }] }, 'id'],
  ])('rejects malformed input (%#)', (raw, field) => {
    expect(() => parseLevelPack(raw)).toThrow(InvalidLevelPackError);
    expect(() => parseLevelPack(raw)).toThrow(field);
  });
});
