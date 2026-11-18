import type { GridSize } from '@games/core';
import { cellCenter } from './geometry';

interface FruitsProps {
  readonly size: GridSize;
  readonly checkpoints: readonly number[];
  /** Fruits already eaten (they become small badges on the snake). */
  readonly eaten: number;
}

/** Glossy apples for the fruits still to eat; small number badges for eaten ones. */
export function Fruits({ size, checkpoints, eaten }: FruitsProps) {
  return (
    <g>
      {checkpoints.map((cell, order) => {
        const { x, y } = cellCenter(size, cell);
        const label = order + 1;
        if (order < eaten) {
          return (
            <g key={cell} transform={`translate(${x} ${y})`} className="badge">
              <circle r={15} className="badge__disc" />
              <text className="badge__label" dy="0.36em">
                {label}
              </text>
            </g>
          );
        }
        return (
          <g key={cell} transform={`translate(${x} ${y})`}>
            {/* Inner group: CSS animations must not override the positioning transform above. */}
            <g className={order === eaten ? 'apple apple--next' : 'apple'}>
              <ellipse cy={27} rx={22} ry={7} className="apple__shadow" />
              <circle r={30} fill="url(#apple)" className="apple__body" />
              <ellipse
                cx={-11}
                cy={-12}
                rx={8}
                ry={5}
                transform="rotate(-35 -11 -12)"
                className="apple__shine"
              />
              <path d="M2 -28 q2 -10 -3 -16" className="apple__stem" />
              <path d="M3 -36 q12 -10 22 -2 q-12 8 -22 2z" className="apple__leaf" />
              <text className="apple__label" dy="0.36em">
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
