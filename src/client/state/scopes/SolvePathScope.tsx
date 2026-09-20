import { ScopeProvider } from 'jotai-scope';
import { memo, ReactNode } from 'react';
import { solvePathAtom, visualizeSolvePathAtom } from '../solvePath';
import { Position } from '@logic-pad/core/data/primitives';

/**
 * Isolates solve path state for a perfection screen
 * (route-level or inside the solve path editor modal).
 */
export const SolvePathScope = memo(function SolvePathScope({
  initialSolvePath,
  children,
}: {
  initialSolvePath?: Position[];
  children: ReactNode;
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
