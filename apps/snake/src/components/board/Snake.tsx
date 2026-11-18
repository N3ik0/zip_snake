import { directionBetween } from '@games/core';
import type { Direction, GridSize, Point } from '@games/core';
import { mixColor } from './color';
import { cellCenter } from './geometry';

const TAIL_COLOR = '#47d1a0';
const HEAD_COLOR = '#0b8a5f';
const SHADOW_OFFSET = 9;
const ANGLE: Readonly<Record<Direction, number>> = { right: 0, down: 90, left: 180, up: -90 };

interface SnakeProps {
  readonly size: GridSize;
  readonly path: readonly number[];
  /** Cell the snake is looking at (next fruit), if any. */
  readonly target: number | undefined;
  readonly happy: boolean;
}

const toPoints = (points: readonly Point[], dy = 0) =>
  points.map((p) => `${p.x},${p.y + dy}`).join(' ');

/**
 * The hero of the game. Opaque body segments go from a pale tail to a deep jade head;
 * translucent layers (shadow, gloss) are single polylines so joints never darken.
 */
export function Snake({ size, path, target, happy }: SnakeProps) {
  if (path.length === 0) return null;
  const points = path.map((cell) => cellCenter(size, cell));
  const head = points[points.length - 1] as Point;
  const segmentCount = points.length - 1;
  const tone = (i: number) => mixColor(TAIL_COLOR, HEAD_COLOR, segmentCount ? i / segmentCount : 1);
  const direction =
    path.length > 1
      ? (directionBetween(size, path[path.length - 2] as number, path[path.length - 1] as number) ??
        'right')
      : 'right';

  return (
    <g className="snake">
      {segmentCount > 0 && (
        <>
          <polyline points={toPoints(points, SHADOW_OFFSET)} className="snake__shadow" />
          <polyline points={toPoints(points)} className="snake__outline" />
          {points.slice(1).map((to, i) => {
            const from = points[i] as Point;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={tone(i)}
                className="snake__body"
              />
            );
          })}
          <polyline points={toPoints(points)} className="snake__gloss" />
          {points
            .slice(0, -1)
            .map((p, i) =>
              i % 2 === 1 ? (
                <circle key={`scale${i}`} cx={p.x} cy={p.y} r={7} className="snake__scale" />
              ) : null,
            )}
        </>
      )}
      <Head
        center={head}
        direction={direction}
        target={target === undefined ? undefined : cellCenter(size, target)}
        happy={happy}
      />
    </g>
  );
}

function rotate(v: Point, degrees: number): Point {
  const r = (degrees * Math.PI) / 180;
  return { x: v.x * Math.cos(r) - v.y * Math.sin(r), y: v.x * Math.sin(r) + v.y * Math.cos(r) };
}

interface HeadProps {
  readonly center: Point;
  readonly direction: Direction;
  readonly target: Point | undefined;
  readonly happy: boolean;
}

function Head({ center, direction, target, happy }: HeadProps) {
  const angle = ANGLE[direction];
  // Pupils glance toward the next fruit, in screen space.
  const look = target
    ? { x: target.x - center.x, y: target.y - center.y }
    : rotate({ x: 1, y: 0 }, angle);
  const length = Math.hypot(look.x, look.y) || 1;
  const pupil = { x: (look.x / length) * 5, y: (look.y / length) * 5 };
  const eyes = [rotate({ x: 10, y: -17 }, angle), rotate({ x: 10, y: 17 }, angle)];

  return (
    <g transform={`translate(${center.x} ${center.y})`} className="snake-head">
      <g transform={`rotate(${angle})`}>
        <g className="snake-head__tongue">
          <path d="M38 0 h16 l7 -6 M54 0 l7 6" />
        </g>
        <ellipse rx={44} ry={38} className="snake-head__outline" />
        <ellipse rx={40} ry={34} fill="url(#snake-head)" />
        <circle cx={30} cy={-8} r={2.6} className="snake-head__nostril" />
        <circle cx={30} cy={8} r={2.6} className="snake-head__nostril" />
        <ellipse cx={-6} cy={-26} rx={7} ry={4} className="snake-head__cheek" />
        <ellipse cx={-6} cy={26} rx={7} ry={4} className="snake-head__cheek" />
      </g>
      {eyes.map((e) =>
        happy ? (
          <path
            key={`${e.x},${e.y}`}
            d={`M${e.x - 8} ${e.y + 3} q8 -10 16 0`}
            className="snake-head__happy"
          />
        ) : (
          <g key={`${e.x},${e.y}`} transform={`translate(${e.x} ${e.y})`}>
            <circle r={12} className="snake-head__eye" />
            <circle cx={pupil.x} cy={pupil.y} r={6.5} className="snake-head__pupil" />
            <circle cx={pupil.x - 2} cy={pupil.y - 3} r={2.2} className="snake-head__glint" />
          </g>
        ),
      )}
    </g>
  );
}
