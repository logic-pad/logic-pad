import {
  memo,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import GridData from '@logic-pad/core/data/grid';
import { cn } from '../../client/uiHelper.ts';
import EmbedScope from '../state/embed.tsx';
import PuzzleEditorScreen from '../screens/PuzzleEditorScreen.tsx';
import { defaultGrid, gridAtom, metadataAtom } from '../state/grid.ts';
import { useDelta } from 'react-delta-hooks';
import FullScreenModal from '../components/FullScreenModal.tsx';
import { PuzzleMetadata } from '@logic-pad/core/data/puzzle.ts';
import { AtomRefBridge, EmbeddedPuzzleScope } from '../state/scopes.tsx';

export interface PuzzleEditorRef {
  open: (metadata: PuzzleMetadata, gridWithSolution: GridData) => void;
}

export interface PuzzleEditorModalProps {
  onChange: (metadata: PuzzleMetadata, gridWithSolution: GridData) => void;
  ref?: Ref<PuzzleEditorRef>;
}

export default memo(function PuzzleEditorModal({
  onChange,
  ref,
}: PuzzleEditorModalProps) {
  const [open, setOpen] = useState(false);
  const [initialState, setInitialState] = useState<{
    metadata: PuzzleMetadata;
    grid: GridData;
  }>({
    metadata: {
      title: '',
      description: '',
      author: '',
      difficulty: 0,
    },
    grid: defaultGrid,
  });
  const metadataRef = useRef<PuzzleMetadata>(initialState.metadata);
  const gridRef = useRef<GridData>(initialState.grid);

  useImperativeHandle(ref, () => ({
    open: (metadata: PuzzleMetadata, gridWithSolution: GridData) => {
      setInitialState({ metadata, grid: gridWithSolution });
      metadataRef.current = metadata;
      gridRef.current = gridWithSolution;
      setOpen(true);
    },
  }));

  const openDelta = useDelta(open);
  useEffect(() => {
    if (!openDelta) return;
    if (openDelta.prev && !openDelta.curr) {
      onChange(metadataRef.current, gridRef.current);
    }
  }, [onChange, openDelta]);

  return (
    open && (
      <FullScreenModal
        title="Edit puzzle"
        className={cn('modal', open && 'modal-open')}
        onClose={() => setOpen(false)}
      >
        <EmbedScope
          name="grid-modal"
          features={{
            instructions: true,
            metadata: true,
            checklist: true,
            saveControl: false,
            preview: true,
          }}
        >
          <EmbeddedPuzzleScope
            grid={initialState.grid}
            solution={null}
            metadata={initialState.metadata}
            isolateInstructionsAndSolver
          >
            <AtomRefBridge atom={gridAtom} ref={gridRef} />
            <AtomRefBridge atom={metadataAtom} ref={metadataRef} />
            <PuzzleEditorScreen>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Save and exit
              </button>
            </PuzzleEditorScreen>
          </EmbeddedPuzzleScope>
        </EmbedScope>
      </FullScreenModal>
    )
  );
});
