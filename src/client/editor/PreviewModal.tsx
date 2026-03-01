import { memo, Ref, useImperativeHandle, useState } from 'react';
import { cn } from '../uiHelper';
import EmbedContext from '../contexts/EmbedContext';
import GridContext from '../contexts/GridContext';
import DisplayContext from '../contexts/DisplayContext';
import GridStateContext from '../contexts/GridStateContext';
import EditContext from '../contexts/EditContext';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import FullScreenModal from '../components/FullScreenModal';
import OnlineContext from '../contexts/OnlineContext';
import SolveScreen from '../screens/SolveScreen';

export interface PreviewRef {
  open: (solution: GridData, metadata: PuzzleMetadata) => void;
}

export interface PreviewModalProps {
  ref?: Ref<PreviewRef>;
}

export default memo(function PreviewModal({ ref }: PreviewModalProps) {
  /**
   * initialState also specifies the open state of the modal.
   */
  const [initialState, setInitialState] = useState<Puzzle | null>(null);

  useImperativeHandle(ref, () => ({
    open: (solution: GridData, metadata: PuzzleMetadata) => {
      setInitialState({ ...metadata, grid: solution.resetTiles(), solution });
    },
  }));

  return (
    <FullScreenModal
      title="Preview puzzle"
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
                    <SolveScreen>
                      <button
                        type="button"
                        className="btn btn-primary rounded-2xl"
                        onClick={() => {
                          setInitialState(null);
                        }}
                      >
                        Exit
                      </button>
                    </SolveScreen>
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
