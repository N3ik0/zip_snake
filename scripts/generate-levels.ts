/**
 * Generates the level pack shipped with the Snake app.
 * Deterministic: same config => same file, so the JSON can be reviewed in git.
 *
 *   npm run generate:levels
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Rng } from '@games/core';
import { generatePuzzle, verifyLevel } from '@games/zip-engine';
import type { LevelDefinition, LevelPack, Tier } from '@games/zip-engine';

interface TierConfig {
  readonly tier: Tier;
  readonly prefix: string;
  readonly size: number;
  readonly count: number;
  readonly extraCheckpoints: number;
  readonly wallChance: number;
  readonly seed: number;
}

const TIER_CONFIGS: readonly TierConfig[] = [
  {
    tier: 'easy',
    prefix: 'e',
    size: 5,
    count: 60,
    extraCheckpoints: 3,
    wallChance: 0.1,
    seed: 1_000,
  },
  {
    tier: 'medium',
    prefix: 'm',
    size: 6,
    count: 70,
    extraCheckpoints: 3,
    wallChance: 0.15,
    seed: 2_000,
  },
  {
    tier: 'hard',
    prefix: 'h',
    size: 7,
    count: 70,
    extraCheckpoints: 1,
    wallChance: 0.2,
    seed: 3_000,
  },
];

const MAX_ATTEMPTS_FACTOR = 10;
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../apps/snake/src/levels/levels.json',
);

function generateTier(config: TierConfig): LevelDefinition[] {
  const seen = new Set<string>();
  const candidates: Omit<LevelDefinition, 'id'>[] = [];

  for (let attempt = 0; candidates.length < config.count; attempt++) {
    if (attempt >= config.count * MAX_ATTEMPTS_FACTOR) {
      throw new Error(`Could not generate ${config.count} ${config.tier} levels`);
    }
    const generated = generatePuzzle({
      width: config.size,
      height: config.size,
      rng: new Rng(config.seed + attempt),
      extraCheckpoints: config.extraCheckpoints,
      wallChance: config.wallChance,
    });
    if (!generated) continue;

    const key = generated.solution.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      ...generated.puzzle,
      tier: config.tier,
      solution: generated.solution,
      difficulty: generated.difficulty,
    });
  }

  // Smooth difficulty curve inside a tier: easiest first.
  return candidates
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((level, i) => ({ id: `${config.prefix}-${String(i + 1).padStart(3, '0')}`, ...level }));
}

function main(): void {
  const levels = TIER_CONFIGS.flatMap(generateTier);
  for (const level of levels) {
    const check = verifyLevel(level);
    if (!check.ok) throw new Error(`Level ${level.id} is invalid: ${check.reason}`);
  }
  const pack: LevelPack = { version: 1, levels };
  // One level per line keeps git diffs readable.
  const body = levels.map((l) => `    ${JSON.stringify(l)}`).join(',\n');
  writeFileSync(OUTPUT, `{\n  "version": ${pack.version},\n  "levels": [\n${body}\n  ]\n}\n`);
  console.info(`Wrote ${levels.length} verified levels to ${OUTPUT}`);
}

main();
