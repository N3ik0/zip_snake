import type { Tier } from '@games/zip-engine';

/** All user-facing text in one place, ready for translation. */
export const COPY = {
  title: 'Zip Snake',
  tagline: 'Eat the fruits in order. Fill every square.',
  /** Each difficulty tier is a zone of the garden. */
  zones: { easy: 'Meadow', medium: 'Orchard', hard: 'Jungle' } satisfies Record<Tier, string>,
  level: (n: number) => `Level ${n}`,
  levelLocked: 'Locked',
  back: 'Levels',
  undo: 'Undo',
  restart: 'Restart',
  hint: 'Hint',
  squares: (filled: number, total: number) => `${filled}/${total} squares`,
  solvedTitle: 'Level complete',
  starsLabel: (n: number) => `${n} of 3 stars`,
  next: 'Next level',
  allDone: 'Every level cleared. More coming soon.',
  deadEnd: 'Last fruit eaten too early. Drag back to free some squares.',
  howTo: 'Drag from fruit 1 through every square.',
} as const;
