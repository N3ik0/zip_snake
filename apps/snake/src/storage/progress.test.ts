import { describe, expect, it, vi } from 'vitest';
import { createProgressStore } from './progress';
import type { KeyValueStorage } from './progress';

const KEY = 'zip-snake/progress/v2';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

describe('progress store', () => {
  it('persists ratings across instances', () => {
    const storage = memoryStorage();
    createProgressStore(storage).record('e-001', 2);
    expect(createProgressStore(storage).get().get('e-001')).toBe(2);
  });

  it('keeps the best rating and returns the same map when nothing improves', () => {
    const store = createProgressStore(memoryStorage());
    const first = store.record('a', 2);
    expect(store.record('a', 1)).toBe(first);
    expect(store.record('a', 2)).toBe(first);
    expect(store.record('a', 3).get('a')).toBe(3);
  });

  it('clamps ratings to 1..3', () => {
    const store = createProgressStore(memoryStorage());
    expect(store.record('a', 0).get('a')).toBe(1);
    expect(store.record('b', 9).get('b')).toBe(3);
  });

  it('ignores corrupted or malformed data', () => {
    expect(createProgressStore(memoryStorage({ [KEY]: '{not json' })).get().size).toBe(0);
    expect(createProgressStore(memoryStorage({ [KEY]: '[1,2]' })).get().size).toBe(0);
    const mixed = memoryStorage({ [KEY]: '{"a":2,"b":"3","c":7,"d":1.5}' });
    expect([...createProgressStore(mixed).get()]).toEqual([['a', 2]]);
  });

  it('keeps working in memory when storage is missing or throws', () => {
    expect(createProgressStore(undefined).record('a', 3).get('a')).toBe(3);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(createProgressStore(broken).record('a', 3).get('a')).toBe(3);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
