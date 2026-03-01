import React, { createContext, memo, use, useMemo, useState } from 'react';
import { defaultGrid } from './GridContext';
import { Puzzle } from '@logic-pad/core/data/puzzle';
import { PuzzleFull } from '../online/data';

const defaultPuzzle = {
  title: '',
  description: '',
  author: '',
  difficulty: 1,
  grid: defaultGrid,
  solution: null,
};

export interface OnlinePuzzleContext {
  id: string | null;
  puzzle: PuzzleFull | null;
  lastSaved: Puzzle;
  setLastSaved: (puzzle: Puzzle) => void;
}

const Context = createContext<OnlinePuzzleContext>({
  id: null,
  puzzle: null,
  lastSaved: defaultPuzzle,
  setLastSaved: () => {},
});

export const useOnlinePuzzle = () => {
  return use(Context);
};

export const OnlinePuzzleConsumer = Context.Consumer;

export default memo(function OnlinePuzzleContext({
  children,
  id,
  puzzle,
  initialPuzzle = defaultPuzzle,
}: {
  children: React.ReactNode;
  id: string | null;
  puzzle: PuzzleFull | null;
  initialPuzzle?: Puzzle;
}) {
  const [lastSaved, setLastSaved] = useState<Puzzle>(initialPuzzle);

  const value = useMemo(
    () => ({
      id,
      puzzle,
      lastSaved,
      setLastSaved,
    }),
    [id, lastSaved, puzzle]
  );

  return <Context value={value}>{children}</Context>;
});
