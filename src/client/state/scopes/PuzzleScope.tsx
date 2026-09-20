import { memo, ReactNode, useMemo } from 'react';
import { PuzzleFull } from '../../online/data';
import { displayScopeAtoms } from '../display';
import { editHistoryScopeAtoms } from '../editHistory';
import {
  embedFeaturesAtom,
  defaultEmbedFeatures,
  embedChildrenAtom,
} from '../embed';
import {
  puzzleMetadata,
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
import {
  onlinePuzzleIdAtom,
  onlinePuzzleAtom,
  lastSavedPuzzleAtom,
} from '../onlinePuzzle';
import { solverAtom } from '../solver';
import { SyncPropToAtom } from '../stateHelper';
import { ScopeProvider } from 'jotai-scope';
import { Puzzle } from '@logic-pad/core/data/puzzle';

export interface PuzzleScopeProps {
  puzzleId: string | null;
  puzzle: PuzzleFull | null;
  initialPuzzle: Puzzle;
  children: ReactNode;
}

/**
 * The root state scope of a puzzle route (editor, player, perfection).
 */
export const PuzzleScope = memo(function PuzzleScope({
  puzzleId,
  puzzle,
  initialPuzzle,
  children,
}: PuzzleScopeProps) {
  const { grid, solution, metadata } = useMemo(() => {
    const { grid, solution } = initialPuzzle;
    return { grid, solution, metadata: puzzleMetadata(initialPuzzle) };
  }, [initialPuzzle]);
  const validator = useGridValidator();
  return (
    <ScopeProvider
      name="puzzle"
      atoms={[
        [embedFeaturesAtom, defaultEmbedFeatures],
        [embedChildrenAtom, []],
        [onlinePuzzleIdAtom, puzzleId],
        [onlinePuzzleAtom, puzzle],
        [lastSavedPuzzleAtom, initialPuzzle],
        ...displayScopeAtoms,
        ...editHistoryScopeAtoms,
        [gridValidatorAtom, validator],
        ...gridStateScopeAtoms,
        [gridAtomPrivate, grid],
        [solutionAtom, solution],
        [metadataAtom, metadata],
        solverAtom,
        instructionPartsAtom,
      ]}
    >
      {/* puzzleId and puzzle are pass-through props and must stay in sync */}
      <SyncPropToAtom atom={onlinePuzzleIdAtom} value={puzzleId} />
      <SyncPropToAtom atom={onlinePuzzleAtom} value={puzzle} />
      <SubscribeToValidator validator={validator} />
      <InitializeGrid grid={grid} solution={solution} />
      {children}
    </ScopeProvider>
  );
});
