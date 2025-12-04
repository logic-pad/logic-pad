import { memo, Ref, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '../../uiHelper';
import EmbedContext from '../../contexts/EmbedContext';
import GridContext, { GridConsumer } from '../../contexts/GridContext';
import DisplayContext from '../../contexts/DisplayContext';
import GridStateContext from '../../contexts/GridStateContext';
import { Color, Position } from '@logic-pad/core/data/primitives';
import PerfectionRule from '@logic-pad/core/data/rules/perfectionRule';
import PerfectionScreen from '../../screens/PerfectionScreen';
import { instance as foresightInstance } from '@logic-pad/core/data/rules/foresightRule';
import EditContext, { EditConsumer } from '../../contexts/EditContext';
import { useDelta } from 'react-delta-hooks';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import { invokeSetGrid } from '@logic-pad/core/data/events/onSetGrid';
import FullScreenModal from '../../components/FullScreenModal';
import OnlineContext from '../../contexts/OnlineContext';

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

export default memo(function SolvePathEditorModal({
  onChange,
  ref,
}: SolvePathEditorModalProps) {
  /**
   * initialState also specifies the open state of the modal.
   */
  const [initialState, setInitialState] = useState<Puzzle | null>(null);
  const [tempSolvePath, setTempSolvePath] = useState<Position[]>([]);

  useImperativeHandle(ref, () => ({
    open: (value: Position[], grid: GridData, metadata: PuzzleMetadata) => {
      const { grid: newGrid, solution } = prepareGrid(grid, value);
      setInitialState({ ...metadata, grid: newGrid, solution });
      setTempSolvePath(value);
    },
  }));

  const openDelta = useDelta(initialState);
  useEffect(() => {
    if (!openDelta) return;
    if (!openDelta.curr && openDelta.prev) {
      onChange(tempSolvePath);
    }
  }, [onChange, openDelta, tempSolvePath]);

  return (
    <FullScreenModal
      title="Edit solve path"
      className={cn('modal', initialState && 'modal-open')}
      onClose={() => setInitialState(null)}
    >
      {initialState && (
        <EmbedContext name="solve-path-modal">
          <OnlineContext forceOffline={true}>
            <DisplayContext>
              <EditContext>
                <GridStateContext>
                  <GridContext
                    initialGrid={initialState.grid}
                    initialSolution={initialState.solution}
                    initialMetadata={() => {
                      const {
                        grid: _1,
                        solution: _2,
                        ...metadata
                      } = initialState;
                      return metadata;
                    }}
                  >
                    <EditConsumer>
                      {({ clearHistory }) => {
                        return (
                          <GridConsumer>
                            {({ setGridRaw: setInnerGrid }) => {
                              const onReset = () => {
                                const { grid, solution } = prepareGrid(
                                  initialState.grid,
                                  []
                                );
                                setInnerGrid(grid, solution);
                                setTempSolvePath([]);
                                clearHistory(grid);
                              };
                              return (
                                <PerfectionScreen
                                  solvePath={tempSolvePath}
                                  setSolvePath={setTempSolvePath}
                                  onReset={onReset}
                                >
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={onReset}
                                  >
                                    Reset progress (R)
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                      setInitialState(null);
                                    }}
                                  >
                                    Save and exit
                                  </button>
                                </PerfectionScreen>
                              );
                            }}
                          </GridConsumer>
                        );
                      }}
                    </EditConsumer>
                  </GridContext>
                </GridStateContext>
              </EditContext>
            </DisplayContext>
          </OnlineContext>
        </EmbedContext>
      )}
    </FullScreenModal>
  );
});

export const type = undefined;
