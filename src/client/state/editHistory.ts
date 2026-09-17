import { atom } from 'jotai';
import GridData from '@logic-pad/core/data/grid';

const MAX_HISTORY = 200;

export const undoStackAtom = atom<GridData[]>([]);
export const redoStackAtom = atom<GridData[]>([]);
export const lastGridAtom = atom<GridData | null>(null);

const pushStack = (stack: GridData[], grid: GridData) => {
  if (stack[stack.length - 1] === grid) return stack;
  const trimmed = stack.length > MAX_HISTORY ? stack.slice(1) : stack;
  return [...trimmed, grid];
};

export const recordEditAtom = atom(null, (get, set, grid: GridData) => {
  const lastGrid = get(lastGridAtom);
  if (lastGrid === null) {
    set(lastGridAtom, grid);
    return;
  }
  if (lastGrid.equals(grid)) return;
  set(undoStackAtom, stack => pushStack(stack, lastGrid));
  set(lastGridAtom, grid);
  set(redoStackAtom, []);
});

/**
 * Pops the undo stack and returns the grid to restore, or undefined if there is nothing to undo.
 */
export const undoAtom = atom(null, (get, set, grid: GridData) => {
  const undoStack = get(undoStackAtom);
  const last = undoStack[undoStack.length - 1];
  if (!last) return undefined;
  set(undoStackAtom, undoStack.slice(0, -1));
  set(redoStackAtom, stack => pushStack(stack, grid));
  set(lastGridAtom, last);
  return last;
});

/**
 * Pops the redo stack and returns the grid to restore, or undefined if there is nothing to redo.
 */
export const redoAtom = atom(null, (get, set, grid: GridData) => {
  const redoStack = get(redoStackAtom);
  const next = redoStack[redoStack.length - 1];
  if (!next) return undefined;
  set(redoStackAtom, redoStack.slice(0, -1));
  set(undoStackAtom, stack => pushStack(stack, grid));
  set(lastGridAtom, next);
  return next;
});

export const clearHistoryAtom = atom(null, (_get, set, grid: GridData) => {
  set(undoStackAtom, []);
  set(redoStackAtom, []);
  set(lastGridAtom, grid);
});

export const editHistoryScopeAtoms = [
  undoStackAtom,
  redoStackAtom,
  lastGridAtom,
];
