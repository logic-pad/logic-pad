import GridData from '@logic-pad/core/data/grid';
import { Color, Position } from '@logic-pad/core/data/primitives';
import { useCallback, useEffect, useState } from 'react';

export interface Deduction {
  x: number;
  y: number;
  color: Color;
}

export function deductedCells(before: GridData, after: GridData): Deduction[] {
  const cells: Deduction[] = [];
  for (let y = 0; y < after.height; y++) {
    for (let x = 0; x < after.width; x++) {
      const was = before.getTile(x, y);
      const now = after.getTile(x, y);
      if (now.exists && was.color !== now.color) {
        cells.push({ x, y, color: now.color });
      }
    }
  }
  return cells;
}

export function tilesSyntax(cells: readonly Position[]): string {
  return `(${cells.map(c => `${c.x},${c.y}`).join(';')})`;
}

const COUNTDOWN_TICK = 100;

export interface Countdown {
  /** Counts from 0 to 1 as the deadline approaches; 1 when idle. */
  progress: number;
  /** Begin a new countdown of the configured duration. */
  start: () => void;
  /** Cancel the countdown; progress immediately becomes 1. */
  stop: () => void;
}

/**
 * A countdown timer that owns its deadline internally. Pass `autoStart` to
 * begin counting down on mount.
 */
export function useCountdown(duration: number, autoStart = false): Countdown {
  const [end, setEnd] = useState<number | null>(() =>
    autoStart ? Date.now() + duration : null
  );
  const [progress, setProgress] = useState(autoStart ? 0 : 1);

  useEffect(() => {
    if (end === null) return;
    const update = () => {
      const value = Math.min(1, 1 - (end - Date.now()) / duration);
      setProgress(value);
      return value >= 1;
    };
    if (update()) return;
    const timer = setInterval(() => {
      if (update()) clearInterval(timer);
    }, COUNTDOWN_TICK);
    return () => clearInterval(timer);
  }, [end, duration]);

  const start = useCallback(() => setEnd(Date.now() + duration), [duration]);
  const stop = useCallback(() => {
    setEnd(null);
    setProgress(1);
  }, []);

  return { progress, start, stop };
}

export type Status =
  | 'solving'
  | 'found'
  | 'revealed'
  | 'error'
  | 'unsolvable'
  | 'unavailable'
  | null;

export function statusToText(status: Status, coolingDown: boolean): string {
  switch (status) {
    case 'solving':
      return 'Solving...';
    case 'found':
      return 'Insight found';
    case 'revealed':
      return 'Insight available';
    case 'error':
      return 'Unexpected error';
    case 'unsolvable':
      return 'Puzzle is unsolvable';
    case 'unavailable':
      return 'No insights available';
    default:
      return coolingDown ? 'Insights not yet available' : 'Get insights';
  }
}
