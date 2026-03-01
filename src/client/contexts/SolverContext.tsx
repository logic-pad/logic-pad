import React, { createContext, memo, use, useState } from 'react';
import Solver from '@logic-pad/core/data/solver/solver';

interface SolverContext {
  solver: Solver | null;
  setSolver: (value: Solver) => void;
}

const Context = createContext<SolverContext>({
  solver: null,
  setSolver: () => {},
});

export const useSolver = () => {
  return use(Context);
};

export const SolverConsumer = Context.Consumer;

export default memo(function SolverContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [solver, setSolver] = useState<Solver | null>(null);

  return (
    <Context
      value={{
        solver,
        setSolver,
      }}
    >
      {children}
    </Context>
  );
});
