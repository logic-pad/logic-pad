import { memo, Ref, useImperativeHandle, useState } from 'react';
import { cn } from '../uiHelper';
import EmbedScope from '../state/embed.tsx';
import GridData from '@logic-pad/core/data/grid';
import { Puzzle, PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import FullScreenModal from '../components/FullScreenModal';
import SolveScreen from '../screens/SolveScreen';
import { EmbeddedPuzzleScope } from '../state/scopes.tsx';
import { puzzleMetadata } from '../state/grid.ts';

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
        <EmbedScope name="solve-path-modal">
          <EmbeddedPuzzleScope
            grid={initialState.grid}
            solution={initialState.solution}
            metadata={puzzleMetadata(initialState)}
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
          </EmbeddedPuzzleScope>
        </EmbedScope>
      )}
    </FullScreenModal>
  );
});
