import React, { createContext, memo, use, useState } from 'react';
import GridData from '@logic-pad/core/data/grid';

interface EditContext {
  undoStack: GridData[];
  redoStack: GridData[];
  undo: (grid: GridData) => GridData | undefined;
  redo: (grid: GridData) => GridData | undefined;
  recordEdit: (grid: GridData) => void;
  clearHistory: (grid: GridData) => void;
}

const Context = createContext<EditContext>({
  undoStack: [],
  redoStack: [],
  undo: () => undefined,
  redo: () => undefined,
  recordEdit: () => {},
  clearHistory: () => {},
});

export const useEdit = () => {
  return use(Context);
};

export const EditConsumer = Context.Consumer;

export default memo(function EditContext({
  children,
  initialGrid = null,
}: {
  children: React.ReactNode;
  initialGrid?: GridData | null;
}) {
  const [undoStack, setUndoStack] = useState<GridData[]>([]);
  const [redoStack, setRedoStack] = useState<GridData[]>([]);
  const [lastGrid, setLastGrid] = useState<GridData | null>(initialGrid);

  const addToUndoStack = (grid: GridData) => {
    setUndoStack(stack => {
      if (stack[stack.length - 1] === grid) return stack;
      if (stack.length > 200) stack.shift();
      return [...stack, grid];
    });
  };

  const addToRedoStack = (grid: GridData) => {
    setRedoStack(stack => {
      if (stack[stack.length - 1] === grid) return stack;
      if (stack.length > 200) stack.shift();
      return [...stack, grid];
    });
  };

  const recordEdit = (grid: GridData) => {
    if (lastGrid === null) {
      setLastGrid(grid);
      return;
    }
    if (lastGrid.equals(grid)) return;
    addToUndoStack(lastGrid);
    setLastGrid(grid);
    setRedoStack([]);
  };

  const undo = (grid: GridData) => {
    const last = undoStack.pop();
    if (!last) return;
    addToRedoStack(grid);
    setLastGrid(last);
    return last;
  };

  const redo = (grid: GridData) => {
    const next = redoStack.pop();
    if (!next) return;
    addToUndoStack(grid);
    setLastGrid(next);
    return next;
  };

  const clearHistory = (grid: GridData) => {
    setUndoStack([]);
    setRedoStack([]);
    setLastGrid(grid);
  };

  return (
    <Context
      value={{
        undoStack,
        redoStack,
        undo,
        redo,
        recordEdit,
        clearHistory,
      }}
    >
      {children}
    </Context>
  );
});
