import { TIERS } from '@games/zip-engine';
import type { Tier } from '@games/zip-engine';
import { useEffect, useRef } from 'react';
import { COPY } from '../copy';
import { currentLevelIndex, isLevelUnlocked, levelIndexById, levelsByTier } from '../levels';
import type { Progress } from '../storage/progress';
import { LockIcon, Star } from './icons';

interface LevelMapProps {
  readonly progress: Progress;
  readonly onSelect: (levelIndex: number) => void;
}

/** Trail layout, in a 400-wide coordinate space scaled to the screen. */
const MAP_WIDTH = 400;
const COLUMNS = [64, 157, 243, 336];
const ROW_HEIGHT = 104;
const TOP = 56;

interface Node {
  readonly x: number;
  readonly y: number;
}

/** Boustrophedon placement: left-to-right, then right-to-left, like a snake. */
function nodePosition(i: number): Node {
  const row = Math.floor(i / COLUMNS.length);
  const col = i % COLUMNS.length;
  const x = COLUMNS[row % 2 === 0 ? col : COLUMNS.length - 1 - col] as number;
  return { x, y: TOP + row * ROW_HEIGHT };
}

/** Straight runs along a row, round U-turns at the row ends. */
function trailPath(nodes: readonly Node[]): string {
  return nodes
    .map((n, i) => {
      if (i === 0) return `M${n.x} ${n.y}`;
      const prev = nodes[i - 1] as Node;
      if (prev.y === n.y) return `L${n.x} ${n.y}`;
      const bulge = n.x > MAP_WIDTH / 2 ? 58 : -58;
      return `C${prev.x + bulge} ${prev.y} ${n.x + bulge} ${n.y} ${n.x} ${n.y}`;
    })
    .join(' ');
}

export function LevelMap({ progress, onSelect }: LevelMapProps) {
  const current = currentLevelIndex(progress);
  const currentRef = useRef<HTMLButtonElement>(null);
  const stars = [...progress.values()].reduce((sum, s) => sum + s, 0);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'center' });
  }, []);

  return (
    <main className="screen map">
      <header className="map__header">
        <Logo />
        <h1 className="map__title">{COPY.title}</h1>
        <p className="map__tagline">{COPY.tagline}</p>
        <p className="pill" aria-label={`${stars} stars collected`}>
          <Star filled size={18} /> {stars}
        </p>
      </header>

      {TIERS.map((tier) => (
        <Zone
          key={tier}
          tier={tier}
          progress={progress}
          current={current}
          currentRef={currentRef}
          onSelect={onSelect}
        />
      ))}
    </main>
  );
}

interface ZoneProps {
  readonly tier: Tier;
  readonly progress: Progress;
  readonly current: number;
  readonly currentRef: React.RefObject<HTMLButtonElement | null>;
  readonly onSelect: (levelIndex: number) => void;
}

function Zone({ tier, progress, current, currentRef, onSelect }: ZoneProps) {
  const levels = levelsByTier(tier);
  const nodes = levels.map((_, i) => nodePosition(i));
  const height = (nodes[nodes.length - 1]?.y ?? 0) + TOP;
  const indices = levels.map((level) => levelIndexById(level.id));
  const reachedInZone = indices.filter((i) => i <= current).length;
  const done = levels.filter((l) => progress.has(l.id)).length;

  return (
    <section className={`zone zone--${tier}`} aria-label={COPY.zones[tier]}>
      <h2 className="zone__title">
        {COPY.zones[tier]}
        <span className="zone__count">
          {done}/{levels.length}
        </span>
      </h2>
      <div className="zone__trail" style={{ aspectRatio: `${MAP_WIDTH} / ${height}` }}>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${height}`} className="trail" aria-hidden="true">
          <path d={trailPath(nodes)} className="trail__ground" />
          <path d={trailPath(nodes)} className="trail__dashes" />
          {reachedInZone > 1 && (
            <path d={trailPath(nodes.slice(0, reachedInZone))} className="trail__done" />
          )}
        </svg>
        {levels.map((level, i) => {
          const index = indices[i] as number;
          const node = nodes[i] as Node;
          const unlocked = isLevelUnlocked(index, progress);
          const rating = progress.get(level.id);
          const isCurrent = index === current;
          const state = rating ? 'done' : isCurrent ? 'current' : unlocked ? 'open' : 'locked';
          return (
            <button
              key={level.id}
              ref={isCurrent ? currentRef : undefined}
              type="button"
              className={`map-node map-node--${state}`}
              style={{ left: `${(node.x / MAP_WIDTH) * 100}%`, top: `${(node.y / height) * 100}%` }}
              aria-label={`${COPY.zones[tier]} ${i + 1}${unlocked ? '' : `, ${COPY.levelLocked}`}`}
              disabled={!unlocked}
              onClick={() => onSelect(index)}
            >
              {unlocked ? <span className="map-node__number">{i + 1}</span> : <LockIcon />}
              {rating !== undefined && (
                <span className="map-node__stars">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} filled={s <= rating} size={13} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Logo() {
  return (
    <svg className="map__logo" viewBox="0 0 120 64" aria-hidden="true">
      <path d="M12 46 Q30 12 52 34 T92 30" className="logo__body" />
      <circle cx="98" cy="28" r="15" className="logo__head" />
      <circle cx="101" cy="22" r="4.5" fill="#fff" />
      <circle cx="102" cy="22" r="2.4" fill="#10251b" />
      <circle cx="22" cy="18" r="9" className="logo__apple" />
    </svg>
  );
}
