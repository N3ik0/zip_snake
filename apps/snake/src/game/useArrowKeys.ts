import type { Direction } from '@games/core';
import { useEffect } from 'react';

const KEY_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Keyboard controls for desktop testing: arrows move the head, Backspace undoes. */
export function useArrowKeys(onMove: (d: Direction) => void, onUndo: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        onMove(direction);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onMove, onUndo]);
}
