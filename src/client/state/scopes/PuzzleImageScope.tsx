import { GridState } from '@logic-pad/core/data/primitives';
import { PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { GridData } from '@logic-pad/core/index';
import { ScopeProvider } from 'jotai-scope';
import { memo, ReactNode } from 'react';
import { scaleAtom, responsiveScaleAtom } from '../display';
import { gridAtomPrivate, solutionAtom, metadataAtom } from '../grid';
import { validationEnabledAtom, gridStateAtom } from '../gridState';
import { SyncPropToAtom } from '../stateHelper';

export interface PuzzleImageScopeProps {
  grid: GridData;
  solution: GridData | null;
  metadata: PuzzleMetadata;
  state: GridState;
  scale: number;
  children: ReactNode;
}

/**
 * A read-only puzzle scope for the share-image renderer. Grids are not
 * validated; the grid state is injected from the parent scope.
 */
export const PuzzleImageScope = memo(function PuzzleImageScope({
  grid,
  solution,
  metadata,
  state,
  scale,
  children,
}: PuzzleImageScopeProps) {
  return (
    <ScopeProvider
      name="puzzle-image"
      atoms={[
        [scaleAtom, scale],
        [responsiveScaleAtom, false],
        [validationEnabledAtom, false],
        [gridStateAtom, state],
        [gridAtomPrivate, grid],
        [solutionAtom, solution],
        [metadataAtom, metadata],
      ]}
    >
      <SyncPropToAtom atom={scaleAtom} value={scale} />
      <SyncPropToAtom atom={gridStateAtom} value={state} />
      <SyncPropToAtom atom={gridAtomPrivate} value={grid} />
      <SyncPropToAtom atom={solutionAtom} value={solution} />
      <SyncPropToAtom atom={metadataAtom} value={metadata} />
      {children}
    </ScopeProvider>
  );
});
