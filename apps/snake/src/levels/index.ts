import { parseLevelPack } from '@games/zip-engine';
import type { LevelDefinition, Tier } from '@games/zip-engine';
import type { Progress } from '../storage/progress';
import levelsJson from './levels.json';

// Produced by `npm run generate:levels`; structure checked here, puzzles verified by levels.test.ts.
const pack = parseLevelPack(levelsJson);

export const LEVELS: readonly LevelDefinition[] = pack.levels;

export function levelsByTier(tier: Tier): readonly LevelDefinition[] {
  return LEVELS.filter((level) => level.tier === tier);
}

export function levelIndexById(id: string): number {
  return LEVELS.findIndex((level) => level.id === id);
}

/** Linear progression: a level opens once the previous one is completed. */
export function isLevelUnlocked(index: number, progress: Progress): boolean {
  const level = LEVELS[index];
  if (!level) return false;
  if (index === 0 || progress.has(level.id)) return true;
  const previous = LEVELS[index - 1];
  return previous !== undefined && progress.has(previous.id);
}

/** Index of the first level not completed yet (the one to play next), or the last level. */
export function currentLevelIndex(progress: Progress): number {
  const index = LEVELS.findIndex((level) => !progress.has(level.id));
  return index === -1 ? LEVELS.length - 1 : index;
}
