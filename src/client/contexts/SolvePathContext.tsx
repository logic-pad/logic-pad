import React, { createContext, memo, use, useState } from 'react';
import { Position } from '@logic-pad/core/data/primitives';

interface SolvePathContext {
  solvePath: Position[];
  setSolvePath: (solvePath: Position[]) => void;
  visualizeSolvePath: boolean;
  setVisualizeSolvePath: (visualizeSolvePath: boolean) => void;
}

const Context = createContext<SolvePathContext>({
  solvePath: [],
  setSolvePath: () => {},
  visualizeSolvePath: false,
  setVisualizeSolvePath: () => {},
});

export const useSolvePath = () => {
  return use(Context);
};

export const SolvePathConsumer = Context.Consumer;

export interface SolvePathContextProps {
  children: React.ReactNode;
  solvePath?: Position[];
  setSolvePath?: (solvePath: Position[]) => void;
}

export default memo(function SolvePathContext({
  children,
  solvePath: externalSolvePath,
  setSolvePath: setExternalSolvePath,
}: SolvePathContextProps) {
  const [internalSolvePath, setInternalSolvePath] = useState<Position[]>([]);
  const [visualizeSolvePath, setVisualizeSolvePath] = useState<boolean>(false);

  return (
    <Context
      value={{
        solvePath: externalSolvePath ?? internalSolvePath,
        setSolvePath: setExternalSolvePath ?? setInternalSolvePath,
        visualizeSolvePath,
        setVisualizeSolvePath,
      }}
    >
      {children}
    </Context>
  );
});
