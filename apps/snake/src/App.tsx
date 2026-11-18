import { useCallback, useMemo, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { LevelMap } from './components/LevelMap';
import { createFeedback } from './feedback/feedback';
import type { Feedback } from './feedback/feedback';
import { LEVELS, levelsByTier } from './levels';
import { browserStorage, createProgressStore } from './storage/progress';
import type { KeyValueStorage } from './storage/progress';

interface AppProps {
  /** Injectable for tests; defaults to the real browser/WebView implementations. */
  readonly storage?: KeyValueStorage;
  readonly feedback?: Feedback;
}

export function App({ storage, feedback }: AppProps) {
  const store = useMemo(() => createProgressStore(storage ?? browserStorage()), [storage]);
  const fx = useMemo(() => feedback ?? createFeedback(), [feedback]);
  const [progress, setProgress] = useState(() => store.get());
  const [current, setCurrent] = useState<number | null>(null);

  const recordWin = useCallback(
    (id: string, stars: number) => setProgress(store.record(id, stars)),
    [store],
  );

  const level = current === null ? undefined : LEVELS[current];
  if (current === null || !level) {
    return <LevelMap progress={progress} onSelect={setCurrent} />;
  }

  const levelNumber = levelsByTier(level.tier).indexOf(level) + 1;
  const hasNext = current + 1 < LEVELS.length;

  return (
    <GameScreen
      key={level.id}
      level={level}
      levelNumber={levelNumber}
      feedback={fx}
      onSolved={recordWin}
      onBack={() => setCurrent(null)}
      onNext={hasNext ? () => setCurrent(current + 1) : undefined}
    />
  );
}
