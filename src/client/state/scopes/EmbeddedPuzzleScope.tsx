import { PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { GridData } from '@logic-pad/core/index';
import { ScopeProvider } from 'jotai-scope';
import { ReactNode, memo } from 'react';
import { displayScopeAtoms } from '../display';
import { editHistoryScopeAtoms } from '../editHistory';
import {
  gridAtomPrivate,
  solutionAtom,
  metadataAtom,
  InitializeGrid,
} from '../grid';
import {
  useGridValidator,
  gridValidatorAtom,
  gridStateScopeAtoms,
  SubscribeToValidator,
} from '../gridState';
import { instructionPartsAtom } from '../instructionParts';
import { forceOfflineAtom } from '../online';
import {
  onlinePuzzleIdAtom,
  onlinePuzzleAtom,
  lastSavedPuzzleAtom,
} from '../onlinePuzzle';
import { solverAtom } from '../solver';

export interface EmbeddedPuzzleScopeProps {
  grid: GridData;
  solution: GridData | null;
  metadata: PuzzleMetadata;
  /**
   * Also scope the solver, instruction parts and online puzzle atoms.
   * Required when there is no parent puzzle scope above (e.g. the uploader
   * modal); nested modals must leave this off so instruction parts and
   * online puzzle data flow to the parent scope.
   */
  isolateInstructionsAndSolver?: boolean;
  children: ReactNode;
}

/**
 * An isolated puzzle scope for embedded editors and previews, always offline.
 */
export const EmbeddedPuzzleScope = memo(function EmbeddedPuzzleScope({
  grid,
  solution,
  metadata,
  isolateInstructionsAndSolver = false,
  children,
}: EmbeddedPuzzleScopeProps) {
  const validator = useGridValidator();
  return (
    <ScopeProvider
      name="embedded-puzzle"
      atoms={[
        [forceOfflineAtom, true],
        ...displayScopeAtoms,
        ...editHistoryScopeAtoms,
        [gridValidatorAtom, validator],
        ...gridStateScopeAtoms,
        [gridAtomPrivate, grid],
        [solutionAtom, solution],
        [metadataAtom, metadata],
        ...(isolateInstructionsAndSolver
          ? [
              solverAtom,
              instructionPartsAtom,
              onlinePuzzleIdAtom,
              onlinePuzzleAtom,
              lastSavedPuzzleAtom,
            ]
          : []),
      ]}
    >
      <SubscribeToValidator validator={validator} />
      <InitializeGrid grid={grid} solution={solution} />
      {children}
    </ScopeProvider>
  );
});
