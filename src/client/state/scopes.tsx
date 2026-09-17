import { Atom, PrimitiveAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { ScopeProvider } from 'jotai-scope';
import React, { memo, RefObject, useEffect, useMemo, useState } from 'react';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { GridState } from '@logic-pad/core/data/primitives';
import { GridValidator } from '@logic-pad/core/data/validateAsync';
import { PuzzleFull } from '../online/data';
import { gridAtom, metadataAtom, puzzleMetadata, solutionAtom } from './grid';
import {
  gridStateAtom,
  gridStateScopeAtoms,
  gridValidatorAtom,
  validateGridAtom,
  validationEnabledAtom,
} from './gridState';
import { clearHistoryAtom, editHistoryScopeAtoms } from './editHistory';
import { displayScopeAtoms, responsiveScaleAtom, scaleAtom } from './display';
import {
  defaultEmbedFeatures,
  embedChildrenAtom,
  embedFeaturesAtom,
} from './embed';
import { solverAtom } from './solver';
import { instructionPartsAtom } from './instructionParts';
import {
  lastSavedPuzzleAtom,
  onlinePuzzleAtom,
  onlinePuzzleIdAtom,
} from './onlinePuzzle';
import { forceOfflineAtom } from './online';
import { configScopeAtoms } from './config';
import { activeToolAtom } from './toolbox';

/**
 * Keeps a scoped atom in sync with a prop after mount.
 * ScopeProvider initial values only apply when the scope is created.
 */
export function SyncAtom<T>({
  atom,
  value,
}: {
  atom: PrimitiveAtom<T>;
  value: T;
}) {
  const set = useSetAtom(atom);
  useEffect(() => {
    set(value);
  }, [set, value]);
  return null;
}

/**
 * Mirrors an atom's value into a ref, for reading the current value
 * outside of React's render cycle (e.g. when a modal closes).
 */
export function AtomRefBridge<T>({
  atom,
  ref,
}: {
  atom: Atom<T>;
  ref: RefObject<T>;
}) {
  const value = useAtomValue(atom);
  useEffect(() => {
    ref.current = value;
  }, [ref, value]);
  return null;
}

const GridStateBridge = memo(function GridStateBridge({
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

const GridInitializer = memo(function GridInitializer({
  grid,
  solution,
}: {
  grid: GridData;
  solution: GridData | null;
}) {
  const clearHistory = useSetAtom(clearHistoryAtom);
  const validateGrid = useSetAtom(validateGridAtom);
  useEffect(() => {
    clearHistory(grid);
    validateGrid(grid, solution);
    // mount-only, mirrors the original GridContext mount effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
});

function useGridValidator() {
  const [validator] = useState(() => new GridValidator());
  useEffect(() => () => validator.delete(), [validator]);
  return validator;
}

export interface PuzzleScopeProps {
  puzzleId: string | null;
  puzzle: PuzzleFull | null;
  initialPuzzle: Puzzle;
  children: React.ReactNode;
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
        [gridAtom, grid],
        [solutionAtom, solution],
        [metadataAtom, metadata],
        solverAtom,
        instructionPartsAtom,
      ]}
    >
      {/* puzzleId and puzzle are pass-through props and must stay in sync */}
      <SyncAtom atom={onlinePuzzleIdAtom} value={puzzleId} />
      <SyncAtom atom={onlinePuzzleAtom} value={puzzle} />
      <GridStateBridge validator={validator} />
      <GridInitializer grid={grid} solution={solution} />
      {children}
    </ScopeProvider>
  );
});

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
  children: React.ReactNode;
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
        [gridAtom, grid],
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
      <GridStateBridge validator={validator} />
      <GridInitializer grid={grid} solution={solution} />
      {children}
    </ScopeProvider>
  );
});

export interface PuzzleImageScopeProps {
  grid: GridData;
  solution: GridData | null;
  metadata: PuzzleMetadata;
  state: GridState;
  scale: number;
  children: React.ReactNode;
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
        [gridAtom, grid],
        [solutionAtom, solution],
        [metadataAtom, metadata],
      ]}
    >
      <SyncAtom atom={scaleAtom} value={scale} />
      <SyncAtom atom={gridStateAtom} value={state} />
      <SyncAtom atom={gridAtom} value={grid} />
      <SyncAtom atom={solutionAtom} value={solution} />
      <SyncAtom atom={metadataAtom} value={metadata} />
      {children}
    </ScopeProvider>
  );
});

/**
 * The state scope of a puzzle editor screen (toolbox and config popup state).
 * Mounted by PuzzleEditorScreen, including inside embedded editor modals.
 */
export const EditorScope = memo(function EditorScope({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScopeProvider name="editor" atoms={[...configScopeAtoms, activeToolAtom]}>
      {children}
    </ScopeProvider>
  );
});
