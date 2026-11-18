const STORAGE_KEY = 'zip-snake/progress/v2';
const MAX_STARS = 3;

/** Minimal subset of the Web Storage API, so tests can pass an in-memory fake. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Best star rating per completed level id. */
export type Progress = ReadonlyMap<string, number>;

export interface ProgressStore {
  get(): Progress;
  /** Records a completion; keeps the best rating. Returns the (possibly unchanged) progress. */
  record(levelId: string, stars: number): Progress;
}

/**
 * Completed levels with their best stars, persisted as JSON. Storage can be missing or throw
 * (private mode, quota, WebView quirks): progress then just lives in memory.
 */
export function createProgressStore(storage: KeyValueStorage | undefined): ProgressStore {
  let progress: Progress = read(storage);

  return {
    get: () => progress,
    record(levelId, stars) {
      const clamped = Math.max(1, Math.min(MAX_STARS, Math.round(stars)));
      if ((progress.get(levelId) ?? 0) >= clamped) return progress;
      progress = new Map(progress).set(levelId, clamped);
      write(storage, progress);
      return progress;
    },
  };
}

function read(storage: KeyValueStorage | undefined): Progress {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return new Map();
    return new Map(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          Number.isInteger(entry[1]) && entry[1] >= 1 && entry[1] <= MAX_STARS,
      ),
    );
  } catch {
    return new Map();
  }
}

function write(storage: KeyValueStorage | undefined, progress: Progress): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(progress)));
  } catch (error) {
    console.warn('Progress could not be saved', error);
  }
}

export function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
