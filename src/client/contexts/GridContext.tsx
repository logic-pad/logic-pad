import React, { createContext, memo, use, useEffect, useState } from 'react';
import GridData from '@logic-pad/core/data/grid';
import { useEdit } from './EditContext.tsx';
import { PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { useGridState } from './GridStateContext.tsx';
import { invokeSetGrid } from '@logic-pad/core/data/events/onSetGrid';

export interface GridContext {
  grid: GridData;
  solution: GridData | null;
  metadata: PuzzleMetadata;
  setGrid: (value: GridData, solution?: GridData | null) => void;
  setGridRaw: (value: GridData, solution?: GridData | null) => void;
  setMetadata: (value: PuzzleMetadata) => void;
}

export const defaultGrid = GridData.create(5, 4);
const defaultMetadata: PuzzleMetadata = {
  title: '',
  author: '',
  description: '',
  difficulty: 1,
};

const Context = createContext<GridContext>({
  grid: defaultGrid,
  solution: null,
  metadata: defaultMetadata,
  setGrid: () => {},
  setGridRaw: () => {},
  setMetadata: () => {},
});

export const useGrid = () => {
  return use(Context);
};

export const GridConsumer = Context.Consumer;

export interface GridContextProps {
  children: React.ReactNode;
  initialGrid?: GridData | (() => GridData);
  initialSolution?: GridData | null | (() => GridData | null);
  initialMetadata?: PuzzleMetadata | (() => PuzzleMetadata);
  grid?: GridData;
  setGrid?: (value: GridData) => void;
  metadata?: PuzzleMetadata;
  setMetadata?: (value: PuzzleMetadata) => void;
}

export default memo(function GridContext({
  children,
  initialGrid,
  initialSolution,
  initialMetadata,
  grid: externalGrid,
  setGrid: setExternalGrid,
  metadata: externalMetadata,
  setMetadata: setExternalMetadata,
}: GridContextProps) {
  const { recordEdit, clearHistory } = useEdit();
  const { validateGrid } = useGridState();

  const [internalGrid, setInternalGrid] = useState(initialGrid ?? defaultGrid);
  const [solution, setSolution] = useState<GridData | null>(
    initialSolution === undefined ? null : initialSolution
  );
  const [internalMetadata, setInternalMetadata] = useState<PuzzleMetadata>(
    initialMetadata ?? defaultMetadata
  );

  const grid = externalGrid ?? internalGrid;
  const setGrid = setExternalGrid ?? setInternalGrid;
  const metadata = externalMetadata ?? internalMetadata;
  const setMetadata = setExternalMetadata ?? setInternalMetadata;

  useEffect(() => {
    clearHistory(grid);
    validateGrid(grid, solution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateGrid]);

  const setGridRaw = (newGrid: GridData, sol?: GridData | null) => {
    newGrid = invokeSetGrid(grid, newGrid, sol === undefined ? solution : sol);
    setGrid(newGrid);
    if (sol !== undefined) setSolution(sol);
    validateGrid(newGrid, sol === undefined ? solution : sol);
    return newGrid;
  };

  return (
    <Context
      value={{
        grid,
        solution,
        metadata,
        setGrid: (grid, sol) => {
          recordEdit(setGridRaw(grid, sol));
        },
        setGridRaw,
        setMetadata,
      }}
    >
      {children}
    </Context>
  );
});
