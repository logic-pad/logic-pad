import { atom } from 'jotai';
import { ScopeProvider } from 'jotai-scope';
import { Position } from '@logic-pad/core/data/primitives';
import React, { memo } from 'react';

export const solvePathAtom = atom<Position[]>([]);
export const visualizeSolvePathAtom = atom(false);

/**
 * Isolates solve path state for a perfection screen
 * (route-level or inside the solve path editor modal).
 */
export default memo(function SolvePathScope({
  initialSolvePath,
  children,
}: {
  initialSolvePath?: Position[];
  children: React.ReactNode;
}) {
  return (
    <ScopeProvider
      name="solve-path"
      atoms={[[solvePathAtom, initialSolvePath ?? []], visualizeSolvePathAtom]}
    >
      {children}
    </ScopeProvider>
  );
});
