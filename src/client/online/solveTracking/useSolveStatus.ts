import { useMemo, useSyncExternalStore } from 'react';
import onlineSolveTracker from './onlineSolveTracker';

export interface SolveStatus {
  /**
   * True once progress has hydrated and the visitor is a tracked (signed-in)
   * user. Card indicators gate on this; anonymous visitors see none.
   */
  loaded: boolean;
  seen: boolean;
  solved: boolean;
}

/**
 * Subscribes a component to the solve tracker. The version counter (not the
 * mutable Sets) is the store snapshot, which is what keeps
 * `useSyncExternalStore` from looping.
 */
export function useSolveStatus(puzzleId?: string | null): SolveStatus {
  const version = useSyncExternalStore(
    onlineSolveTracker.subscribe,
    onlineSolveTracker.getVersion,
    onlineSolveTracker.getVersion
  );
  return useMemo(
    () => ({
      loaded: onlineSolveTracker.isLoaded() && onlineSolveTracker.isTracked(),
      seen: !!puzzleId && onlineSolveTracker.isSeen(puzzleId),
      solved: !!puzzleId && onlineSolveTracker.isSolved(puzzleId),
    }),
    // `version` is the tracker change signal: it must stay in the deps even
    // though the body never reads it, or updates would never propagate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puzzleId, version]
  );
}
