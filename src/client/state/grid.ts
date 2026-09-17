import { atom } from 'jotai';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { invokeSetGrid } from '@logic-pad/core/data/events/onSetGrid';
import { recordEditAtom } from './editHistory';
import { validateGridAtom } from './gridState';

export const defaultGrid = GridData.create(5, 4);

export const defaultMetadata: PuzzleMetadata = {
  title: '',
  author: '',
  description: '',
  difficulty: 1,
};

export const puzzleMetadata = (puzzle: Puzzle): PuzzleMetadata => {
  const { grid: _grid, solution: _solution, ...metadata } = puzzle;
  return metadata;
};

export const gridAtom = atom<GridData>(defaultGrid);
export const solutionAtom = atom<GridData | null>(null);
export const metadataAtom = atom<PuzzleMetadata>(defaultMetadata);

/**
 * Sets the grid without recording edit history.
 * Returns the grid actually set (after onSetGrid event handlers).
 */
export const setGridRawAtom = atom(
  null,
  (get, set, newGrid: GridData, sol?: GridData | null) => {
    const grid = get(gridAtom);
    const solution = get(solutionAtom);
    newGrid = invokeSetGrid(grid, newGrid, sol === undefined ? solution : sol);
    set(gridAtom, newGrid);
    if (sol !== undefined) set(solutionAtom, sol);
    set(validateGridAtom, newGrid, sol === undefined ? solution : sol);
    return newGrid;
  }
);

/**
 * Sets the grid and records the edit in history.
 */
export const setGridAtom = atom(
  null,
  (_get, set, newGrid: GridData, sol?: GridData | null) => {
    const applied = set(setGridRawAtom, newGrid, sol);
    set(recordEditAtom, applied);
  }
);

export const gridScopeAtoms = [gridAtom, solutionAtom, metadataAtom];

/**
 * A snapshot of the current grid and its setter, passed to tile click
 * handlers so they always read fresh state at event time.
 */
export interface GridActions {
  grid: GridData;
  setGrid: (value: GridData, solution?: GridData | null) => void;
}
