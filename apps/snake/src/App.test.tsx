import { directionBetween } from '@games/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Feedback } from './feedback/feedback';
import { LEVELS } from './levels';
import type { KeyValueStorage } from './storage/progress';

const ARROW_KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

function setup() {
  const data = new Map<string, string>();
  const storage: KeyValueStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
  const feedback: Feedback = { step: vi.fn(), fruit: vi.fn(), win: vi.fn() };
  render(<App storage={storage} feedback={feedback} />);
  return { feedback };
}

/** Plays a level's stored solution with the keyboard, like a desktop player would. */
function playMoves(solution: readonly number[], width: number, from = 0) {
  const size = { width, height: Math.ceil(solution.length / width) };
  if (from === 0) fireEvent.keyDown(window, { key: 'ArrowRight' }); // places the snake on 1
  for (let i = Math.max(1, from); i < solution.length; i++) {
    const direction = directionBetween(size, solution[i - 1]!, solution[i]!);
    if (!direction) throw new Error('solution is not a path');
    fireEvent.keyDown(window, { key: ARROW_KEYS[direction] });
  }
}

const node = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}(,|$)`) });
const filled = () => screen.getByRole('img').getAttribute('aria-label');

describe('App', () => {
  it('shows the map with zones, only the first level unlocked', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Zip Snake' })).toBeTruthy();
    expect((node('Meadow 1') as HTMLButtonElement).disabled).toBe(false);
    expect((node('Meadow 2') as HTMLButtonElement).disabled).toBe(true);
    expect((node('Orchard 1') as HTMLButtonElement).disabled).toBe(true);
    expect(node('Jungle 1')).toBeTruthy();
  });

  it('plays a level end to end: solve, 3 stars, feedback, unlock, next level', () => {
    const { feedback } = setup();
    const level = LEVELS[0]!;

    fireEvent.click(node('Meadow 1'));
    expect(filled()).toMatch(/0 of 25 squares/);

    playMoves(level.solution, level.width);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText('3 of 3 stars')).toBeTruthy();
    expect(feedback.win).toHaveBeenCalledTimes(1);
    expect(feedback.fruit).toHaveBeenCalled();
    expect(feedback.step).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Next level' }));
    expect(screen.getByRole('heading', { name: 'Level 2' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Levels' }));
    expect(node('Meadow 1').className).toContain('map-node--done');
    expect((node('Meadow 2') as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByLabelText('3 stars collected')).toBeTruthy();
  });

  it('gives hints that cost a star', () => {
    setup();
    const level = LEVELS[0]!;
    fireEvent.click(node('Meadow 1'));

    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(filled()).toMatch(/1 of 25/);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(filled()).toMatch(/2 of 25/);

    playMoves(level.solution, level.width, 2);
    expect(screen.getByLabelText('1 of 3 stars')).toBeTruthy();
  });

  it('supports undo and restart', () => {
    setup();
    fireEvent.click(node('Meadow 1'));
    const level = LEVELS[0]!;
    playMoves(level.solution.slice(0, 4), level.width);
    expect(filled()).toMatch(/4 of 25/);

    fireEvent.click(screen.getByRole('button', { name: /Undo/ }));
    expect(filled()).toMatch(/3 of 25/);

    fireEvent.click(screen.getByRole('button', { name: /Restart/ }));
    expect(filled()).toMatch(/0 of 25/);
  });
});
