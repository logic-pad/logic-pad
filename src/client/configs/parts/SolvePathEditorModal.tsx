import {
  memo,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '../../uiHelper';
import { Color, Position } from '@logic-pad/core/data/primitives';
import PerfectionRule from '@logic-pad/core/data/rules/perfectionRule';
import PerfectionScreen from '../../screens/PerfectionScreen';
import { instance as foresightInstance } from '@logic-pad/core/data/rules/foresightRule';
import { useDelta } from 'react-delta-hooks';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { invokeSetGrid } from '@logic-pad/core/data/events/onSetGrid';
import FullScreenModal from '../../components/FullScreenModal';
import { useSetAtom } from 'jotai';
import { puzzleMetadata, setGridRawAtom } from '../../state/grid.ts';
import { clearHistoryAtom } from '../../state/editHistory.ts';
import { solvePathAtom } from '../../state/solvePath.ts';
import { SyncAtomToRef } from '../../state/stateHelper.tsx';
import { EmbeddedPuzzleScope } from '../../state/scopes/EmbeddedPuzzleScope.tsx';
import { EmbedScope } from '../../state/scopes/EmbedScope.tsx';
import { SolvePathScope } from '../../state/scopes/SolvePathScope.tsx';

export interface SolvePathEditorRef {
  open: (value: Position[], grid: GridData, metadata: PuzzleMetadata) => void;
}

export interface SolvePathEditorModalProps {
  onChange: (solvePath: Position[]) => void;
  ref?: Ref<SolvePathEditorRef>;
}

function prepareGrid(
  grid: GridData,
  solvePath: Position[] | null
): { grid: GridData; solution: GridData | null } {
  const newGrid = grid.withRules(rules => [
    new PerfectionRule(),
    ...rules.filter(r => r.id !== foresightInstance.id),
  ]);
  if (solvePath) {
    const resetGrid = newGrid.withTiles(tiles =>
      tiles.map((row, y) =>
        row.map((tile, x) => {
          if (
            !tile.exists ||
            tile.fixed ||
            solvePath.some(p => p.x === x && p.y === y)
          ) {
            return tile;
          } else {
            return tile.withColor(Color.Gray);
          }
        })
      )
    );
    if (resetGrid.colorEquals(newGrid)) {
      return { grid: invokeSetGrid(resetGrid, newGrid, null), solution: null };
    } else {
      return {
        grid: invokeSetGrid(resetGrid, resetGrid, null),
        solution: newGrid,
      };
    }
  } else {
    const resetGrid = newGrid.resetTiles();
    if (resetGrid.colorEquals(newGrid)) {
      return { grid: invokeSetGrid(resetGrid, newGrid, null), solution: null };
    } else {
      return {
        grid: invokeSetGrid(resetGrid, resetGrid, null),
        solution: newGrid,
      };
    }
  }
}

const SolvePathEditorContent = memo(function SolvePathEditorContent({
  initialGrid,
  onClose,
}: {
  initialGrid: GridData;
  onClose: () => void;
}) {
  const setInnerGrid = useSetAtom(setGridRawAtom);
  const clearHistory = useSetAtom(clearHistoryAtom);
  const setSolvePath = useSetAtom(solvePathAtom);
  const onReset = () => {
    const { grid, solution } = prepareGrid(initialGrid, []);
    setInnerGrid(grid, solution);
    setSolvePath([]);
    clearHistory(grid);
  };
  return (
    <PerfectionScreen onReset={onReset}>
      <button type="button" className="btn" onClick={onReset}>
        Reset progress (R)
      </button>
      <button type="button" className="btn btn-primary" onClick={onClose}>
        Save and exit
      </button>
    </PerfectionScreen>
  );
});

export default memo(function SolvePathEditorModal({
  onChange,
  ref,
}: SolvePathEditorModalProps) {
  /**
   * initialState also specifies the open state of the modal.
   */
  const [initialState, setInitialState] = useState<Puzzle | null>(null);
  const solvePathRef = useRef<Position[]>([]);

  useImperativeHandle(ref, () => ({
    open: (value: Position[], grid: GridData, metadata: PuzzleMetadata) => {
      const { grid: newGrid, solution } = prepareGrid(grid, value);
      setInitialState({ ...metadata, grid: newGrid, solution });
      solvePathRef.current = value;
    },
  }));

  const openDelta = useDelta(initialState);
  useEffect(() => {
    if (!openDelta) return;
    if (!openDelta.curr && openDelta.prev) {
      onChange(solvePathRef.current);
    }
  }, [onChange, openDelta]);

  return (
    <FullScreenModal
      title="Edit solve path"
      className={cn('modal', initialState && 'modal-open')}
      onClose={() => setInitialState(null)}
    >
      {initialState && (
        <EmbedScope name="solve-path-modal">
          <EmbeddedPuzzleScope
            grid={initialState.grid}
            solution={initialState.solution}
            metadata={puzzleMetadata(initialState)}
          >
            <SolvePathScope initialSolvePath={solvePathRef.current}>
              <SyncAtomToRef atom={solvePathAtom} ref={solvePathRef} />
              <SolvePathEditorContent
                initialGrid={initialState.grid}
                onClose={() => setInitialState(null)}
              />
            </SolvePathScope>
          </EmbeddedPuzzleScope>
        </EmbedScope>
      )}
    </FullScreenModal>
  );
});

export const type = undefined;
