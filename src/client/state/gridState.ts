import { atom, useStore } from 'jotai';
import { GridState, State } from '@logic-pad/core/data/primitives';
import { GridValidator } from '@logic-pad/core/data/validateAsync';
import GridData from '@logic-pad/core/data/grid';
import { useState, useEffect, memo } from 'react';

export const defaultState: GridState = {
  final: State.Incomplete,
  rules: [],
  symbols: new Map(),
};

export const gridStateAtom = atom<GridState>(defaultState);

/**
 * The validator of the enclosing puzzle scope, injected at scope creation.
 * Null in scopes that do not validate (e.g. the share-image renderer).
 */
export const gridValidatorAtom = atom<GridValidator | null>(null);

/**
 * When false, grids in this scope are not validated and the grid state
 * is provided externally (e.g. the share-image renderer).
 */
export const validationEnabledAtom = atom(true);

export const validateGridAtom = atom(
  null,
  (get, _set, grid: GridData, solution: GridData | null) => {
    if (!get(validationEnabledAtom)) return;
    get(gridValidatorAtom)?.validateGrid(grid, solution);
  }
);

export const gridStateScopeAtoms = [gridStateAtom, validationEnabledAtom];

export function useGridValidator() {
  const [validator] = useState(() => new GridValidator());
  useEffect(() => () => validator.delete(), [validator]);
  return validator;
}

export const SubscribeToValidator = memo(function SubscribeToValidator({
  validator,
}: {
  validator: GridValidator;
}) {
  const store = useStore();
  useEffect(
    () => validator.subscribeToState(state => store.set(gridStateAtom, state)),
    [validator, store]
  );
  return null;
});
