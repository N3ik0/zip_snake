import { cellCount, neighbors } from '@games/core';
import type { GridSize, Rng } from '@games/core';

/**
 * Random Hamiltonian path on an open grid using the "backbite" algorithm:
 * start from a serpentine path, then repeatedly connect an end to one of its
 * grid neighbours and reverse the tail. Every step keeps a valid path.
 */
export function randomHamiltonianPath(size: GridSize, rng: Rng, iterations?: number): number[] {
  const count = cellCount(size);
  const path = serpentine(size);
  const steps = iterations ?? count * 30;

  for (let i = 0; i < steps; i++) {
    if (rng.chance(0.5)) path.reverse();
    backbite(size, path, rng);
  }
  return path;
}

function serpentine(size: GridSize): number[] {
  const path: number[] = [];
  for (let y = 0; y < size.height; y++) {
    for (let i = 0; i < size.width; i++) {
      const x = y % 2 === 0 ? i : size.width - 1 - i;
      path.push(y * size.width + x);
    }
  }
  return path;
}

/** Applies one backbite move on the last cell of the path (in place). */
function backbite(size: GridSize, path: number[], rng: Rng): void {
  const last = path.length - 1;
  const end = path[last] as number;
  const target = rng.pick(neighbors(size, end));
  const j = path.indexOf(target);
  if (j === last - 1) return; // already the previous cell: no-op
  reverseRange(path, j + 1, last);
}

function reverseRange(items: number[], from: number, to: number): void {
  for (let i = from, k = to; i < k; i++, k--) {
    [items[i], items[k]] = [items[k] as number, items[i] as number];
  }
}
