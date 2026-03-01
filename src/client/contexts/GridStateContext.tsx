import React, {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { GridState, State } from '@logic-pad/core/data/primitives';
import { GridValidator } from '@logic-pad/core/data/validateAsync';
import GridData from '@logic-pad/core/data/grid';

interface GridStateContext {
  state: GridState;
  setState: (value: GridState) => void;
  validateGrid: (grid: GridData, solution: GridData | null) => void;
  gridValidator: GridValidator;
}

export const defaultState: GridState = {
  final: State.Incomplete,
  rules: [],
  symbols: new Map(),
};

const Context = createContext<GridStateContext>({
  state: defaultState,
  setState: () => {},
  validateGrid: () => {},
  gridValidator: new GridValidator(),
});

export const useGridState = () => {
  return use(Context);
};

export const GridStateConsumer = Context.Consumer;

export default memo(function GridStateContext({
  children,
  state: externalState,
  setState: setExternalState,
}: {
  children: React.ReactNode;
  state?: GridState;
  setState?: (value: GridState) => void;
}) {
  const [internalState, setInternalState] = useState(defaultState);

  const state = externalState ?? internalState;
  const setState = setExternalState ?? setInternalState;

  const [gridValidator, setGridValidator] = useState<GridValidator>(
    () => new GridValidator()
  );

  useEffect(() => {
    const validator = new GridValidator();
    validator.subscribeToState(newState => setState(newState));
    setGridValidator(validator);
    return () => {
      validator.delete();
    };
  }, [setState]);

  const validateGrid = useCallback(
    (grid: GridData, solution: GridData | null) => {
      gridValidator.validateGrid(grid, solution);
    },
    [gridValidator]
  );

  return (
    <Context
      value={{
        state,
        setState,
        validateGrid,
        gridValidator,
      }}
    >
      {children}
    </Context>
  );
});
